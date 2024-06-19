import React from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { Dropdown, MenuItem } from 'react-bootstrap';


const possible_alterations = ['f-&', 'f-etch', 'f-list', 'f-oversized', 'f-pp', 'f-pre', 'list', 'oversized', 'pp', 'ser', 'thick']


export default class CardImage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      front: true,
      tla: this.props.default_tla ? this.props.default_tla : this.props.spec.tla,
      dropdownOpen: false
    }
  }

  componentDidUpdate(prevProps) {
    const tla = this.props.default_tla ? this.props.default_tla : this.props.spec.tla
    if (tla && prevProps.default_tla && (tla !== prevProps.default_tla)) {
      this.setState({
        tla: tla
      });
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

  renderExtras = (spec, is_foil) => {
    const front_color = this.state.front ? 'black' : "rgb(76 72 72)"
    const back_color = !this.state.front ? 'black' : "rgb(76 72 72)"
    let font_size = '12px'
    if (this.props.width < 160) {
      font_size = '10px'
    }
    if (this.props.width < 100) {
      font_size = '8px'
    }
    const tcg_price = is_foil && spec.tcg_foil_market_price ? spec.tcg_foil_market_price : spec.tcg_market_price
    const ck_price =  is_foil && spec.ck_foil_price ? spec.ck_foil_price : spec.ck_price
    return (
      <div>
      {!!this.props.spec.flip && <div className="btn-group btn-group-xs" style={{"width": "100%", "margin": "3px 0"}}>
          <button onClick={this.handleImgToggle} type="button" className="btn btn-default" disabled={this.state.front} style={{"width": "50%", "background-color": front_color, "color": "white"}}>Frontside</button>
          <button onClick={this.handleImgToggle} type="button" className="btn btn-default" disabled={!this.state.front} style={{"width": "50%", "background-color": back_color, "color": "white"}}>Backside</button>
        </div>}
        <table style={{'background-color': 'black', 'font-size': font_size, 'margin-bottom': '0'}} className="table table-border-bottom">
          {tcg_price &&
          <tr>
            <td onClick={() => this.handlePriceClick('TCG', spec)} style={{"text-align": "center", "width":"60%", "cursor": "pointer", "padding": "4px"}}>TCGPlayer</td>
            <td onClick={() => this.handlePriceClick('TCG', spec)} style={{"text-align": "center", "width":"40%", "cursor": "pointer", "padding": "4px"}}>${tcg_price}</td>
          </tr>}
          {ck_price &&
          <tr>
            <td onClick={() => this.handlePriceClick('CK', spec)} style={{"text-align": "center", "width":"60%", "cursor": "pointer", "padding": "4px"}}>Card Kingdom</td>
            <td onClick={() => this.handlePriceClick('CK', spec)} style={{"text-align": "center", "width":"40%", "cursor": "pointer", "padding": "4px"}}>${ck_price}</td>
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
    let alteration = ''
    const frameShrinkPercentage = 0.9
    const found_print = spec.printings.find((p) => p.tla === this.state.tla)
    if (found_print.alterations && found_print.alterations.length) {
        alteration = found_print.alterations[0][0]
    }
    if (spec.tla !== this.state.tla) {
      if (found_print) {
        image = found_print.image
      }
    }
    const is_foil = alteration.startsWith('f')
    const special_alteration = possible_alterations.includes(alteration)
    let img_style = {}
    if (special_alteration) {
        img_style = {
            width: `${frameShrinkPercentage * 100}%`, 
            height: 'auto', 
            position: 'absolute', 
            top: '52.2%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)'
        }
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
          <div style={{ position: 'relative', width: '100%', height: 'auto' }}>
            <LazyLoadImage
                alt={spec.name}
                src={image}
                width={this.props.width}
                style={img_style}
                className="img-responsive"
            />
            {alteration === 'f' && 
              <img
                src={window.django.foil_overlay_url}
                alt=""
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none'
                }}
              />
            }
            {special_alteration && 
              <img
                src={`${window.django.alterations_base_url}${alteration}.png`}
                alt="Frame"
                style={{
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none'
                }}
              />
            }
          </div>
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
          <div style={{'width': '75%'}}>{this.renderExtras(spec, is_foil)}</div>
        </div>
      </div>
    )
  }
}