// input.js — mouse and keyboard input, converted to logical coordinates.
// Single responsibility: turning clicks and keys into game actions.

(function () {
  'use strict';

  // The canvas element and the scale/offset game.js computes for letterboxing.
  var canvas = null;
  var view = { scale: 1, ox: 0, oy: 0 }; // set by game.js on resize

  function init(c) { canvas = c; }

  function setView(v) { view.scale = v.scale; view.ox = v.ox; view.oy = v.oy; }

  // Convert a client (page) point to logical 1280x720 coordinates.
  function toLogical(clientX, clientY) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left - view.ox) / view.scale,
      y: (clientY - r.top - view.oy) / view.scale
    };
  }

  // Station keys come from the station definitions (Q=grill, W=wok, E=board, R=steamer),
  // so look the index up instead of assuming an order.
  function stationIndex(key) {
    var sts = window.WK.STATIONS || [];
    for (var i = 0; i < sts.length; i++) if (sts[i].key === key) return i;
    return -1;
  }

  // Bind mouse + keyboard to a handler object {onClick(hit), onKey(action)}.
  function bind(handler) {
    canvas.addEventListener('click', function (e) {
      var p = toLogical(e.clientX, e.clientY);
      handler.onClick(p.x, p.y);
    });
    canvas.addEventListener('mousemove', function (e) {
      var p = toLogical(e.clientX, e.clientY);
      if (handler.onMove) handler.onMove(p.x, p.y);
    });
    window.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === ' ' || k === 'Enter') { handler.onKey('serve'); e.preventDefault(); return; }
      if (k >= '1' && k <= '8') { handler.onKey('bin' + (parseInt(k, 10) - 1)); return; }
      var up = k.toUpperCase();
      if (up === 'Q' || up === 'W' || up === 'E' || up === 'R') {
        var idx = stationIndex(up);
        if (idx >= 0) handler.onKey('station' + idx);
        return;
      }
      if (up === 'X') { handler.onKey('trash'); return; }
      if (up === 'P' || k === 'Escape') { handler.onKey('pause'); return; }
      if (up === 'M') { handler.onKey('mute'); return; }
      if (up === 'H') { handler.onKey('help'); return; }
    });
    // Pause when the tab is hidden.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && handler.onHide) handler.onHide();
    });
  }

  window.WK = window.WK || {};
  window.WK.input = { init: init, setView: setView, toLogical: toLogical, bind: bind };
})();
