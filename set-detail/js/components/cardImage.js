import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';


export default class CardImage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      front: true
    }
  }

  handleImgToggle = () => {
    this.setState({front: !this.state.front})
  }

  render() {
    let spec = this.props.spec
    let image = spec.image
    const front_color = this.state.front ? 'black' : "rgb(76 72 72)"
    const back_color = !this.state.front ? 'black' : "rgb(76 72 72)"
    if (!this.state.front && this.props.backsides[this.props.spec['flip']] && this.props.backsides[this.props.spec['flip']]['image']) {
      image = this.props.backsides[this.props.spec['flip']]['image']
    }
    let font_size = '12px'
    if (this.props.width < 160) {
      font_size = '10px'
    }
    if (this.props.width < 100) {
      font_size = '8px'
    }
    return (
      <div style={{'width': this.props.width, 'max-width': this.props.width, 'display': 'inline-block', 'margin-right': '15px'}}>
        <a href={spec.url}>
          <LazyLoadImage
            alt={spec.name}
            src={image}
            width={this.props.width}
            className="img-responsive"
          />
        </a>
        {!!this.props.spec.flip && <div className="btn-group btn-group-xs" style={{"width": "100%", "margin": "3px 0"}}>
          <button onClick={this.handleImgToggle} type="button" className="btn btn-default" disabled={this.state.front} style={{"width": "50%", "background-color": front_color, "color": "white"}}>Frontside</button>
          <button onClick={this.handleImgToggle} type="button" className="btn btn-default" disabled={!this.state.front} style={{"width": "50%", "background-color": back_color, "color": "white"}}>Backside</button>
        </div>}
        <table style={{'background-color': 'black', 'font-size': font_size}} className="table table-bordered">
          {spec.tcg_market_price &&
          <tr style={{'border': '1px solid #ddd'}}>
            <td onClick={() => this.handlePriceClick('TCG', spec)} style={{"text-align": "center", "width":"60%", "cursor": "pointer", "padding": "4px"}}>TCG Market Price</td>
            <td onClick={() => this.handlePriceClick('TCG', spec)} style={{"text-align": "center", "width":"40%", "cursor": "pointer", "padding": "4px"}}>${spec.tcg_market_price}</td>
          </tr>}
          {spec.ck_price &&
          <tr style={{'border': '1px solid #ddd'}}>
            <td onClick={() => this.handlePriceClick('CK', spec)} style={{"text-align": "center", "width":"60%", "cursor": "pointer", "padding": "4px"}}>Card Kingdom</td>
            <td onClick={() => this.handlePriceClick('CK', spec)} style={{"text-align": "center", "width":"40%", "cursor": "pointer", "padding": "4px"}}>${spec.ck_price}</td>
          </tr>}
          {(spec.rank_display && (spec.rank_display !== '--')) &&
          <tr style={{'border': '1px solid #ddd'}}>
            <td style={{"text-align": "center", "width":"60%", "cursor": "pointer", "padding": "4px"}}>{this.props.rank_label}</td>
            <td style={{"text-align": "center", "width":"40%", "cursor": "pointer", "padding": "4px"}}>#{spec.rank_display}</td>
          </tr>}
        </table>
      </div>
    )
  }
}