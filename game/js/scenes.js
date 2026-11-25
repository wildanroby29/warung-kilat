// scenes.js — title, help, pause, summary and end screens.
// Single responsibility: drawing the non-play overlays and their buttons.
// All labels are English; dish names stay Indonesian for flavour.

(function () {
  'use strict';

  var CFG = window.WK.config;
  var art = window.WK.art;

  function dim(c, a) {
    c.fillStyle = 'rgba(10,4,24,' + a + ')';
    c.fillRect(0, 0, CFG.W, CFG.H);
  }

  function panel(c, x, y, w, h) {
    c.fillStyle = '#fff8e7';
    art.rr(c, x, y, w, h, 16); c.fill();
    c.strokeStyle = '#ffc53d'; c.lineWidth = 4;
    art.rr(c, x, y, w, h, 16); c.stroke();
  }

  function drawTitle(c, state, t) {
    // night sky + lanterns + stall silhouette
    c.save();
    c.fillStyle = CFG.palette.night;
    c.fillRect(0, 0, CFG.W, CFG.H);
    // stars
    c.fillStyle = 'rgba(255,255,255,0.8)';
    for (var i = 0; i < 40; i++) {
      var sx = (i * 137) % CFG.W, sy = (i * 89) % 200;
      c.fillRect(sx, sy, 2, 2);
    }
    // lanterns
    art.drawLantern(c, 180, 110, 34, '#e5484d', true);
    art.drawLantern(c, 1100, 90, 28, '#f59e0b', true);
    art.drawLantern(c, 640, 70, 22, '#e5484d', true);
    // title
    c.textAlign = 'center';
    c.fillStyle = '#ffc53d';
    c.font = 'bold 84px system-ui, sans-serif';
    c.fillText('WARUNG KILAT', CFG.W / 2, 260);
    c.fillStyle = '#fff8e7';
    c.font = 'bold 30px system-ui, sans-serif';
    c.fillText('A night-market food stall — cook fast, serve right!', CFG.W / 2, 312);
    c.font = '20px system-ui, sans-serif';
    c.fillStyle = '#fbbf24';
    c.fillText('5 nights • 5 dishes • impatient customers', CFG.W / 2, 348);
    // start prompt (pulsing)
    var a = 0.6 + 0.4 * Math.sin(t * 4);
    c.fillStyle = 'rgba(255,248,231,' + a.toFixed(3) + ')';
    c.font = 'bold 26px system-ui, sans-serif';
    c.fillText('Click or press Enter to open the stall', CFG.W / 2, 430);
    c.fillStyle = '#fff8e7';
    c.font = '18px system-ui, sans-serif';
    c.fillText('1-8 ingredients  •  Q/W/E/R stations  •  Space serve  •  X trash  •  P pause  •  H help', CFG.W / 2, 480);
    c.fillText('Best score: ' + state.best, CFG.W / 2, 516);
    c.restore();
  }

  function drawHelp(c) {
    c.save();
    dim(c, 0.7);
    panel(c, 240, 90, 800, 540);
    c.fillStyle = '#241a12'; c.textAlign = 'left';
    c.font = 'bold 30px system-ui, sans-serif';
    c.fillText('How to Play', 280, 150);
    c.font = '19px system-ui, sans-serif';
    var lines = [
      '1. Orders appear on the board above. Click a ticket to work on that order.',
      '2. Click an ingredient bin (1-8) or press its number to pick it up.',
      '3. Raw ingredients must be cooked: Skewers → Grill (Q), Egg → Wok (W),',
      '    Tempeh → Chopping board (E), Rice → Steamer (R). Wait until READY, then collect.',
      '4. Click the plate to stack layers in the order shown on the ticket.',
      '    The dashed outline shows the next layer.',
      '5. When the plate matches the order exactly, it glows READY.',
      '    Press Space / Enter or click the bell to serve it.',
      '6. Do not leave skewers on the grill — they burn! Discard with X if burnt.',
      '7. Customer patience runs out — serve fast for big tips and combos.',
      '',
      'Controls: 1-8 ingredients • Q/W/E/R stations • Space serve • X trash • P pause • M mute'
    ];
    for (var i = 0; i < lines.length; i++) c.fillText(lines[i], 280, 190 + i * 30);
    c.fillStyle = '#6b4a2a';
    c.font = 'bold 20px system-ui, sans-serif';
    c.fillText('Press H / Esc / click to go back', 280, 190 + lines.length * 30 + 10);
    c.restore();
  }

  function drawPause(c) {
    c.save();
    dim(c, 0.6);
    c.textAlign = 'center';
    c.fillStyle = '#ffc53d';
    c.font = 'bold 64px system-ui, sans-serif';
    c.fillText('PAUSED', CFG.W / 2, 320);
    c.fillStyle = '#fff8e7';
    c.font = '24px system-ui, sans-serif';
    c.fillText('Press P / Esc / click to resume', CFG.W / 2, 372);
    c.restore();
  }

  function drawSummary(c, state) {
    c.save();
    dim(c, 0.75);
    panel(c, 340, 110, 600, 480);
    c.textAlign = 'center';
    c.fillStyle = '#241a12';
    c.font = 'bold 34px system-ui, sans-serif';
    c.fillText('Night ' + state.night + ' complete!', CFG.W / 2, 180);
    c.font = '22px system-ui, sans-serif';
    c.fillText('Dishes served: ' + state.served + '   •   Orders lost: ' + state.lost, CFG.W / 2, 230);
    c.fillText('Night score: ' + state.nightScore + '   •   Total score: ' + state.score, CFG.W / 2, 266);
    c.font = 'bold 44px system-ui, sans-serif';
    c.fillStyle = '#ffc53d';
    var stars = '';
    for (var i = 0; i < 3; i++) stars += state.starsEarned > i ? '★' : '☆';
    c.fillText(stars, CFG.W / 2, 330);
    c.fillStyle = '#241a12';
    c.font = '22px system-ui, sans-serif';
    c.fillText(state.night < 5 ? 'The next night gets busier!' : 'That was the last night — see your final result!', CFG.W / 2, 380);
    var a = 0.6 + 0.4 * Math.sin(performance.now() / 300);
    c.fillStyle = 'rgba(36,26,18,' + a.toFixed(3) + ')';
    c.font = 'bold 24px system-ui, sans-serif';
    c.fillText(state.night < 5 ? 'Click / Enter — Night ' + (state.night + 1) : 'Click / Enter — Final Result', CFG.W / 2, 450);
    c.restore();
  }

  function drawEnd(c, state) {
    c.save();
    c.fillStyle = CFG.palette.night;
    c.fillRect(0, 0, CFG.W, CFG.H);
    art.drawLantern(c, 200, 100, 30, '#e5484d', true);
    art.drawLantern(c, 1080, 100, 30, '#f59e0b', true);
    c.textAlign = 'center';
    c.fillStyle = '#ffc53d';
    c.font = 'bold 64px system-ui, sans-serif';
    c.fillText(state.score >= 1500 ? 'LEGENDARY STALL!' : 'STALL CLOSED', CFG.W / 2, 240);
    c.fillStyle = '#fff8e7';
    c.font = '26px system-ui, sans-serif';
    c.fillText('5 nights done. Final score: ' + state.score, CFG.W / 2, 300);
    c.fillText('Best score: ' + Math.max(state.best, state.score), CFG.W / 2, 340);
    c.font = '20px system-ui, sans-serif';
    c.fillText('Click / Enter to play again', CFG.W / 2, 420);
    c.restore();
  }

  window.WK = window.WK || {};
  window.WK.scenes = {
    drawTitle: drawTitle,
    drawHelp: drawHelp,
    drawPause: drawPause,
    drawSummary: drawSummary,
    drawEnd: drawEnd
  };
})();
