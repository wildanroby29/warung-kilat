// rng.js — seeded random number generator so a seed reproduces a game.
// Single responsibility: deterministic randomness and small helpers.

(function () {
  'use strict';

  // mulberry32: a tiny fast seeded PRNG.
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function RNG(seed) {
    this.next = mulberry32(seed);
  }
  RNG.prototype.float = function () { return this.next(); };
  RNG.prototype.int = function (min, max) {
    return min + Math.floor(this.next() * (max - min + 1));
  };
  RNG.prototype.pick = function (arr) {
    return arr[Math.floor(this.next() * arr.length)];
  };
  RNG.prototype.chance = function (p) { return this.next() < p; };
  RNG.prototype.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(this.next() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };

  window.WK = window.WK || {};
  window.WK.RNG = RNG;
})();
