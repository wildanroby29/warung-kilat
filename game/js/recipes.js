// recipes.js — dish data helpers: matching a plate to a dish, next layer, names.
// Single responsibility: the rules that say what a dish is and when it is done.

(function () {
  'use strict';

  var CFG = window.WK.config;
  var DISHES = window.WK.DISHES;

  function dishById(id) {
    for (var i = 0; i < DISHES.length; i++) if (DISHES[i].id === id) return DISHES[i];
    return null;
  }

  // Dishes available on a given night (1-based).
  function dishesForNight(night) {
    var idx = window.WK.NIGHT_DISHES[Math.max(0, Math.min(4, night - 1))];
    var out = [];
    for (var i = 0; i < idx.length; i++) out.push(DISHES[idx[i]]);
    return out;
  }

  // The next layer a plate needs for a dish, given the layers already placed.
  // Returns the ingredient id, or null when the plate already holds the whole dish.
  function nextLayer(dish, layers) {
    if (!dish) return null;
    if (layers.length >= dish.layers.length) return null;
    return dish.layers[layers.length];
  }

  // True when the plate's layers exactly equal the dish (same items, same order).
  function plateMatches(dish, layers) {
    if (!dish || layers.length !== dish.layers.length) return false;
    for (var i = 0; i < layers.length; i++) {
      if (layers[i] !== dish.layers[i]) return false;
    }
    return true;
  }

  // How many leading layers of the plate agree with the dish (for progress display).
  function matchingPrefix(dish, layers) {
    var n = 0;
    for (var i = 0; i < layers.length && i < dish.layers.length; i++) {
      if (layers[i] === dish.layers[i]) n++;
      else break;
    }
    return n;
  }

  window.WK = window.WK || {};
  window.WK.recipes = {
    dishById: dishById,
    dishesForNight: dishesForNight,
    nextLayer: nextLayer,
    plateMatches: plateMatches,
    matchingPrefix: matchingPrefix
  };
})();
