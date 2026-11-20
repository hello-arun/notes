# Notes

A minimal, fast study-notes website: write Markdown, get rendered math (KaTeX), figures, live JavaScript simulations, quizzes and flashcards. There is no build step and no framework. It is a static site you can host anywhere (GitHub Pages works out of the box).

**First subject:** *Density Functional Theory*, 13 chapters from the many-body problem to ML interatomic potentials, with interactive simulations (including a real Kohn–Sham SCF solver running in the browser), a quiz in every chapter, a ~55-question interview bank and a final exam.

## Run locally

Browsers block `fetch()` on `file://`, so serve the folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Deploy on GitHub Pages

Push the repo, then **Settings → Pages → Deploy from branch → `main` / root**. The `.nojekyll` file is already there, so files are served as-is.

## Features

- Markdown with `$inline$` and `$$display$$` math (KaTeX; `\(…\)` and `\[…\]` also work)
- Interactive canvas figures that only animate while visible
- Quizzes (shuffled; best score saved), flashcards, timelines, collapsible Q&A
- Callouts: `> [!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!DANGER]`, `[!KEY]`, `[!INTERVIEW]`
- Full-text search across all subjects (press `/`)
- Per-chapter progress tracking (saved in the browser), table of contents with scroll-spy, prev/next navigation
- Dark/light theme, responsive layout, print-friendly styles, syntax highlighting with copy buttons

## Layout

```
index.html                 app shell
assets/css/style.css       all styles (theme tokens at the top)
assets/js/app.js           router, Markdown + math renderer, navigation, search, progress
assets/js/widgets.js       quiz, flashcards, timeline, animation registry, UI helpers
assets/js/plot.js          tiny canvas plotting helper for figures
content/subjects.json      list of subjects and chapters
content/<subject>/*.md     the notes
content/<subject>/*.js     optional interactive figures for that subject
```

## Adding a subject or chapter

1. Create `content/<subject-id>/` and write chapters as Markdown files.
2. Register them in `content/subjects.json`:

```json
{
  "id": "quantum-mechanics",
  "title": "Quantum Mechanics",
  "short": "QM",
  "description": "One-line summary shown on the home page.",
  "scripts": ["content/quantum-mechanics/qm-anims.js"],
  "chapters": [
    { "id": "postulates", "num": 1, "file": "01-postulates.md", "title": "Postulates", "minutes": 20, "description": "…" }
  ]
}
```

`scripts` and `minutes` are optional. Each chapter's first `# Heading` is its title on the page. Links to `other-chapter.md` are rewritten to the right route automatically, and relative image paths resolve against the chapter's folder.

## Authoring syntax

### Math

```markdown
Inline $E = mc^2$ and display:

$$
\hat H\Psi = E\Psi
$$
```

Handy macros: `\vr` (bold r), `\vk`, `\vR`, `\vG`, `\ket{}`, `\bra{}`, `\braket{}{}`, `\dd`, `\Exc`, `\vxc`, `\veff`, `\vext`, `\Ts`, `\EH`. Add more in `KATEX_MACROS` in `assets/js/app.js`.

### Callouts

```markdown
> [!INTERVIEW] Optional custom title
> Text of the callout.
```

### Collapsible answers

```markdown
<details>
<summary>Question?</summary>

Answer in **Markdown**, math $x^2$ allowed.

</details>
```

### Quiz

`?` starts a question, `+` is a correct option, `-` a wrong one, `=` the explanation. Several `+` lines make it a multi-select question. Options are shuffled, so avoid "all of the above".

````markdown
```quiz
? What is $\int_0^1 x\,dx$?
+ $1/2$
- $1$
- $0$
= Area of a triangle with base 1 and height 1.
```
````

### Flashcards

````markdown
```cards
Q: Front of card (Markdown + math)
A: Back of card

Q: Next card
A: …
```
````

### Timeline

````markdown
```timeline
1964 | **Hohenberg–Kohn** theorems
1965 | **Kohn–Sham** equations
```
````

### Interactive figures

Use a registered animation by name, with optional `key: value` parameters:

````markdown
```anim
scf-1d
alpha: 0.5
```
````

Register one in a subject script (listed under `scripts` in `subjects.json`):

```js
Notes.registerAnim('my-figure', function (root, params, ctx) {
  var panel = Notes.ui.el('div', 'panel');
  root.appendChild(panel);
  var canvas = Notes.ui.el('canvas');
  panel.appendChild(canvas);
  var plot = new Plot(canvas, { height: 240, xlim: [0, 10], ylim: [-1, 1], xlabel: 't' });
  var ctl = Notes.ui.controls(panel);
  var w = Notes.ui.slider(ctl, { label: 'ω', min: 0.5, max: 3, value: 1, onInput: draw });

  function draw(t) {
    var xs = [], ys = [];
    for (var x = 0; x <= 10; x += 0.02) { xs.push(x); ys.push(Math.sin(w.value * x - (t || 0))); }
    plot.clear(); plot.axes(); plot.line(xs, ys, { color: 'c1' });
  }
  plot.onResize = draw;                                 // redraw on resize / theme change
  var loop = Notes.animate(panel, function (dt, t) { draw(t); });  // runs only while visible
  return { destroy: function () { loop.destroy(); plot.destroy(); } };
});
```

Colours such as `'c1'`…`'c5'`, `'fg'`, `'accent'` come from CSS variables, so figures follow the light/dark theme automatically. See `content/dft/dft-anims.js` for complete examples (a 1D Kohn–Sham solver, plane-wave convergence, smearing functions, k-point grids, and more).

## Libraries

Loaded from CDNs with pinned versions: [marked](https://marked.js.org) 12.0.2 (Markdown), [KaTeX](https://katex.org) 0.16.11 (math, much faster than MathJax), [highlight.js](https://highlightjs.org) 11.9.0 (code). Everything else is plain JavaScript.
