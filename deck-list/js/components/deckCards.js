import React from 'react';
import DeckCard from "./deckCard";


export default class DeckCards extends React.Component {
  render() {
    const cards = this.props.decks.map(deck =>
      <DeckCard deck={deck} selectedDecks={this.props.selectedDecks} deckCheckboxToggle={this.props.deckCheckboxToggle}/>
    )
    return (
      <div>
        {cards}
      </div>
    )
  }
}
