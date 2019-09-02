_ = require('lodash');

const COLORS = {
  'W': 'White',
  'U': 'Blue',
  'B': 'Black',
  'R': 'Red',
  'G': 'Green',
  'O': 'Gold',
  'L': 'Colorless',
  'C': 'Colorless'
};

const COLOR_KEYS = Object.keys(COLORS);

const COLOR_HEX_MAP = {
    'W': '#FFFFFF',
    'U': '#361ED6',
    'B': '#000000',
    'R': '#820A03',
    'G': '#00AB48',
    'O': '#FFE87C',
    'L': '#817679',
    'C': '#817679'
};

function groupColor(cards, additive) {
  let result = {};
  cards.forEach((card) => {
    _.forEach(card.cost, function(s){
      let added = [];
      s = s.toUpperCase();
      if (COLOR_KEYS.indexOf(s) > -1 && !(added.indexOf(s) > -1)) {
        if (result[s]) {
          result[s] += card.qty;
          if (!additive) added.push(s)
        } else {
          result[s] = card.qty;
          if (!additive) added.push(s)
        }
      }
    })
  });
  return result
}

export function buildColorSeries(deck) {
  let result = [];

  let cards = deck.filter(
    (card) => card.reg_mana_cost
  ).map((card) => {return {cost: card.reg_mana_cost, qty: card.qty}});

  let costs = groupColor(cards, true);

  COLOR_KEYS.forEach((c) => {
    if (costs.hasOwnProperty(c)) {
      result.push({name: COLORS[c], y:costs[c], color: COLOR_HEX_MAP[c]})
    }
  });
  return result
}

export function buildLandColorSeries(deck){
  let result = [];

  let lands = deck.filter(
    (card) => card.is_land && card.mana_produced && !card.tap_land
  ).map((card) => {return {cost: card.mana_produced, qty: card.qty}});
  let slowLands = deck.filter(
    (card) => card.is_land && card.mana_produced && card.tap_land
  ).map((card) => {return {cost: card.mana_produced, qty: card.qty}});

  let regProduced = groupColor(lands);
  let slowProduced = groupColor(slowLands);

  COLOR_KEYS.forEach((c) => {
    if (regProduced.hasOwnProperty(c)) {
      result.push({name: COLORS[c], y:regProduced[c], color: COLOR_HEX_MAP[c]})
    }
    if (slowProduced.hasOwnProperty(c)) {
      result.push({name: COLORS[c] + ' (slow)', y:regProduced[c], color: COLOR_HEX_MAP[c]})
    }
  });
  return result
}

export function buildTypeSeries(deck){
  let result = [];
  let types = {};
  deck.forEach((card) => {
    let type = card.cannonical_type;
    if (!type) type = 'Unknown';
    if (types[type]) {
      types[type] += card.qty;
    } else {
      types[type] = card.qty;
    }
  });
  Object.keys(types).forEach(
    (type) => {result.push([type, types[type]])}
  );
  return result
}

export function buildCurveSeries(deck){
  deck = deck.filter(
    (card) => !card.is_basic_land &&
      card.cannonical_type !== 'Land' &&
      card.mana_cost_converted !== undefined
  );
  let result = [];
  let color_hex = [];
  let range = [];
  let costs = {
    'W': [],
    'U': [],
    'B': [],
    'R': [],
    'G': [],
    'O': [],
    'L': [],
    'C': []
  };
  deck.forEach((card) => {
    let cost = card.mana_cost_converted;
    let card_colors = card.reg_effective_cost ? card.reg_effective_cost : card.effective_cost;
    let color = card_colors.length ? card_colors.length === 1 ? card_colors[0] : 'O' : 'L';
    if (costs[color].length >= cost + 1 ) {
      costs[color][cost] = costs[color][cost] + card.qty
    } else {
      while (costs[color].length < cost + 1) {
        costs[color].push(0)
      }
      costs[color][cost] = costs[color][cost] + card.qty
    }
    while (range.length < cost) {
      range.push(range.length)
    }
  });
  Object.keys(costs).forEach(
    (color) => {
      if (costs[color].length) {
        result.push({name: COLORS[color], data: costs[color]});
        color_hex.push(COLOR_HEX_MAP[color])
      }

    }
  );
  return [range, result, color_hex]
}