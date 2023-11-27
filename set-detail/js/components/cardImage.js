import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { Dropdown, MenuItem } from 'react-bootstrap';


export default class CardImage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      front: true,
      tla: this.props.default_tla ? this.props.default_tla : this.props.spec.tla,
      dropdownOpen: false
    }
  }

  handleDropdownToggle = () => {
    this.setState({dropdownOpen: !this.state.dropdownOpen})
  }

  handleImgToggle = () => {
    this.setState({front: !this.state.front})
  }

  handlePriceClick = (vendor, spec) => {
    const url = spec[this.props.choices.vendor_url[vendor]];
    if (url) {
      const link = `${url}${this.props.choices.vendor_param[vendor]}`
      window.open(link, "_blank")
    }
  }

  changePrinting = (tla) => {
    this.setState({tla: tla})
  }

  getIconClass = (tla) => {
    const new_tla = this.props.choices.set_icon_map[tla]
    if (new_tla) return new_tla
    return tla.toLowerCase()
  }

  renderExtras = (spec) => {
    const front_color = this.state.front ? 'black' : "rgb(76 72 72)"
    const back_color = !this.state.front ? 'black' : "rgb(76 72 72)"
    let font_size = '12px'
    if (this.props.width < 160) {
      font_size = '10px'
    }
    if (this.props.width < 100) {
      font_size = '8px'
    }
    return (
      <div>
      {!!this.props.spec.flip && <div className="btn-group btn-group-xs" style={{"width": "100%", "margin": "3px 0"}}>
          <button onClick={this.handleImgToggle} type="button" className="btn btn-default" disabled={this.state.front} style={{"width": "50%", "background-color": front_color, "color": "white"}}>Frontside</button>
          <button onClick={this.handleImgToggle} type="button" className="btn btn-default" disabled={!this.state.front} style={{"width": "50%", "background-color": back_color, "color": "white"}}>Backside</button>
        </div>}
        <table style={{'background-color': 'black', 'font-size': font_size, 'margin-bottom': '0'}} className="table table-border-bottom">
          {spec.tcg_market_price &&
          <tr>
            <td onClick={() => this.handlePriceClick('TCG', spec)} style={{"text-align": "center", "width":"60%", "cursor": "pointer", "padding": "4px"}}>TCGPlayer</td>
            <td onClick={() => this.handlePriceClick('TCG', spec)} style={{"text-align": "center", "width":"40%", "cursor": "pointer", "padding": "4px"}}>${spec.tcg_market_price}</td>
          </tr>}
          {spec.ck_price &&
          <tr>
            <td onClick={() => this.handlePriceClick('CK', spec)} style={{"text-align": "center", "width":"60%", "cursor": "pointer", "padding": "4px"}}>Card Kingdom</td>
            <td onClick={() => this.handlePriceClick('CK', spec)} style={{"text-align": "center", "width":"40%", "cursor": "pointer", "padding": "4px"}}>${spec.ck_price}</td>
          </tr>}
          {(spec.rank_display && (spec.rank_display !== '--')) &&
          <tr>
            <td style={{"text-align": "center", "width":"60%", "cursor": "pointer", "padding": "4px"}}>{this.props.rank_label}</td>
            <td style={{"text-align": "center", "width":"40%", "cursor": "pointer", "padding": "4px"}}>#{spec.rank_display}</td>
          </tr>}
        </table>
      </div>
    )
  }

  render() {
    let spec = this.props.spec
    let image = spec.image
    if (spec.tla !== this.state.tla) {
      const new_img = spec.printings.find((p) => p.tla === this.state.tla).image
      if (new_img) image = new_img
    }
    if (!this.state.front && this.props.backsides[this.props.spec['flip']] && this.props.backsides[this.props.spec['flip']]['image']) {
      image = ''
      if (spec.tla !== this.state.tla) {
        image = this.props.backsides[this.props.spec['flip']].printings.find((p) => p.tla === this.state.tla).image
      }
      if (!image) {
        image = this.props.backsides[this.props.spec['flip']]['image']
      }
    }
    const printingList = spec.printings.map((p) => <MenuItem onClick={() => this.changePrinting(p.tla)} active={p.tla === this.state.tla}><i className={`fa ss ss-${this.getIconClass(p.tla)} ss-fw`} /> {p.name}</MenuItem>)
    return (
      <div style={{'width': this.props.width, 'max-width': this.props.width, 'display': 'inline-block', 'margin-right': '15px', 'margin-bottom': '20px'}}>
        <a href={spec.url}>
          <LazyLoadImage
            alt={spec.name}
            src={image}
            width={this.props.width}
            className="img-responsive"
          />
        </a>
        <div style={{'display': 'flex', 'background-color': 'black', 'align-items': 'center'}}>
          <div style={{'width': '25%', 'text-align': 'center', 'font-size': '22px'}}>
            <Dropdown isOpen={this.state.dropdownOpen} toggle={this.toggleDropdown}>
              <i style={{'cursor': 'pointer', 'margin-bottom': '5px'}} onClick={this.handleDropdownToggle} data-toggle="dropdown" className={`fa ss ss-${this.getIconClass(this.state.tla)} ss-fw`} />
              <Dropdown.Menu>
                {printingList}
              </Dropdown.Menu>
            </Dropdown>
          </div>
          <div style={{'width': '75%'}}>{this.renderExtras(spec)}</div>
        </div>
      </div>
    )
  }
}