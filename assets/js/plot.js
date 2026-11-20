/*
 * Plot: a tiny, dependency-free canvas plotting helper for note widgets.
 *
 *   const p = new Plot(canvas, { height: 260, xlim: [0, 1], ylim: [-1, 1], xlabel: 'x', ylabel: 'y' });
 *   p.onResize = draw;            // called when the canvas width or theme changes
 *   function draw() { p.clear(); p.axes(); p.line(xs, ys, { color: 'c1' }); }
 *
 * Colours may be CSS custom-property names ('c1', 'fg', 'accent', ...) or any CSS colour.
 */
(function () {
  'use strict';

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue('--' + name).trim();
  }

  function color(c) {
    if (!c) return cssVar('fg');
    return /^[a-z]+[0-9]*$/i.test(c) && cssVar(c) ? cssVar(c) : c;
  }

  // "Nice" tick positions between a and b.
  function ticks(a, b, n) {
    n = n || 5;
    var span = b - a;
    if (!(span > 0)) return [a];
    var step = Math.pow(10, Math.floor(Math.log10(span / n)));
    var err = (n * step) / span;
    if (err <= 0.15) step *= 10; else if (err <= 0.35) step *= 5; else if (err <= 0.75) step *= 2;
    var out = [];
    for (var v = Math.ceil(a / step) * step; v <= b + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    return out;
  }

  function fmt(v) {
    var a = Math.abs(v);
    if (a === 0) return '0';
    if (a >= 1e4 || a < 1e-3) return v.toExponential(0);
    return String(+v.toPrecision(4));
  }

  function Plot(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.height = opts.height || 260;
    this.xlim = opts.xlim || [0, 1];
    this.ylim = opts.ylim || [0, 1];
    this.xlabel = opts.xlabel || '';
    this.ylabel = opts.ylabel || '';
    this.logy = !!opts.logy;
    this.pad = Object.assign({ l: 48, r: 14, t: 12, b: 38 }, opts.pad || {});
    this.onResize = null;
    canvas.classList.add('plot');
    canvas.style.height = this.height + 'px';
    var self = this;
    this._resize();
    if (window.ResizeObserver) {
      this._ro = new ResizeObserver(function () { if (self._resize() && self.onResize) self.onResize(); });
      this._ro.observe(canvas);
    }
    this._theme = function () { if (self.onResize) self.onResize(); };
    document.addEventListener('themechange', this._theme);
  }

  Plot.prototype.destroy = function () {
    if (this._ro) this._ro.disconnect();
    document.removeEventListener('themechange', this._theme);
  };

  Plot.prototype._resize = function () {
    var dpr = window.devicePixelRatio || 1;
    var w = this.canvas.clientWidth || 600;
    if (w === this.w && dpr === this.dpr) return false;
    this.w = w; this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  };

  Plot.prototype.X = function (x) {
    var p = this.pad;
    return p.l + ((x - this.xlim[0]) / (this.xlim[1] - this.xlim[0])) * (this.w - p.l - p.r);
  };
  Plot.prototype.Y = function (y) {
    var p = this.pad, lo = this.ylim[0], hi = this.ylim[1];
    if (this.logy) { y = Math.log10(Math.max(y, 1e-300)); lo = Math.log10(lo); hi = Math.log10(hi); }
    return this.height - p.b - ((y - lo) / (hi - lo)) * (this.height - p.t - p.b);
  };
  // Inverse of X: pixel -> data
  Plot.prototype.invX = function (px) {
    var p = this.pad;
    return this.xlim[0] + ((px - p.l) / (this.w - p.l - p.r)) * (this.xlim[1] - this.xlim[0]);
  };

  Plot.prototype.clear = function () {
    this.ctx.clearRect(0, 0, this.w, this.height);
  };

  Plot.prototype.axes = function (o) {
    o = o || {};
    var c = this.ctx, p = this.pad, self = this;
    var x0 = p.l, x1 = this.w - p.r, y0 = this.height - p.b, y1 = p.t;
    c.save();
    c.font = '11px ' + getComputedStyle(document.body).fontFamily;
    c.lineWidth = 1;
    var xt = o.xticks || ticks(this.xlim[0], this.xlim[1], Math.max(3, Math.round((x1 - x0) / 90)));
    var yt;
    if (this.logy) {
      yt = [];
      for (var e = Math.ceil(Math.log10(this.ylim[0])); e <= Math.floor(Math.log10(this.ylim[1])); e++) yt.push(Math.pow(10, e));
    } else yt = o.yticks || ticks(this.ylim[0], this.ylim[1], Math.max(3, Math.round((y0 - y1) / 50)));
    c.strokeStyle = color('grid');
    c.fillStyle = color('fg-faint');
    c.textAlign = 'center'; c.textBaseline = 'top';
    xt.forEach(function (t) {
      var X = Math.round(self.X(t)) + 0.5;
      if (X < x0 - 1 || X > x1 + 1) return;
      c.beginPath(); c.moveTo(X, y0); c.lineTo(X, y1); c.stroke();
      c.fillText(o.xfmt ? o.xfmt(t) : fmt(t), X, y0 + 5);
    });
    c.textAlign = 'right'; c.textBaseline = 'middle';
    yt.forEach(function (t) {
      var Y = Math.round(self.Y(t)) + 0.5;
      if (Y > y0 + 1 || Y < y1 - 1) return;
      c.beginPath(); c.moveTo(x0, Y); c.lineTo(x1, Y); c.stroke();
      c.fillText(self.logy ? '1e' + Math.round(Math.log10(t)) : (o.yfmt ? o.yfmt(t) : fmt(t)), x0 - 6, Y);
    });
    c.strokeStyle = color('fg-faint');
    c.beginPath(); c.moveTo(x0 + 0.5, y1); c.lineTo(x0 + 0.5, y0 + 0.5); c.lineTo(x1, y0 + 0.5); c.stroke();
    c.fillStyle = color('fg-soft');
    c.font = '12px ' + getComputedStyle(document.body).fontFamily;
    if (this.xlabel) { c.textAlign = 'center'; c.textBaseline = 'bottom'; c.fillText(this.xlabel, (x0 + x1) / 2, this.height - 2); }
    if (this.ylabel) {
      c.translate(12, (y0 + y1) / 2); c.rotate(-Math.PI / 2);
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(this.ylabel, 0, 0);
    }
    c.restore();
  };

  // Clip drawing to the plotting area.
  Plot.prototype._clip = function () {
    var p = this.pad;
    this.ctx.beginPath();
    this.ctx.rect(p.l, p.t - 2, this.w - p.l - p.r, this.height - p.t - p.b + 4);
    this.ctx.clip();
  };

  Plot.prototype.line = function (xs, ys, o) {
    o = o || {};
    var c = this.ctx;
    c.save(); this._clip();
    c.strokeStyle = color(o.color || 'c1');
    c.lineWidth = o.width || 2;
    c.globalAlpha = o.alpha == null ? 1 : o.alpha;
    c.lineJoin = 'round';
    if (o.dash) c.setLineDash(o.dash);
    c.beginPath();
    var started = false;
    for (var i = 0; i < xs.length; i++) {
      var y = ys[i];
      if (y == null || !isFinite(y)) { started = false; continue; }
      var X = this.X(xs[i]), Y = this.Y(y);
      if (!started) { c.moveTo(X, Y); started = true; } else c.lineTo(X, Y);
    }
    c.stroke();
    c.restore();
  };

  Plot.prototype.fill = function (xs, ys, o) {
    o = o || {};
    var c = this.ctx, base = o.base == null ? 0 : o.base;
    c.save(); this._clip();
    c.fillStyle = color(o.color || 'c1');
    c.globalAlpha = o.alpha == null ? 0.15 : o.alpha;
    c.beginPath();
    c.moveTo(this.X(xs[0]), this.Y(Array.isArray(base) ? base[0] : base));
    for (var i = 0; i < xs.length; i++) c.lineTo(this.X(xs[i]), this.Y(ys[i]));
    for (var j = xs.length - 1; j >= 0; j--) c.lineTo(this.X(xs[j]), this.Y(Array.isArray(base) ? base[j] : base));
    c.closePath(); c.fill();
    c.restore();
  };

  Plot.prototype.points = function (xs, ys, o) {
    o = o || {};
    var c = this.ctx, r = o.r || 3;
    c.save(); this._clip();
    c.fillStyle = color(o.color || 'c1');
    for (var i = 0; i < xs.length; i++) {
      if (!isFinite(ys[i])) continue;
      c.beginPath(); c.arc(this.X(xs[i]), this.Y(ys[i]), r, 0, 2 * Math.PI); c.fill();
    }
    c.restore();
  };

  Plot.prototype.hline = function (y, o) { this.line(this.xlim, [y, y], Object.assign({ width: 1, dash: [4, 4], color: 'fg-faint' }, o)); };
  Plot.prototype.vline = function (x, o) {
    o = Object.assign({ width: 1, dash: [4, 4], color: 'fg-faint' }, o);
    var c = this.ctx;
    c.save(); this._clip();
    c.strokeStyle = color(o.color); c.lineWidth = o.width; c.setLineDash(o.dash);
    c.beginPath(); c.moveTo(this.X(x), this.pad.t); c.lineTo(this.X(x), this.height - this.pad.b); c.stroke();
    c.restore();
  };

  Plot.prototype.text = function (x, y, s, o) {
    o = o || {};
    var c = this.ctx;
    c.save();
    c.fillStyle = color(o.color || 'fg-soft');
    c.font = (o.bold ? '600 ' : '') + (o.size || 12) + 'px ' + getComputedStyle(document.body).fontFamily;
    c.textAlign = o.align || 'left'; c.textBaseline = o.baseline || 'middle';
    c.fillText(s, o.px ? x : this.X(x), o.px ? y : this.Y(y));
    c.restore();
  };

  Plot.color = color;
  Plot.ticks = ticks;
  window.Plot = Plot;
})();
