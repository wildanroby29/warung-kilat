// plate.js — the assembly plate: layers, targeting, serving.
// Single responsibility: building a dish layer by layer and checking it.

(function () {
  'use strict';

  // The plate holds an ordered list of ingredient ids.
  function makePlate() {
    return { layers: [], wrong: false };
  }

  function clearPlate(plate) {
    plate.layers.length = 0;
    plate.wrong = false;
  }

  // Add an item to the plate for the targeted dish.
  // Returns 'ok' (right next layer), 'wrong' (not the next layer), or 'burnt'.
  function addLayer(plate, dish, itemId) {
    if (itemId === 'burnt') return 'burnt';
    var next = window.WK.recipes.nextLayer(dish, plate.layers);
    plate.layers.push(itemId);
    if (next === null) { plate.wrong = true; return 'wrong'; }
    if (itemId === next) {
      // Re-check the whole plate: a wrong layer anywhere spoils it.
      var good = window.WK.recipes.matchingPrefix(dish, plate.layers) === plate.layers.length;
      plate.wrong = !good;
      return good ? 'ok' : 'wrong';
    }
    plate.wrong = true;
    return 'wrong';
  }

  // True when the plate is complete and correct for the targeted dish.
  function isReady(plate, dish) {
    return !plate.wrong && window.WK.recipes.plateMatches(dish, plate.layers);
  }

  window.WK = window.WK || {};
  window.WK.plate = {
    makePlate: makePlate,
    clearPlate: clearPlate,
    addLayer: addLayer,
    isReady: isReady
  };
})();
