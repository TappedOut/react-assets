import React from 'react';
import { Glyphicon, Well } from 'react-bootstrap';


export default class DeckCard extends React.Component {
  render() {
    const deck = this.props.deck
    return (
      <Well className='deck-card-well' style={{'display': 'flex', 'flex-direction': 'column', 'flex': '1 1 0%', 'min-width': '400px'}} bsSize='small'>
        <div style={{'display': 'flex', 'flex-direction': 'row', 'gap': '10px'}}>
          <div className="deck-card-img-container" style={{'position': 'relative'}}>
            {this.props.canEdit && <input
              type="checkbox"
              onChange={() => this.props.deckCheckboxToggle(deck.id)}
              checked={_.includes(this.props.selectedDecks, deck.id)}
              style={{'position': 'absolute', 'top': '5px', 'left': '5px', 'z-index': '1', 'margin': '0'}}
            />}
            <img className="deck-card-left-img"
                 src={deck.featured}
                 alt="Deck featured img"
            />
          </div>
          <div style={{'white-space': 'nowrap', 'overflow': 'hidden', 'text-overflow': 'ellipsis', 'max-width': '60%'}}>
            <a href={deck.url} style={{'font-size': '18px'}}>{deck.name}</a>
            <div style={{'display': 'flex', 'flex-direction': 'row', 'align-items': 'center'}}>
              <img style={{'height': '75px'}} alt="deck mana pie" src={deck.chart} />
              <div>
                <p>{deck.format}</p>
                <p>{deck.hubs.slice(0, 2).join(' | ')}</p>
              </div>
            </div>
          </div>
        </div>
        <div style={{'display': 'flex', 'flex-direction': 'row', 'justify-content': 'space-between', 'align-items': 'flex-end', 'gap': '10px'}}>
          <div>
            <span className="small-text">
              <span><Glyphicon glyph="arrow-up" /> {deck.score} | </span>
              <span><Glyphicon glyph="comment" /> {deck.comments} | </span>
              <span><Glyphicon glyph="eye-open" /> {deck.views} | </span>
              <span><Glyphicon glyph="folder-open" /> {deck.folder_count} </span>
            </span>
          </div>
          {deck.price && <div>
            <span className="small-text">${deck.price}</span>
          </div>}
          <div>
            <span className="pull-right small-text">Updated {deck.last_update} ago</span>
          </div>
        </div>
      </Well>
    )
  }
}