import React from 'react';
import axios from 'axios';
import Slider from 'react-rangeslider';
import 'react-rangeslider/lib/index.css';
import {ProgressBar} from 'react-bootstrap'
import CardImages from '../../set-detail/js/components/cardImages.js';
import CardTable from '../../set-detail/js/components/cardTable.js';
import CardList from '../../set-detail/js/components/cardList.js';
import Filter from "../../set-detail/js/components/filters.js";
import 'react-select/dist/react-select.css';
import '../../set-detail/css/set-detail.scss';
const _ = require('lodash');


const CARD_SEARCH_API = window.django.card_filter_api


const COLOR_ORDER = {
  'W': 1,
  'U': 2,
  'B': 3,
  'R': 4,
  'G': 5
}


export default class CardSearchApp extends React.Component {
  constructor(props) {
    super(props);
    let img_width = localStorage ? parseInt(localStorage.getItem('toImgWidth')) : 300
    if (!img_width || img_width < 100 || img_width > 500) {
      img_width = 300
    }
    this.state = {
      specs: [],
      loading: true,
      display: 'images',
      vendors: ['tcg'],
      api_error: '',
      order_by: 'name',
      choices: {},
      images_width: img_width,
      backsides: {},
      filters: {
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
      },
    }
    axios.get(
      `${CARD_SEARCH_API}?choices=True`,
    ).then(
      response => {
        let card_display = response.data.reduce_images ? 'table' : 'images'
        if (localStorage) {
          const saved_display = localStorage.getItem('toCardDisplay')
          if (_.includes(['images', 'table', 'list'], saved_display) && !(saved_display === 'list' && window.django.is_mobile)) {
            card_display = saved_display;
          }
        }

        this.setState({
          display: card_display,
          specs: response.data.results,
          vendors: response.data.vendors,
          choices: response.data.choices,
          loading: false
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

  filterCards = (cards) => {
    //TODO: api call?
    return cards
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
    this.setState({filters: empty})
    this.filterCards(empty)
  }

  handleFilterChange = (name, value) => {
    const new_filters = {...this.state.filters, [name]: value}
    this.setState({
      filters: new_filters
    });
  }

  handleOrderChange = (event) => {
    this.setState({order_by: event.target.value})
  }

  orderCards = (specs) => {
    //TODO: handle order
    return specs
  }

  renderWidthOrder = (order_opts, filtered_count) => {
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
        <div className="col-lg-2 col-md-2 col-xs-4">{filtered_count} / {this.state.specs.length}</div>
      </div>
    )
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
    const widthOrder = this.renderWidthOrder(order_opts, specs.length)
    return (
      <div>
        <Filter filters={this.state.filters} choices={this.state.choices} filterChange={this.handleFilterChange} resetFilters={this.resetFilters} />
        {widthOrder}
        <div className="row">
          <div className="col-lg-12">
            {main_content}
          </div>
        </div>
      </div>
    )
  }
}
