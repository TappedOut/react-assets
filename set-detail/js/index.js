import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import {ProgressBar, Modal, Button} from 'react-bootstrap'
import ImageCardRow from './components/imageCardRow.js'
import 'react-select/dist/react-select.css';
import Select from 'react-select';
const _ = require('lodash');


const SET_DETAIL_API = window.django.set_specs_api;


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
        this.setState({
          specs: _.sortBy(response.data.specs, (spec) => spec['name']),
          filtered_specs: _.sortBy(response.data.specs, (spec) => spec['name']),
          vendors: response.data.vendors
        })
      },
      error => {
        this.setState({error: 'Error getting card info. Please refresh the page.'})
      }
    )
  }

  get_price = (spec, url) => {
    return spec['tcg_mkt_price']
  }

  handleAdvFiltersShow = () => {
    this.setState({show_filters_modal: true})
  };
  handleAdvFiltersHide = () => this.setState({show_filters_modal: false});

  filterSpecs = (filters) => {
    if (Object.values(filters).every(value => !value)) {
      this.setState({filtered_specs: this.state.specs})
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
        keep = keep && spec['mana_cost'].includes(filters.mana_cost)
      }
      if (filters.subtype){
        keep = keep && spec['subtype'].toLowerCase().includes(filters.subtype.toLowerCase())
      }
      if (filters.cmc_from){
        keep = keep && spec['mana_cost_converted'] >= filters.cmc_from
      }
      if (filters.cmc_to){
        keep = keep && spec['mana_cost_converted'] <= filters.cmc_to
      }
      if (filters.rules){
        keep = keep && spec['rules'].toLowerCase().includes(filters.rules.toLowerCase())
      }
      if (filters.format){
        keep = keep && spec['formats'].indexOf(filters.format) > -1
      }
      if (filters.companion){
        keep = keep && spec['companions'].indexOf(filters.companion) > -1
      }
      return keep
    })
    this.setState({filtered_specs: filtered})
  }

  chunkArray = (inputArray, perChunk) => {
    return inputArray.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index/perChunk)

      if(!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = [] // start a new chunk
      }

      resultArray[chunkIndex].push(item)

      return resultArray
    }, [])
  }

  resetFilters = () => {
    // TODO: DO this
    return
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
    this.debouncedFilter(new_filters)
  }

  handleOrderChange = (opt) => {
    this.setState({order_by: opt.value})
    this.changeOrder(opt.value)
  }

  handleDisplayChange = (opt) => {
    this.setState({display: opt.value})
  }

  changeOrder = (order) => {
    const ordered = _.sortBy(this.state.filtered_specs, (spec) => {
      if (order === 'name') {
        return spec['name']
      }
      if (order === 'cmc') {
        return spec['mana_cost_converted']
      }
      if (order === 'price') {
        return spec['tcg_mkt_price']
      }
      if (order === 'number') {
        return spec['number']
      }
    })
    this.setState({filtered_specs: ordered, order: order})
  }

  render() {
    let main_content = <div></div>;
    if (this.state.display === 'images') {
      main_content = this.chunkArray(this.state.filtered_specs, 4).map(chunk => <ImageCardRow specs={chunk} vendors={this.state.vendors} />);
    } else {
      //TODO table display
    }
    if (!main_content.length) {
        main_content = <p style={{'height': '500px'}}>No cards found</p>
      }
    const display_opts = [{'label': 'Images', 'value': 'images'}, {'label': 'Table', 'value': 'table'}]
    const order_opts = [
      {'label': 'Name', 'value': 'name'},
      {'label': 'Price', 'value': 'price'},
      {'label': 'CMC', 'value': 'cmc'},
      {'label': 'Number', 'value': 'number'}
    ]

    return (
      <div>
        <div className="row">
          <div className="col-lg-12 col-xs-12">
            <div className="well">
              <div className="row">
                <div className="col-lg-3">
                  <div className="form-group">
                    <label htmlFor="name-filter">Name</label>
                    <input id="name-filter" name="name" value={this.state.filters.name} className="form-control" onChange={this.handleInputChange}/>
                  </div>
                </div>
                <div className="col-lg-3">
                  <div className="row">
                    <div className="col-lg-4 col-xs-6">
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
                    <div className="col-lg-4 col-xs-6">
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
                    <div className="col-lg-4 col-xs-6">
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
                    <div className="col-lg-4 col-xs-6">
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
                    <div className="col-lg-4 col-xs-6">
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
                    <div className="col-lg-4 col-xs-6">
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
                <div className="col-lg-3">
                  <button className="btn btn-block" onClick={this.handleAdvFiltersShow}>More Filters</button>
                  <button className="btn btn-block btn-warning" onClick={this.resetFilters}>Reset Filters</button>
                </div>
                <div className="col-lg-3">
                  <div className="form-group">
                    <label className="control-label">Display</label>
                    <Select
                      name="display"
                      onChange={this.handleDisplayChange}
                      value={this.state.display}
                      options={display_opts}
                      clearable={false}
                    />
                  </div>
                  <div className="form-group">
                    <label className="control-label">Order by</label>
                    <Select
                      name="order_by"
                      onChange={this.handleOrderChange}
                      value={this.state.order_by}
                      options={order_opts}
                      clearable={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {main_content}
        <Modal bsSize='lg' show={this.state.show_filters_modal} onHide={this.handleAdvFiltersHide}>
          <Modal.Body>
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
