// game.js — main loop, state, rules, demo mode, and the entry point.
// Single responsibility: owning the game state and running it every frame.

(function () {
  'use strict';

  var CFG = window.WK.config;
  var audio = window.WK.audio;

  var canvas = null;
  var ctx = null;
  var view = { scale: 1, ox: 0, oy: 0 };
  var state = null;
  var lastT = 0;
  var rafId = 0;

  // ---- Best score (localStorage, always guarded) ----
  function loadBest() {
    try {
      var v = window.localStorage.getItem('warung-kilat-best');
      var n = parseInt(v, 10);
      return isNaN(n) ? 0 : n;
    } catch (e) { return 0; }
  }
  function saveBest(n) {
    try { window.localStorage.setItem('warung-kilat-best', String(n)); } catch (e) { /* offline-safe */ }
  }

  // ---- State ----
  function freshState(seed) {
    return {
      scene: 'title',
      night: 1,
      timeLeft: CFG.nightSeconds[0],
      score: 0,
      nightScore: 0,
      combo: 0,
      comboMult: 1,
      starsEarned: 0,
      best: loadBest(),
      tickets: [],
      targetIndex: 0,
      hand: null,
      plate: window.WK.plate.makePlate(),
      stationSlots: window.WK.stations.makeStations(),
      particles: window.WK.particles.makeParticles(),
      rng: new window.WK.RNG(seed || 20261125),
      rush: false,
      rushT: 0,
      rushAt: 0,
      orderTimer: 2,
      ticketSeq: 0,
      served: 0,
      lost: 0,
      muted: false,
      demo: null,
      t: 0
    };
  }

  function targetDish() {
    var tk = state.tickets[state.targetIndex];
    if (!tk) return null;
    return window.WK.recipes.dishById(tk.dishId);
  }
  function plateReady() {
    var d = targetDish();
    return d ? window.WK.plate.isReady(state.plate, d) : false;
  }

  // ---- Night flow ----
  function startNight(n) {
    state.night = n;
    state.timeLeft = CFG.nightSeconds[n - 1];
    state.nightScore = 0;
    state.served = 0;
    state.lost = 0;
    state.tickets.length = 0;
    state.targetIndex = 0;
    state.hand = null;
    window.WK.plate.clearPlate(state.plate);
    state.stationSlots = window.WK.stations.makeStations();
    state.orderTimer = 1.5;
    state.rush = false;
    state.rushT = 0;
    state.rushAt = 25 + state.rng.float() * 25;
    for (var i = 0; i < 3; i++) spawnTicket();
    state.scene = 'play';
  }

  function spawnTicket() {
    if (state.tickets.length >= CFG.maxTickets) return;
    var tk = window.WK.orders.makeTicket(state.rng, state.night, ++state.ticketSeq);
    state.tickets.push(tk);
    audio.chime();
  }

  function endNight() {
    var th = CFG.starThresholds;
    state.starsEarned = state.nightScore >= th[2] ? 3 : (state.nightScore >= th[1] ? 2 : (state.nightScore >= th[0] ? 1 : 0));
    if (state.score > state.best) { state.best = state.score; saveBest(state.best); }
    state.scene = 'summary';
    audio.stopMusic();
  }

  // ---- Actions ----
  function pickBin(i) {
    var ing = window.WK.INGREDIENTS[i];
    if (!ing) return;
    state.hand = ing.id;
    audio.pop();
  }

  function useStation(i) {
    var slot = state.stationSlots[i];
    if (!slot) return;
    // Collect a finished item first.
    if (slot.item && slot.done) {
      var got = window.WK.stations.collect(slot);
      if (got) { state.hand = got; audio.pop(); }
      return;
    }
    // Start cooking the held raw ingredient if this station takes it.
    if (slot.item || !state.hand) { audio.buzz(); return; }
    var ing = null;
    for (var j = 0; j < window.WK.INGREDIENTS.length; j++) {
      if (window.WK.INGREDIENTS[j].id === state.hand) ing = window.WK.INGREDIENTS[j];
    }
    if (!ing || ing.station !== slot.id) { audio.buzz(); return; }
    window.WK.stations.startCook(slot, state.hand);
    state.hand = null;
    if (slot.id === 'grill' || slot.id === 'wok') audio.sizzle();
    else audio.chop();
  }

  function clickPlate() {
    if (!state.hand) return;
    if (state.hand === 'burnt') { audio.buzz(); return; }
    var dish = targetDish();
    if (!dish) { audio.buzz(); return; }
    var res = window.WK.plate.addLayer(state.plate, dish, state.hand);
    if (res === 'ok') {
      state.hand = null;
      audio.pop();
      window.WK.particles.spawn(state.particles, 'spark', 640, 500);
    } else {
      state.hand = null;
      audio.buzz();
      window.WK.particles.addShake(state.particles, 5);
    }
  }

  function serve() {
    if (!plateReady()) { audio.buzz(); return; }
    var tk = state.tickets[state.targetIndex];
    var dish = targetDish();
    var tip = Math.round(window.WK.orders.patienceFrac(tk) * tk.patienceMax * CFG.tipPerSecondLeft);
    var pts = Math.round((dish.price + tip) * state.comboMult * (tk.vip ? CFG.vipMultiplier : 1));
    state.score += pts;
    state.nightScore += pts;
    state.combo += 1;
    state.comboMult = Math.min(CFG.comboCap, 1 + state.combo * CFG.comboStep);
    state.served += 1;
    window.WK.particles.spawn(state.particles, 'text', 640, 460, '+' + pts);
    window.WK.particles.spawn(state.particles, 'spark', 1190, 500);
    audio.coin();
    audio.bell();
    window.WK.plate.clearPlate(state.plate);
    state.tickets.splice(state.targetIndex, 1);
    state.targetIndex = 0;
  }

  function trash() {
    if (state.hand) {
      state.hand = null;
      state.score = Math.max(0, state.score - CFG.trashPenalty);
      audio.buzz();
      return;
    }
    if (state.plate.layers.length) {
      window.WK.plate.clearPlate(state.plate);
      state.score = Math.max(0, state.score - CFG.trashPenalty);
      audio.buzz();
    }
  }

  function targetTicket(i) {
    if (state.tickets[i]) { state.targetIndex = i; audio.pop(); }
  }

  // ---- Update ----
  function update(dt) {
    state.t += dt;
    if (state.scene !== 'play') return;
    // timer
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) { state.timeLeft = 0; endNight(); return; }
    // rush hour: one rush per night, ~15s
    if (!state.rush && state.t > state.rushAt && state.night >= 2) {
      state.rush = true; state.rushT = 15;
      audio.chime();
    }
    if (state.rush) {
      state.rushT -= dt;
      if (state.rushT <= 0) state.rush = false;
    }
    // orders spawn
    state.orderTimer -= dt;
    if (state.orderTimer <= 0) {
      spawnTicket();
      var gap = CFG.orderGapSeconds[state.night - 1] * (state.rush ? 0.55 : 1);
      state.orderTimer = gap * (0.8 + state.rng.float() * 0.4);
    }
    // patience
    for (var i = state.tickets.length - 1; i >= 0; i--) {
      if (window.WK.orders.tickTicket(state.tickets[i], dt, state.rush)) {
        state.tickets.splice(i, 1);
        state.lost += 1;
        state.combo = 0; state.comboMult = 1;
        state.score = Math.max(0, state.score - CFG.lostOrderPenalty);
        audio.buzz();
        window.WK.particles.addShake(state.particles, 4);
        if (state.targetIndex >= state.tickets.length) state.targetIndex = Math.max(0, state.tickets.length - 1);
      }
    }
    // stations
    for (var s = 0; s < state.stationSlots.length; s++) {
      var slot = state.stationSlots[s];
      var ev = window.WK.stations.tickStation(slot, dt);
      if (ev === 'done') audio.chime();
      if (ev === 'burnt') { audio.burn(); window.WK.particles.addShake(state.particles, 3); }
      if (slot.item && !slot.done && slot.id === 'grill') {
        if (Math.random() < dt * 6) window.WK.particles.spawn(state.particles, 'steam', 700 + s * 40, 300);
      }
      if (slot.item && slot.id === 'steamer') {
        if (Math.random() < dt * 4) window.WK.particles.spawn(state.particles, 'steam', 60 + s * 316, 300);
      }
    }
    window.WK.particles.tick(state.particles, dt);
  }

  // ---- Draw ----
  function draw() {
    if (!ctx) return;
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // letterbox background
    ctx.fillStyle = '#0b0618';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    var off = window.WK.particles.shakeOffset(state.particles);
    ctx.translate(view.ox + off.x, view.oy + off.y);
    ctx.scale(view.scale, view.scale);
    // night sky backdrop for the play screen (the awning is drawn by ui.drawPlay)
    ctx.fillStyle = CFG.palette.night;
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    // hanging paper lanterns in the dark gaps beside the plate (night-market look)
    if (state.scene === 'play' || state.scene === 'pause' || state.scene === 'help' || state.scene === 'summary') {
      var sway = Math.sin(state.t * 1.2) * 3;
      window.WK.art.drawLantern(ctx, 300 + sway, 520, 22, '#e5484d', true);
      window.WK.art.drawLantern(ctx, 980 - sway, 520, 22, '#f59e0b', true);
    }
    if (state.scene === 'title') {
      window.WK.scenes.drawTitle(ctx, state, state.t);
    } else if (state.scene === 'help') {
      window.WK.ui.drawPlay(ctx, state, state.t);
      window.WK.scenes.drawHelp(ctx);
    } else if (state.scene === 'pause') {
      window.WK.ui.drawPlay(ctx, state, state.t);
      window.WK.scenes.drawPause(ctx);
    } else if (state.scene === 'summary') {
      window.WK.ui.drawPlay(ctx, state, state.t);
      window.WK.scenes.drawSummary(ctx, state);
    } else if (state.scene === 'end') {
      window.WK.scenes.drawEnd(ctx, state);
    } else {
      window.WK.ui.drawPlay(ctx, state, state.t);
      window.WK.particles.draw(ctx, state.particles);
    }
    ctx.restore();
  }

  function loop(ts) {
    var dt = Math.min(0.05, (ts - lastT) / 1000 || 0.016);
    lastT = ts;
    update(dt);
    draw();
    rafId = window.requestAnimationFrame(loop);
  }

  // ---- Resize / letterbox ----
  function resize() {
    var ww = window.innerWidth, wh = window.innerHeight;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(ww * dpr);
    canvas.height = Math.round(wh * dpr);
    canvas.style.width = ww + 'px';
    canvas.style.height = wh + 'px';
    var scale = Math.min(ww / CFG.W, wh / CFG.H);
    view.scale = scale * dpr;
    view.ox = (ww * dpr - CFG.W * view.scale) / 2;
    view.oy = (wh * dpr - CFG.H * view.scale) / 2;
    window.WK.input.setView({ scale: view.scale, ox: view.ox, oy: view.oy });
  }

  // ---- Input routing ----
  function onClick(x, y) {
    audio.unlock();
    if (state.scene === 'title') { startNight(1); audio.startMusic(); return; }
    if (state.scene === 'summary') {
      if (state.night < 5) startNight(state.night + 1);
      else state.scene = 'end';
      return;
    }
    if (state.scene === 'end') { state.score = 0; state.combo = 0; state.comboMult = 1; startNight(1); return; }
    if (state.scene === 'help') { state.scene = 'play'; return; }
    if (state.scene === 'pause') { state.scene = 'play'; return; }
    if (state.scene !== 'play') return;
    var hit = window.WK.ui.hitTest(x, y, state);
    if (!hit) return;
    if (hit.type === 'ticket') targetTicket(hit.index);
    else if (hit.type === 'bin') pickBin(hit.index);
    else if (hit.type === 'station') useStation(hit.index);
    else if (hit.type === 'plate') clickPlate();
    else if (hit.type === 'hatch') serve();
    else if (hit.type === 'trash') trash();
  }

  function onKey(action) {
    audio.unlock();
    if (action === 'mute') {
      state.muted = !state.muted;
      audio.setMuted(state.muted);
      return;
    }
    if (state.scene === 'title' && (action === 'serve')) { startNight(1); audio.startMusic(); return; }
    if (state.scene === 'summary' && action === 'serve') {
      if (state.night < 5) startNight(state.night + 1); else state.scene = 'end';
      return;
    }
    if (state.scene === 'end' && action === 'serve') { state.score = 0; state.combo = 0; state.comboMult = 1; startNight(1); return; }
    if (action === 'help') {
      state.scene = state.scene === 'help' ? 'play' : 'help';
      return;
    }
    if (action === 'pause') {
      if (state.scene === 'play') state.scene = 'pause';
      else if (state.scene === 'pause') state.scene = 'play';
      return;
    }
    if (state.scene !== 'play') return;
    if (action === 'serve') serve();
    else if (action === 'trash') trash();
    else if (action.indexOf('bin') === 0) pickBin(parseInt(action.slice(3), 10));
    else if (action.indexOf('station') === 0) useStation(parseInt(action.slice(7), 10));
  }

  // ---- Demo mode: build a shot state through the real code path ----
  // Each shot is a different real-play moment: different timer, different
  // patience levels (green / yellow / red), different ticket sets and nights.
  function applyDemo(shot) {
    state.demo = shot;
    state.scene = 'play';
    // varied nights and timers per shot
    var nightByShot = { rush: 1, assembly: 2, ready: 2, night3: 3 };
    var timeByShot = { rush: 42, assembly: 63, ready: 25, night3: 74 };
    var scoreByShot = { rush: 320, assembly: 210, ready: 450, night3: 580 };
    state.night = nightByShot[shot] || 1;
    state.timeLeft = timeByShot[shot] || 60;
    state.score = scoreByShot[shot] || 180;
    state.combo = shot === 'rush' ? 3 : (shot === 'night3' ? 4 : 1);
    state.comboMult = 1 + state.combo * CFG.comboStep;
    state.rush = (shot === 'rush' || shot === 'night3');
    // keep rush active for the whole shot (rushT drains in update())
    if (state.rush) state.rushT = 60;
    // never auto-trigger a rush during a screenshot (rushAt is 0 by default,
    // which would fire rush immediately on night >= 2)
    state.rushAt = 999;
    // tickets via the real generator, then set varied patience levels
    state.tickets.length = 0;
    var want = shot === 'rush' ? 5 : 4;
    for (var i = 0; i < want; i++) spawnTicket();
    // patience fractions: green, yellow, red mix so the bars differ
    var fracs = [0.82, 0.55, 0.34, 0.18, 0.66];
    for (var p = 0; p < state.tickets.length; p++) {
      state.tickets[p].patience = state.tickets[p].patienceMax * fracs[p % fracs.length];
    }
    state.targetIndex = 0;
    var dish = targetDish();
    if (shot === 'assembly' && dish) {
      // build 3 of 5 layers through the real plate logic
      window.WK.plate.addLayer(state.plate, dish, dish.layers[0]);
      window.WK.plate.addLayer(state.plate, dish, dish.layers[1]);
      window.WK.plate.addLayer(state.plate, dish, dish.layers[2]);
      state.hand = dish.layers[3];
    } else if (shot === 'ready' && dish) {
      for (var j = 0; j < dish.layers.length; j++) {
        window.WK.plate.addLayer(state.plate, dish, dish.layers[j]);
      }
      state.hand = null;
    } else if (shot === 'rush') {
      window.WK.plate.addLayer(state.plate, dish, dish.layers[0]);
      state.hand = 'tomato';
      // a station mid-cook through the real station logic
      window.WK.stations.startCook(state.stationSlots[1], 'skewer');
      state.stationSlots[1].progress = 2.5;
    } else if (shot === 'night3') {
      // a grill mid-action with steam
      window.WK.stations.startCook(state.stationSlots[1], 'skewer');
      state.stationSlots[1].progress = 2.5;
      window.WK.stations.startCook(state.stationSlots[0], 'rice');
      state.stationSlots[0].progress = 1.2;
      state.hand = 'egg';
    }
  }

  function boot() {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    state = freshState(20261125);
    // The HUD calls these through the state object; they close over it.
    state.targetDish = targetDish;
    state.plateReady = plateReady;
    // expose for the demo hash and debugging
    window.WK.game = { state: state, startNight: startNight };
    window.WK.input.init(canvas);
    window.WK.input.bind({ onClick: onClick, onKey: onKey, onHide: function () { if (state.scene === 'play') state.scene = 'pause'; } });
    window.addEventListener('resize', resize);
    resize();
    // demo mode from the URL hash (screenshots only; normal play is unaffected)
    var m = (window.location.hash || '').match(/#shot=([a-z0-9]+)/);
    if (m) applyDemo(m[1]);
    lastT = performance.now();
    rafId = window.requestAnimationFrame(loop);
  }

  window.WK = window.WK || {};
  window.WK.boot = boot;
  window.WK._game = { freshState: freshState };
})();
