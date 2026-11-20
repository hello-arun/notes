/*
 * Interactive figures for the Density Functional Theory notes.
 * Each is used from Markdown as:
 *
 *   ```anim
 *   scf-1d
 *   ```
 */
(function () {
  'use strict';
  var ui = Notes.ui, el = ui.el;

  function header(panel, title, right) {
    panel.appendChild(el('div', 'panel-head', '<span class="panel-title">' + title + '</span>' +
      (right ? '<span class="fc-count" style="font-size:.8rem">' + right + '</span>' : '')));
  }
  function linspace(a, b, n) { var o = new Float64Array(n); for (var i = 0; i < n; i++) o[i] = a + ((b - a) * i) / (n - 1); return o; }
  function dot(u, v, h) { var s = 0; for (var i = 0; i < u.length; i++) s += u[i] * v[i]; return s * (h || 1); }

  // erf, Abramowitz & Stegun 7.1.26 (|error| < 1.5e-7)
  function erf(x) {
    var s = x < 0 ? -1 : 1; x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  function erfc(x) { return 1 - erf(x); }

  /* =====================================================================
   * 1. A real (toy) 1D Kohn-Sham SCF solver
   * ===================================================================== */

  // k lowest eigenpairs of a symmetric tridiagonal matrix (diag a, constant off-diagonal b)
  function tridiagEigs(a, b, k) {
    var n = a.length, b2 = b * b, lo0 = Infinity, hi0 = -Infinity, i;
    for (i = 0; i < n; i++) { lo0 = Math.min(lo0, a[i]); hi0 = Math.max(hi0, a[i]); }
    lo0 -= 2 * Math.abs(b); hi0 += 2 * Math.abs(b);
    function count(x) { // number of eigenvalues below x (Sturm sequence)
      var c = 0, q = a[0] - x;
      if (q < 0) c++;
      for (var j = 1; j < n; j++) { q = a[j] - x - b2 / (q === 0 ? 1e-300 : q); if (q < 0) c++; }
      return c;
    }
    var vals = [], vecs = [];
    for (var e = 0; e < k; e++) {
      var lo = lo0, hi = hi0;
      for (var it = 0; it < 60; it++) { var mid = 0.5 * (lo + hi); if (count(mid) > e) hi = mid; else lo = mid; }
      var lam = 0.5 * (lo + hi);
      vals.push(lam);
      // inverse iteration
      var x = new Float64Array(n);
      for (i = 0; i < n; i++) x[i] = 1 + 0.3 * Math.sin(1.7 * i + e);
      for (it = 0; it < 4; it++) {
        x = solveShifted(a, b, lam - 1e-9 * (1 + Math.abs(lam)), x);
        for (var p = 0; p < vecs.length; p++) { var d = dot(x, vecs[p]); for (i = 0; i < n; i++) x[i] -= d * vecs[p][i]; }
        var nr = Math.sqrt(dot(x, x)); for (i = 0; i < n; i++) x[i] /= nr;
      }
      vecs.push(x);
    }
    return { vals: vals, vecs: vecs };
  }
  function solveShifted(a, b, s, r) { // Thomas algorithm for (T - sI) x = r
    var n = a.length, cp = new Float64Array(n), dp = new Float64Array(n), x = new Float64Array(n);
    var den = a[0] - s; if (Math.abs(den) < 1e-14) den = 1e-14;
    cp[0] = b / den; dp[0] = r[0] / den;
    for (var i = 1; i < n; i++) {
      den = a[i] - s - b * cp[i - 1]; if (Math.abs(den) < 1e-14) den = 1e-14;
      cp[i] = b / den; dp[i] = (r[i] - b * dp[i - 1]) / den;
    }
    x[n - 1] = dp[n - 1];
    for (i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
    return x;
  }
  function solveLinear(A, y) { // Gaussian elimination with partial pivoting (small systems)
    var n = y.length, M = A.map(function (r, i) { return r.slice().concat([y[i]]); });
    for (var c = 0; c < n; c++) {
      var p = c;
      for (var r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
      var t = M[c]; M[c] = M[p]; M[p] = t;
      if (Math.abs(M[c][c]) < 1e-300) M[c][c] = 1e-300;
      for (r = c + 1; r < n; r++) { var f = M[r][c] / M[c][c]; for (var k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
    }
    var x = new Array(n);
    for (var i = n - 1; i >= 0; i--) { var s = M[i][n]; for (var j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / M[i][i]; }
    return x;
  }

  function KS1D(o) {
    var M = 161, L = 8, x = linspace(-L, L, M), h = x[1] - x[0], i, j;
    var vext = new Float64Array(M);
    var N = o.N, Z;
    for (i = 0; i < M; i++) {
      var X = x[i];
      if (o.pot === 'harmonic') vext[i] = 0.5 * 0.25 * X * X;
      else if (o.pot === 'double') vext[i] = 0.02 * Math.pow(X * X - 9, 2) - 1.62;
      else if (o.pot === 'box') vext[i] = 0;
      else { Z = N / 2; vext[i] = -Z / Math.sqrt((X - 1.5) * (X - 1.5) + 1) - Z / Math.sqrt((X + 1.5) * (X + 1.5) + 1); }
    }
    var K = []; // soft-Coulomb kernel, times h
    for (i = 0; i < M; i++) { K.push(new Float64Array(M)); for (j = 0; j < M; j++) K[i][j] = h / Math.sqrt((x[i] - x[j]) * (x[i] - x[j]) + 1); }
    var cx = Math.pow(3 / Math.PI, 1 / 3);
    var self = {
      x: x, h: h, vext: vext, N: N, lam: o.lam,
      potentials: function (n) {
        var vH = new Float64Array(M), vx = new Float64Array(M), EH = 0, Ex = 0, Vx = 0;
        for (i = 0; i < M; i++) { var s = 0, Ki = K[i]; for (j = 0; j < M; j++) s += Ki[j] * n[j]; vH[i] = self.lam * s; }
        for (i = 0; i < M; i++) {
          var c = Math.cbrt(Math.max(n[i], 0));
          vx[i] = -self.lam * cx * c;
          EH += 0.5 * n[i] * vH[i] * h;
          Ex += -self.lam * 0.75 * cx * c * c * c * c * h;
        }
        return { vH: vH, vx: vx, EH: EH, Ex: Ex };
      },
      // Diagonalise H[v_eff(n_in)] and build n_out. Also returns the KS energy at n_out.
      solve: function (nIn) {
        var p = nIn ? self.potentials(nIn) : null, a = new Float64Array(M), veff = new Float64Array(M);
        for (i = 0; i < M; i++) { veff[i] = vext[i] + (p ? p.vH[i] + p.vx[i] : 0); a[i] = 1 / (h * h) + veff[i]; }
        var nocc = N / 2, r = tridiagEigs(a, -0.5 / (h * h), nocc), nOut = new Float64Array(M);
        r.vecs.forEach(function (v) { for (i = 0; i < M; i++) nOut[i] += (2 * v[i] * v[i]) / h; });
        var Eband = 2 * r.vals.reduce(function (s, e) { return s + e; }, 0);
        var q = self.potentials(nOut), Ts = Eband - dot(veff, nOut, h);
        var E = Ts + dot(vext, nOut, h) + q.EH + q.Ex;
        return { nOut: nOut, eps: r.vals, E: E, veff: veff };
      }
    };
    return self;
  }

  Notes.registerAnim('scf-1d', function (root, params) {
    var panel = el('div', 'panel'); root.appendChild(panel);
    header(panel, 'Live 1D Kohn–Sham self-consistent field', 'a real solver running in your browser');
    var grid = el('div', 'two-col'); panel.appendChild(grid);
    var c1 = el('canvas'), c2 = el('canvas'); grid.appendChild(c1); grid.appendChild(c2);
    var pd = new Plot(c1, { height: 250, xlim: [-8, 8], ylim: [0, 1], xlabel: 'x (bohr)', ylabel: 'density n(x)' });
    var pr = new Plot(c2, { height: 250, xlim: [0, 30], ylim: [1e-8, 10], logy: true, xlabel: 'SCF iteration', ylabel: '‖n_out − n_in‖' });
    ui.legend(panel, [{ color: 'c1', label: 'n_in (input density)' }, { color: 'c2', label: 'n_out (from solving KS eqs.)' },
      { color: 'fg-faint', label: 'v_ext (scaled)' }, { color: 'c4', label: 'residual, this run' }, { color: 'fg-soft', label: 'previous run (compare α / mixing)' }]);
    var ctl = ui.controls(panel);
    var pot = ui.select(ctl, { label: 'Potential', value: params.pot || 'box', options: [['box', 'Flat box (metal-like)'], ['harmonic', 'Harmonic trap'], ['double', 'Double well'], ['atoms', 'Two atoms']], onChange: reset });
    var nel = ui.select(ctl, { label: 'Electrons', value: String(params.N || 8), options: [['2', '2'], ['4', '4'], ['6', '6'], ['8', '8'], ['12', '12']], onChange: reset });
    var lam = ui.slider(ctl, { label: 'e–e strength λ', min: 0, max: 2, step: 0.05, value: params.lam == null ? 1 : params.lam, onInput: reset });
    var mix = ui.select(ctl, { label: 'Mixing', value: params.mix || 'linear', options: [['linear', 'Linear'], ['pulay', 'Pulay / DIIS']], onChange: reset });
    var alpha = ui.slider(ctl, { label: 'α', min: 0.05, max: 1, step: 0.05, value: params.alpha || 0.7, onInput: reset });
    var ctl2 = ui.controls(panel);
    var runBtn = ui.button(ctl2, 'Run', toggle, 'primary');
    ui.button(ctl2, 'Step', function () { running = false; runBtn.textContent = 'Run'; step(); draw(); });
    ui.button(ctl2, 'Reset', reset);
    var out = el('div', 'readout'); panel.appendChild(out);

    var sys, nIn, last, res = [], prev = [], hist, it, running = false, done = false, acc = 0;
    function reset() {
      if (res.length > 1) prev = res.slice();
      sys = KS1D({ N: +nel.value, pot: pot.value, lam: lam.value });
      var start = sys.solve(null); // non-interacting guess
      nIn = start.nOut; last = null; res = []; hist = []; it = 0; done = false;
      step0();
      draw();
    }
    function step0() { last = sys.solve(nIn); }
    function step() {
      if (done) return;
      var nOut = last.nOut, M = nIn.length, R = new Float64Array(M), i;
      for (i = 0; i < M; i++) R[i] = nOut[i] - nIn[i];
      var r = Math.sqrt(dot(R, R, sys.h));
      res.push(r);
      if (r < 1e-7 || it >= 150 || !isFinite(r)) { done = true; running = false; runBtn.textContent = 'Run'; return; }
      var a = alpha.value, next = new Float64Array(M);
      if (mix.value === 'pulay') {
        hist.push({ n: nIn, R: R }); if (hist.length > 6) hist.shift();
        var m = hist.length, B = [], y = [];
        for (var p = 0; p <= m; p++) { B.push([]); for (var q = 0; q <= m; q++) B[p].push(p < m && q < m ? dot(hist[p].R, hist[q].R, sys.h) : (p === m && q === m ? 0 : -1)); y.push(p < m ? 0 : -1); }
        var c = solveLinear(B, y);
        for (p = 0; p < m; p++) for (i = 0; i < M; i++) next[i] += c[p] * (hist[p].n[i] + a * hist[p].R[i]);
        var tot = 0; for (i = 0; i < M; i++) { if (next[i] < 0) next[i] = 0; tot += next[i] * sys.h; }
        for (i = 0; i < M; i++) next[i] *= sys.N / tot;
      } else {
        for (i = 0; i < M; i++) next[i] = nIn[i] + a * R[i];
      }
      nIn = next; it++;
      step0();
    }
    function toggle() {
      if (done) reset();
      running = !running; runBtn.textContent = running ? 'Pause' : 'Run';
    }
    function draw() {
      var ymax = 0, i, x = sys.x;
      for (i = 0; i < x.length; i++) ymax = Math.max(ymax, nIn[i], last.nOut[i]);
      ymax = Math.max(0.2, ymax * 1.15);
      pd.ylim = [0, ymax];
      pd.clear(); pd.axes();
      var vmin = Infinity, vmax = -Infinity;
      for (i = 0; i < x.length; i++) { vmin = Math.min(vmin, sys.vext[i]); vmax = Math.max(vmax, sys.vext[i]); }
      var span = vmax - vmin || 1, vs = Array.prototype.map.call(sys.vext, function (v) { return pot.value === 'box' ? null : (0.9 * ymax * (v - vmin)) / span; });
      pd.line(x, vs, { color: 'fg-faint', width: 1.2 });
      pd.fill(x, nIn, { color: 'c1', alpha: 0.12 });
      pd.line(x, nIn, { color: 'c1', width: 2.2 });
      pd.line(x, last.nOut, { color: 'c2', width: 1.6, dash: [5, 4] });
      var n = Math.max(30, res.length + 2, prev.length + 2);
      pr.xlim = [0, n];
      pr.clear(); pr.axes();
      pr.hline(1e-7, { color: 'c3' });
      if (prev.length) pr.line(prev.map(function (_, k) { return k; }), prev, { color: 'fg-soft', width: 1.5, alpha: 0.45 });
      pr.line(res.map(function (_, k) { return k; }), res, { color: 'c4', width: 2 });
      pr.points(res.map(function (_, k) { return k; }), res, { color: 'c4', r: 2.2 });
      var r = res.length ? res[res.length - 1] : NaN;
      out.textContent = 'iteration ' + it + '   residual ' + (isFinite(r) ? r.toExponential(2) : '—') +
        '   E_total ' + last.E.toFixed(6) + ' Ha' + (done ? (r < 1e-7 ? '   ✓ converged' : '   ✗ stopped (no convergence)') : '') +
        '\noccupied ε_i (Ha): ' + last.eps.map(function (e) { return e.toFixed(4); }).join('  ');
    }
    pd.onResize = pr.onResize = draw;
    reset();
    var loop = Notes.animate(panel, function (dt) {
      if (!running) return;
      acc += dt;
      if (acc > 0.12) { acc = 0; step(); draw(); }
    });
    return { destroy: function () { loop.destroy(); pd.destroy(); pr.destroy(); } };
  });

  /* =====================================================================
   * 2. Plane-wave cutoff: all-electron vs pseudo wavefunction
   * ===================================================================== */
  Notes.registerAnim('pw-cutoff', function (root) {
    var panel = el('div', 'panel'); root.appendChild(panel);
    header(panel, 'Plane-wave cutoff & pseudopotentials', 'drag the sliders');
    var grid = el('div', 'two-col'); panel.appendChild(grid);
    var c1 = el('canvas'), c2 = el('canvas'); grid.appendChild(c1); grid.appendChild(c2);
    var pf = new Plot(c1, { height: 250, xlim: [-3, 3], ylim: [-0.35, 1.05], xlabel: 'x (bohr)', ylabel: 'ψ(x)' });
    var pc = new Plot(c2, { height: 250, xlim: [0, 80], ylim: [1e-7, 1], logy: true, xlabel: 'plane-wave index k', ylabel: '|c_k|' });
    ui.legend(panel, [{ color: 'c2', label: 'all-electron ψ (cusp + node)' }, { color: 'c1', label: 'pseudo ψ (smooth, nodeless core)' },
      { color: 'fg-faint', label: 'exact target' }]);
    var ctl = ui.controls(panel);
    var K = ui.slider(ctl, { label: 'number of plane waves K', min: 1, max: 80, step: 1, value: 12, onInput: draw, fmt: function (v) { return v | 0; } });
    var rc = ui.slider(ctl, { label: 'core radius r_c', min: 0.6, max: 1.8, step: 0.05, value: 1.0, onInput: build });
    var out = el('div', 'readout'); panel.appendChild(out);
    ui.note(panel, 'Each function is expanded as ψ(x) ≈ Σ<sub>|k|≤K</sub> c<sub>k</sub> e<sup>iG<sub>k</sub>x</sup> in a periodic box of length 10, with G<sub>k</sub> = 2πk/10. ' +
      'The cusp and the node of the all-electron function make its coefficients decay slowly; the pseudo-function is identical beyond r<sub>c</sub> but converges with far fewer plane waves.');

    var Lb = 10, NS = 1024, xs = new Float64Array(NS), KMAX = 80, i, k;
    for (i = 0; i < NS; i++) xs[i] = -Lb / 2 + (Lb * i) / NS;
    function ae(x) { var a = Math.abs(x); return (1 - 2 * a) * Math.exp(-2 * a); }
    var A = [], P = [], fAE = new Float64Array(NS), fPS = new Float64Array(NS), coefAE, coefPS;
    function ps(x, r) {
      var a = Math.abs(x);
      if (a >= r) return ae(a);
      var e = Math.exp(-2 * r), f = (1 - 2 * r) * e, f1 = (4 * r - 4) * e, f2 = (12 - 8 * r) * e;
      var a4 = (f2 - f1 / r) / (8 * r * r), a2 = (f1 / r - 4 * a4 * r * r) / 2, a0 = f - a2 * r * r - a4 * r * r * r * r;
      return a0 + a2 * a * a + a4 * a * a * a * a;
    }
    function coeffs(f) {
      var c = new Float64Array(KMAX + 1);
      for (k = 0; k <= KMAX; k++) { var s = 0, G = (2 * Math.PI * k) / Lb; for (i = 0; i < NS; i++) s += f[i] * Math.cos(G * xs[i]); c[k] = s / NS; }
      return c;
    }
    function build() {
      for (i = 0; i < NS; i++) { fAE[i] = ae(xs[i]); fPS[i] = ps(xs[i], rc.value); }
      coefAE = coeffs(fAE); coefPS = coeffs(fPS);
      draw();
    }
    function recon(c, K) {
      var y = new Float64Array(NS);
      for (i = 0; i < NS; i++) { var s = c[0]; for (k = 1; k <= K; k++) s += 2 * c[k] * Math.cos(((2 * Math.PI * k) / Lb) * xs[i]); y[i] = s; }
      return y;
    }
    function rms(a, b) { var s = 0, t = 0; for (i = 0; i < NS; i++) { s += (a[i] - b[i]) * (a[i] - b[i]); t += b[i] * b[i]; } return Math.sqrt(s / t); }
    function draw() {
      var Kv = K.value | 0, yA = recon(coefAE, Kv), yP = recon(coefPS, Kv);
      pf.clear(); pf.axes();
      pf.vline(rc.value); pf.vline(-rc.value);
      pf.line(xs, fAE, { color: 'fg-faint', width: 1 }); pf.line(xs, fPS, { color: 'fg-faint', width: 1 });
      pf.line(xs, yA, { color: 'c2', width: 2 }); pf.line(xs, yP, { color: 'c1', width: 2 });
      pf.text(rc.value + 0.05, 0.95, 'r_c', { size: 11 });
      pc.clear(); pc.axes();
      var ks = [], a = [], p = [];
      for (k = 0; k <= KMAX; k++) { ks.push(k); a.push(Math.abs(coefAE[k]) + 1e-12); p.push(Math.abs(coefPS[k]) + 1e-12); }
      pc.line(ks, a, { color: 'c2', width: 1.8 }); pc.line(ks, p, { color: 'c1', width: 1.8 });
      pc.vline(Kv, { color: 'c4', dash: [3, 3] });
      var G = (2 * Math.PI * Kv) / Lb;
      out.textContent = 'K = ' + Kv + '   G_max = ' + G.toFixed(2) + ' bohr⁻¹   E_cut = G²/2 = ' + (G * G / 2).toFixed(1) + ' Ha (' + (G * G / 2 * 27.211).toFixed(0) + ' eV)' +
        '\nrelative RMS error:  all-electron ' + (100 * rms(yA, fAE)).toFixed(2) + ' %    pseudo ' + (100 * rms(yP, fPS)).toFixed(3) + ' %';
    }
    pf.onResize = pc.onResize = draw;
    build();
    return { destroy: function () { pf.destroy(); pc.destroy(); } };
  });

  /* =====================================================================
   * 3. Smearing functions
   * ===================================================================== */
  Notes.registerAnim('smearing', function (root) {
    var panel = el('div', 'panel'); root.appendChild(panel);
    header(panel, 'Occupation smearing schemes');
    var c = el('canvas'); panel.appendChild(c);
    var p = new Plot(c, { height: 270, xlim: [-1, 1], ylim: [-0.15, 1.15], xlabel: 'ε − μ (eV)', ylabel: 'occupation f(ε)' });
    var defs = [
      { id: 'step', label: 'T = 0 step', color: 'fg-faint', f: function (y) { return y < 0 ? 1 : y > 0 ? 0 : 0.5; } },
      { id: 'fd', label: 'Fermi–Dirac', color: 'c1', f: function (y) { return 1 / (1 + Math.exp(y)); } },
      { id: 'gauss', label: 'Gaussian', color: 'c3', f: function (y) { return 0.5 * erfc(y); } },
      { id: 'mp', label: 'Methfessel–Paxton (N=1)', color: 'c2', f: function (y) { return 0.5 * erfc(y) - (y * Math.exp(-y * y)) / (2 * Math.sqrt(Math.PI)); } },
      { id: 'mv', label: 'Marzari–Vanderbilt (cold)', color: 'c4', f: function (y) { var u = y + Math.SQRT1_2; return 0.5 * erfc(u) + Math.exp(-u * u) / Math.sqrt(2 * Math.PI); } }
    ];
    var on = { step: true, fd: true, gauss: true, mp: true, mv: true };
    var leg = el('div', 'legend'); panel.appendChild(leg);
    defs.forEach(function (d) {
      var b = el('button', '', '<i style="background:' + Plot.color(d.color) + '"></i>' + d.label);
      b.type = 'button';
      b.addEventListener('click', function () { on[d.id] = !on[d.id]; b.classList.toggle('off', !on[d.id]); draw(); });
      leg.appendChild(b);
    });
    var ctl = ui.controls(panel);
    var sig = ui.slider(ctl, { label: 'smearing width σ', min: 0.01, max: 0.4, step: 0.01, value: 0.1, onInput: draw, fmt: function (v) { return v.toFixed(2) + ' eV'; } });
    var out = el('div', 'readout'); panel.appendChild(out);
    var xs = linspace(-1, 1, 601);
    function draw() {
      p.clear(); p.axes(); p.hline(0); p.hline(1);
      var s = sig.value, mpMin = 1;
      defs.forEach(function (d) {
        if (!on[d.id]) return;
        var ys = Array.prototype.map.call(xs, function (x) { return d.id === 'step' ? d.f(x) : d.f(x / s); });
        if (d.id === 'mp') mpMin = Math.min.apply(null, ys);
        p.line(xs, ys, { color: d.color, width: d.id === 'step' ? 1.2 : 2 });
      });
      out.textContent = 'click legend entries to toggle.  ' + (on.mp ? 'MP minimum occupation = ' + mpMin.toFixed(3) + ' (negative! non-physical but harmless)' : '');
    }
    p.onResize = draw; draw();
    return { destroy: function () { p.destroy(); } };
  });

  /* =====================================================================
   * 4. GGA exchange enhancement factors F_x(s)
   * ===================================================================== */
  Notes.registerAnim('xc-enhancement', function (root) {
    var panel = el('div', 'panel'); root.appendChild(panel);
    header(panel, 'Exchange enhancement factor F<sub>x</sub>(s)');
    var c = el('canvas'); panel.appendChild(c);
    var p = new Plot(c, { height: 280, xlim: [0, 3], ylim: [0.9, 2.0], xlabel: 'reduced gradient s = |∇n| / (2 k_F n)', ylabel: 'F_x(s)' });
    function pbeLike(kappa, mu) { return function (s) { return 1 + kappa - kappa / (1 + (mu * s * s) / kappa); }; }
    var xfac = Math.cbrt(48 * Math.PI * Math.PI), beta = 0.0042, Cx = 1.5 * Math.cbrt(3 / (4 * Math.PI));
    var defs = [
      { label: 'LDA', color: 'fg-faint', f: function () { return 1; } },
      { label: 'PBE (κ=0.804, μ=0.2195)', color: 'c1', f: pbeLike(0.804, 0.21951) },
      { label: 'PBEsol (μ=10/81)', color: 'c3', f: pbeLike(0.804, 10 / 81) },
      { label: 'revPBE (κ=1.245)', color: 'c2', f: pbeLike(1.245, 0.21951) },
      { label: 'B88', color: 'c4', f: function (s) { var x = xfac * s; return 1 + ((beta / Cx) * x * x) / (1 + 6 * beta * x * Math.asinh(x)); } }
    ];
    ui.legend(panel, defs.map(function (d) { return { color: d.color, label: d.label }; }).concat([{ color: 'c5', label: 'Lieb–Oxford bound 1.804' }]));
    var ctl = ui.controls(panel);
    var sv = ui.slider(ctl, { label: 's', min: 0, max: 3, step: 0.01, value: 1, onInput: draw, fmt: function (v) { return v.toFixed(2); } });
    var out = el('div', 'readout'); panel.appendChild(out);
    var xs = linspace(0, 3, 300);
    function draw() {
      p.clear(); p.axes();
      p.fill([0, 1], [2, 2], { base: 0.9, color: 'c3', alpha: 0.05 });
      p.text(0.05, 1.95, 'valence / bonding (s ≲ 1)', { size: 11, color: 'fg-faint' });
      p.text(1.55, 1.95, 'density tails, surfaces', { size: 11, color: 'fg-faint' });
      p.hline(1.804, { color: 'c5', dash: [6, 4] });
      defs.forEach(function (d) { p.line(xs, Array.prototype.map.call(xs, d.f), { color: d.color, width: 2 }); });
      p.vline(sv.value, { color: 'fg-soft' });
      out.textContent = 'at s = ' + sv.value.toFixed(2) + ':  ' + defs.map(function (d) { return d.label.split(' ')[0] + ' ' + d.f(sv.value).toFixed(3); }).join('   ');
    }
    p.onResize = draw; draw();
    return { destroy: function () { p.destroy(); } };
  });

  /* =====================================================================
   * 5. Fractional charge: E(N) and the derivative discontinuity
   * ===================================================================== */
  Notes.registerAnim('fractional-charge', function (root) {
    var panel = el('div', 'panel'); root.appendChild(panel);
    header(panel, 'Energy vs. fractional electron number');
    var grid = el('div', 'two-col'); panel.appendChild(grid);
    var c1 = el('canvas'), c2 = el('canvas'); grid.appendChild(c1); grid.appendChild(c2);
    var pe = new Plot(c1, { height: 250, xlim: [-1, 1], ylim: [-2.5, 10], xlabel: 'N − N₀', ylabel: 'E(N) − E(N₀)  (eV)' });
    var pd = new Plot(c2, { height: 250, xlim: [-1, 1], ylim: [-13, 3], xlabel: 'N − N₀', ylabel: 'μ = ∂E/∂N  (eV)' });
    ui.legend(panel, [{ color: 'c3', label: 'exact: straight lines' }, { color: 'c2', label: 'semilocal DFA: convex (delocalisation error)' }, { color: 'c1', label: 'Hartree–Fock: concave (localisation error)' }]);
    var ctl = ui.controls(panel);
    var I = 9, A = 1;
    var cv = ui.slider(ctl, { label: 'curvature error', min: 0, max: 3.5, step: 0.05, value: 2, onInput: draw, fmt: function (v) { return v.toFixed(2) + ' eV'; } });
    var out = el('div', 'readout'); panel.appendChild(out);
    var xs = linspace(-1, 1, 401);
    function exact(n) { return n <= 0 ? -I * n : -A * n; }
    function slope(n) { return n < 0 ? -I : -A; }
    function dlt(n) { return n <= 0 ? n + 1 : n; }
    function draw() {
      var c = cv.value;
      pe.clear(); pe.axes(); pe.vline(0);
      pe.line(xs, Array.prototype.map.call(xs, exact), { color: 'c3', width: 2.4 });
      pe.line(xs, Array.prototype.map.call(xs, function (n) { var d = dlt(n); return exact(n) - c * d * (1 - d); }), { color: 'c2', width: 2 });
      pe.line(xs, Array.prototype.map.call(xs, function (n) { var d = dlt(n); return exact(n) + c * d * (1 - d); }), { color: 'c1', width: 2 });
      pe.points([-1, 0, 1], [I, 0, -A], { color: 'fg', r: 3.5 });
      pe.text(-0.95, I - 0.6, 'N₀−1 (cation)', { size: 11 }); pe.text(0.55, 1.2, 'N₀+1 (anion)', { size: 11 });
      pd.clear(); pd.axes(); pd.vline(0);
      var left = xs.filter(function (n) { return n < 0; }), right = xs.filter(function (n) { return n > 0; });
      [left, right].forEach(function (seg) {
        pd.line(seg, seg.map(slope), { color: 'c3', width: 2.4 });
        pd.line(seg, seg.map(function (n) { return slope(n) - c * (1 - 2 * dlt(n)); }), { color: 'c2', width: 2 });
        pd.line(seg, seg.map(function (n) { return slope(n) + c * (1 - 2 * dlt(n)); }), { color: 'c1', width: 2 });
      });
      pd.text(-0.95, -I + 0.8, '−I', { size: 12, bold: true, color: 'c3' }); pd.text(0.85, -A + 0.8, '−A', { size: 12, bold: true, color: 'c3' });
      out.textContent = 'fundamental gap I − A = ' + (I - A).toFixed(2) + ' eV.   ' +
        'DFA jump in μ at N₀ = ' + (I - A - 2 * c).toFixed(2) + ' eV (gap underestimated).   HF jump = ' + (I - A + 2 * c).toFixed(2) + ' eV (overestimated).';
    }
    pe.onResize = pd.onResize = draw; draw();
    return { destroy: function () { pe.destroy(); pd.destroy(); } };
  });

  /* =====================================================================
   * 6. Adiabatic connection and the rationale for hybrids
   * ===================================================================== */
  Notes.registerAnim('adiabatic-connection', function (root) {
    var panel = el('div', 'panel'); root.appendChild(panel);
    header(panel, 'Adiabatic connection: E<sub>xc</sub> = ∫₀¹ W<sub>λ</sub> dλ', 'model curves (arbitrary units)');
    var c = el('canvas'); panel.appendChild(c);
    var p = new Plot(c, { height: 270, xlim: [0, 1], ylim: [-1.32, -0.95], xlabel: 'coupling constant λ', ylabel: 'W_λ' });
    var Ex = -1.0;
    function W(l) { return Ex - (0.35 * l) / (0.5 + l); }               // "exact"
    function Wd(l) { return -1.1 - (0.13 * l) / (0.5 + l); }            // semilocal approximation
    var n = 4;
    function Wh(l) { return Wd(l) + (Ex - Wd(0)) * Math.pow(1 - l, n - 1); } // PBE0-style hybrid (PEB 1996)
    var show = { exact: true, dfa: true, hyb: true, hh: false };
    var defs = [['exact', 'exact W_λ (area = E_xc)', 'c3'], ['dfa', 'semilocal DFA', 'c2'], ['hyb', 'hybrid, a = 1/n = 1/4', 'c1'], ['hh', 'half-and-half (linear)', 'c4']];
    var leg = el('div', 'legend'); panel.appendChild(leg);
    defs.forEach(function (d) {
      var b = el('button', show[d[0]] ? '' : 'off', '<i style="background:' + Plot.color(d[2]) + '"></i>' + d[1]);
      b.type = 'button';
      b.addEventListener('click', function () { show[d[0]] = !show[d[0]]; b.classList.toggle('off', !show[d[0]]); draw(); });
      leg.appendChild(b);
    });
    var out = el('div', 'readout'); panel.appendChild(out);
    var xs = linspace(0, 1, 201);
    function integ(f) { var s = 0; for (var i = 1; i < xs.length; i++) s += 0.5 * (f(xs[i]) + f(xs[i - 1])) * (xs[i] - xs[i - 1]); return s; }
    function draw() {
      p.clear(); p.axes();
      var map = function (f) { return Array.prototype.map.call(xs, f); };
      if (show.exact) { p.fill(xs, map(W), { base: -0.95, color: 'c3', alpha: 0.1 }); p.line(xs, map(W), { color: 'c3', width: 2.4 }); }
      if (show.dfa) p.line(xs, map(Wd), { color: 'c2', width: 2 });
      if (show.hyb) p.line(xs, map(Wh), { color: 'c1', width: 2 });
      if (show.hh) p.line([0, 1], [W(0), W(1)], { color: 'c4', width: 2, dash: [6, 4] });
      p.points([0], [Ex], { color: 'fg', r: 4 });
      p.text(0.02, Ex + 0.012, 'λ = 0: exact exchange E_x', { size: 11 });
      p.text(0.98, W(1) - 0.02, 'λ = 1: fully interacting', { size: 11, align: 'right' });
      out.textContent = 'E_xc  exact ' + integ(W).toFixed(4) + '   DFA ' + integ(Wd).toFixed(4) + '   hybrid ' + integ(Wh).toFixed(4) +
        '   half-and-half ' + (0.5 * (W(0) + W(1))).toFixed(4) + '\nhybrid = DFA + ¼ (E_x − E_x^DFA): the (1−λ)^(n−1) correction fixes the λ≈0 end, where exact exchange is known.';
    }
    p.onResize = draw; draw();
    return { destroy: function () { p.destroy(); } };
  });

  /* =====================================================================
   * 7. k-point sampling in a 2D square Brillouin zone
   * ===================================================================== */
  Notes.registerAnim('kpoints', function (root) {
    var panel = el('div', 'panel'); root.appendChild(panel);
    header(panel, 'Monkhorst–Pack sampling of a square Brillouin zone');
    var c = el('canvas'); panel.appendChild(c);
    var p = new Plot(c, { height: 330, xlim: [-0.62, 0.62], ylim: [-0.56, 0.56], xlabel: 'k_x (2π/a)', ylabel: 'k_y (2π/a)' });
    var ctl = ui.controls(panel);
    var nk = ui.slider(ctl, { label: 'grid n × n', min: 1, max: 16, step: 1, value: 6, onInput: draw, fmt: function (v) { return (v | 0) + '×' + (v | 0); } });
    var shift = ui.select(ctl, { label: 'grid', value: 'mp', options: [['mp', 'Monkhorst–Pack (shifted for even n)'], ['gamma', 'Γ-centred']], onChange: draw });
    var out = el('div', 'readout'); panel.appendChild(out);
    ui.note(panel, 'Large dots are the irreducible k-points (inside the shaded 1/8 wedge Γ–X–M), sized by their symmetry weight. ' +
      'Using the 8 point-group operations of the square (plus time reversal) you only diagonalise H(k) at these points.');
    function draw() {
      var n = nk.value | 0, pts = [], i, j;
      // keep the plot square
      var ar = (p.w - p.pad.l - p.pad.r) / (p.height - p.pad.t - p.pad.b);
      p.xlim = [-0.56 * ar, 0.56 * ar];
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
        var kx, ky;
        if (shift.value === 'mp') { kx = (2 * (i + 1) - n - 1) / (2 * n); ky = (2 * (j + 1) - n - 1) / (2 * n); }
        else { kx = i / n; ky = j / n; if (kx >= 0.5 - 1e-9) kx -= 1; if (ky >= 0.5 - 1e-9) ky -= 1; }
        pts.push([kx, ky]);
      }
      var irr = {};
      pts.forEach(function (k) {
        var a = Math.abs(k[0]), b = Math.abs(k[1]), hi = Math.max(a, b), lo = Math.min(a, b);
        var key = hi.toFixed(6) + ',' + lo.toFixed(6);
        irr[key] = irr[key] || { k: [hi, lo], w: 0 }; irr[key].w++;
      });
      p.clear(); p.axes();
      p.fill([0, 0.5], [0, 0.5], { base: 0, color: 'c1', alpha: 0.12 });
      p.line([-0.5, 0.5, 0.5, -0.5, -0.5], [-0.5, -0.5, 0.5, 0.5, -0.5], { color: 'fg-soft', width: 1.5 });
      p.points(pts.map(function (k) { return k[0]; }), pts.map(function (k) { return k[1]; }), { color: 'fg-faint', r: 2.2 });
      var keys = Object.keys(irr), maxw = 0;
      keys.forEach(function (k) { maxw = Math.max(maxw, irr[k].w); });
      keys.forEach(function (k) { var q = irr[k]; p.points([q.k[0]], [q.k[1]], { color: 'c2', r: 2.5 + 3.5 * Math.sqrt(q.w / maxw) }); });
      p.text(0, 0, '  Γ', { size: 12, bold: true }); p.text(0.5, 0, '  X', { size: 12, bold: true }); p.text(0.5, 0.5, '  M', { size: 12, bold: true });
      var hasG = pts.some(function (k) { return Math.abs(k[0]) < 1e-9 && Math.abs(k[1]) < 1e-9; });
      out.textContent = 'total k-points ' + n * n + '   irreducible ' + keys.length + '   (Γ ' + (hasG ? 'included' : 'not included') + ')' +
        '\nweights: ' + keys.map(function (k) { return irr[k].w; }).join(' ');
    }
    p.onResize = draw; draw();
    return { destroy: function () { p.destroy(); } };
  });

  /* =====================================================================
   * 8. Jacob's ladder
   * ===================================================================== */
  Notes.registerAnim('jacobs-ladder', function (root, params, ctx) {
    var rungs = [
      { name: 'LDA', sub: 'rung 1 · local', ing: '$n(\\vr)$', ex: 'SVWN, PW92 (fit to Ceperley–Alder QMC of the uniform electron gas)', cost: 'Cheapest; $O(N^3)$ diagonalisation dominates.',
        good: 'Surprisingly good structures for solids, smooth metals; exact for the uniform gas.', bad: 'Overbinds badly (atomisation energies off by tens of kcal/mol), lattice constants ~1–2 % too small, bond lengths short, no dispersion, gaps too small.' },
      { name: 'GGA', sub: 'rung 2 · semilocal', ing: '$n,\\ \\nabla n$ (via $s$)', ex: 'PBE, PBEsol, RPBE, BLYP, B97-D', cost: 'Same scaling as LDA; workhorse of materials science.',
        good: 'Fixes most LDA overbinding; reasonable molecules and solids; PBE is the default in high-throughput databases.', bad: 'Underbinds solids slightly (PBE lattice constants ~1 % too large), gaps too small, self-interaction error, no long-range dispersion.' },
      { name: 'meta-GGA', sub: 'rung 3 · semilocal', ing: '$n,\\ \\nabla n,\\ \\tau = \\tfrac12\\sum_i|\\nabla\\phi_i|^2$', ex: 'TPSS, SCAN, r2SCAN, M06-L', cost: 'Slightly more than GGA; τ is cheap (occupied orbitals only); numerically touchier grids.',
        good: 'τ (via $\\alpha$ or the iso-orbital indicator) recognises single-orbital, slowly-varying and bonding regions. SCAN obeys all 17 known exact constraints a meta-GGA can satisfy.', bad: 'Still semilocal: self-interaction and gap problems remain; SCAN has grid sensitivity (fixed by r2SCAN).' },
      { name: 'Hybrid', sub: 'rung 4 · non-local', ing: '+ exact (HF) exchange from occupied orbitals', ex: 'B3LYP, PBE0, HSE06 (screened), ωB97X-V, M06-2X', cost: 'Exact exchange is $O(N^4)$; 10–100× costlier than GGA in plane-wave codes. Screening (HSE) helps for solids.',
        good: 'Reduces self-interaction; much better gaps (HSE), barrier heights and thermochemistry (B3LYP ~2–4 kcal/mol on standard sets).', bad: 'Expensive for large/periodic systems; fixed fraction of exact exchange is not universal (metals dislike it).' },
      { name: 'Double hybrid / RPA', sub: 'rung 5 · fully non-local', ing: '+ unoccupied orbitals (MP2-like or RPA correlation)', ex: 'B2PLYP, DSD-PBEP86, RPA, RPA+SOSEX', cost: '$O(N^5)$ (MP2-like) or $O(N^4)$ with RI; needs large basis sets.',
        good: 'Approaches ~1 kcal/mol for main-group thermochemistry; RPA captures dispersion naturally.', bad: 'Cost, basis-set convergence, and trouble for small-gap / metallic systems.' }
    ];
    var panel = el('div', 'panel'); root.appendChild(panel);
    header(panel, "Jacob's ladder of density functionals", 'click a rung');
    var wrap = el('div', 'ladder'); panel.appendChild(wrap);
    var col = el('div', 'ladder-rungs'), det = el('div', 'ladder-detail');
    wrap.appendChild(col); wrap.appendChild(det);
    var sky = el('div', '', '<small style="color:var(--fg-faint)">↑ heaven of chemical accuracy (~1 kcal/mol)</small>');
    var btns = rungs.map(function (r, i) {
      var b = el('button', 'ladder-rung', '<b>' + r.name + '</b><small>' + r.sub + '</small>');
      b.type = 'button';
      b.addEventListener('click', function () { show(i); });
      col.appendChild(b);
      return b;
    });
    col.appendChild(sky);
    col.insertBefore(el('div', '', '<small style="color:var(--fg-faint)">↓ Hartree world (no xc)</small>'), col.firstChild);
    function show(i) {
      var r = rungs[i];
      btns.forEach(function (b, j) { b.classList.toggle('active', i === j); });
      det.innerHTML = '<h4>' + r.name + '</h4><dl>' +
        '<dt>Ingredients</dt><dd>' + ctx.inline(r.ing) + '</dd>' +
        '<dt>Examples</dt><dd>' + ctx.inline(r.ex) + '</dd>' +
        '<dt>Cost</dt><dd>' + ctx.inline(r.cost) + '</dd>' +
        '<dt>Good at</dt><dd>' + ctx.inline(r.good) + '</dd>' +
        '<dt>Weak at</dt><dd>' + ctx.inline(r.bad) + '</dd></dl>';
    }
    show(1);
  });
})();
