// orders.js — order ticket generator, patience, and ticket state.
// Single responsibility: what customers order and how long they wait.

(function () {
  'use strict';

  var CFG = window.WK.config;

  function makeTicket(rng, night, id) {
    var dishes = window.WK.recipes.dishesForNight(night);
    var dish = rng.pick(dishes);
    var patience = CFG.patienceSeconds * (0.9 + rng.float() * 0.25);
    return {
      id: id,
      dishId: dish.id,
      dishName: dish.name,
      layers: dish.layers.slice(),
      patience: patience,
      patienceMax: patience,
      variant: rng.int(0, 4),
      vip: rng.chance(0.12),
      bobPhase: rng.float() * Math.PI * 2,
      served: false
    };
  }

  // Patience drains; returns true when the ticket just expired.
  function tickTicket(t, dt, rush) {
    if (t.served) return false;
    var rate = rush ? 1.6 : 1;
    t.patience -= dt * rate;
    return t.patience <= 0;
  }

  function patienceFrac(t) {
    return Math.max(0, t.patience / t.patienceMax);
  }

  window.WK = window.WK || {};
  window.WK.orders = {
    makeTicket: makeTicket,
    tickTicket: tickTicket,
    patienceFrac: patienceFrac
  };
})();
