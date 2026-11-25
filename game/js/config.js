// config.js — constants, palette, dishes, nights, and tuning for Warung Kilat.
// Single responsibility: every number and name the game uses lives here.
// UI labels are English; dish names stay Indonesian for flavour.

(function () {
  'use strict';

  var W = 1280; // logical playfield width
  var H = 720;  // logical playfield height

  var CFG = {
    W: W,
    H: H,
    // Layout bands (logical px)
    boardY: 0, boardH: 132,          // order ticket rail
    counterY: 150, counterH: 250,    // bins + stations band
    plateY: 420, plateH: 170,        // assembly plate band
    hudY: 606, hudH: 114,            // bottom hints / score strip
    // Night lengths (seconds)
    nightSeconds: [90, 100, 110, 120, 120],
    // Orders
    maxTickets: 5,
    patienceSeconds: 55,             // base patience per ticket
    orderGapSeconds: [7, 6, 5, 4, 4], // seconds between new orders per night
    // Grill / wok / board cook times (seconds)
    cookSeconds: { grill: 4, wok: 3, board: 2, steamer: 2 },
    burnSeconds: 6,                  // seconds after done before a grilled item burns
    // Scoring
    baseServe: 100,
    tipPerSecondLeft: 2,             // bonus per second of patience left
    comboStep: 0.25,                 // +25% per combo level, cap 2x
    comboCap: 2,
    vipMultiplier: 2,
    lostOrderPenalty: 25,
    trashPenalty: 5,
    // Stars per night (score thresholds)
    starThresholds: [300, 600, 1000],
    // Colours
    palette: {
      night: '#160b2e',      // deep violet night sky
      stall: '#2a1450',      // stall awning purple
      awningRed: '#e5484d',
      awningCream: '#fff3d6',
      counter: '#7a4a21',    // wooden counter
      counterTop: '#a06a35',
      counterDark: '#5d3a1a',
      plate: '#f5efe0',
      gold: '#ffc53d',
      cream: '#fff8e7',
      ink: '#241a12',
      green: '#4ade80',
      red: '#ef4444',
      amber: '#f59e0b',
      teal: '#2dd4bf',
      pink: '#f472b6'
    }
  };

  // Ingredients: id, English name, short label, key, colour, station needed
  // (null = ready to plate). Dish names stay Indonesian for flavour.
  var INGREDIENTS = [
    { id: 'rice',     name: 'Rice',           short: 'Rice',     key: '1', color: '#f5efe0', station: 'steamer' },
    { id: 'skewer',   name: 'Chicken skewers', short: 'Skewers', key: '2', color: '#d97706', station: 'grill' },
    { id: 'egg',      name: 'Egg',            short: 'Egg',      key: '3', color: '#fde68a', station: 'wok' },
    { id: 'tempeh',   name: 'Tempeh',         short: 'Tempeh',   key: '4', color: '#b45309', station: 'board' },
    { id: 'cucumber', name: 'Cucumber',       short: 'Cucumber', key: '5', color: '#4ade80', station: null },
    { id: 'tomato',   name: 'Tomato',         short: 'Tomato',   key: '6', color: '#ef4444', station: null },
    { id: 'sambal',   name: 'Sambal',         short: 'Sambal',   key: '7', color: '#dc2626', station: null },
    { id: 'shallot',  name: 'Fried shallots', short: 'Shallots', key: '8', color: '#fbbf24', station: null }
  ];

  // Stations: id, English name, key, cook time, colour
  var STATIONS = [
    { id: 'steamer', name: 'Steamer',        key: 'R', seconds: 2, color: '#7dd3fc' },
    { id: 'grill',   name: 'Grill',          key: 'Q', seconds: 4, color: '#f97316' },
    { id: 'wok',     name: 'Wok',            key: 'W', seconds: 3, color: '#facc15' },
    { id: 'board',   name: 'Chopping board', key: 'E', seconds: 2, color: '#a3e635' }
  ];

  // Dishes: each is an ordered list of ingredient ids (after prep).
  // A cooked ingredient is named '<id>_cooked' (e.g. 'skewer_cooked').
  // Dish names stay Indonesian for flavour.
  var DISHES = [
    { id: 'nasi-goreng', name: 'Nasi Goreng', price: 100,
      layers: ['rice_cooked', 'egg_cooked', 'cucumber', 'sambal', 'shallot'] },
    { id: 'sate-ayam', name: 'Sate Ayam', price: 120,
      layers: ['skewer_cooked', 'skewer_cooked', 'tomato', 'sambal', 'shallot'] },
    { id: 'nasi-telur', name: 'Nasi Telur', price: 90,
      layers: ['rice_cooked', 'egg_cooked', 'tempeh_cooked', 'tomato', 'shallot'] },
    { id: 'tempeh-sambal', name: 'Tempeh Sambal', price: 80,
      layers: ['tempeh_cooked', 'sambal', 'cucumber', 'tomato', 'shallot'] },
    { id: 'gado-gado', name: 'Gado-Gado', price: 110,
      layers: ['tempeh_cooked', 'cucumber', 'tomato', 'egg_cooked', 'sambal'] }
  ];

  // Which dishes are unlocked each night (index into DISHES)
  var NIGHT_DISHES = [
    [0, 2],
    [0, 1, 2],
    [0, 1, 2, 3],
    [0, 1, 2, 3, 4],
    [0, 1, 2, 3, 4]
  ];

  // Display name for a (possibly cooked) ingredient id, in English.
  function ingredientName(id) {
    var base = id.replace('_cooked', '');
    for (var i = 0; i < INGREDIENTS.length; i++) {
      if (INGREDIENTS[i].id === base) {
        if (id.indexOf('_cooked') !== -1) {
          if (base === 'rice') return 'Steamed rice';
          if (base === 'skewer') return 'Grilled skewers';
          if (base === 'egg') return 'Fried egg';
          if (base === 'tempeh') return 'Fried tempeh';
        }
        return INGREDIENTS[i].name;
      }
    }
    return id;
  }

  // Colour for a (possibly cooked) ingredient id
  function ingredientColor(id) {
    var base = id.replace('_cooked', '');
    for (var i = 0; i < INGREDIENTS.length; i++) {
      if (INGREDIENTS[i].id === base) return INGREDIENTS[i].color;
    }
    return '#cccccc';
  }

  window.WK = window.WK || {};
  window.WK.config = CFG;
  window.WK.INGREDIENTS = INGREDIENTS;
  window.WK.STATIONS = STATIONS;
  window.WK.DISHES = DISHES;
  window.WK.NIGHT_DISHES = NIGHT_DISHES;
  window.WK.ingredientName = ingredientName;
  window.WK.ingredientColor = ingredientColor;
})();
