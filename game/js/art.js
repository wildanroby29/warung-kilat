// art.js — vector drawing of food, customers, lanterns and the stall.
// Single responsibility: everything the game draws as shapes (no image files).
// v3: the stall is a real night-market scene — wooden counter, striped awning,
// ingredient containers, and each station drawn as a physical object.

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

  // Wooden counter: warm planks with grain lines and a darker front edge.
  function drawWoodCounter(c, x, y, w, h) {
    c.save();
    c.fillStyle = '#a06a35';
    rr(c, x, y, w, h, 8); c.fill();
    // plank seams
    c.strokeStyle = 'rgba(93,58,26,0.55)'; c.lineWidth = 2;
    var rows = 3;
    for (var i = 1; i < rows; i++) {
      c.beginPath(); c.moveTo(x + 4, y + h * i / rows); c.lineTo(x + w - 4, y + h * i / rows); c.stroke();
    }
    // grain strokes
    c.strokeStyle = 'rgba(93,58,26,0.25)'; c.lineWidth = 1.5;
    for (var j = 0; j < 14; j++) {
      var gy = y + 8 + (j * 13) % (h - 16);
      var gx = x + 10 + ((j * 97) % (w - 40));
      c.beginPath(); c.moveTo(gx, gy); c.quadraticCurveTo(gx + 30, gy + 3, gx + 70, gy); c.stroke();
    }
    // front edge (darker, thicker)
    c.fillStyle = '#5d3a1a';
    rr(c, x, y + h - 10, w, 10, 4); c.fill();
    // highlight along the top
    c.fillStyle = 'rgba(255,220,160,0.35)';
    c.fillRect(x + 6, y + 3, w - 12, 3);
    c.restore();
  }

  // Striped awning with a scalloped lower edge, hung across the top.
  function drawAwning(c, x, y, w, h) {
    c.save();
    var stripes = 10;
    var sw = w / stripes;
    for (var i = 0; i < stripes; i++) {
      c.fillStyle = i % 2 ? '#e5484d' : '#fff3d6';
      c.fillRect(x + i * sw, y, sw + 1, h - 10);
    }
    // scalloped hem
    for (var j = 0; j < stripes; j++) {
      c.fillStyle = j % 2 ? '#e5484d' : '#fff3d6';
      c.beginPath(); c.arc(x + j * sw + sw / 2, y + h - 10, sw / 2, 0, Math.PI); c.fill();
    }
    // top shadow line
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(x, y, w, 4);
    c.restore();
  }

  // A rising steam puff (three soft circles), alpha fades with t.
  function drawSteam(c, x, y, s, t) {
    c.save();
    c.globalAlpha = 0.35;
    c.fillStyle = '#e8f4ff';
    var wob = Math.sin(t * 2 + x) * s * 0.12;
    circle(c, x + wob, y - s * 0.5, s * 0.32); c.fill();
    circle(c, x - wob, y - s * 0.9, s * 0.26); c.fill();
    circle(c, x + wob * 0.5, y - s * 1.25, s * 0.2); c.fill();
    c.restore();
  }

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

  // An ingredient bin drawn as a real container sitting on the counter:
  // a woven basket / ceramic bowl with the food heaped above the rim.
  // cx, cy = centre of the container; w = container width.
  function drawBinContainer(c, id, cx, cy, w) {
    var bowlH = w * 0.34;
    c.save();
    // heaped food above the rim (drawn first so the rim overlaps it)
    drawIngredient(c, id, cx, cy - bowlH * 0.35, w * 0.30);
    // bowl body
    c.fillStyle = id === 'sambal' ? '#1e3a8a' : '#8b5a2b';
    c.beginPath();
    c.moveTo(cx - w / 2, cy - bowlH * 0.5);
    c.lineTo(cx + w / 2, cy - bowlH * 0.5);
    c.quadraticCurveTo(cx + w / 2, cy + bowlH * 0.55, cx, cy + bowlH * 0.55);
    c.quadraticCurveTo(cx - w / 2, cy + bowlH * 0.55, cx - w / 2, cy - bowlH * 0.5);
    c.closePath(); c.fill();
    // woven rim
    c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(cx - w / 2, cy - bowlH * 0.5); c.lineTo(cx + w / 2, cy - bowlH * 0.5); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.fillRect(cx - w / 2 + 4, cy - bowlH * 0.5, w - 8, 3);
    c.restore();
  }

  // Steamer: a stacked bamboo steamer basket with steam rising.
  function drawSteamerObj(c, cx, cy, w, t, cooking) {
    var h = w * 0.62;
    c.save();
    if (cooking) drawSteam(c, cx, cy - h * 0.5, w * 0.32, t);
    // basket tiers
    c.fillStyle = '#c89b5a';
    rr(c, cx - w * 0.42, cy - h * 0.28, w * 0.84, h * 0.26, 4); c.fill();
    c.fillStyle = '#b98a45';
    rr(c, cx - w * 0.42, cy + h * 0.02, w * 0.84, h * 0.26, 4); c.fill();
    c.fillStyle = '#a67c3d';
    rr(c, cx - w * 0.46, cy + h * 0.28, w * 0.92, h * 0.2, 4); c.fill();
    // weave lines
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1.5;
    for (var i = 0; i < 3; i++) {
      c.beginPath(); c.moveTo(cx - w * 0.42, cy - h * 0.2 + i * h * 0.3); c.lineTo(cx + w * 0.42, cy - h * 0.2 + i * h * 0.3); c.stroke();
    }
    // lid
    c.fillStyle = '#d9b06a';
    c.beginPath(); c.ellipse(cx, cy - h * 0.28, w * 0.44, h * 0.16, 0, Math.PI, 0); c.fill();
    c.fillStyle = '#8b5a2b';
    circle(c, cx, cy - h * 0.42, w * 0.05); c.fill();
    c.restore();
  }

  // Grill: a charcoal grill with glowing coals and skewers laid across it.
  function drawGrillObj(c, cx, cy, w, t, cooking, item) {
    var h = w * 0.55;
    c.save();
    // glowing coals
    var glow = cooking ? 0.55 + Math.sin(t * 6) * 0.15 : 0.35;
    var g = c.createRadialGradient(cx, cy, 4, cx, cy, w * 0.45);
    g.addColorStop(0, 'rgba(249,115,22,' + glow + ')');
    g.addColorStop(1, 'rgba(249,115,22,0)');
    c.fillStyle = g;
    c.fillRect(cx - w * 0.5, cy - h * 0.5, w, h);
    // grill body
    c.fillStyle = '#374151';
    rr(c, cx - w * 0.46, cy - h * 0.1, w * 0.92, h * 0.5, 6); c.fill();
    // grate bars
    c.strokeStyle = '#9ca3af'; c.lineWidth = 2;
    for (var i = 0; i < 5; i++) {
      var gx = cx - w * 0.4 + i * w * 0.2;
      c.beginPath(); c.moveTo(gx, cy - h * 0.08); c.lineTo(gx, cy + h * 0.36); c.stroke();
    }
    // coals
    c.fillStyle = '#ef4444';
    for (var j = 0; j < 5; j++) {
      circle(c, cx - w * 0.32 + j * w * 0.16, cy + h * 0.16, w * 0.05); c.fill();
    }
    c.fillStyle = '#f97316';
    for (var k = 0; k < 4; k++) {
      circle(c, cx - w * 0.24 + k * w * 0.16, cy + h * 0.28, w * 0.04); c.fill();
    }
    // skewers on the grill when cooking
    if (item) {
      drawIngredient(c, 'skewer_cooked', cx - w * 0.18, cy - h * 0.12, w * 0.16);
      drawIngredient(c, 'skewer_cooked', cx + w * 0.18, cy - h * 0.12, w * 0.16);
    }
    c.restore();
  }

  // Wok: a round wok over a blue-orange flame.
  function drawWokObj(c, cx, cy, w, t, cooking) {
    var h = w * 0.5;
    c.save();
    if (cooking) {
      // flame under the wok
      var fl = 1 + Math.sin(t * 9) * 0.12;
      c.fillStyle = '#f97316';
      c.beginPath(); c.ellipse(cx, cy + h * 0.42, w * 0.3 * fl, h * 0.3, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#facc15';
      c.beginPath(); c.ellipse(cx, cy + h * 0.42, w * 0.18 * fl, h * 0.18, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#3b82f6';
      c.beginPath(); c.ellipse(cx, cy + h * 0.42, w * 0.1, h * 0.1, 0, 0, Math.PI * 2); c.fill();
    }
    // wok bowl
    c.fillStyle = '#1f2937';
    c.beginPath(); c.ellipse(cx, cy, w * 0.46, h * 0.42, 0, 0, Math.PI); c.fill();
    c.fillStyle = '#374151';
    c.beginPath(); c.ellipse(cx, cy, w * 0.46, h * 0.42, 0, Math.PI, 0); c.fill();
    // food in the wok when cooking
    if (cooking) drawIngredient(c, 'egg_cooked', cx, cy - h * 0.05, w * 0.2);
    // handles
    c.strokeStyle = '#111827'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(cx - w * 0.46, cy); c.lineTo(cx - w * 0.6, cy - h * 0.15); c.stroke();
    c.beginPath(); c.moveTo(cx + w * 0.46, cy); c.lineTo(cx + w * 0.6, cy - h * 0.15); c.stroke();
    c.restore();
  }

  // Chopping board: a wooden board with a knife and chopped pieces.
  function drawBoardObj(c, cx, cy, w, t, cooking, item) {
    var h = w * 0.34;
    c.save();
    c.fillStyle = '#d9b06a';
    rr(c, cx - w * 0.46, cy - h * 0.4, w * 0.92, h * 0.8, 6); c.fill();
    c.strokeStyle = '#a67c3d'; c.lineWidth = 2;
    rr(c, cx - w * 0.46, cy - h * 0.4, w * 0.92, h * 0.8, 6); c.stroke();
    // knife
    c.fillStyle = '#9ca3af';
    c.save(); c.translate(cx + w * 0.28, cy - h * 0.15); c.rotate(-0.5);
    rr(c, -w * 0.02, -h * 0.08, w * 0.26, h * 0.16, 2); c.fill();
    c.fillStyle = '#374151';
    rr(c, -w * 0.14, -h * 0.08, w * 0.12, h * 0.16, 2); c.fill();
    c.restore();
    // chopped pieces when cooking
    if (item) {
      drawIngredient(c, 'tempeh_cooked', cx - w * 0.2, cy + h * 0.1, w * 0.14);
      drawIngredient(c, 'tempeh_cooked', cx + w * 0.02, cy + h * 0.15, w * 0.12);
    }
    c.restore();
  }

  // A real plate (or bowl) with the dish built up in visible layers.
  // layers = array of ingredient ids already placed. ghost = next layer id or null.
  function drawPlateObj(c, cx, cy, w, layers, ghost) {
    var h = w * 0.52;
    c.save();
    // plate rim (white ceramic)
    c.fillStyle = '#f5efe0';
    c.beginPath(); c.ellipse(cx, cy + h * 0.1, w * 0.5, h * 0.42, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#d9c9a8'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(cx, cy + h * 0.1, w * 0.5, h * 0.42, 0, 0, Math.PI * 2); c.stroke();
    // inner well
    c.fillStyle = '#efe6cf';
    c.beginPath(); c.ellipse(cx, cy + h * 0.08, w * 0.38, h * 0.3, 0, 0, Math.PI * 2); c.fill();
    // layers, stacked bottom-up so the dish visibly builds
    var n = layers.length;
    for (var i = 0; i < n; i++) {
      var ly = cy + h * 0.18 - i * h * 0.13;
      var lx = cx + (i % 2 ? w * 0.05 : -w * 0.05);
      drawIngredient(c, layers[i], lx, ly, w * 0.17);
    }
    // ghost outline of the next layer
    if (ghost) {
      c.save();
      c.globalAlpha = 0.45;
      c.setLineDash([5, 4]);
      c.strokeStyle = '#8b5a2b'; c.lineWidth = 2;
      var gy = cy + h * 0.18 - n * h * 0.13;
      c.beginPath(); c.ellipse(cx, gy, w * 0.17, w * 0.11, 0, 0, Math.PI * 2); c.stroke();
      c.restore();
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

  // A speech bubble above a customer, with short text inside.
  function drawSpeechBubble(c, x, y, w, text) {
    var h = 30;
    c.save();
    c.fillStyle = '#fff8e7';
    rr(c, x - w / 2, y - h, w, h, 10); c.fill();
    c.strokeStyle = '#d9c9a8'; c.lineWidth = 1.5;
    rr(c, x - w / 2, y - h, w, h, 10); c.stroke();
    // tail
    c.fillStyle = '#fff8e7';
    c.beginPath(); c.moveTo(x - 8, y - 2); c.lineTo(x + 8, y - 2); c.lineTo(x, y + 10); c.closePath(); c.fill();
    c.fillStyle = '#241a12';
    c.font = '700 15px system-ui, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, x, y - h / 2);
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
    drawLantern: drawLantern,
    drawWoodCounter: drawWoodCounter,
    drawAwning: drawAwning,
    drawSteam: drawSteam,
    drawBinContainer: drawBinContainer,
    drawSteamerObj: drawSteamerObj,
    drawGrillObj: drawGrillObj,
    drawWokObj: drawWokObj,
    drawBoardObj: drawBoardObj,
    drawPlateObj: drawPlateObj,
    drawSpeechBubble: drawSpeechBubble
  };
})();
