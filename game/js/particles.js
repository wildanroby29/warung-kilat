// particles.js — steam, sparks, floating score text, screen shake.
// Single responsibility: juice that makes cooking feel alive.

(function () {
  'use strict';

  function makeParticles() {
    return { list: [], shake: 0, shakeT: 0 };
  }

  function spawn(p, kind, x, y, text) {
    if (kind === 'steam') {
      p.list.push({ kind: kind, x: x, y: y, vy: -34, life: 1.1, max: 1.1, r: 5 + Math.random() * 5 });
    } else if (kind === 'spark') {
      p.list.push({ kind: kind, x: x, y: y, vx: (Math.random() - 0.5) * 90, vy: -40 - Math.random() * 60, life: 0.6, max: 0.6, r: 2.5 });
    } else if (kind === 'text') {
      p.list.push({ kind: kind, x: x, y: y, vy: -46, life: 1.2, max: 1.2, text: text || '' });
    }
    if (p.list.length > 220) p.list.splice(0, p.list.length - 220);
  }

  function addShake(p, amt) {
    p.shake = Math.max(p.shake, amt);
    p.shakeT = 0.3;
  }

  function tick(p, dt) {
    for (var i = p.list.length - 1; i >= 0; i--) {
      var q = p.list[i];
      q.life -= dt;
      if (q.life <= 0) { p.list.splice(i, 1); continue; }
      q.y += (q.vy || 0) * dt;
      q.x += (q.vx || 0) * dt;
      if (q.kind === 'steam') q.r += 12 * dt;
    }
    if (p.shakeT > 0) {
      p.shakeT -= dt;
      if (p.shakeT <= 0) p.shake = 0;
    }
  }

  function draw(c, p) {
    c.save();
    for (var i = 0; i < p.list.length; i++) {
      var q = p.list[i];
      var a = Math.max(0, q.life / q.max);
      if (q.kind === 'steam') {
        c.fillStyle = 'rgba(255,255,255,' + (a * 0.35).toFixed(3) + ')';
        c.beginPath(); c.arc(q.x, q.y, q.r, 0, Math.PI * 2); c.fill();
      } else if (q.kind === 'spark') {
        c.fillStyle = 'rgba(255,197,61,' + a.toFixed(3) + ')';
        c.beginPath(); c.arc(q.x, q.y, q.r, 0, Math.PI * 2); c.fill();
      } else if (q.kind === 'text') {
        c.fillStyle = 'rgba(255,197,61,' + a.toFixed(3) + ')';
        c.font = 'bold 26px system-ui, sans-serif';
        c.textAlign = 'center';
        c.strokeStyle = 'rgba(36,26,18,' + a.toFixed(3) + ')';
        c.lineWidth = 4;
        c.strokeText(q.text, q.x, q.y);
        c.fillText(q.text, q.x, q.y);
      }
    }
    c.restore();
  }

  function shakeOffset(p) {
    if (!p.shake) return { x: 0, y: 0 };
    return {
      x: (Math.random() - 0.5) * p.shake,
      y: (Math.random() - 0.5) * p.shake
    };
  }

  window.WK = window.WK || {};
  window.WK.particles = {
    makeParticles: makeParticles,
    spawn: spawn,
    addShake: addShake,
    tick: tick,
    draw: draw,
    shakeOffset: shakeOffset
  };
})();
