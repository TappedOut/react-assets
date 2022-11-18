import React from 'react';

export default class CardImage extends React.Component {
  render() {
    return (
      <div style={{'margin': '8px 8px 8px 8px', 'cursor': 'pointer', 'display': 'inline-block'}}>
        <img style={{'width': `${this.props.width}px`}} onClick={this.props.handleClick} className="img-responsive" src={this.props.card.image} alt={this.props.card.name}/>
      </div>
    )
  }
}
