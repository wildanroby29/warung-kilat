// art.js — vector drawing of food, customers, lanterns and the stall.
// Single responsibility: everything the game draws as shapes (no image files).

(function () {
  'use strict';

  var CFG = window.WK.config;

  // Round-rect helper.
  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function circle(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); }

  // Draw one ingredient as a vector icon centred at (x, y) with radius ~size.
  function drawIngredient(c, id, x, y, size) {
    var s = size;
    c.save();
    c.translate(x, y);
    if (id === 'rice' || id === 'rice_cooked') {
      // steamed rice: a white mound with grain dots
      c.fillStyle = '#fff8e7';
      c.beginPath(); c.ellipse(0, s * 0.15, s, s * 0.62, 0, Math.PI, 0); c.fill();
      c.fillStyle = '#e8dcc0';
      for (var i = 0; i < 7; i++) {
        circle(c, -s * 0.6 + i * s * 0.2, -s * 0.1 + (i % 2) * s * 0.18, s * 0.09); c.fill();
      }
      c.strokeStyle = '#c9b892'; c.lineWidth = 2;
      c.beginPath(); c.ellipse(0, s * 0.15, s, s * 0.62, 0, Math.PI, 0); c.stroke();
    } else if (id === 'skewer' || id === 'skewer_cooked') {
      // chicken skewer: a stick with browned cubes
      c.strokeStyle = '#8b5a2b'; c.lineWidth = s * 0.16;
      c.beginPath(); c.moveTo(-s, s * 0.5); c.lineTo(s, -s * 0.5); c.stroke();
      var cols = id === 'skewer_cooked' ? ['#a16207', '#92400e', '#b45309'] : ['#f59e0b', '#d97706', '#f59e0b'];
      for (var j = 0; j < 3; j++) {
        var px = -s * 0.55 + j * s * 0.55, py = s * 0.28 - j * s * 0.28;
        c.fillStyle = cols[j];
        rr(c, px - s * 0.28, py - s * 0.28, s * 0.56, s * 0.56, s * 0.12); c.fill();
      }
    } else if (id === 'egg' || id === 'egg_cooked') {
      // fried egg: wobbly white with a yolk
      c.fillStyle = '#fffdf5';
      c.beginPath();
      c.ellipse(0, 0, s * 0.95, s * 0.8, 0.3, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#f59e0b';
      circle(c, s * 0.1, -s * 0.05, s * 0.42); c.fill();
      c.fillStyle = '#fbbf24';
      circle(c, s * 0.05, -s * 0.1, s * 0.22); c.fill();
    } else if (id === 'tempeh' || id === 'tempeh_cooked') {
      // tempeh: a golden slab with bean dots
      c.fillStyle = id === 'tempeh_cooked' ? '#b45309' : '#d97706';
      rr(c, -s * 0.85, -s * 0.5, s * 1.7, s, s * 0.18); c.fill();
      c.fillStyle = '#fde68a';
      for (var k = 0; k < 5; k++) {
        circle(c, -s * 0.6 + k * s * 0.3, (k % 2 ? -s * 0.18 : s * 0.18), s * 0.1); c.fill();
      }
    } else if (id === 'cucumber') {
      c.fillStyle = '#22c55e';
      circle(c, 0, 0, s * 0.85); c.fill();
      c.fillStyle = '#bbf7d0';
      circle(c, 0, 0, s * 0.6); c.fill();
      c.fillStyle = '#86efac';
      for (var m = 0; m < 5; m++) {
        var a = m * Math.PI * 2 / 5;
        circle(c, Math.cos(a) * s * 0.3, Math.sin(a) * s * 0.3, s * 0.09); c.fill();
      }
    } else if (id === 'tomato') {
      c.fillStyle = '#dc2626';
      circle(c, 0, 0, s * 0.85); c.fill();
      c.fillStyle = '#fca5a5';
      circle(c, -s * 0.3, -s * 0.3, s * 0.25); c.fill();
      c.fillStyle = '#16a34a';
      c.beginPath(); c.moveTo(0, -s * 0.8); c.lineTo(-s * 0.25, -s * 1.05); c.lineTo(s * 0.25, -s * 1.05); c.closePath(); c.fill();
    } else if (id === 'sambal') {
      // small bowl of red sambal with a chilli
      c.fillStyle = '#1e3a8a';
      c.beginPath(); c.ellipse(0, s * 0.25, s * 0.9, s * 0.5, 0, 0, Math.PI); c.fill();
      c.fillStyle = '#dc2626';
      c.beginPath(); c.ellipse(0, s * 0.1, s * 0.75, s * 0.35, 0, Math.PI, 0); c.fill();
      c.fillStyle = '#991b1b';
      circle(c, -s * 0.3, s * 0.05, s * 0.14); c.fill();
      circle(c, s * 0.25, s * 0.12, s * 0.12); c.fill();
    } else if (id === 'shallot') {
      // crispy fried shallots: golden flakes
      c.fillStyle = '#f59e0b';
      for (var n = 0; n < 6; n++) {
        var ax = (n % 3 - 1) * s * 0.5, ay = (Math.floor(n / 3) - 0.5) * s * 0.55;
        c.save(); c.translate(ax, ay); c.rotate(n * 0.7);
        c.beginPath(); c.ellipse(0, 0, s * 0.34, s * 0.16, 0, 0, Math.PI * 2); c.fill();
        c.restore();
      }
    } else if (id === 'burnt') {
      c.fillStyle = '#1f2937';
      c.beginPath(); c.ellipse(0, 0, s * 0.9, s * 0.6, 0.2, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#374151';
      circle(c, -s * 0.3, -s * 0.15, s * 0.18); c.fill();
      circle(c, s * 0.25, s * 0.1, s * 0.14); c.fill();
    }
    c.restore();
  }

  // Customer faces. variant 0-4 picks skin/hair/hat; mood: 'happy' | 'neutral' | 'angry'.
  var SKINS = ['#f2c89b', '#e8b07d', '#c98d5a', '#8d5a2b', '#f7d7a8'];
  var HAIRS = ['#1f2937', '#3b2f2f', '#6b7280', '#92400e', '#111827'];
  function drawCustomer(c, variant, x, y, r, mood, bob) {
    var skin = SKINS[variant % SKINS.length];
    var hair = HAIRS[variant % HAIRS.length];
    c.save();
    c.translate(x, y + (bob || 0));
    // body hint
    c.fillStyle = ['#e5484d', '#2dd4bf', '#f59e0b', '#a78bfa', '#34d399'][variant % 5];
    rr(c, -r * 0.9, r * 0.55, r * 1.8, r * 0.9, r * 0.3); c.fill();
    // head
    c.fillStyle = skin;
    circle(c, 0, 0, r); c.fill();
    // hair / hat
    if (variant % 3 === 2) {
      c.fillStyle = '#b45309'; // straw hat
      c.beginPath(); c.ellipse(0, -r * 0.55, r * 1.15, r * 0.4, 0, Math.PI, 0); c.fill();
      c.fillStyle = '#92400e';
      rr(c, -r * 0.55, -r * 1.05, r * 1.1, r * 0.5, r * 0.2); c.fill();
    } else {
      c.fillStyle = hair;
      c.beginPath(); c.arc(0, -r * 0.1, r * 1.02, Math.PI * 1.02, Math.PI * 1.98); c.fill();
      if (variant % 2 === 0) { rr(c, -r * 0.9, -r * 0.95, r * 0.5, r * 0.5, r * 0.15); c.fill(); rr(c, r * 0.4, -r * 0.95, r * 0.5, r * 0.5, r * 0.15); c.fill(); }
    }
    // eyes
    c.fillStyle = '#1f2937';
    if (mood === 'angry') {
      c.strokeStyle = '#1f2937'; c.lineWidth = 2.5;
      c.beginPath(); c.moveTo(-r * 0.55, -r * 0.35); c.lineTo(-r * 0.15, -r * 0.15); c.stroke();
      c.beginPath(); c.moveTo(r * 0.55, -r * 0.35); c.lineTo(r * 0.15, -r * 0.15); c.stroke();
    } else {
      circle(c, -r * 0.35, -r * 0.15, r * 0.09); c.fill();
      circle(c, r * 0.35, -r * 0.15, r * 0.09); c.fill();
    }
    // mouth
    c.strokeStyle = '#7c2d12'; c.lineWidth = 2.5; c.lineCap = 'round';
    c.beginPath();
    if (mood === 'happy') { c.arc(0, r * 0.25, r * 0.4, 0.15 * Math.PI, 0.85 * Math.PI); }
    else if (mood === 'angry') { c.arc(0, r * 0.75, r * 0.35, 1.15 * Math.PI, 1.85 * Math.PI); }
    else { c.moveTo(-r * 0.3, r * 0.45); c.lineTo(r * 0.3, r * 0.45); }
    c.stroke();
    c.restore();
  }

  // Paper lantern with a warm glow.
  function drawLantern(c, x, y, r, color, glow) {
    c.save();
    c.translate(x, y);
    if (glow) {
      var g = c.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 2.6);
      g.addColorStop(0, 'rgba(255,197,61,0.35)');
      g.addColorStop(1, 'rgba(255,197,61,0)');
      c.fillStyle = g;
      circle(c, 0, 0, r * 2.6); c.fill();
    }
    c.fillStyle = color || '#e5484d';
    c.beginPath(); c.ellipse(0, 0, r, r * 1.15, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2;
    for (var i = -2; i <= 2; i++) {
      c.beginPath(); c.ellipse(0, i * r * 0.4, r * Math.sqrt(1 - (i * 0.4) * (i * 0.4) * 0.8), r * 0.12, 0, 0, Math.PI * 2); c.stroke();
    }
    c.fillStyle = '#ffc53d';
    rr(c, -r * 0.25, -r * 1.35, r * 0.5, r * 0.25, 2); c.fill();
    rr(c, -r * 0.25, r * 1.1, r * 0.5, r * 0.25, 2); c.fill();
    c.restore();
  }

  window.WK = window.WK || {};
  window.WK.art = {
    rr: rr, circle: circle,
    drawIngredient: drawIngredient,
    drawCustomer: drawCustomer,
    drawLantern: drawLantern
  };
})();
