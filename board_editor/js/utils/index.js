/*
* General utils
*/

import Rusha from 'rusha';


export function slugify(text)
{
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
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

  hash.update(`token-${slugify(card.name)}`);

  return hash.digest('hex');
}