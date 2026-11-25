// stations.js — the four cooking stations: steamer, grill, wok, chopping board.
// Single responsibility: starting, timing and collecting cooked items.

(function () {
  'use strict';

  var CFG = window.WK.config;

  // A station slot: { id, item, progress, done, burnt }
  function makeStations() {
    var out = [];
    for (var i = 0; i < window.WK.STATIONS.length; i++) {
      out.push({ id: window.WK.STATIONS[i].id, item: null, progress: 0, done: false, burnt: false });
    }
    return out;
  }

  function stationDef(id) {
    for (var i = 0; i < window.WK.STATIONS.length; i++) {
      if (window.WK.STATIONS[i].id === id) return window.WK.STATIONS[i];
    }
    return null;
  }

  // Start cooking a raw ingredient on a station. Returns true when accepted.
  function startCook(slot, rawId) {
    if (slot.item) return false;
    var def = stationDef(slot.id);
    slot.item = rawId;
    slot.progress = 0;
    slot.seconds = def.seconds;
    slot.done = false;
    slot.burnt = false;
    return true;
  }

  // Advance cooking; returns 'done' once, 'burnt' once, else null.
  function tickStation(slot, dt) {
    if (!slot.item || slot.done) {
      if (slot.item && slot.done && !slot.burnt) {
        slot.over += dt;
        if (slot.id === 'grill' && slot.over > CFG.burnSeconds) {
          slot.burnt = true;
          return 'burnt';
        }
      }
      return null;
    }
    slot.progress += dt;
    if (slot.progress >= slot.seconds) {
      slot.done = true;
      slot.over = 0;
      return 'done';
    }
    return null;
  }

  // Collect the finished item; returns the cooked id, 'burnt', or null.
  function collect(slot) {
    if (!slot.item || !slot.done) return null;
    var raw = slot.item;
    slot.item = null; slot.progress = 0; slot.done = false;
    var wasBurnt = slot.burnt; slot.burnt = false; slot.over = 0;
    if (wasBurnt) return 'burnt';
    return raw + '_cooked';
  }

  function progressFrac(slot) {
    if (!slot.item) return 0;
    return Math.min(1, slot.progress / slot.seconds);
  }

  window.WK = window.WK || {};
  window.WK.stations = {
    makeStations: makeStations,
    stationDef: stationDef,
    startCook: startCook,
    tickStation: tickStation,
    collect: collect,
    progressFrac: progressFrac
  };
})();
