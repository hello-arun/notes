/*
 * Notes app: hash router, Markdown + KaTeX renderer, navigation, search and progress.
 *
 * Routes:  #/                       home (all subjects)
 *          #/<subject>              subject overview
 *          #/<subject>/<chapter>    a chapter
 *          #/<subject>/<chapter>/<heading-id>
 */
(function () {
  'use strict';

  var Notes = window.Notes;
  var MANIFEST = 'content/subjects.json';
  var WIDGET_TYPES = { quiz: 1, cards: 1, anim: 1, timeline: 1 };

  var KATEX_MACROS = {
    '\\vr': '\\mathbf{r}',
    '\\vk': '\\mathbf{k}',
    '\\vR': '\\mathbf{R}',
    '\\vG': '\\mathbf{G}',
    '\\ket': '\\left|#1\\right\\rangle',
    '\\bra': '\\left\\langle#1\\right|',
    '\\braket': '\\left\\langle#1\\middle|#2\\right\\rangle',
    '\\expval': '\\left\\langle#1\\right\\rangle',
    '\\dd': '\\mathrm{d}',
    '\\Exc': 'E_{\\mathrm{xc}}',
    '\\vxc': 'v_{\\mathrm{xc}}',
    '\\veff': 'v_{\\mathrm{eff}}',
    '\\vext': 'v_{\\mathrm{ext}}',
    '\\Ts': 'T_{\\mathrm{s}}',
    '\\EH': 'E_{\\mathrm{H}}'
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var main = $('#main'), sidebar = $('#sidebar'), toc = $('#toc'), layout = $('.layout');

  var manifest = null;
  var mdCache = {};
  var scriptCache = {};
  var active = [];          // live widget instances (for cleanup)
  var current = {};         // { subject, chapter }
  var spy = null;

  /* =====================================================================
   * Markdown rendering
   * ===================================================================== */

  function slugify(s) {
    return s.toLowerCase()
      .replace(/\$[^$]*\$/g, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/[`*_~\[\]()\\{}^]/g, '')
      .replace(/&[a-z]+;/g, '')
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim().replace(/\s+/g, '-').replace(/-+/g, '-') || 'section';
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var FENCE = /^([ \t]*)(```|~~~)([^\n]*)\n([\s\S]*?)^[ \t]*\2[ \t]*$/m;
  var INLINE_MATH = /\$(?!\s)((?:[^$\\\n]|\\[\s\S]|\n(?!\s*\n))+?)(?<![\s\\])\$/g;

  // Replace math with placeholders so the Markdown parser cannot mangle it.
  function protectMath(text, math) {
    return text.split(/(`[^`\n]+`)/).map(function (chunk, i) {
      if (i % 2) return chunk; // inline code
      function put(tex, display) { math.push({ tex: tex, display: display }); return '@@M' + (math.length - 1) + '@@'; }
      return chunk
        .replace(/\\\$/g, '&#36;')
        .replace(/\$\$([\s\S]+?)\$\$/g, function (_, t) { return put(t, true); })
        .replace(/\\\[([\s\S]+?)\\\]/g, function (_, t) { return put(t, true); })
        .replace(/\\\(([\s\S]+?)\\\)/g, function (_, t) { return put(t, false); })
        .replace(INLINE_MATH, function (_, t) { return put(t, false); });
    }).join('');
  }

  function renderTex(m) {
    try {
      return katex.renderToString(m.tex, {
        displayMode: m.display, throwOnError: false, strict: 'ignore', macros: Object.assign({}, KATEX_MACROS)
      });
    } catch (e) {
      return '<span class="math-error">' + escapeHtml(m.tex) + '</span>';
    }
  }

  function restoreMath(html, math) {
    return html
      .replace(/<p>\s*@@M(\d+)@@\s*<\/p>/g, function (_, i) { return renderTex(math[+i]); })
      .replace(/@@M(\d+)@@/g, function (_, i) { return renderTex(math[+i]); });
  }

  /*
   * Full render. Returns { html, widgets: [{type, src}], headings: [{level, text, id}] }.
   * Code fences are left to marked, except widget fences which become placeholders.
   */
  function renderMarkdown(md, allowWidgets) {
    var math = [], widgets = [], headings = [], out = '', rest = md.replace(/\r\n?/g, '\n');
    var seen = {};
    function scanHeadings(prose) {
      var re = /^(#{1,4})[ \t]+(.+?)[ \t]*#*[ \t]*$/gm, m;
      while ((m = re.exec(prose))) {
        var id = slugify(m[2]);
        if (seen[id]) id += '-' + (++seen[id]); else seen[id] = 1;
        headings.push({ level: m[1].length, text: m[2], id: id });
      }
    }
    while (rest.length) {
      var m = FENCE.exec(rest);
      var prose = m ? rest.slice(0, m.index) : rest;
      scanHeadings(prose);
      out += protectMath(prose, math);
      if (!m) break;
      var lang = m[3].trim().split(/\s+/)[0];
      if (allowWidgets && WIDGET_TYPES[lang]) {
        widgets.push({ type: lang, src: m[4] });
        out += '\n<div class="widget" data-wid="' + (widgets.length - 1) + '"></div>\n';
      } else {
        out += m[0];
      }
      rest = rest.slice(m.index + m[0].length);
    }
    var html = marked.parse(out, { gfm: true, breaks: false });
    return { html: restoreMath(html, math), widgets: widgets, headings: headings };
  }

  function renderInline(md) {
    var math = [];
    return restoreMath(marked.parseInline(protectMath(md, math)), math);
  }
  function renderBlock(md) { return renderMarkdown(md, false).html; }

  Notes.inline = renderInline;
  Notes.block = renderBlock;

  // DOM post-processing for callouts, collapsibles, code and links.
  var CALLOUTS = {
    note: 'Note', tip: 'Tip', warning: 'Watch out', danger: 'Common mistake', interview: 'Interview angle',
    key: 'Key idea', important: 'Important', example: 'Example', summary: 'Summary', caution: 'Caution'
  };

  function enhance(root, ctx) {
    root.querySelectorAll('blockquote').forEach(function (bq) {
      var p = bq.firstElementChild;
      if (!p || p.tagName !== 'P') return;
      var m = /^\s*\[!(\w+)\][ \t]*([^\n<]*)(\n|<br>)?/.exec(p.innerHTML);
      if (!m) return;
      var type = m[1].toLowerCase();
      var div = document.createElement('div');
      var cls = { important: 'key', summary: 'key', example: 'tip', caution: 'warning' }[type] || type;
      div.className = 'callout ' + cls;
      div.innerHTML = '<div class="callout-title">' + (m[2].trim() || CALLOUTS[type] || m[1]) + '</div>';
      p.innerHTML = p.innerHTML.slice(m[0].length);
      if (!p.innerHTML.trim()) p.remove();
      while (bq.firstChild) div.appendChild(bq.firstChild);
      bq.replaceWith(div);
    });

    root.querySelectorAll('details').forEach(function (d) {
      var body = document.createElement('div');
      body.className = 'details-body';
      Array.from(d.childNodes).forEach(function (n) { if (n.nodeName !== 'SUMMARY') body.appendChild(n); });
      d.appendChild(body);
    });

    root.querySelectorAll('pre > code').forEach(function (code) {
      var lang = (/language-([\w+-]+)/.exec(code.className) || [])[1];
      if (window.hljs && lang && hljs.getLanguage(lang)) hljs.highlightElement(code);
      var btn = document.createElement('button');
      btn.className = 'copy-btn'; btn.type = 'button'; btn.textContent = 'Copy';
      btn.addEventListener('click', function () {
        navigator.clipboard && navigator.clipboard.writeText(code.textContent).then(function () {
          btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy'; }, 1200);
        });
      });
      code.parentNode.appendChild(btn);
    });

    if (!ctx) return;
    // Relative links/images resolve against the chapter's folder; "*.md" links map to chapter routes.
    root.querySelectorAll('img[src]').forEach(function (img) {
      var s = img.getAttribute('src');
      if (!/^(https?:|data:|\/)/.test(s)) img.src = ctx.base + s;
      img.loading = 'lazy';
    });
    root.querySelectorAll('a[href]').forEach(function (a) {
      var h = a.getAttribute('href'), m = /^([^#:]+\.md)(?:#(.*))?$/.exec(h);
      if (m) {
        var ch = ctx.subject.chapters.filter(function (c) { return c.file === m[1]; })[0];
        if (ch) a.setAttribute('href', '#/' + ctx.subject.id + '/' + ch.id + (m[2] ? '/' + m[2] : ''));
      } else if (/^https?:/.test(h)) {
        a.target = '_blank'; a.rel = 'noopener';
      }
    });
  }

  function mountWidgets(root, widgets, route) {
    root.querySelectorAll('.widget[data-wid]').forEach(function (holder) {
      var i = +holder.getAttribute('data-wid'), w = widgets[i], fn = Notes.widgets[w.type];
      try {
        var inst = fn(holder, w.src, { route: route, index: i, inline: renderInline, block: renderBlock });
        if (inst) active.push(inst);
      } catch (e) {
        console.error(e);
        holder.innerHTML = '<div class="panel math-error">Widget error: ' + escapeHtml(String(e.message || e)) + '</div>';
      }
    });
  }

  function destroyWidgets() {
    active.forEach(function (w) { try { w.destroy && w.destroy(); } catch (e) {} });
    active = [];
  }

  /* =====================================================================
   * Data
   * ===================================================================== */

  function fetchText(url) {
    if (mdCache[url]) return Promise.resolve(mdCache[url]);
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(r.status + ' ' + url);
      return r.text();
    }).then(function (t) { mdCache[url] = t; return t; });
  }

  function loadManifest() {
    return fetch(MANIFEST, { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (m) {
      manifest = m;
      m.subjects.forEach(function (s) {
        s.dir = s.dir || ('content/' + s.id + '/');
        s.chapters = s.chapters || [];
        s.chapters.forEach(function (c, i) { c.n = i; c.path = s.dir + c.file; });
      });
      return m;
    });
  }

  function loadScripts(subject) {
    return Promise.all((subject.scripts || []).map(function (src) {
      if (!scriptCache[src]) {
        scriptCache[src] = new Promise(function (res) {
          var s = document.createElement('script');
          s.src = src; s.onload = res;
          s.onerror = function () { console.warn('Could not load', src); res(); };
          document.head.appendChild(s);
        });
      }
      return scriptCache[src];
    }));
  }

  function subjectById(id) { return manifest.subjects.filter(function (s) { return s.id === id; })[0]; }

  /* ---------- Progress ---------- */
  function isDone(s, c) { return !!Notes.store.get('done:' + s.id + '/' + c.id, false); }
  function setDone(s, c, v) { Notes.store.set('done:' + s.id + '/' + c.id, v); }
  function subjectProgress(s) {
    var n = s.chapters.filter(function (c) { return isDone(s, c); }).length;
    return { done: n, total: s.chapters.length, pct: s.chapters.length ? Math.round((100 * n) / s.chapters.length) : 0 };
  }

  /* =====================================================================
   * Views
   * ===================================================================== */

  function setTitle(t) { document.title = t ? t + ' · Notes' : 'Notes'; }

  function renderSidebar(subject, chapter) {
    if (!subject) {
      sidebar.innerHTML = '<div class="sb-subject">Subjects</div><ul class="sb-list">' +
        manifest.subjects.map(function (s) {
          return '<li><a href="#/' + s.id + '"><span>' + escapeHtml(s.title) + '</span></a></li>';
        }).join('') + '</ul>';
      return;
    }
    var p = subjectProgress(subject);
    sidebar.innerHTML =
      '<div class="sb-subject"><a href="#/">All subjects</a> / <a href="#/' + subject.id + '">' + escapeHtml(subject.short || subject.title) + '</a></div>' +
      '<ul class="sb-list">' + subject.chapters.map(function (c) {
        return '<li><a href="#/' + subject.id + '/' + c.id + '"' + (chapter && chapter.id === c.id ? ' class="active"' : '') + '>' +
          '<span class="sb-num">' + (c.num != null ? c.num : c.n) + '</span><span>' + escapeHtml(c.title) + '</span>' +
          (isDone(subject, c) ? '<span class="sb-check" title="Completed">&#10003;</span>' : '') + '</a></li>';
      }).join('') + '</ul>' +
      '<div class="sb-progress"><div class="bar"><span style="width:' + p.pct + '%"></span></div>' +
      '<div style="margin-top:6px">' + p.done + ' of ' + p.total + ' chapters completed</div></div>';
  }

  function viewHome() {
    layout.classList.add('no-sidebar');
    renderSidebar(null);
    toc.innerHTML = '';
    setTitle('');
    var html = '<div class="page"><div class="hero"><h1>' + escapeHtml(manifest.title || 'Notes') + '</h1><p>' +
      escapeHtml(manifest.tagline || '') + '</p></div><div class="cards-grid">' +
      manifest.subjects.map(function (s) {
        var p = subjectProgress(s);
        return '<a class="subject-card' + (s.soon ? ' soon' : '') + '" href="#/' + s.id + '"><h3>' + escapeHtml(s.title) + '</h3>' +
          '<p>' + escapeHtml(s.description || '') + '</p>' +
          '<div class="meta">' + (s.soon ? 'Coming soon' : s.chapters.length + ' chapters &middot; ' + p.pct + '% complete') + '</div>' +
          (s.soon ? '' : '<div class="bar"><span style="width:' + p.pct + '%"></span></div>') + '</a>';
      }).join('') + '</div></div>';
    main.innerHTML = html;
    window.scrollTo(0, 0);
  }

  function viewSubject(s) {
    layout.classList.remove('no-sidebar');
    renderSidebar(s, null);
    toc.innerHTML = '';
    setTitle(s.title);
    var p = subjectProgress(s);
    var next = s.chapters.filter(function (c) { return !isDone(s, c); })[0] || s.chapters[0];
    main.innerHTML = '<div class="page prose"><h1>' + escapeHtml(s.title) + '</h1>' +
      '<p class="lede">' + escapeHtml(s.description || '') + '</p>' +
      (s.intro ? '<div>' + renderBlock(s.intro) + '</div>' : '') +
      '<div class="bar" style="margin:18px 0 8px"><span style="width:' + p.pct + '%"></span></div>' +
      '<div class="chapter-meta" style="margin:0 0 6px">' + p.done + ' of ' + p.total + ' chapters completed</div>' +
      (next ? '<p><a class="btn primary" href="#/' + s.id + '/' + next.id + '">' + (p.done ? 'Continue: ' : 'Start: ') + escapeHtml(next.title) + ' &rarr;</a></p>' : '') +
      '<ol class="chapter-list">' + s.chapters.map(function (c) {
        var d = isDone(s, c);
        return '<li><a href="#/' + s.id + '/' + c.id + '"><span class="cl-num">' + (c.num != null ? c.num : c.n) + '</span>' +
          '<span class="cl-title">' + escapeHtml(c.title) + '</span>' +
          '<span class="cl-meta' + (d ? ' done' : '') + '">' + (d ? '&#10003; done' : (c.minutes ? c.minutes + ' min' : '')) + '</span>' +
          (c.description ? '<span class="cl-desc">' + escapeHtml(c.description) + '</span>' : '') + '</a></li>';
      }).join('') + '</ol></div>';
    window.scrollTo(0, 0);
  }

  function viewChapter(s, c, section) {
    layout.classList.remove('no-sidebar');
    renderSidebar(s, c);
    setTitle(c.title);
    var route = s.id + '/' + c.id;
    return Promise.all([fetchText(c.path), loadScripts(s)]).then(function (res) {
      if (current.route !== route) return; // navigated away meanwhile
      var r = renderMarkdown(res[0], true);
      var art = document.createElement('article');
      art.className = 'prose';
      art.innerHTML = r.html;

      // Assign stable heading ids from the source headings.
      var hs = art.querySelectorAll('h1, h2, h3, h4');
      hs.forEach(function (h, i) {
        var src = r.headings[i];
        h.id = src && +h.tagName[1] === src.level ? src.id : slugify(h.textContent);
        if (h.tagName !== 'H1' || hs.length && art.querySelectorAll('h1').length > 1) {
          var a = document.createElement('a');
          a.className = 'heading-anchor'; a.href = '#/' + route + '/' + h.id; a.textContent = '#';
          a.setAttribute('aria-label', 'Link to this section');
          h.appendChild(a);
        }
      });
      var h1s = art.querySelectorAll('h1');
      if (h1s.length > 1) art.classList.add('many-h1');

      // Meta line under the title.
      var words = res[0].split(/\s+/).length;
      var meta = document.createElement('div');
      meta.className = 'chapter-meta';
      meta.textContent = 'Chapter ' + (c.num != null ? c.num : c.n) + ' of ' + s.title + ' · ~' + (c.minutes || Math.max(3, Math.round(words / 180))) + ' min';
      if (h1s.length === 1) h1s[0].after(meta); else art.prepend(meta);

      enhance(art, { base: s.dir + c.file.replace(/[^/]*$/, ''), subject: s });

      // Footer: completion toggle and pager.
      var done = document.createElement('div');
      done.className = 'done-row';
      var btn = document.createElement('button');
      btn.className = 'btn';
      function syncDone() {
        var d = isDone(s, c);
        btn.className = 'btn' + (d ? ' on' : ' primary');
        btn.innerHTML = d ? '&#10003; Completed' : 'Mark chapter as complete';
      }
      btn.addEventListener('click', function () { setDone(s, c, !isDone(s, c)); syncDone(); renderSidebar(s, c); });
      syncDone();
      done.appendChild(btn);
      done.appendChild(Object.assign(document.createElement('span'), { className: 'chapter-meta', style: 'margin:0', textContent: 'Progress is saved in this browser.' }));
      art.appendChild(done);

      var prev = s.chapters[c.n - 1], next = s.chapters[c.n + 1];
      var pager = document.createElement('nav');
      pager.className = 'pager';
      pager.innerHTML =
        (prev ? '<a href="#/' + s.id + '/' + prev.id + '"><div class="pg-label">&larr; Previous</div>' + escapeHtml(prev.title) + '</a>' : '') +
        (next ? '<a class="pg-next" href="#/' + s.id + '/' + next.id + '"><div class="pg-label">Next &rarr;</div>' + escapeHtml(next.title) + '</a>' : '');
      art.appendChild(pager);

      destroyWidgets();
      main.innerHTML = '';
      main.appendChild(art);
      mountWidgets(art, r.widgets, route);
      buildToc(art, route);
      scrollToSection(section);
    });
  }

  function scrollToSection(id) {
    if (!id) { window.scrollTo(0, 0); return; }
    var t = document.getElementById(id);
    if (t) t.scrollIntoView(); else window.scrollTo(0, 0);
  }

  function buildToc(art, route) {
    var multiH1 = art.querySelectorAll('h1').length > 1;
    var sel = multiH1 ? 'h1, h2' : 'h2, h3';
    var hs = Array.from(art.querySelectorAll(sel));
    if (spy) { window.removeEventListener('scroll', spy); spy = null; }
    if (hs.length < 2) { toc.innerHTML = ''; return; }
    var top = multiH1 ? 'H1' : 'H2';
    toc.innerHTML = '<div class="toc-title">On this page</div><ul>' + hs.map(function (h) {
      var label = h.cloneNode(true);
      var a = label.querySelector('.heading-anchor'); if (a) a.remove();
      return '<li class="' + (h.tagName === top ? 'lvl-1' : 'lvl-2') + '"><a href="#/' + route + '/' + h.id + '" data-id="' + h.id + '">' + label.innerHTML + '</a></li>';
    }).join('') + '</ul>';
    var links = toc.querySelectorAll('a');
    var ticking = false;
    spy = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var idx = 0;
        for (var i = 0; i < hs.length; i++) { if (hs[i].getBoundingClientRect().top < 120) idx = i; else break; }
        links.forEach(function (l, i) { l.classList.toggle('active', i === idx); });
        var a = links[idx];
        if (a && toc.scrollHeight > toc.clientHeight) {
          var r = a.getBoundingClientRect(), tr = toc.getBoundingClientRect();
          if (r.top < tr.top + 40 || r.bottom > tr.bottom - 40) toc.scrollTop += r.top - tr.top - tr.height / 3;
        }
      });
    };
    window.addEventListener('scroll', spy, { passive: true });
    spy();
  }

  function viewError(msg) {
    destroyWidgets();
    main.innerHTML = '<div class="page error-page">' + msg + '</div>';
  }

  /* =====================================================================
   * Router
   * ===================================================================== */

  function route() {
    document.body.classList.remove('nav-open');
    $('#scrim').hidden = true;
    $('#search-results').hidden = true;
    var parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
    var s = parts[0] && subjectById(parts[0]);
    if (!parts.length) { current = {}; destroyWidgets(); return viewHome(); }
    if (!s) return viewError('No subject called <b>' + escapeHtml(parts[0]) + '</b>. <a href="#/">Go home</a>.');
    if (parts.length === 1) { current = { route: s.id }; destroyWidgets(); return viewSubject(s); }
    var c = s.chapters.filter(function (ch) { return ch.id === parts[1]; })[0];
    if (!c) return viewError('No chapter <b>' + escapeHtml(parts[1]) + '</b> in ' + escapeHtml(s.title) + '. <a href="#/' + s.id + '">Back</a>.');
    var r = s.id + '/' + c.id;
    if (current.route === r && main.querySelector('article')) { renderSidebar(s, c); return scrollToSection(parts[2]); }
    current = { route: r };
    main.innerHTML = '<div class="loading">Loading&hellip;</div>';
    viewChapter(s, c, parts[2]).catch(function (e) {
      console.error(e);
      viewError('Could not load <code>' + escapeHtml(c.path) + '</code>.<br>' + (location.protocol === 'file:' ?
        'Browsers block <code>fetch</code> on <code>file://</code>. Serve the folder instead:<br><code>python3 -m http.server</code> and open <code>http://localhost:8000</code>.' :
        escapeHtml(String(e.message || e))));
    });
  }

  /* =====================================================================
   * Search
   * ===================================================================== */

  var index = null, indexing = null;

  function plain(md) {
    return md
      .replace(/^```(quiz|cards)[\s\S]*?^```/gm, function (b) { return b.replace(/^[?+\-=]\s|^[QA]:\s/gm, ''); })
      .replace(/^```anim[\s\S]*?^```/gm, '')
      .replace(/\$\$?([^$]+)\$\$?/g, function (_, t) {
        return t.replace(/\\(text|mathrm|mathbf|operatorname|left|right|big|Big)\b/g, '').replace(/\\([a-zA-Z]+)/g, '$1').replace(/[{}]/g, '');
      })
      .replace(/<[^>]+>/g, ' ')
      .replace(/[#*_`>|]/g, ' ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\s+/g, ' ');
  }

  function buildIndex() {
    if (index) return Promise.resolve(index);
    if (indexing) return indexing;
    var jobs = [];
    manifest.subjects.forEach(function (s) {
      s.chapters.forEach(function (c) {
        jobs.push(fetchText(c.path).then(function (md) {
          var out = [], seen = {}, head = { text: c.title, id: '' }, buf = [];
          function flush() {
            var t = plain(buf.join('\n'));
            if (t.trim() || head.id === '') out.push({ s: s, c: c, h: head.text.replace(/\$/g, ''), id: head.id, t: t });
            buf = [];
          }
          var inFence = false;
          md.split('\n').forEach(function (line) {
            if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
            var m = !inFence && /^(#{1,4})[ \t]+(.+?)[ \t]*#*[ \t]*$/.exec(line);
            if (m) {
              flush();
              var id = slugify(m[2]);
              if (seen[id]) id += '-' + (++seen[id]); else seen[id] = 1;
              head = { text: m[2], id: m[1].length === 1 && !out.length ? '' : id };
            } else buf.push(line);
          });
          flush();
          return out;
        }).catch(function () { return []; }));
      });
    });
    indexing = Promise.all(jobs).then(function (arr) { index = [].concat.apply([], arr); return index; });
    return indexing;
  }

  function search(q) {
    var terms = q.toLowerCase().split(/\s+/).filter(function (t) { return t.length > 1; });
    if (!terms.length) return [];
    var res = [], phrase = terms.length > 1 ? terms.join(' ') : null;
    index.forEach(function (e) {
      var h = e.h.toLowerCase(), t = e.t.toLowerCase(), ct = e.c.title.toLowerCase(), score = 0;
      if (phrase) score += (h.indexOf(phrase) >= 0 ? 30 : 0) + (t.indexOf(phrase) >= 0 ? 6 * Math.min(5, t.split(phrase).length - 1) : 0);
      for (var i = 0; i < terms.length; i++) {
        var w = terms[i], inH = h.indexOf(w) >= 0, inC = ct.indexOf(w) >= 0, k = 0, p = -1;
        while ((p = t.indexOf(w, p + 1)) >= 0 && k < 20) k++;
        if (!inH && !inC && !k) return;
        score += (inH ? 8 : 0) + (inC ? 2 : 0) + Math.min(k, 10);
      }
      res.push({ e: e, score: score });
    });
    return res.sort(function (a, b) { return b.score - a.score; }).slice(0, 12).map(function (r) { return r.e; });
  }

  function highlight(text, terms) {
    var h = escapeHtml(text);
    terms.forEach(function (t) {
      h = h.replace(new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>');
    });
    return h;
  }

  function initSearch() {
    var input = $('#search'), box = $('#search-results'), sel = -1;
    function close() { box.hidden = true; sel = -1; }
    function run() {
      var q = input.value.trim();
      if (!q) return close();
      buildIndex().then(function () {
        var terms = q.toLowerCase().split(/\s+/).filter(function (t) { return t.length > 1; });
        var rs = search(q);
        sel = -1;
        box.innerHTML = rs.length ? rs.map(function (e) {
          var t = e.t, i = t.toLowerCase().indexOf(terms[0] || ''), from = Math.max(0, i - 50);
          var snip = (from ? '…' : '') + t.slice(from, from + 150) + '…';
          return '<a href="#/' + e.s.id + '/' + e.c.id + (e.id ? '/' + e.id : '') + '">' +
            '<div class="sr-title">' + highlight(e.h, terms) + '</div>' +
            '<div class="sr-path">' + escapeHtml(e.s.short || e.s.title) + ' &rsaquo; ' + escapeHtml(e.c.title) + '</div>' +
            '<div class="sr-snip">' + highlight(snip, terms) + '</div></a>';
        }).join('') : '<div class="sr-empty">No results for “' + escapeHtml(q) + '”</div>';
        box.hidden = false;
      });
    }
    var timer;
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 120); });
    input.addEventListener('focus', function () { buildIndex(); if (input.value.trim()) run(); });
    input.addEventListener('keydown', function (e) {
      var items = box.querySelectorAll('a');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!items.length) return;
        sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items.forEach(function (a, i) { a.classList.toggle('active', i === sel); });
        items[sel].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        var a = items[sel >= 0 ? sel : 0];
        if (a) { location.hash = a.getAttribute('href'); close(); input.blur(); }
      } else if (e.key === 'Escape') { close(); input.blur(); }
    });
    box.addEventListener('click', function (e) { if (e.target.closest('a')) { close(); input.blur(); } });
    document.addEventListener('click', function (e) { if (!e.target.closest('.search')) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); input.focus(); }
    });
  }

  /* =====================================================================
   * Theme, chrome, boot
   * ===================================================================== */

  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  function isDark() {
    var t = document.documentElement.getAttribute('data-theme');
    return t ? t === 'dark' : mq.matches;
  }
  function syncTheme() {
    var d = isDark();
    $('#hl-light').disabled = d;
    $('#hl-dark').disabled = !d;
    document.dispatchEvent(new Event('themechange'));
  }

  function initChrome() {
    $('#theme-btn').addEventListener('click', function () {
      var t = isDark() ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', t);
      try { localStorage.setItem('notes:theme', t); } catch (e) {}
      syncTheme();
    });
    mq.addEventListener && mq.addEventListener('change', syncTheme);
    syncTheme();

    $('#menu-btn').addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      $('#scrim').hidden = !open;
    });
    $('#scrim').addEventListener('click', function () { document.body.classList.remove('nav-open'); $('#scrim').hidden = true; });

    var bar = $('#read-progress'), tick = false;
    window.addEventListener('scroll', function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () {
        tick = false;
        var h = document.documentElement.scrollHeight - innerHeight;
        bar.style.width = (h > 0 ? (100 * scrollY) / h : 0) + '%';
      });
    }, { passive: true });
  }

  initChrome();
  loadManifest().then(function () {
    if (manifest.title) document.querySelector('.brand').textContent = manifest.title;
    initSearch();
    window.addEventListener('hashchange', route);
    route();
  }).catch(function (e) {
    console.error(e);
    viewError(location.protocol === 'file:' ?
      'This site loads its notes with <code>fetch</code>, which browsers block on <code>file://</code>.<br>Run <code>python3 -m http.server</code> in this folder and open <code>http://localhost:8000</code>.' :
      'Could not load <code>' + MANIFEST + '</code>: ' + escapeHtml(String(e.message || e)));
  });
})();
