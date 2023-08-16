import React from 'react';
import axios from 'axios';
import Slider from 'react-rangeslider';
import 'react-rangeslider/lib/index.css';
import InfiniteScroll from 'react-infinite-scroll-component';
import {ProgressBar} from 'react-bootstrap'
import CardImages from '../../set-detail/js/components/cardImages.js';
import CardTable from '../../set-detail/js/components/cardTable.js';
import CardList from '../../set-detail/js/components/cardList.js';
import Filter from "../../set-detail/js/components/filters.js";
import 'react-select/dist/react-select.css';
import '../../set-detail/css/set-detail.scss';
const _ = require('lodash');


const CARD_SEARCH_API = window.django.card_filter_api


export default class CardSearchApp extends React.Component {
  constructor(props) {
    super(props);
    let img_width = localStorage ? parseInt(localStorage.getItem('toImgWidth')) : 300
    if (!img_width || img_width < 100 || img_width > 500) {
      img_width = 300
    }
    const filters = this.buildFilterDefaults()
    this.state = {
      specs: [],
      total_specs: 0,
      page: 1,
      loading: true,
      disable_main_inputs: true,
      display: 'images',
      vendors: ['tcg'],
      api_error: '',
      order_by: 'name',
      choices: {},
      images_width: img_width,
      backsides: {},
      filters: filters,
    }
    this.get_cards(this.state.filters, 'name', 1, true)
    this.debounced_get_cards = _.debounce(
      (filters, order, page, get_choices) => this.get_cards(filters, order, page, get_choices),
      1500
    )
  }

  buildFilterDefaults = () => {
    const filters = {
      name: '',
      formats: {
        'Commander / EDH': true,
        'Modern': true,
        'Standard': true,
        'Legacy': true,
        'Vintage': true,
        'Pauper': true,
        'Pauper EDH': true,
        'Duel Commander': true,
        'Pauper Duel Commander': true,
        'Commander: Rule 0': true,
        'Canadian Highlander': true
      },
      colors: {
        'u': 0,
        'b': 0,
        'g': 0,
        'r': 0,
        'w': 0,
        'c': 0,
      },
      price_from: '',
      price_to: '',
      type: '',
      rarity: '',
      mana_cost: '',
      cmc_from: '',
      cmc_to: '',
      rules: '',
      subtype: '',
      companion: ''
    }
    const queryParameters = new URLSearchParams(window.location.search)
    for (const [key, value] of queryParameters.entries()) {
      switch(key) {
        case 'formats':
          // handle later
          break
        case 'colors':
          // handle later
          break
        case 'type':
          if (value) filters.type = _.startCase(value)
          break
        case 'mana_value_min':
          if (!isNaN(parseInt(value))) filters.cmc_from = value
          break
        case 'cmc_to':
          if (!isNaN(parseInt(value))) filters.cmc_to = value
          break
        default:
          if (value) filters[key] = value
      }
    }
    return filters
  }

  get_cards = (filters, order, page, get_choices) => {
    let initial = {disable_main_inputs: true}
    if (page === 1) initial.loading = true
    this.setState(initial)
    let get_params = `?p=${page}`
    if (get_choices) get_params += '&choices=True'
    if (filters) get_params += this.buildFilterGET(filters)
    if (order) get_params += this.buildOrderGET(order)
    axios.get(
      `${CARD_SEARCH_API}${get_params}`,
    ).then(
      response => {
        let card_display = response.data.reduce_images ? 'table' : 'images'
        if (localStorage) {
          const saved_display = localStorage.getItem('toCardDisplay')
          if (_.includes(['images', 'table', 'list'], saved_display) && !(saved_display === 'list' && window.django.is_mobile)) {
            card_display = saved_display;
          }
        }
        const specs = page === 1 ? response.data.results : this.state.specs.concat(response.data.results)
        const choices = get_choices ? response.data.choices : this.state.choices
        const total = get_choices ? response.data.total_objects : this.state.total_specs
        this.setState({
          display: card_display,
          specs: specs,
          total_specs: total,
          vendors: response.data.vendors,
          choices: choices,
          loading: false,
          disable_main_inputs: false,
          page: page + 1
        })
      },
      error => {
        this.setState({
          loading: false,
          error: 'Error getting card info. Please refresh the page.'
        })
      }
    )
  }

  buildFilterGET = (filters) => {
    let get_params = ''
    _.forOwn(filters, (value, key) => {
      switch(key) {
        case 'formats':
          if (!_.values(filters.formats).includes(false)) break
          _.forOwn(filters.formats, (fvalue, fkey) => {
            if (fvalue) get_params += `&formats=${this.formatGET(fkey)}`
          })
          break
        case 'colors':
          _.forOwn(filters.colors, (cvalue, ckey) => {
            if (cvalue === 1) get_params += `&color=${ckey.toUpperCase()}`
            if (cvalue === -1) get_params += `&exclude_color=${ckey.toUpperCase()}`
          })
          break
        case 'type':
          if (value) get_params += `&${key}=${value.toLowerCase()}`
          break
        case 'cmc_from':
          if (!isNaN(parseInt(value))) get_params += `&mana_value_min=${value}`
          break
        case 'cmc_to':
          if (!isNaN(parseInt(value))) get_params += `&mana_value_max=${value}`
          break
        default:
          if (value) get_params += `&${key}=${value}`
      }
    });
    return get_params
  }

  buildOrderGET = (order) => {
    if (order === 'name') return '&o=name_sort'
    if (_.includes(['color', 'type', 'mana_value'], order)) return `&o=${order}`
    return ''
  }

