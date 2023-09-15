import React from 'react';
import {Modal, Button, Checkbox, FormGroup, InputGroup, FormControl} from 'react-bootstrap';
import _ from "lodash";
import Select from 'react-select';


export default class Filters extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false
    }
  }

  handleModalClose = () => {
    this.setState({showModal: false});
    this.props.modalCloseCB();
  }

  handleModalShow = () => {
    this.setState({showModal: true});
  }

  handleInputChange = (event) => {
    const target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    this.props.filterChange(name, value)
  }

  handleSelectChange = (name, selected) => {
    let value = ''
    if (selected) {
      value = Array.isArray(selected) ? selected.map(v => {
        return v['value']
      }) : selected['value'];
    }
    this.props.filterChange(name, value)
  }

  handleFormatToggle = (format) => {
    let formats = {...this.props.filters.formats}
    formats[format] = !this.props.filters.formats[format]
    this.props.filterChange('formats', formats)
  }

  handleColorToggle = (color) => {
    let colors = {...this.props.filters.colors}
    if (this.props.filters.colors[color] === 0) {
      colors[color] = 1
    } else if (this.props.filters.colors[color] === 1) {
      colors[color] = -1
    } else {
      colors[color] = 0
    }
    this.props.filterChange('colors', colors)
  }

  render() {
    let formatCheckboxes = _.keys(this.props.filters.formats).map(formatName => {
      return (
        <div className="col-lg-3 col-xs-6">
          <Checkbox
            onChange={() => this.handleFormatToggle(formatName)}
            checked={this.props.filters.formats[formatName]}
          >{formatName}</Checkbox>
        </div>
      )
    })
    let colorCheckboxes = _.keys(this.props.filters.colors).map(color => {
      let icon = 'minus'
      let icon_color = 'white'
      if (this.props.filters.colors[color] === 1) {
        icon = 'ok'
        icon_color = 'green'
      } else if (this.props.filters.colors[color] === -1) {
        icon = 'remove'
        icon_color = 'red'
      }
      return (
        <div className="col-lg-4 col-xs-4">
          <div className="form-group">
            <button onClick={() => this.handleColorToggle(color)} className="btn btn-sm btn-default btn-block" disabled={this.props.disableInputs}>
              <i className={`ms ms-${color} ms-cost ms-shadow ms-1point2x`}></i>&nbsp;&nbsp;
              <span style={{'color': icon_color}} className={`glyphicon glyphicon-${icon}`} aria-hidden="true"></span>
            </button>
          </div>
        </div>
      )
    })
    return (
      <div className="row">
        <div className="col-lg-6 col-xs-12">
          <div className="well">
            <div className="row">
              <div className="col-lg-6 col-md-6 col-xs-12">
                {colorCheckboxes}
              </div>
              <div className="col-lg-6 col-md-6 col-xs-12">
                <FormGroup>
                  <InputGroup>
                    <FormControl placeholder="Search" name="name" type="text" className="form-control" onChange={this.handleInputChange} value={this.props.filters.name} disabled={this.props.disableInputs}/>
                    <InputGroup.Button>
                      <Button bsStyle="info" onClick={this.handleModalShow}><span className="glyphicon glyphicon-filter" aria-hidden="true"></span></Button>
                      <Button bsStyle="danger" onClick={this.props.resetFilters}><span className="glyphicon glyphicon-remove" aria-hidden="true"></span></Button>
                    </InputGroup.Button>
                  </InputGroup>
                </FormGroup>
                <Modal bsSize="lg" show={this.state.showModal} onHide={this.handleModalClose}>
                  <Modal.Body>
                    <div className="row">
                      {formatCheckboxes}
                    </div>
                    <div className="row">
                      <div className="col-lg-12 col-md-12 col-xs-12">
                        <div className="form-group">
                          <div className="row">
                            <div className="col-lg-5 col-xs-5"><input placeholder="Price from" name="price_from" type="number" className="form-control" onChange={this.handleInputChange} value={this.props.filters.price_from} /></div>
                            <div className="col-lg-2 col-xs-2">-</div>
                            <div className="col-lg-5 col-xs-5"><input placeholder="Price to" name="price_to" type="number" className="form-control" onChange={this.handleInputChange} value={this.props.filters.price_to} /></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-12 col-xs-12">
                        <div className="form-group">
                          <div className="row">
                            <div className="col-lg-5 col-xs-5"><input placeholder="Mana value from" name="cmc_from" type="text" className="form-control" onChange={this.handleInputChange} value={this.props.filters.cmc_from} /></div>
                            <div className="col-lg-2 col-xs-2">-</div>
                            <div className="col-lg-5 col-xs-5"><input placeholder="Mana value to" name="cmc_to" type="text" className="form-control" onChange={this.handleInputChange} value={this.props.filters.cmc_to} /></div>
                            </div>
                          </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-6 col-xs-12">
                        <div className="form-group">
                            <Select
                              name="rarity"
                              placeholder="Rarity"
                              onChange={(v) => this.handleSelectChange('rarity', v)}
                              value={this.props.filters.rarity}
                              options={this.props.choices.rarity_opts}
                            />
                          </div>
                      </div>
                      <div className="col-lg-6 col-xs-12">
                        <div className="form-group">
                          <input placeholder="Mana cost" name="mana_cost" value={this.props.filters.mana_cost} className="form-control" onChange={this.handleInputChange}/>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-6 col-xs-12">
                        <div className="form-group">
                          <Select
                            name="type"
                            placeholder="Type"
                            onChange={(v) => this.handleSelectChange('type', v)}
                            value={this.props.filters.type}
                            options={this.props.choices.type_opts}
                          />
                        </div>
                      </div>
                      <div className="col-lg-6 col-xs-12">
                        <div className="form-group">
                          <input placeholder="Subtype" name="subtype" value={this.props.filters.subtype} className="form-control" onChange={this.handleInputChange}/>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-6 col-xs-12">
                        <input placeholder="Rules" name="rules" value={this.props.filters.rules} className="form-control" onChange={this.handleInputChange}/>
                      </div>
                      <div className="col-lg-6 col-xs-12">
                        <div className="form-group">
                          <Select
                            name="companion"
                            placeholder="Companion"
                            onChange={(v) => this.handleSelectChange('companion', v)}
                            value={this.props.filters.companion}
                            options={this.props.choices.companion_opts}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-6 col-xs-12">
                        <div className="form-group">
                          <Select
                            name="keywords"
                            placeholder="Keywords"
                            onChange={(v) => this.handleSelectChange('keywords', v)}
                            value={this.props.filters.keywords}
                            options={this.props.choices.kw_opts}
                            multi={true}
                          />
                        </div>
                      </div>
                    </div>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={this.handleModalClose}>
                      Confirm
                    </Button>
                  </Modal.Footer>
                </Modal>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}