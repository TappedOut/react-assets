/*
* General utils
*/

import Rusha from 'rusha';


export function slugify(text)
{
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-_]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

export function get_card_id(card, board) {
  const hash = Rusha.createHash();

  hash.update(`b-${board || 'main'}`);

  if (card.condition && card.condition !== 'NM')
    hash.update(`condition-${slugify(card.condition)}`);

  if (card.foil)
    hash.update(`foil-${slugify(card.foil === true ? 'foil' : card.foil)}`);

  if (card.language && card.language.toUpperCase() !== 'EN')
    hash.update(`language-${slugify(card.language)}`);

  if (card.need_qty && card.need_qty !== 0)
    hash.update(`need_qty-${slugify(card.need_qty)}`);

  if (card.tla) hash.update(`tla-${card.tla}`);

  if (card.variation) hash.update(`var-${card.variation}`);

  if (card.alter_pk) hash.update(`alter-${card.alter_pk}`);

  if (card.alt_mana_cost) hash.update(`alt-mc-${card.alt_mana_cost}`);

  if (card.alt_cmc) hash.update(`alt-cmc-${card.alt_cmc}`);

  if (card.alt_color) hash.update(`alt-color-${card.alt_color}`);

  if (card.alt_rarity) hash.update(`alt-rarity-${card.alt_rarity}`);

  if (card.categories && card.categories.length > 0) {
    card.categories.sort();
    hash.update(slugify(card.categories.sort().join('-')))
  }

  hash.update(`token-${slugify(card.name)}`);

  return hash.digest('hex');
}