// ui.js — the in-game HUD: order board, timer, counter, plate, hatch, hints.
// Single responsibility: drawing the play screen and hit-testing clicks.
// v3: a real night-market stall — striped awning, wooden counter, ingredient
// containers and stations drawn as physical objects, customers at the hatch.
// Layout is fixed in logical 1280x720 coordinates; game.js scales the canvas.
// All UI labels are English; dish names stay Indonesian for flavour.

(function () {
  'use strict';

  var CFG = window.WK.config;
  var art = window.WK.art;

  // --- Layout rects (logical px) ---
  var L = {
    tickets: [], // filled below: 5 ticket rects
    timerPanel: { x: 1016, y: 30, w: 248, h: 140 },
    bins: [],    // 8 bin rects
    stations: [],// 4 station rects
    plate: { x: 470, y: 440, w: 340, h: 150 },
    hatch: { x: 1120, y: 440, w: 144, h: 150 },
    trash: { x: 16, y: 440, w: 120, h: 150 }
  };
  (function () {
    var i;
    for (i = 0; i < 5; i++) L.tickets.push({ x: 16 + i * 196, y: 58, w: 188, h: 112 });
    for (i = 0; i < 8; i++) L.bins.push({ x: 16 + i * 156, y: 192, w: 146, h: 92 });
    for (i = 0; i < 4; i++) L.stations.push({ x: 16 + i * 316, y: 292, w: 300, h: 128 });
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

  // Small round key badge, top-right corner of a card. Never overlaps the
  // centred name because the name sits lower on the card.
  function keyBadge(c, x, y, key) {
    c.save();
    c.fillStyle = '#241a12';
    c.beginPath(); c.arc(x, y, 12, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffc53d';
    c.font = 'bold 15px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(key, x, y + 1);
    c.restore();
  }

  function drawTickets(c, state, t) {
    var i, r, tk;
    c.save();
    // "ORDERS" wooden sign above the rail
    c.fillStyle = '#5d3a1a';
    art.rr(c, 16, 30, 150, 24, 6); c.fill();
    c.fillStyle = '#ffc53d';
    c.font = 'bold 16px system-ui, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('ORDERS', 28, 43);
    // rail
    c.fillStyle = '#3a2a1a';
    art.rr(c, 8, 56, 1000, 116, 10); c.fill();
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
      art.drawCustomer(c, tk.variant, r.x + 28, r.y + 32, 20, mood, bob);
      // dish name (short Indonesian names fit; 15px bold)
      c.fillStyle = tk.vip ? '#ffc53d' : '#241a12';
      c.font = 'bold 15px system-ui, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      c.fillText(tk.dishName, r.x + 54, r.y + 26);
      if (tk.vip) { c.font = 'bold 13px system-ui, sans-serif'; c.fillText('VIP x2', r.x + 54, r.y + 44); }
      // layer icons in order, ~30 px each so they survive downscaling
      var dish = window.WK.recipes.dishById(tk.dishId);
      for (var j = 0; j < dish.layers.length; j++) {
        art.drawIngredient(c, dish.layers[j], r.x + 22 + j * 32, r.y + 72, 14);
      }
      // patience bar
      var bw = r.w - 20;
      c.fillStyle = '#e5d9bd';
      art.rr(c, r.x + 10, r.y + 96, bw, 12, 6); c.fill();
      c.fillStyle = frac > 0.5 ? '#4ade80' : (frac > 0.25 ? '#f59e0b' : '#ef4444');
      if (frac > 0) { art.rr(c, r.x + 10, r.y + 96, bw * frac, 12, 6); c.fill(); }
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
    c.fillText('SHIFT TIMER', r.x + r.w / 2, r.y + 26);
    c.font = 'bold 44px system-ui, sans-serif';
    c.fillStyle = state.timeLeft < 15 ? '#ef4444' : '#ffc53d';
    c.fillText(fmtTime(state.timeLeft), r.x + r.w / 2, r.y + 72);
    c.fillStyle = '#fff8e7';
    c.font = 'bold 18px system-ui, sans-serif';
    c.fillText('Score ' + state.score + '  x' + state.comboMult.toFixed(2).replace(/\.?0+$/, ''), r.x + r.w / 2, r.y + 104);
    c.font = '16px system-ui, sans-serif';
    var stars = '';
    for (var i = 0; i < 3; i++) stars += state.starsEarned > i ? '★' : '☆';
    c.fillStyle = '#ffc53d';
    c.fillText(stars + '  Night ' + state.night + '/5', r.x + r.w / 2, r.y + 130);
    c.restore();
  }

  function drawBins(c, state) {
    c.save();
    // wooden counter band the bins sit on
    art.drawWoodCounter(c, 8, 184, 1264, 108);
    for (var i = 0; i < 8; i++) {
      var r = L.bins[i];
      var ing = window.WK.INGREDIENTS[i];
      var held = state.hand === ing.id;
      // bin card (a light tray on the counter)
      c.fillStyle = held ? '#ffe9a8' : '#fff8e7';
      art.rr(c, r.x, r.y, r.w, r.h, 8); c.fill();
      if (held) { c.strokeStyle = '#e5484d'; c.lineWidth = 3; art.rr(c, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 7); c.stroke(); }
      // container with the food heaped in it
      art.drawBinContainer(c, ing.id, r.x + r.w / 2, r.y + 34, 78);
      // name, centred below the container
      c.fillStyle = '#241a12'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.font = 'bold 15px system-ui, sans-serif';
      c.fillText(ing.name, r.x + r.w / 2, r.y + 70);
      // station hint, small and grey, below the name
      c.font = '13px system-ui, sans-serif';
      c.fillStyle = '#6b4a2a';
      var st = ing.station ? ('→ ' + window.WK.stations.stationDef(ing.station).name) : 'Ready to serve';
      c.fillText(st, r.x + r.w / 2, r.y + 86);
      // key badge, top-right corner (clear of the centred name)
      keyBadge(c, r.x + r.w - 14, r.y + 14, ing.key);
    }
    c.restore();
  }

  function drawStations(c, state) {
    c.save();
    // wooden counter band the stations sit on
    art.drawWoodCounter(c, 8, 284, 1264, 144);
    for (var i = 0; i < 4; i++) {
      var r = L.stations[i];
      var def = window.WK.STATIONS[i];
      var slot = state.stationSlots[i];
      var busy = !!slot.item;
      // station card: dark when busy (cooking), light when idle
      c.fillStyle = busy ? '#2a1a0e' : '#fff8e7';
      art.rr(c, r.x, r.y, r.w, r.h, 10); c.fill();
      if (busy) { c.strokeStyle = '#f59e0b'; c.lineWidth = 3; art.rr(c, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 8); c.stroke(); }
      // name + key badge (name left, badge right — no overlap)
      c.fillStyle = busy ? '#ffc53d' : '#241a12'; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      c.font = 'bold 18px system-ui, sans-serif';
      c.fillText(def.name, r.x + 16, r.y + 28);
      keyBadge(c, r.x + r.w - 18, r.y + 22, def.key);
      if (!busy) {
        // the station object, idle (no food on it) — no instruction text
        // inside the card; the help screen and bin hints explain the flow
        drawStationObject(c, def.id, r.x + 70, r.y + 84, 120, state.t, false, null);
      } else {
        // the station object with food on it
        drawStationObject(c, def.id, r.x + 70, r.y + 84, 120, state.t, true, slot.item);
        // timing ring (right side)
        var frac = window.WK.stations.progressFrac(slot);
        var cx = r.x + r.w - 58, cy = r.y + 78, rad = 32;
        c.strokeStyle = '#e5d9bd'; c.lineWidth = 8;
        c.beginPath(); c.arc(cx, cy, rad, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = slot.burnt ? '#ef4444' : (slot.done ? '#4ade80' : '#f59e0b');
        c.beginPath(); c.arc(cx, cy, rad, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); c.stroke();
        // status text in the ring: high contrast (white on the dark busy card)
        c.fillStyle = slot.burnt ? '#ef4444' : '#fff8e7';
        c.font = 'bold 17px system-ui, sans-serif'; c.textAlign = 'center';
        c.fillText(slot.burnt ? 'BURNT!' : (slot.done ? 'READY!' : Math.ceil(slot.seconds - slot.progress) + 's'), cx, cy + 6);
        // status label at the bottom centre of the card (clear of object and ring)
        c.font = 'bold 15px system-ui, sans-serif';
        c.fillStyle = slot.burnt ? '#fca5a5' : '#ffe9a8';
        c.fillText(slot.done ? 'Click to collect' : 'Cooking…', r.x + r.w / 2, r.y + 110);
      }
    }
    c.restore();
  }

  // Draw the station object for a station id.
  function drawStationObject(c, id, cx, cy, w, t, cooking, item) {
    if (id === 'steamer') art.drawSteamerObj(c, cx, cy, w, t, cooking);
    else if (id === 'grill') art.drawGrillObj(c, cx, cy, w, t, cooking, item);
    else if (id === 'wok') art.drawWokObj(c, cx, cy, w, t, cooking);
    else if (id === 'board') art.drawBoardObj(c, cx, cy, w, t, cooking, item);
  }

  function drawPlateArea(c, state, t) {
    var r = L.plate;
    c.save();
    // trash (left) — English, high-contrast hint
    var tr = L.trash;
    c.fillStyle = '#374151';
    art.rr(c, tr.x, tr.y, tr.w, tr.h, 10); c.fill();
    c.fillStyle = '#f3f4f6'; c.textAlign = 'center';
    c.font = 'bold 18px system-ui, sans-serif';
    c.fillText('TRASH', tr.x + tr.w / 2, tr.y + 32);
    // trash can, drawn as vector shapes (no emoji glyphs)
    var tx = tr.x + tr.w / 2, ty = tr.y + 72;
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
    c.font = 'bold 15px system-ui, sans-serif';
    c.fillStyle = '#f3f4f6';
    c.fillText('[X] discard', tr.x + tr.w / 2, tr.y + 116);
    c.fillText('plate / hand', tr.x + tr.w / 2, tr.y + 136);
    // the assembly plate: a real plate with the dish built in layers
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
    c.fillText(dish ? dish.name : '— pick an order —', r.x + r.w / 2, r.y + 26);
    // the plate itself, with layers stacked on it
    var next = dish ? window.WK.recipes.nextLayer(dish, state.plate.layers) : null;
    art.drawPlateObj(c, r.x + r.w / 2, r.y + 92, 150, state.plate.layers, state.plate.wrong ? null : next);
    // status line under the plate
    if (ready) {
      c.fillStyle = '#16a34a'; c.font = 'bold 18px system-ui, sans-serif';
      c.fillText('READY — press SPACE!', r.x + r.w / 2, r.y + 138);
    } else if (state.plate.wrong) {
      c.fillStyle = '#dc2626'; c.font = 'bold 16px system-ui, sans-serif';
      c.fillText('Wrong layer — press X to discard', r.x + r.w / 2, r.y + 138);
    } else if (next) {
      c.fillStyle = '#6b4a2a'; c.font = '15px system-ui, sans-serif';
      c.fillText('Next: ' + window.WK.ingredientName(next), r.x + r.w / 2, r.y + 138);
    }
    // in-hand indicator (light text on the dark background)
    c.textAlign = 'left';
    c.fillStyle = '#fff8e7'; c.font = 'bold 16px system-ui, sans-serif';
    c.fillText('In hand: ' + (state.hand ? window.WK.ingredientName(state.hand) : 'empty'), 16, 616);
    if (state.hand) art.drawIngredient(c, state.hand, 190, 610, 16);
    // serving hatch (right) with customers standing at it
    var h = L.hatch;
    c.fillStyle = ready ? '#166534' : '#14532d';
    art.rr(c, h.x, h.y, h.w, h.h, 10); c.fill();
    c.fillStyle = '#f0fdf4'; c.textAlign = 'center';
    c.font = 'bold 17px system-ui, sans-serif';
    c.fillText('SERVE', h.x + h.w / 2, h.y + 28);
    // bell
    c.fillStyle = '#ffc53d';
    c.beginPath(); c.arc(h.x + h.w / 2, h.y + 76, 26, Math.PI, 0); c.fill();
    art.rr(c, h.x + h.w / 2 - 30, h.y + 76, 60, 8, 4); c.fill();
    art.circle(c, h.x + h.w / 2, h.y + 94, 6); c.fill();
    c.fillStyle = '#f0fdf4'; c.font = '15px system-ui, sans-serif';
    c.fillText('[Space] serve', h.x + h.w / 2, h.y + 128);
    // customers standing at the serving hatch, with a speech bubble.
    // They stand in the gap left of the hatch (clear of the stations above
    // and the lantern), so the bubble never overlaps a station card.
    var tk = state.tickets[state.targetIndex];
    if (tk) {
      var mood = ready ? 'happy' : 'neutral';
      var bob = Math.sin(t * 2 + tk.bobPhase) * 2;
      var custX = 1050, custY = 545;
      art.drawCustomer(c, tk.variant, custX, custY, 20, mood, bob);
      // speech bubble: what they want (the dish name, or a happy word when ready)
      art.drawSpeechBubble(c, custX, custY - 62, 120, ready ? 'Thank you!' : tk.dishName);
    }
    c.restore();
  }

  function drawHints(c, state) {
    c.save();
    c.fillStyle = '#241a12';
    art.rr(c, 8, 632, 1264, 80, 10); c.fill();
    // key hints as small badges, not sentences
    var badges = ['1-8 Ingredients', 'Q/W/E/R Stations', 'Click plate to build', 'Space Serve', 'X Trash', 'P Pause', 'M Mute', 'H Help'];
    var bx = 24;
    c.font = 'bold 14px system-ui, sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle';
    for (var i = 0; i < badges.length; i++) {
      var w = c.measureText(badges[i]).width + 18;
      c.fillStyle = '#3a2a1a';
      art.rr(c, bx, 644, w, 26, 13); c.fill();
      c.fillStyle = '#ffc53d';
      c.fillText(badges[i], bx + 9, 658);
      bx += w + 8;
    }
    c.textAlign = 'right';
    c.fillStyle = '#fff8e7';
    c.font = '16px system-ui, sans-serif';
    c.fillText('Night ' + state.night + ' / 5   •   Best score: ' + state.best, 1256, 658);
    c.fillStyle = '#ffc53d';
    c.fillText(state.rush ? 'RUSH HOUR — orders arrive faster!' : 'Warung Kilat — night market', 1256, 690);
    c.restore();
  }

  // Full play screen.
  function drawPlay(c, state, t) {
    // striped awning across the top of the stall
    art.drawAwning(c, 0, 0, CFG.W, 28);
    drawTickets(c, state, t);
    drawTimerPanel(c, state);
    // RUSH HOUR banner, centred in the free strip above the tickets
    if (state.rush) {
      c.save();
      var pulse = 0.75 + 0.25 * Math.sin(t * 5);
      c.globalAlpha = pulse;
      c.fillStyle = '#e5484d';
      art.rr(c, 420, 30, 440, 26, 13); c.fill();
      c.globalAlpha = 1;
      c.fillStyle = '#fff8e7';
      c.font = 'bold 17px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('RUSH HOUR!', 640, 44);
      c.restore();
    }
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
