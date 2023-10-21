import React from 'react';
import DeckCard from "./deckCard";


export default class DeckCards extends React.Component {
  render() {
    const cards = this.props.decks.map(deck =>
      <DeckCard deck={deck} selectedDecks={this.props.selectedDecks} deckCheckboxToggle={this.props.deckCheckboxToggle} canEdit={this.props.canEdit}
                isMobile={this.props.isMobile} />
    )
    return (
      <div style={{'display': 'grid', 'grid-template-columns': 'repeat(auto-fill,minmax(250px, 1fr))', 'gap': '0 20px'}}>
        {cards}
      </div>
    )
  }
}