  formatGET = (format) => {
    return this.state.choices.format_map[format]
  }

  get_price = (spec) => {
    return spec['ck_price']
  }

  handleImagesMaxWidth = (value) => {
    this.setState({
      images_width: value
    })
    if (localStorage) localStorage.setItem('toImgWidth', value)
  };

  handleDisplayChange = (val) => {
    this.setState({display: val})
    if (localStorage) localStorage.setItem('toCardDisplay', val)
  }

  resetFilters = () => {
    const empty = {
      name: '',
        formats: {
        'Commander / EDH': true,
        'Modern': true,
        'Standard': true,
        'Legacy': true,
        'Vintage': true,
        'Pauper': true,
        'Pauper EDH': true,
        'Duel Commander': true,
        'Pauper Duel Commander': true,
        'Commander: Rule 0': true,
        'Canadian Highlander': true
      },
      colors: {
        'u': 0,
        'b': 0,
        'g': 0,
        'r': 0,
        'w': 0,
        'c': 0,
      },
      price_from: '',
      price_to: '',
      type: '',
      rarity: '',
      mana_cost: '',
      cmc_from: '',
      cmc_to: '',
      rules: '',
      subtype: '',
      companion: ''
    }
    this.setState({filters: empty, disable_main_inputs: true})
    this.get_cards({}, this.state.order_by, 1, true)
  }

  handleFilterChange = (name, value) => {
    const main_input = _.includes(['colors', 'name'], name)
    const new_filters = {...this.state.filters, [name]: value}
    this.setState({
      filters: new_filters,
    });
    if (main_input) this.debounced_get_cards(new_filters, this.state.order_by, 1, true)
  }

  handleOrderChange = (event) => {
    this.setState({
      order_by: event.target.value,
    })
    this.get_cards(this.state.filters, event.target.value, 1, false)
  }

  handleFilterModalClose = () => {
    this.get_cards(this.state.filters, this.state.order_by, 1, true)
  }

  renderWidthOrder = (order_opts) => {
    order_opts = order_opts.map(opt => <option value={opt.value}>{opt.label}</option>)
    return (
      <div style={{"margin-bottom": "15px"}} className="row">
        <div className="col-lg-2 col-md-2 col-xs-7">
          <div className="btn-group" role="group" style={{'display': 'flex'}}>
            <button className="btn btn-default btn-sm" style={{'flex': 1}} onClick={() => this.handleDisplayChange('table')} disabled={this.state.display === 'table'}>Table</button>
            <button className="btn btn-default btn-sm" style={{'flex': 1}} onClick={() => this.handleDisplayChange('images')} disabled={this.state.display === 'images'}>Images</button>
            {window.django.is_mobile &&
            <button className="btn btn-default btn-sm" style={{'flex': 1}} onClick={() => this.handleDisplayChange('list')} disabled={this.state.display === 'list'}>List</button>}
          </div>
        </div>
        <div className="col-lg-2 col-md-2 col-xs-5">
          <select onChange={this.handleOrderChange} className="form-control input-sm">
            {order_opts}
          </select>
        </div>
        <div className="col-lg-2 col-md-2 col-xs-8">
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
        <div className="col-lg-2 col-md-2 col-xs-4">{this.state.specs.length} / {this.state.total_specs}</div>
      </div>
    )
  }

  render() {
    let main_content;
    let order_opts = [
      {'label': 'Name', 'value': 'name'},
      {'label': 'Color', 'value': 'color'},
      {'label': 'Price', 'value': 'price'},
      {'label': 'Mana Value', 'value': 'mana_value'},
      {'label': 'Type', 'value': 'type'},
    ]
    this.selectedFormats = _.keys(this.state.filters.formats).filter(f => this.state.filters.formats[f])
    this.selectedColors = _.keys(this.state.filters.colors).filter(c => this.state.filters.colors[c] === 1)
    this.selectedExcludeColors = _.keys(this.state.filters.colors).filter(c => this.state.filters.colors[c] === -1)
    let specs = this.state.specs

    if (this.state.loading) {
      main_content = <ProgressBar active now={100} />
    } else if (!specs.length) {
      main_content = <p style={{'height': '500px'}}>No cards found</p>
    } else {
      if (this.state.display === 'images') {
        main_content = <CardImages specs={specs} choices={this.state.choices}
                                   width={this.state.images_width} backsides={this.state.backsides} rank_label={''} />;
      }
      if (this.state.display === 'table') {
        main_content = <CardTable specs={specs} choices={this.state.choices} backsides={this.state.backsides} rank_label={''} />
      }
      if (this.state.display === 'list') {
        main_content = <CardList specs={specs} choices={this.state.choices} backsides={this.state.backsides} rank_label={''} />;
      }
    }
    const widthOrder = this.renderWidthOrder(order_opts)
    return (
      <div>
        <Filter filters={this.state.filters} choices={this.state.choices} filterChange={this.handleFilterChange}
                resetFilters={this.resetFilters} modalCloseCB={this.handleFilterModalClose} disableInputs={this.state.disable_main_inputs}/>
        {widthOrder}
        <div className="row">
          <div className="col-lg-12">
            <InfiniteScroll
              dataLength={this.state.specs.length}
              next={() => this.get_cards(this.state.filters, this.state.order_by, this.state.page, false)}
              hasMore={this.state.specs.length < this.state.total_specs && !this.state.loading}
              loader={<ProgressBar active now={100} />}
            >
              {main_content}
            </InfiniteScroll>
          </div>
        </div>
      </div>
    )
  }
}
