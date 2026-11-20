/*
 * Widgets: interactive blocks embedded in Markdown with fenced code blocks.
 *
 *   ```quiz      multiple-choice questions (see README for syntax)
 *   ```cards     flashcards
 *   ```timeline  vertical timeline: "YEAR | markdown"
 *   ```anim      a named animation registered with Notes.registerAnim(name, fn)
 *
 * Subject-specific animations live in content/<subject>/*.js and are listed in content/subjects.json.
 */
(function () {
  'use strict';

  var Notes = (window.Notes = window.Notes || {});
  Notes.widgets = {};
  Notes.anims = {};

  Notes.registerAnim = function (name, fn) { Notes.anims[name] = fn; };

  /* ---------- Storage (never throws) ---------- */
  Notes.store = {
    get: function (k, d) {
      try { var v = localStorage.getItem('notes:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem('notes:' + k, JSON.stringify(v)); } catch (e) {}
    }
  };

  /* ---------- Small DOM/UI helpers for widget authors ---------- */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  Notes.ui = {
    el: el,
    panel: function (title, note) {
      var p = el('div', 'panel');
      if (title) p.appendChild(el('div', 'panel-head', '<span class="panel-title">' + title + '</span>'));
      p.body = p;
      if (note) p._note = note;
      return p;
    },
    note: function (parent, html) { var n = el('div', 'panel-note', html); parent.appendChild(n); return n; },
    controls: function (parent) { var c = el('div', 'controls'); parent.appendChild(c); return c; },
    slider: function (parent, o) {
      var lab = el('label');
      lab.appendChild(document.createTextNode(o.label + ' '));
      var inp = el('input');
      inp.type = 'range'; inp.min = o.min; inp.max = o.max; inp.step = o.step || 'any'; inp.value = o.value;
      var val = el('span', 'val');
      var f = o.fmt || function (v) { return String(+(+v).toPrecision(3)); };
      function upd() { val.textContent = f(+inp.value); }
      upd();
      inp.addEventListener('input', function () { upd(); if (o.onInput) o.onInput(+inp.value); });
      lab.appendChild(inp); lab.appendChild(val);
      parent.appendChild(lab);
      return { el: lab, input: inp, get value() { return +inp.value; }, set: function (v) { inp.value = v; upd(); } };
    },
    select: function (parent, o) {
      var lab = el('label');
      lab.appendChild(document.createTextNode(o.label + ' '));
      var s = el('select');
      o.options.forEach(function (opt) {
        var op = el('option'); op.value = opt[0]; op.textContent = opt[1]; s.appendChild(op);
      });
      if (o.value != null) s.value = o.value;
      s.addEventListener('change', function () { if (o.onChange) o.onChange(s.value); });
      lab.appendChild(s); parent.appendChild(lab);
      return { el: lab, select: s, get value() { return s.value; } };
    },
    button: function (parent, label, onClick, cls) {
      var b = el('button', 'btn small' + (cls ? ' ' + cls : ''));
      b.type = 'button'; b.textContent = label;
      b.addEventListener('click', onClick);
      parent.appendChild(b);
      return b;
    },
    legend: function (parent, items) {
      var l = el('div', 'legend');
      items.forEach(function (it) {
        l.appendChild(el('span', '', '<i style="background:' + Plot.color(it.color) + (it.dash ? ';opacity:.6' : '') + '"></i>' + it.label));
      });
      parent.appendChild(l);
      return l;
    }
  };

  /*
   * Run fn(dt, t) on every animation frame, but only while el is on screen.
   * Returns { stop, start, running }.
   */
  Notes.animate = function (el, fn) {
    var raf = 0, visible = false, wanted = true, last = 0, t = 0;
    function frame(now) {
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now; t += dt;
      fn(dt, t);
      raf = requestAnimationFrame(frame);
    }
    function sync() {
      if (visible && wanted && !raf) { last = 0; raf = requestAnimationFrame(frame); }
      if ((!visible || !wanted) && raf) { cancelAnimationFrame(raf); raf = 0; }
    }
    var io = new IntersectionObserver(function (es) { visible = es[0].isIntersecting; sync(); });
    io.observe(el);
    return {
      stop: function () { wanted = false; sync(); },
      start: function () { wanted = true; sync(); },
      destroy: function () { wanted = false; sync(); io.disconnect(); },
      get running() { return wanted; }
    };
  };

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------- Quiz ---------- */
  function parseQuiz(src) {
    var qs = [], cur = null, last = null;
    src.split('\n').forEach(function (raw) {
      var line = raw.replace(/\s+$/, '');
      var m = /^([?+\-=])\s+(.*)$/.exec(line);
      if (m && m[1] === '?') { cur = { q: m[2], opts: [], explain: '' }; qs.push(cur); last = 'q'; return; }
      if (!cur) return;
      if (m && (m[1] === '+' || m[1] === '-')) { cur.opts.push({ text: m[2], ok: m[1] === '+' }); last = 'o'; return; }
      if (m && m[1] === '=') { cur.explain = m[2]; last = 'e'; return; }
      if (!line.trim()) { if (last === 'e') cur.explain += '\n\n'; return; }
      // Continuation of the previous element.
      if (last === 'q') cur.q += ' ' + line.trim();
      else if (last === 'o') cur.opts[cur.opts.length - 1].text += ' ' + line.trim();
      else if (last === 'e') cur.explain += '\n' + line;
    });
    return qs.filter(function (q) { return q.opts.length; });
  }

  Notes.widgets.quiz = function (root, src, ctx) {
    var qs = parseQuiz(src);
    var key = 'quiz:' + ctx.route + ':' + ctx.index;
    var panel = el('div', 'panel quiz');
    var head = el('div', 'quiz-head');
    var title = el('span', 'panel-title', 'Check yourself &middot; ' + qs.length + ' question' + (qs.length === 1 ? '' : 's'));
    var score = el('span', 'quiz-score');
    head.appendChild(title); head.appendChild(score);
    panel.appendChild(head);
    var body = el('div');
    panel.appendChild(body);
    var foot = el('div', 'q-actions');
    panel.appendChild(foot);
    Notes.ui.button(foot, 'Reset & shuffle', build);
    root.appendChild(panel);

    var answered, correct;
    function updScore() {
      var best = Notes.store.get(key, null);
      score.innerHTML = '<b>' + correct + '</b> / ' + answered + ' answered of ' + qs.length +
        (best != null ? ' &middot; best ' + best + '/' + qs.length : '');
      if (answered === qs.length) {
        if (best == null || correct > best) Notes.store.set(key, correct);
        if (ctx.onScore) ctx.onScore(correct, qs.length);
      }
    }

    function build() {
      answered = 0; correct = 0;
      body.innerHTML = '';
      shuffle(qs.slice()).forEach(function (q, qi) {
        var multi = q.opts.filter(function (o) { return o.ok; }).length > 1;
        var box = el('div', 'q');
        box.appendChild(el('div', 'q-text', '<span class="q-num">' + (qi + 1) + '.</span>' + ctx.inline(q.q) +
          (multi ? '<span class="q-multi-hint">(select all that apply)</span>' : '')));
        var opts = el('div', 'q-opts');
        var btns = shuffle(q.opts.slice()).map(function (o) {
          var b = el('button', 'q-opt', ctx.inline(o.text));
          b.type = 'button'; b._ok = o.ok;
          opts.appendChild(b);
          return b;
        });
        box.appendChild(opts);
        var ex = el('div', 'q-explain');
        ex.hidden = true;
        if (q.explain) ex.innerHTML = ctx.block(q.explain);
        box.appendChild(ex);

        function finish(chosen) {
          var ok = true;
          btns.forEach(function (b) {
            b.disabled = true;
            var picked = chosen.indexOf(b) >= 0;
            b.classList.remove('selected');
            if (picked && b._ok) b.classList.add('correct');
            else if (picked && !b._ok) { b.classList.add('wrong'); ok = false; }
            else if (!picked && b._ok) { b.classList.add('missed'); ok = false; }
          });
          answered++; if (ok) correct++;
          if (q.explain) ex.hidden = false;
          updScore();
        }

        if (multi) {
          var chosen = [];
          btns.forEach(function (b) {
            b.addEventListener('click', function () {
              var i = chosen.indexOf(b);
              if (i >= 0) chosen.splice(i, 1); else chosen.push(b);
              b.classList.toggle('selected');
            });
          });
          var actions = el('div', 'q-actions');
          var check = Notes.ui.button(actions, 'Check answer', function () { check.remove(); finish(chosen); });
          box.appendChild(actions);
        } else {
          btns.forEach(function (b) { b.addEventListener('click', function () { finish([b]); }); });
        }
        body.appendChild(box);
      });
      updScore();
    }
    build();
  };

  /* ---------- Flashcards ---------- */
  function parseCards(src) {
    var cards = [], cur = null, side = null;
    src.split('\n').forEach(function (line) {
      var m = /^(Q|A):\s?(.*)$/.exec(line);
      if (m && m[1] === 'Q') { cur = { q: m[2], a: '' }; cards.push(cur); side = 'q'; return; }
      if (m && m[1] === 'A' && cur) { cur.a = m[2]; side = 'a'; return; }
      if (cur && side) cur[side] += '\n' + line;
    });
    return cards;
  }

  Notes.widgets.cards = function (root, src, ctx) {
    var all = parseCards(src), order = all.slice(), i = 0;
    var panel = el('div', 'panel');
    panel.appendChild(el('div', 'panel-head', '<span class="panel-title">Flashcards &middot; ' + all.length +
      '</span><span class="fc-count" style="font-size:.8rem">click card or press space to flip</span>'));
    var stage = el('div', 'fc-stage');
    var card = el('div', 'fc-card');
    card.tabIndex = 0;
    var front = el('div', 'fc-face fc-front'), back = el('div', 'fc-face fc-back');
    card.appendChild(front); card.appendChild(back);
    stage.appendChild(card);
    panel.appendChild(stage);
    var nav = el('div', 'fc-nav');
    var left = el('div'), count = el('span', 'fc-count'), right = el('div');
    Notes.ui.button(left, '← Prev', function () { go(-1); });
    Notes.ui.button(left, 'Shuffle', function () { order = shuffle(all.slice()); i = 0; show(); }).style.marginLeft = '6px';
    Notes.ui.button(right, 'Next →', function () { go(1); }, 'primary');
    nav.appendChild(left); nav.appendChild(count); nav.appendChild(right);
    panel.appendChild(nav);
    root.appendChild(panel);

    function fit() {
      // Grow the card to fit the taller face.
      card.style.minHeight = '';
      var h = Math.max(200, front.scrollHeight, back.scrollHeight);
      card.style.minHeight = h + 'px';
    }
    function show() {
      card.classList.remove('flipped');
      var c = order[i];
      front.innerHTML = '<span class="fc-side">Question</span>' + ctx.block(c.q.trim());
      back.innerHTML = '<span class="fc-side">Answer</span>' + ctx.block(c.a.trim());
      count.textContent = (i + 1) + ' / ' + order.length;
      fit();
    }
    function go(d) { i = (i + d + order.length) % order.length; show(); }
    card.addEventListener('click', function (e) { if (!e.target.closest('a')) card.classList.toggle('flipped'); });
    card.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); card.classList.toggle('flipped'); }
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    });
    if (all.length) show();
    var ro = window.ResizeObserver ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(stage);
    return { destroy: function () { if (ro) ro.disconnect(); } };
  };

  /* ---------- Timeline ---------- */
  Notes.widgets.timeline = function (root, src, ctx) {
    var ul = el('ul', 'timeline');
    src.split('\n').forEach(function (line) {
      var m = /^\s*([^|]+?)\s*\|\s*(.+)$/.exec(line);
      if (!m) return;
      var li = el('li');
      li.appendChild(el('div', 'tl-year', m[1]));
      li.appendChild(el('div', 'tl-body', ctx.block(m[2])));
      ul.appendChild(li);
    });
    root.appendChild(ul);
  };

  /* ---------- Named animations ---------- */
  Notes.widgets.anim = function (root, src, ctx) {
    var lines = src.split('\n').filter(function (l) { return l.trim(); });
    var name = (lines.shift() || '').trim();
    var params = {};
    lines.forEach(function (l) {
      var m = /^\s*([\w-]+)\s*:\s*(.*)$/.exec(l);
      if (m) params[m[1]] = isNaN(+m[2]) || m[2] === '' ? m[2] : +m[2];
    });
    var fn = Notes.anims[name];
    if (!fn) { root.innerHTML = '<div class="panel math-error">Unknown animation: ' + name + '</div>'; return; }
    return fn(root, params, ctx);
  };
})();
