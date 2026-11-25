// scenes.js — title, help, pause, summary and end screens.
// Single responsibility: drawing the non-play overlays and their buttons.

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
    c.fillText('Warung makan pasar malam — masak cepat, saji tepat!', CFG.W / 2, 312);
    c.font = '20px system-ui, sans-serif';
    c.fillStyle = '#fbbf24';
    c.fillText('5 malam • 5 hidangan • pelanggan tidak sabar menunggu', CFG.W / 2, 348);
    // start prompt (pulsing)
    var a = 0.6 + 0.4 * Math.sin(t * 4);
    c.fillStyle = 'rgba(255,248,231,' + a.toFixed(3) + ')';
    c.font = 'bold 26px system-ui, sans-serif';
    c.fillText('Klik atau tekan Enter untuk buka warung', CFG.W / 2, 430);
    c.fillStyle = '#fff8e7';
    c.font = '18px system-ui, sans-serif';
    c.fillText('1-8 bahan  •  Q/W/E/R stasiun  •  Space antar  •  X buang  •  P jeda  •  H bantuan', CFG.W / 2, 480);
    c.fillText('Skor terbaik: ' + state.best, CFG.W / 2, 516);
    c.restore();
  }

  function drawHelp(c) {
    c.save();
    dim(c, 0.7);
    panel(c, 240, 90, 800, 540);
    c.fillStyle = '#241a12'; c.textAlign = 'left';
    c.font = 'bold 30px system-ui, sans-serif';
    c.fillText('Cara Bermain', 280, 150);
    c.font = '19px system-ui, sans-serif';
    var lines = [
      '1. Pesanan muncul di papan atas. Klik tiket untuk memilih pesanan yang dikerjakan.',
      '2. Klik bak bahan (1-8) atau tekan angka untuk mengambil bahan.',
      '3. Bahan mentah harus dimasak: Sate → Panggangan (Q), Telur → Wajan (W),',
      '    Tempeh → Talenan (E), Nasi → Kukusan (R). Tunggu sampai SIAP, lalu ambil.',
      '4. Klik piring untuk menyusun lapisan sesuai urutan pesanan.',
      '    Garis putus-putus menunjukkan lapisan berikutnya.',
      '5. Kalau piring sudah sama persis dengan pesanan, piring menyala READY.',
      '    Tekan Space / Enter atau klik lonceng untuk mengantar.',
      '6. Jangan biarkan sate gosong di panggangan! Buang dengan X kalau gosong.',
      '7. Sabar pelanggan menipis — antar cepat untuk tip besar dan kombo.',
      '',
      'Kontrol: 1-8 bahan • Q/W/E/R stasiun • Space antar • X buang • P jeda • M bisu'
    ];
    for (var i = 0; i < lines.length; i++) c.fillText(lines[i], 280, 190 + i * 30);
    c.fillStyle = '#6b4a2a';
    c.font = 'bold 20px system-ui, sans-serif';
    c.fillText('Tekan H / Esc / klik untuk kembali', 280, 190 + lines.length * 30 + 10);
    c.restore();
  }

  function drawPause(c) {
    c.save();
    dim(c, 0.6);
    c.textAlign = 'center';
    c.fillStyle = '#ffc53d';
    c.font = 'bold 64px system-ui, sans-serif';
    c.fillText('JEDA', CFG.W / 2, 320);
    c.fillStyle = '#fff8e7';
    c.font = '24px system-ui, sans-serif';
    c.fillText('Tekan P / Esc / klik untuk lanjut', CFG.W / 2, 372);
    c.restore();
  }

  function drawSummary(c, state) {
    c.save();
    dim(c, 0.75);
    panel(c, 340, 110, 600, 480);
    c.textAlign = 'center';
    c.fillStyle = '#241a12';
    c.font = 'bold 34px system-ui, sans-serif';
    c.fillText('Malam ' + state.night + ' selesai!', CFG.W / 2, 180);
    c.font = '22px system-ui, sans-serif';
    c.fillText('Hidangan diantar: ' + state.served + '   •   Pesanan hilang: ' + state.lost, CFG.W / 2, 230);
    c.fillText('Skor malam ini: ' + state.nightScore + '   •   Skor total: ' + state.score, CFG.W / 2, 266);
    c.font = 'bold 44px system-ui, sans-serif';
    c.fillStyle = '#ffc53d';
    var stars = '';
    for (var i = 0; i < 3; i++) stars += state.starsEarned > i ? '★' : '☆';
    c.fillText(stars, CFG.W / 2, 330);
    c.fillStyle = '#241a12';
    c.font = '22px system-ui, sans-serif';
    c.fillText(state.night < 5 ? 'Malam berikutnya makin ramai!' : 'Itu malam terakhir — lihat hasil akhirmu!', CFG.W / 2, 380);
    var a = 0.6 + 0.4 * Math.sin(performance.now() / 300);
    c.fillStyle = 'rgba(36,26,18,' + a.toFixed(3) + ')';
    c.font = 'bold 24px system-ui, sans-serif';
    c.fillText(state.night < 5 ? 'Klik / Enter — Malam ' + (state.night + 1) : 'Klik / Enter — Hasil Akhir', CFG.W / 2, 450);
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
    c.fillText(state.score >= 1500 ? 'WARUNG LEGENDA!' : 'WARUNG TUTUP', CFG.W / 2, 240);
    c.fillStyle = '#fff8e7';
    c.font = '26px system-ui, sans-serif';
    c.fillText('5 malam selesai. Skor akhir: ' + state.score, CFG.W / 2, 300);
    c.fillText('Skor terbaik: ' + Math.max(state.best, state.score), CFG.W / 2, 340);
    c.font = '20px system-ui, sans-serif';
    c.fillText('Klik / Enter untuk main lagi', CFG.W / 2, 420);
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
