// ui.js — the in-game HUD: order board, timer, counter, plate, hatch, hints.
// Single responsibility: drawing the play screen and hit-testing clicks.
// Layout is fixed in logical 1280x720 coordinates; game.js scales the canvas.

(function () {
  'use strict';

  var CFG = window.WK.config;
  var art = window.WK.art;

  // --- Layout rects (logical px) ---
  var L = {
    tickets: [], // filled below: 5 ticket rects
    timerPanel: { x: 1016, y: 8, w: 248, h: 124 },
    bins: [],    // 8 bin rects
    stations: [],// 4 station rects
    plate: { x: 470, y: 430, w: 340, h: 160 },
    hatch: { x: 1120, y: 430, w: 144, h: 160 },
    trash: { x: 16, y: 430, w: 120, h: 160 }
  };
  (function () {
    var i;
    for (i = 0; i < 5; i++) L.tickets.push({ x: 16 + i * 196, y: 8, w: 188, h: 124 });
    for (i = 0; i < 8; i++) L.bins.push({ x: 16 + i * 156, y: 155, w: 146, h: 82 });
    for (i = 0; i < 4; i++) L.stations.push({ x: 16 + i * 316, y: 252, w: 300, h: 140 });
  })();

  function inRect(r, x, y) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  // What did the player click? Returns {type, index|id} or null.
  function hitTest(x, y, state) {
    var i;
    for (i = 0; i < state.tickets.length; i++) {
      if (inRect(L.tickets[i], x, y)) return { type: 'ticket', index: i };
    }
    for (i = 0; i < 8; i++) if (inRect(L.bins[i], x, y)) return { type: 'bin', index: i };
    for (i = 0; i < 4; i++) if (inRect(L.stations[i], x, y)) return { type: 'station', index: i };
    if (inRect(L.plate, x, y)) return { type: 'plate' };
    if (inRect(L.hatch, x, y)) return { type: 'hatch' };
    if (inRect(L.trash, x, y)) return { type: 'trash' };
    return null;
  }

  function fmtTime(sec) {
    sec = Math.max(0, Math.ceil(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function drawTickets(c, state, t) {
    var i, r, tk;
    c.save();
    // rail
    c.fillStyle = '#241a12';
    art.rr(c, 8, 4, 1000, 132, 10); c.fill();
    c.fillStyle = '#3a2a1a';
    art.rr(c, 12, 8, 992, 124, 8); c.fill();
    for (i = 0; i < 5; i++) {
      r = L.tickets[i];
      tk = state.tickets[i];
      if (!tk) {
        // empty hook
        c.strokeStyle = 'rgba(255,248,231,0.25)'; c.lineWidth = 2;
        c.beginPath(); c.arc(r.x + r.w / 2, r.y + 30, 10, 0, Math.PI * 2); c.stroke();
        c.fillStyle = 'rgba(255,248,231,0.35)';
        c.font = '16px system-ui, sans-serif'; c.textAlign = 'center';
        c.fillText('—', r.x + r.w / 2, r.y + 84);
        continue;
      }
      var targeted = state.targetIndex === i;
      var frac = window.WK.orders.patienceFrac(tk);
      // ticket card
      c.fillStyle = tk.vip ? '#3a2a00' : '#fff8e7';
      art.rr(c, r.x, r.y, r.w, r.h, 8); c.fill();
      if (targeted) { c.strokeStyle = '#ffc53d'; c.lineWidth = 4; art.rr(c, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 7); c.stroke(); }
      if (tk.vip) { c.strokeStyle = '#ffc53d'; c.lineWidth = 2; art.rr(c, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 7); c.stroke(); }
      // customer face
      var mood = frac < 0.3 ? 'angry' : (frac < 0.6 ? 'neutral' : 'happy');
      var bob = Math.sin(t * 2 + tk.bobPhase) * 2;
      art.drawCustomer(c, tk.variant, r.x + 30, r.y + 34, 22, mood, bob);
      // dish name
      c.fillStyle = tk.vip ? '#ffc53d' : '#241a12';
      c.font = 'bold 15px system-ui, sans-serif'; c.textAlign = 'left';
      c.fillText(tk.dishName, r.x + 58, r.y + 26);
      if (tk.vip) { c.font = 'bold 13px system-ui, sans-serif'; c.fillText('VIP x2', r.x + 58, r.y + 44); }
      // layer icons in order
      var dish = window.WK.recipes.dishById(tk.dishId);
      for (var j = 0; j < dish.layers.length; j++) {
        art.drawIngredient(c, dish.layers[j], r.x + 24 + j * 30, r.y + 74, 11);
      }
      // patience bar
      var bw = r.w - 20;
      c.fillStyle = '#e5d9bd';
      art.rr(c, r.x + 10, r.y + 102, bw, 12, 6); c.fill();
      c.fillStyle = frac > 0.5 ? '#4ade80' : (frac > 0.25 ? '#f59e0b' : '#ef4444');
      if (frac > 0) { art.rr(c, r.x + 10, r.y + 102, bw * frac, 12, 6); c.fill(); }
    }
    c.restore();
  }

  function drawTimerPanel(c, state) {
    var r = L.timerPanel;
    c.save();
    c.fillStyle = '#241a12';
    art.rr(c, r.x, r.y, r.w, r.h, 10); c.fill();
    c.fillStyle = '#fff8e7'; c.textAlign = 'center';
    c.font = 'bold 16px system-ui, sans-serif';
    c.fillText('SHIFT TIMER', r.x + r.w / 2, r.y + 24);
    c.font = 'bold 40px system-ui, sans-serif';
    c.fillStyle = state.timeLeft < 15 ? '#ef4444' : '#ffc53d';
    c.fillText(fmtTime(state.timeLeft), r.x + r.w / 2, r.y + 66);
    c.fillStyle = '#fff8e7';
    c.font = 'bold 18px system-ui, sans-serif';
    c.fillText('Score ' + state.score + '  x' + state.comboMult.toFixed(2).replace(/\.?0+$/, ''), r.x + r.w / 2, r.y + 96);
    c.font = '16px system-ui, sans-serif';
    var stars = '';
    for (var i = 0; i < 3; i++) stars += state.starsEarned > i ? '★' : '☆';
    c.fillStyle = '#ffc53d';
    c.fillText(stars + '  Night ' + state.night + '/5', r.x + r.w / 2, r.y + 118);
    c.restore();
  }

  function drawBins(c, state) {
    c.save();
    c.fillStyle = '#5b3a1e';
    art.rr(c, 8, 148, 1264, 96, 10); c.fill();
    for (var i = 0; i < 8; i++) {
      var r = L.bins[i];
      var ing = window.WK.INGREDIENTS[i];
      var held = state.hand === ing.id;
      c.fillStyle = held ? '#ffc53d' : '#fff8e7';
      art.rr(c, r.x, r.y, r.w, r.h, 8); c.fill();
      if (held) { c.strokeStyle = '#241a12'; c.lineWidth = 3; art.rr(c, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 7); c.stroke(); }
      art.drawIngredient(c, ing.id, r.x + 34, r.y + 40, 20);
      c.fillStyle = '#241a12'; c.textAlign = 'left';
      c.font = 'bold 16px system-ui, sans-serif';
      c.fillText(ing.name, r.x + 62, r.y + 34);
      c.font = '15px system-ui, sans-serif';
      c.fillStyle = '#6b4a2a';
      var st = ing.station ? ('→ ' + window.WK.stations.stationDef(ing.station).name) : 'siap saji';
      c.fillText(st, r.x + 62, r.y + 56);
      // key label
      c.fillStyle = '#241a12';
      c.beginPath(); c.arc(r.x + r.w - 18, r.y + 18, 13, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#ffc53d'; c.font = 'bold 16px system-ui, sans-serif'; c.textAlign = 'center';
      c.fillText(ing.key, r.x + r.w - 18, r.y + 24);
    }
    c.restore();
  }

  function drawStations(c, state) {
    c.save();
    c.fillStyle = '#3a2a1a';
    art.rr(c, 8, 246, 1264, 152, 10); c.fill();
    for (var i = 0; i < 4; i++) {
      var r = L.stations[i];
      var def = window.WK.STATIONS[i];
      var slot = state.stationSlots[i];
      var busy = !!slot.item;
      c.fillStyle = busy ? '#2a1a0e' : '#fff8e7';
      art.rr(c, r.x, r.y, r.w, r.h, 10); c.fill();
      c.fillStyle = busy ? '#ffc53d' : '#241a12'; c.textAlign = 'left';
      c.font = 'bold 18px system-ui, sans-serif';
      c.fillText(def.name + '  [' + def.key + ']', r.x + 16, r.y + 30);
      if (!busy) {
        c.font = '15px system-ui, sans-serif'; c.fillStyle = '#6b4a2a';
        c.fillText('kosong — klik bahan lalu klik stasiun', r.x + 16, r.y + 58);
        // station glyph: an empty plate outline, low so it never covers the text
        c.strokeStyle = '#a06a35'; c.lineWidth = 4;
        c.beginPath(); c.ellipse(r.x + r.w - 60, r.y + 104, 40, 18, 0, 0, Math.PI * 2); c.stroke();
      } else {
        // item + timing ring
        art.drawIngredient(c, slot.burnt ? 'burnt' : slot.item, r.x + 60, r.y + 82, 26);
        var frac = window.WK.stations.progressFrac(slot);
        var cx = r.x + r.w - 60, cy = r.y + 82, rad = 34;
        c.strokeStyle = '#e5d9bd'; c.lineWidth = 8;
        c.beginPath(); c.arc(cx, cy, rad, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = slot.burnt ? '#ef4444' : (slot.done ? '#4ade80' : '#f59e0b');
        c.beginPath(); c.arc(cx, cy, rad, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); c.stroke();
        c.fillStyle = slot.burnt ? '#ef4444' : '#241a12';
        c.font = 'bold 17px system-ui, sans-serif'; c.textAlign = 'center';
        c.fillText(slot.burnt ? 'GOSONG!' : (slot.done ? 'SIAP!' : Math.ceil(slot.seconds - slot.progress) + 's'), cx, cy + 6);
        c.textAlign = 'left';
        c.font = '15px system-ui, sans-serif'; c.fillStyle = '#6b4a2a';
        c.fillText(slot.done ? 'klik untuk ambil' : 'memasak…', r.x + 16, r.y + 58);
      }
    }
    c.restore();
  }

  function drawPlateArea(c, state, t) {
    var r = L.plate;
    c.save();
    // trash (left)
    var tr = L.trash;
    c.fillStyle = '#374151';
    art.rr(c, tr.x, tr.y, tr.w, tr.h, 10); c.fill();
    c.fillStyle = '#f3f4f6'; c.textAlign = 'center';
    c.font = 'bold 18px system-ui, sans-serif';
    c.fillText('SAMPAH', tr.x + tr.w / 2, tr.y + 34);
    // trash can, drawn as vector shapes (no emoji glyphs)
    var tx = tr.x + tr.w / 2, ty = tr.y + 74;
    c.fillStyle = '#9ca3af';
    c.beginPath();
    c.moveTo(tx - 26, ty - 12); c.lineTo(tx + 26, ty - 12);
    c.lineTo(tx + 20, ty + 22); c.lineTo(tx - 20, ty + 22);
    c.closePath(); c.fill();
    c.fillStyle = '#6b7280';
    c.fillRect(tx - 30, ty - 18, 60, 6);
    c.fillRect(tx - 6, ty - 26, 12, 8);
    c.strokeStyle = '#4b5563'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(tx - 10, ty - 6); c.lineTo(tx - 8, ty + 14); c.stroke();
    c.beginPath(); c.moveTo(tx + 10, ty - 6); c.lineTo(tx + 8, ty + 14); c.stroke();
    c.font = '15px system-ui, sans-serif';
    c.fillText('[X] buang', tr.x + tr.w / 2, tr.y + 112);
    c.fillText('piring / tangan', tr.x + tr.w / 2, tr.y + 134);
    // plate
    var dish = state.targetDish();
    var ready = state.plateReady();
    var glow = ready ? (0.5 + 0.5 * Math.sin(t * 6)) : 0;
    if (ready) {
      c.save();
      c.shadowColor = '#4ade80'; c.shadowBlur = 30 + glow * 20;
      c.fillStyle = '#f5efe0';
      art.rr(c, r.x, r.y, r.w, r.h, 12); c.fill();
      c.restore();
    } else {
      c.fillStyle = state.plate.wrong ? '#fecaca' : '#f5efe0';
      art.rr(c, r.x, r.y, r.w, r.h, 12); c.fill();
    }
    c.strokeStyle = ready ? '#4ade80' : '#a06a35'; c.lineWidth = ready ? 5 : 3;
    art.rr(c, r.x, r.y, r.w, r.h, 12); c.stroke();
    c.fillStyle = '#241a12'; c.textAlign = 'center';
    c.font = 'bold 17px system-ui, sans-serif';
    c.fillText(dish ? dish.name : '— pilih pesanan —', r.x + r.w / 2, r.y + 28);
    // layers on the plate
    var n = state.plate.layers.length;
    for (var i = 0; i < n; i++) {
      var lx = r.x + 44 + i * 52;
      art.drawIngredient(c, state.plate.layers[i], lx, r.y + 82, 20);
      c.fillStyle = '#241a12'; c.font = 'bold 14px system-ui, sans-serif';
      c.fillText((i + 1), lx, r.y + 122);
    }
    // ghost outline of next layer
    var next = dish ? window.WK.recipes.nextLayer(dish, state.plate.layers) : null;
    if (next && !state.plate.wrong) {
      var gx = r.x + 44 + n * 52;
      c.save();
      c.globalAlpha = 0.45 + 0.2 * Math.sin(t * 4);
      c.strokeStyle = '#6b4a2a'; c.lineWidth = 2; c.setLineDash([5, 4]);
      c.beginPath(); c.arc(gx, r.y + 82, 24, 0, Math.PI * 2); c.stroke();
      c.restore();
      c.fillStyle = '#6b4a2a'; c.font = '15px system-ui, sans-serif';
      c.fillText('berikutnya: ' + window.WK.ingredientName(next), r.x + r.w / 2, r.y + 146);
    } else if (state.plate.wrong) {
      c.fillStyle = '#dc2626'; c.font = 'bold 16px system-ui, sans-serif';
      c.fillText('lapisan salah — tekan X untuk buang', r.x + r.w / 2, r.y + 146);
    }
    if (ready) {
      c.fillStyle = '#16a34a'; c.font = 'bold 18px system-ui, sans-serif';
      c.fillText('READY — tekan SPACE!', r.x + r.w / 2, r.y + 146);
    }
    // hand indicator (light text: this strip sits on the dark night background)
    c.textAlign = 'left';
    c.fillStyle = '#fff8e7'; c.font = 'bold 16px system-ui, sans-serif';
    c.fillText('Tangan: ' + (state.hand ? window.WK.ingredientName(state.hand) : 'kosong'), 16, 616);
    if (state.hand) art.drawIngredient(c, state.hand, 200, 610, 16);
    // hatch (right)
    var h = L.hatch;
    c.fillStyle = ready ? '#166534' : '#14532d';
    art.rr(c, h.x, h.y, h.w, h.h, 10); c.fill();
    c.fillStyle = '#f0fdf4'; c.textAlign = 'center';
    c.font = 'bold 17px system-ui, sans-serif';
    c.fillText('SAJIKAN', h.x + h.w / 2, h.y + 30);
    // bell
    c.fillStyle = '#ffc53d';
    c.beginPath(); c.arc(h.x + h.w / 2, h.y + 78, 26, Math.PI, 0); c.fill();
    art.rr(c, h.x + h.w / 2 - 30, h.y + 78, 60, 8, 4); c.fill();
    art.circle(c, h.x + h.w / 2, h.y + 96, 6); c.fill();
    c.fillStyle = '#f0fdf4'; c.font = '15px system-ui, sans-serif';
    c.fillText('[Space] antar', h.x + h.w / 2, h.y + 130);
    // customer waiting at hatch
    var tk = state.tickets[state.targetIndex];
    if (tk) {
      var mood = ready ? 'happy' : 'neutral';
      art.drawCustomer(c, tk.variant, h.x + h.w / 2, h.y - 34, 20, mood, Math.sin(t * 2 + tk.bobPhase) * 2);
    }
    c.restore();
  }

  function drawHints(c, state) {
    c.save();
    c.fillStyle = '#241a12';
    art.rr(c, 8, 632, 1264, 80, 10); c.fill();
    c.fillStyle = '#fff8e7'; c.textAlign = 'left';
    c.font = '16px system-ui, sans-serif';
    c.fillText('1-8 bahan   •   Q/W/E/R stasiun   •   klik piring untuk susun   •   Space antar   •   X buang   •   P jeda   •   M bisu   •   H bantuan', 24, 664);
    c.fillStyle = '#ffc53d';
    c.fillText('Tips: panggang sate jangan ditinggal — gosong kalau kelamaan di panggangan!', 24, 692);
    c.textAlign = 'right';
    c.fillStyle = '#fff8e7';
    c.fillText('Malam ' + state.night + ' / 5   •   Skor terbaik: ' + state.best, 1256, 664);
    c.fillText(state.rush ? 'RUSH HOUR — pesanan datang lebih cepat!' : 'Warung Kilat — pasar malam', 1256, 692);
    c.restore();
  }

  // Full play screen.
  function drawPlay(c, state, t) {
    drawTickets(c, state, t);
    drawTimerPanel(c, state);
    drawBins(c, state);
    drawStations(c, state);
    drawPlateArea(c, state, t);
    drawHints(c, state);
  }

  window.WK = window.WK || {};
  window.WK.ui = {
    layout: L,
    hitTest: hitTest,
    fmtTime: fmtTime,
    drawPlay: drawPlay,
    drawTickets: drawTickets,
    drawTimerPanel: drawTimerPanel,
    drawBins: drawBins,
    drawStations: drawStations,
    drawPlateArea: drawPlateArea,
    drawHints: drawHints
  };
})();
