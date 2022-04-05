import React from 'react';
import CardImage from './cardImage.js'


export default class CardImages extends React.Component {
  handlePriceClick = (vendor, spec) => {
    const url = spec[this.props.choices.vendor_url[vendor]];
    if (url) {
      const link = `${url}${this.props.choices.vendor_param[vendor]}`
      window.open(link, "_blank")
    }
  }
  render() {
    const images = this.props.specs.map(spec =>
      <CardImage spec={spec} width={this.props.width} backsides={this.props.backsides} rank_label={this.props.rank_label} />
    )
    return (
      <div style={{"display": "flex", "flex-wrap": "wrap"}}>
        {images}
      </div>
    )
  }
}
