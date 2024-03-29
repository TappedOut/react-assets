/*
* Deck grouping functions
*/

_ = require('lodash');


function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.toLowerCase().slice(1);
}


function group_by_parameter(deck, parameter) {
  return _.groupBy(
    _.mapValues(deck,
      card => { return _.pick(card, [parameter, 'cardId']) }),
    parameter
  );
}


function group_by_price(deck) {
  return _.groupBy(
    _.mapValues(deck,
      card => {
        let price = (card.foil ? card.tcg_foil_price : card.tcg_avg_price) || 0.0;

        if (price === 0) {
          return {
            cardId: card.cardId,
            price: "Unknown"
          }
        } else if (price < 2) {
          return {
            cardId: card.cardId,
            price: "Less than $2"
          }
        } else if (price < 5) {
          return {
            cardId: card.cardId,
            price: "$2 - $5"
          }
        } else if (price < 20) {
          return {
            cardId: card.cardId,
            price: "$5 - $20"
          }
        } else if (price < 100) {
          return {
            cardId: card.cardId,
            price: "$20 - $100"
          }
        } else {
          return {
            cardId: card.cardId,
            price: "More than $100"
          }
        }
      }),
    'price'
  )
}


function group_by_multicategories(deck, category, default_category) {
  return _.reduce(deck,
    (acc, card) => {
      if ((card[category] || []).length > 0) {
        _.forEach(card[category] || [],
          (cat) => {
            if (acc.hasOwnProperty(cat)) acc[cat].add(card.cardId);
            else acc[cat] = new Set([card.cardId]);
          }
        );
      } else acc[default_category].add(card.cardId);

      return acc;
    },
    {[default_category]: new Set()}
  )
}


function clean_groups(groups, uppercase=false, unknownKey="Unknown") {
  return _.mapKeys(
    _.mapValues(
      groups,
      (cards) => { return new Set(_.map(cards, 'cardId')) }
    ),
    (value, key) => {
      let resultKey = key !== "null" && key !== "undefined" ? key : unknownKey;
      resultKey = resultKey.replace(/_+/, ' ').trim().split(/\s+/);

      if (uppercase) resultKey = resultKey.map(k => { return k.toUpperCase() });
      else resultKey = resultKey.map(capitalize);

      return resultKey.join(' ');
    }
  )
}


let deck_group = {
  'type': (deck) => { return clean_groups(group_by_parameter(deck, 'cannonical_type')) },
  'subtype': (deck) => { return clean_groups(group_by_parameter(deck, 'subtype'), false, 'No Subtype') },
  'rarity': (deck) => { return clean_groups(group_by_parameter(deck, 'rarity')) },
  'color': (deck) => { return clean_groups(group_by_parameter(deck, 'color_category')) },
  'set': (deck) => { return clean_groups(group_by_parameter(deck, 'cannonial_set'), true) },
  'block': (deck) => { return clean_groups(group_by_parameter(deck, 'latest_block')) },
  'name': () => { return {} },
  'board': () => { return {} },
  'cost': (deck) => { return clean_groups(group_by_parameter(deck, 'mana_value')) },
  'keyword': (deck) => { return group_by_multicategories(deck, 'keywords', 'None') },
  'price': (deck) => { return clean_groups(group_by_price(deck)) },
  'custom': (deck) => { return group_by_multicategories(deck, 'categories', 'Other') }
};


export default deck_group;