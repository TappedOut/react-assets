import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import {ButtonToolbar, ButtonGroup, Modal, Button} from 'react-bootstrap';
import Slider from 'react-rangeslider';
import '../css/set-detail.scss';
import 'react-rangeslider/lib/index.css';
import CardImages from './components/cardImages.js';
import CardTable from './components/cardTable.js';
import CardList from './components/cardList.js';
import 'react-select/dist/react-select.css';
import Select from 'react-select';
const _ = require('lodash');


const SET_DETAIL_API = window.django.set_specs_api;
const SET_TLA = window.django.tla;


const COLOR_ORDER = {
  'W': 1,
  'U': 2,
  'B': 3,
  'R': 4,
  'G': 5
}


class SetDetailApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      specs: [],
      filtered_specs: [],
      display: 'images',
      vendors: ['tcg'],
      api_error: '',
      show_filters_modal: false,
      order_by: 'name',
      choices: {},
      images_width: 300,
      backsides: {},
      filters: {
        name: '',
        green: false,
        red: false,
        blue: false,
        white: false,
        black: false,
        colorless: false,
        price_from: '',
        price_to: '',
        type: '',
        rarity: '',
        mana_cost: '',
        cmc_from: '',
        cmc_to: '',
        rules: '',
        subtype: '',
        format: '',
        companion: ''
      }
    }
    axios.get(
      SET_DETAIL_API,
    ).then(
      response => {
        let found = [];
        let backsides = {};
        const specs = _.sortBy(response.data.specs.filter((spec) => {
          const duplicate = found.indexOf(spec.name) > -1;
          found.push(spec.name);
          if (spec.flip && !spec.is_front) {
            backsides[spec.name] = spec
            return false
          }
          return !duplicate
        }), (spec) => spec['name']).map((spec) => {
          if (!spec.printings) return spec
          const printing_info = spec.printings.find((p) => {return p.tla === SET_TLA})
          if (!printing_info) return spec
          _.forEach(['image', 'number', 'tcg_market_price', 'ck_price'], (e) => {
            if (printing_info[e]) spec[e] = printing_info[e]
          })
          return spec
        })
        this.setState({
          specs: specs,
          filtered_specs: specs,
          vendors: response.data.vendors,
          choices: response.data.choices,
          backsides: backsides
        })
      },
      error => {
        this.setState({error: 'Error getting card info. Please refresh the page.'})
      }
    )
  }

  get_price = (spec) => {
    return spec['ck_price']
  }

  handleImagesMaxWidth = (value) => {
    this.setState({
      images_width: value
    })
  };

  handleAdvFiltersShow = () => {
    this.setState({show_filters_modal: true})
  };
  handleAdvFiltersHide = () => this.setState({show_filters_modal: false});

  filterSpecs = (filters) => {
    if (Object.values(filters).every(value => !value)) {
      this.changeOrder(this.state.order_by, this.state.specs)
      return
    }
    const filtered = this.state.specs.filter(spec => {
      let keep = true
      const colors = spec['effective_cost'] ? spec['effective_cost'] : []
      if (filters.name){
        keep = keep && spec['name'].toLowerCase().includes(filters.name.toLowerCase())
      }
      if (filters.green){
        keep = keep && colors.indexOf('G') > -1
      }
      if (filters.blue){
        keep = keep && colors.indexOf('U') > -1
      }
      if (filters.white){
        keep = keep && colors.indexOf('W') > -1
      }
      if (filters.red){
        keep = keep && colors.indexOf('R') > -1
      }
      if (filters.black){
        keep = keep && colors.indexOf('B') > -1
      }
      if (filters.colorless){
        keep = keep && colors.length === 0
      }
      if (filters.price_from){
        keep = keep && this.get_price(spec) >= filters.price_from
      }
      if (filters.price_to){
        keep = keep && this.get_price(spec) <= filters.price_to
      }
      if (filters.type){
        keep = keep && spec['type'] === filters.type
      }
      if (filters.rarity){
        keep = keep && spec['rarity'] === filters.rarity
      }
      // TODO: normalize mana_cost
      if (filters.mana_cost){
        const mana_cost = spec['mana_cost'] ? spec['mana_cost'] : '';
        keep = keep && mana_cost.includes(filters.mana_cost)
      }
      if (filters.subtype){
        const subtype = spec['subtype'] ? spec['subtype'] : ''
        keep = keep && subtype.toLowerCase().includes(filters.subtype.toLowerCase())
      }
      if (filters.cmc_from){
        keep = keep && spec['mana_value'] >= filters.cmc_from
      }
      if (filters.cmc_to){
        keep = keep && spec['mana_value'] <= filters.cmc_to
      }
      if (filters.rules){
        const rules = spec['rules'] ? spec['rules'] : ''
        keep = keep && rules.toLowerCase().includes(filters.rules.toLowerCase())
      }
      if (filters.format){
        keep = keep && spec['formats'].indexOf(filters.format) > -1
      }
      if (filters.companion){
        keep = keep && spec['companions'].indexOf(filters.companion) > -1
      }
      return keep
    })
    this.changeOrder(this.state.order_by, filtered)
  }

  resetFilters = () => {
    const empty = {
      name: '',
      green: false,
      red: false,
      blue: false,
      white: false,
      black: false,
      colorless: false,
      price_from: '',
      price_to: '',
      type: '',
      rarity: '',
      mana_cost: '',
      cmc_from: '',
      cmc_to: '',
      rules: '',
      subtype: '',
      format: '',
      companion: ''
    }
    this.setState({filters: empty})
    this.filterSpecs(empty)
  }

  handleInputChange = (event) => {
    const target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    const new_filters = {...this.state.filters, [name]: value}
    this.setState({
      filters: new_filters
    });
    this.filterSpecs(new_filters)
  }

  handleSelectChange = (name, selected) => {
    let value = ''
    if (selected) {
      value = Array.isArray(selected) ? selected.map(v => {
        return v['value']
      }) : selected['value'];
    }
    const new_filters = {...this.state.filters, [name]: value}
    this.setState({
      filters: new_filters,
    });
    this.filterSpecs(new_filters)
  }

  handleOrderChange = (event) => {
    this.setState({order_by: event.target.value})
    this.changeOrder(event.target.value, this.state.filtered_specs)
  }

  handleDisplayChange = (val) => {
    this.setState({display: val})
  }

  changeOrder = (order, specs) => {
    let ordered = _.sortBy(specs, 'name');
    if (order !== 'name') {
      ordered = _.sortBy(ordered, (spec) => {
        if (order === 'color') {
          const colors = spec['effective_cost'] ? spec['effective_cost'] : []
          if (colors.length === 1) {
            return COLOR_ORDER[colors[0]]
          }
          if (colors.length > 1) {
            return 6
          }
          if (colors.length === 0) {
            return 7
          }
        }
        if (order === 'cmc') {
          return spec['mana_value']
        }
        if (order === 'price') {
          return spec['ck_price']
        }
        if (order === 'number') {
          return spec['number']
        }
        if (order === 'type') {
          return spec['type']
        }
        if (order.startsWith('rank_')) {
          if (order === 'rank_cmdr' && spec['rank_cmdr'] && spec['cmdr_rank']['edh']) {
            return spec['cmdr_rank']['edh']
          }
          const order_key = order.replace('rank_', '')
          if (spec['rank'] && spec['rank'][order_key]) {
            return spec['rank'][order_key]
          }
          return 999999
        }
      })
    }
    this.setState({filtered_specs: ordered, order_by: order})
  }

  render() {
    let main_content;
    let order_opts = [
      {'label': 'Name', 'value': 'name'},
      {'label': 'Color', 'value': 'color'},
      {'label': 'Price', 'value': 'price'},
      {'label': 'CMC', 'value': 'cmc'},
      {'label': 'Number', 'value': 'number'},
      {'label': 'Type', 'value': 'type'},
      {'label': 'Commander format rank', 'value': 'rank_edh'},
      {'label': 'As commander rank', 'value': 'rank_cmdr'},
      {'label': 'Standard rank', 'value': 'rank_standard'},
      {'label': 'Modern rank', 'value': 'rank_modern'},
      {'label': 'Legacy rank', 'value': 'rank_legacy'}
    ]
    if (!this.state.filtered_specs.length) {
      main_content = <p style={{'height': '500px'}}>No cards found</p>
    } else {
      let rank_label = 'Commander rank';
      let rank_key = 'rank_edh'
      if (this.state.order_by.startsWith('rank_')) {
        rank_key = this.state.order_by;
        rank_label = order_opts.find((o) => o.value === rank_key).label.replace(' format', '');
      }
      rank_key = rank_key.replace('rank_', '')
      let filtered_specs = this.state.filtered_specs.map((spec) => {
        if (rank_key === 'cmdr' && spec['cmdr_rank'] && spec['cmdr_rank']['edh']) {
          spec['rank_display'] = spec['cmdr_rank']['edh']
        } else if (spec['rank'] && spec['rank'][rank_key]) {
          spec['rank_display'] = spec['rank'][rank_key]
        } else {
          spec['rank_display'] = '--'
        }
        return spec
      })
      if (this.state.display === 'images') {
        main_content = <CardImages specs={filtered_specs} choices={this.state.choices}
                                   width={this.state.images_width} backsides={this.state.backsides} rank_label={rank_label} />;
      }
      if (this.state.display === 'table') {
        main_content = <CardTable specs={filtered_specs} choices={this.state.choices} backsides={this.state.backsides} rank_label={rank_label} />
      }
      if (this.state.display === 'list') {
        main_content = <CardList specs={filtered_specs} choices={this.state.choices} backsides={this.state.backsides} rank_label={rank_label} />;
      }
    }
    order_opts = order_opts.map(opt => <option value={opt.value}>{opt.label}</option> )
    let active_filters;
    if (window.django.is_mobile) {
      active_filters = Object.values(this.state.filters).filter(Boolean).length;
    } else {
      active_filters = [
        this.state.filters.rarity,
        this.state.filters.type,
        this.state.filters.mana_cost,
        this.state.filters.cmc_from,
        this.state.filters.cmc_to,
        this.state.filters.rules,
        this.state.filters.subtype,
        this.state.filters.format,
        this.state.filters.companion,
      ].filter(Boolean).length;
    }
    return (
      <div>
        <div className="row">
          <div className="col-lg-12 col-xs-12">
            <div className="well">
              <div className="row">
                <div className="col-lg-3 hidden-xs">
                  <div className="row">
                    <div className="col-lg-4 col-xs-4">
                      <div className="form-group">
                        <div className="checkbox">
                          <label htmlFor="green-filter">
                            <input id="green-filter" type="checkbox" name="green"
                              checked={this.state.filters.green}
                              onChange={this.handleInputChange}/>
                           <i className="ms ms-g ms-cost ms-shadow ms-1point2x"></i>
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-xs-4">
                      <div className="form-group">
                        <div className="checkbox">
                          <label htmlFor="black-filter">
                            <input id="black-filter" type="checkbox" name="black"
                              checked={this.state.filters.black}
                              onChange={this.handleInputChange}/>
                           <i className="ms ms-b ms-cost ms-shadow ms-1point2x"></i>
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-xs-4">
                      <div className="form-group">
                        <div className="checkbox">
                          <label htmlFor="blue-filter">
                            <input id="blue-filter" type="checkbox" name="blue"
                              checked={this.state.filters.blue}
                              onChange={this.handleInputChange}/>
                           <i className="ms ms-u ms-cost ms-shadow ms-1point2x"></i>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-lg-4 col-xs-4">
                      <div className="form-group">
                        <div className="checkbox">
                          <label htmlFor="white-filter">
                            <input id="white-filter" type="checkbox" name="white"
                              checked={this.state.filters.white}
                              onChange={this.handleInputChange}/>
                           <i className="ms ms-w ms-cost ms-shadow ms-1point2x"></i>
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-xs-4">
                      <div className="form-group">
                        <div className="checkbox">
                          <label htmlFor="red-filter">
                            <input id="red-filter" type="checkbox" name="red"
                              checked={this.state.filters.red}
                              onChange={this.handleInputChange}/>
                           <i className="ms ms-r ms-cost ms-shadow ms-1point2x"></i>
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4 col-xs-4">
                      <div className="form-group">
                        <div className="checkbox">
                          <label htmlFor="colorless-filter">
                            <input id="colorless-filter" type="checkbox" name="colorless"
                              checked={this.state.filters.colorless}
                              onChange={this.handleInputChange}/>
                           <i className="ms ms-c ms-cost ms-shadow ms-1point2x"></i>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3 col-xs-12 hidden-xs">
                  <div className="form-group">
                    <label htmlFor="name-filter">Name</label>
                    <input id="name-filter" name="name" value={this.state.filters.name} className="form-control" onChange={this.handleInputChange}/>
                  </div>
                </div>
                <div className="col-lg-3 col-xs-12 hidden-xs">
                  <div className="form-group">
                    <label>Price</label>
                    <div className="row">
                      <div className="col-lg-5 col-xs-5"><input name="price_from" type="text" className="form-control" onChange={this.handleInputChange} value={this.state.filters.price_from} /></div>
                      <div className="col-lg-1 col-xs-1">to</div>
                      <div className="col-lg-5 col-xs-5"><input name="price_to" type="text" className="form-control" onChange={this.handleInputChange} value={this.state.filters.price_to} /></div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-3 col-xs-12">
                  <button className="btn btn-block" onClick={this.handleAdvFiltersShow}>More Filters {!!active_filters && <span className="badge">{active_filters}</span>}</button>
                  <button className="btn btn-block btn-warning" onClick={this.resetFilters}>Reset Filters</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{"margin-bottom": "15px"}} className="row">
          <div className="col-lg-offset-7 col-lg-2 col-md-offset-6 col-md-2 col-xs-12">
            {this.state.display === 'images' &&
              <span className="slider-container">
                <Slider
                  min={100}
                  tooltip={false}
                  max={500}
                  step={1}
                  value={this.state.images_width}
                  onChange={this.handleImagesMaxWidth}
                />
              </span>
            }
          </div>
          <div className="col-lg-2 col-md-2 col-xs-7">
            <ButtonToolbar>
              <ButtonGroup bsSize="small">
                <Button onClick={() => this.handleDisplayChange('table')} disabled={this.state.display === 'table'}>Table</Button>
                <Button onClick={() => this.handleDisplayChange('images')} disabled={this.state.display === 'images'}>Images</Button>
                {window.django.is_mobile &&
                <Button onClick={() => this.handleDisplayChange('list')} disabled={this.state.display === 'list'}>List</Button>}
              </ButtonGroup>
            </ButtonToolbar>
          </div>
          <div className="col-lg-1 col-md-2 col-xs-5">
            <select onChange={this.handleOrderChange} className="form-control input-sm">
              {order_opts}
            </select>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-12">
            {main_content}
          </div>
        </div>
        <Modal bsSize='lg' show={this.state.show_filters_modal} onHide={this.handleAdvFiltersHide}>
          <Modal.Body>
            <div className="row visible-xs">
              <div className="col-lg-6 col-xs-12">
                <div className="form-group">
                  <label htmlFor="name-filter">Name</label>
                  <input id="name-filter" name="name" value={this.state.filters.name} className="form-control" onChange={this.handleInputChange}/>
                </div>
              </div>
              <div className="col-lg-6 col-xs-12">
                <div className="form-group">
                  <label>Price</label>
                  <div className="row">
                    <div className="col-lg-5 col-xs-5"><input name="price_from" type="text" className="form-control" onChange={this.handleInputChange} value={this.state.filters.price_from} /></div>
                    <div className="col-lg-1 col-xs-1">to</div>
                    <div className="col-lg-5 col-xs-5"><input name="price_to" type="text" className="form-control" onChange={this.handleInputChange} value={this.state.filters.price_to} /></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row visible-xs">
              <div className="col-lg-4 col-xs-4">
                <div className="form-group">
                  <div className="checkbox">
                    <label htmlFor="green-filter">
                      <input id="green-filter" type="checkbox" name="green"
                        checked={this.state.filters.green}
                        onChange={this.handleInputChange}/>
                     <i className="ms ms-g ms-cost ms-shadow ms-1point2x"></i>
                    </label>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-xs-4">
                <div className="form-group">
                  <div className="checkbox">
                    <label htmlFor="black-filter">
                      <input id="black-filter" type="checkbox" name="black"
                        checked={this.state.filters.black}
                        onChange={this.handleInputChange}/>
                     <i className="ms ms-b ms-cost ms-shadow ms-1point2x"></i>
                    </label>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-xs-4">
                <div className="form-group">
                  <div className="checkbox">
                    <label htmlFor="blue-filter">
                      <input id="blue-filter" type="checkbox" name="blue"
                        checked={this.state.filters.blue}
                        onChange={this.handleInputChange}/>
                     <i className="ms ms-u ms-cost ms-shadow ms-1point2x"></i>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="row visible-xs">
              <div className="col-lg-4 col-xs-4">
                <div className="form-group">
                  <div className="checkbox">
                    <label htmlFor="white-filter">
                      <input id="white-filter" type="checkbox" name="white"
                        checked={this.state.filters.white}
                        onChange={this.handleInputChange}/>
                     <i className="ms ms-w ms-cost ms-shadow ms-1point2x"></i>
                    </label>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-xs-4">
                <div className="form-group">
                  <div className="checkbox">
                    <label htmlFor="red-filter">
                      <input id="red-filter" type="checkbox" name="red"
                        checked={this.state.filters.red}
                        onChange={this.handleInputChange}/>
                     <i className="ms ms-r ms-cost ms-shadow ms-1point2x"></i>
                    </label>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 col-xs-4">
                <div className="form-group">
                  <div className="checkbox">
                    <label htmlFor="colorless-filter">
                      <input id="colorless-filter" type="checkbox" name="colorless"
                        checked={this.state.filters.colorless}
                        onChange={this.handleInputChange}/>
                     <i className="ms ms-c ms-cost ms-shadow ms-1point2x"></i>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-6 col-xs-12">
                <div className="form-group">
                    <label className="control-label">Rarity</label>
                    <Select
                      name="rarity"
                      onChange={(v) => this.handleSelectChange('rarity', v)}
                      value={this.state.filters.rarity}
                      options={this.state.choices.rarity_opts}
                    />
                  </div>
              </div>
              <div className="col-lg-6 col-xs-12">
                <div className="form-group">
                  <label className="control-label">Type</label>
                  <Select
                    name="type"
                    onChange={(v) => this.handleSelectChange('type', v)}
                    value={this.state.filters.type}
                    options={this.state.choices.type_opts}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-6 col-xs-12">
                <div className="form-group">
                  <label className="control-label">Mana Cost</label>
                    <input name="mana_cost" value={this.state.filters.mana_cost} className="form-control" onChange={this.handleInputChange}/>
                </div>
              </div>
              <div className="col-lg-6 col-xs-12">
                <div className="form-group">
                  <label>CMC</label>
                  <div className="row">
                    <div className="col-lg-5 col-xs-5"><input name="cmc_from" type="text" className="form-control" onChange={this.handleInputChange} value={this.state.filters.cmc_from} /></div>
                    <div className="col-lg-1 col-xs-1">to</div>
                    <div className="col-lg-5 col-xs-5"><input name="cmc_to" type="text" className="form-control" onChange={this.handleInputChange} value={this.state.filters.cmc_to} /></div>
                    </div>
                  </div>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-6 col-xs-12">
                <div className="form-group">
                  <label className="control-label">Subtype</label>
                  <input name="subtype" value={this.state.filters.subtype} className="form-control" onChange={this.handleInputChange}/>
                </div>
              </div>
              <div className="col-lg-6 col-xs-12">
                <label className="control-label">Rules</label>
                <input name="rules" value={this.state.filters.rules} className="form-control" onChange={this.handleInputChange}/>
              </div>
            </div>
            <div className="row">
              <div className="col-lg-6 col-xs-12">
                <div className="form-group">
                  <label className="control-label">Format</label>
                  <Select
                    name="format"
                    onChange={(v) => this.handleSelectChange('format', v)}
                    value={this.state.filters.format}
                    options={this.state.choices.format_opts}
                  />
                </div>
              </div>
              <div className="col-lg-6 col-xs-12">
                <div className="form-group">
                  <label className="control-label">Companion</label>
                  <Select
                    name="companion"
                    onChange={(v) => this.handleSelectChange('companion', v)}
                    value={this.state.filters.companion}
                    options={this.state.choices.companion_opts}
                  />
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.handleAdvFiltersHide}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}

ReactDOM.render(<SetDetailApp />, document.getElementById('set-detail-root'));
