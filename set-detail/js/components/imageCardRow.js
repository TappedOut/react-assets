import React from 'react';


export default class ImageCardRow extends React.Component {
  handlePriceClick = (vendor, spec) => {
    const url = spec[this.props.choices.vendor_url[vendor]];
    if (url) {
      const link = `${url}${this.props.choices.vendor_param[vendor]}`
      window.open(link, "_blank")
    }
  }
  render() {
    let font_size = '12px'
    if (this.props.width < 160) {
      font_size = '10px'
    }
    if (this.props.width < 100) {
      font_size = '8px'
    }
    const images = this.props.specs.map(spec =>
      <div style={{'width': this.props.width, 'max-width': this.props.width, 'display': 'inline-block', 'margin-right': '15px'}}>
        <a href={spec.url}><img className="img-responsive" src={spec.image_large} style={{'width': this.props.width}} /></a>
        <table style={{'background-color': 'black', 'font-size': font_size}} className="table table-bordered">
          <tr style={{'border': '1px solid #ddd'}}>
            <td onClick={() => this.handlePriceClick('TCG', spec)} style={{"text-align": "center", "width":"60%", "cursor": "pointer"}}>TCG Market Price</td>
            <td onClick={() => this.handlePriceClick('TCG', spec)} style={{"text-align": "center", "width":"40%", "cursor": "pointer"}}>${spec.tcg_market_price}</td>
          </tr>
          <tr style={{'border': '1px solid #ddd'}}>
            <td onClick={() => this.handlePriceClick('CK', spec)} style={{"text-align": "center", "width":"60%", "cursor": "pointer"}}>Card Kingdom</td>
            <td onClick={() => this.handlePriceClick('CK', spec)} style={{"text-align": "center", "width":"40%", "cursor": "pointer"}}>${spec.ck_price}</td>
          </tr>
        </table>
      </div>
    )
    return (
      <div>
        {images}
      </div>
    )
  }
}
