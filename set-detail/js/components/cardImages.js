import React from 'react';
import CardImage from './cardImage.js'


export default class CardImages extends React.Component {
  render() {
    const images = this.props.specs.map(spec =>
      <CardImage default_tla={this.props.default_tla} spec={spec} width={this.props.width} 
                 feedbackCB={this.props.feedbackCB} feedback_enabled={this.props.feedback_enabled}
                 backsides={this.props.backsides} rank_label={this.props.rank_label} choices={this.props.choices}
      />
    )
    return (
      <div style={{"display": "flex", "flex-wrap": "wrap"}}>
        {images}
      </div>
    )
  }
}
