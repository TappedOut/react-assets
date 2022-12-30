import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import Slider from 'react-rangeslider';
import 'react-select/dist/react-select.css';
import 'react-rangeslider/lib/index.css';
import '../../set-detail/css/set-detail.scss';
import CardImage from './components/cardImage';
import CardTable from '../../set-detail/js/components/cardTable';
import CardList from '../../set-detail/js/components/cardList';
import Filter from '../../set-detail/js/components/filters';
import { Async } from 'react-select';
import {ProgressBar} from 'react-bootstrap'
const _ = require('lodash');
import 'react-select/dist/react-select.css';


const COLOR_ORDER = {
  'W': 1,
  'U': 2,
  'B': 3,
  'R': 4,
  'G': 5
}


const SIMILAR_CARD_API = window.django.similar_api.replace(`\/${window.django.card_slug}`, '');
const AUTOCOMPLETE_API = window.django.autocomplete_api


class SimilarCardsApp extends React.Component {
  constructor(props) {
    super(props);
    let img_width = parseInt(localStorage.getItem('toImgWidth'))
    if (!img_width || img_width < 100 || img_width > 500) {
      img_width = 300
    }
    let card_display = localStorage.getItem('toCardDisplay');
    if (!_.includes(['images', 'table', 'list'], card_display) || (card_display === 'list' && !window.django.is_mobile)) {
      card_display = 'images'
    }
    this.state = {
      loading: true,
      loading_similar: false,
      display: card_display,
      order_by: 'similar',
      choices: {},
      backsides: {},
      current: null,
      current_input_value: '',
      current_value: {'name': '', 'slug': ''},
      similar: null,
      similar_error: false,
      images_width: img_width,
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
      showColors: false,
      showExtra: false
    }
    this.getSimilar(window.django.card_slug)
  }

  getSimilar = (card_slug) => {
    let url = `${SIMILAR_CARD_API}${card_slug}`;
    axios.get(
      url,
    ).then(
      response => {
        this.setState({
          similar: response.data.similar,
          current: response.data.current,
          current_input_value: response.data.current.name,
          current_name: {'name': response.data.current.name, 'slug': response.data.current.slug},
          choices: response.data.choices,
          loading: false,
          loading_similar: false,
          similar_error: false
        })
      },
      error => {
        this.setState({
          similar: null,
          similar_error: true,
          current_name: {'name': this.state.current_input_value, 'slug': null}
        })
      }
    )
  }

  handleImagesMaxWidth = (value) => {
    this.setState({
      images_width: value
    })
    localStorage.setItem('toImgWidth', value);
  };

  handleDisplayChange = (val) => {
    this.setState({display: val})
    localStorage.setItem('toCardDisplay', val);
  }

  throttledAutocomplete = _.throttle((searchUrl, callback) => {
    axios.get(searchUrl)
      .then((response) => callback(null, { options: response.data }))
      .catch((error) => callback(error, null))
  }, 1000);

  handleAutocomplete = (input, callback) => {
    if (input && input.length >= 3) {
      let searchUrl = `${AUTOCOMPLETE_API}?name=${input}`
      this.throttledAutocomplete(searchUrl, callback);
    }
  };

  handleCurrentChange = (card) => {
    if (card) {
      this.setState({current: card, current_input_value: card.name, loading_similar: true});
      this.getSimilar(card.slug)
    }
  }

  handleCardClick = (card) => {
    this.setState({current: card, current_input_value: card.name, loading_similar: true});
    this.getSimilar(card.slug)
  }

  handleInputChange = (inputValue) => {
    this.setState({current_input_value: inputValue});
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
  }

  handleFilterChange = (name, value) => {
    const new_filters = {...this.state.filters, [name]: value}
    this.setState({
      filters: new_filters
    });
  }

  filterCards = (cards) => {
    return cards.filter(card => {
      let keep = true

      // formats
      const card_formats = card.formats && card.formats.length ? card.formats : []
      const all_checked = _.keys(this.state.filters.formats).length === this.selectedFormats.length;
      if (!all_checked) {
        let anyfmt = false
        _.each(card_formats, f => {
          if (_.includes(this.selectedFormats, f)) {
            anyfmt = true
          }
        })
        keep = keep && anyfmt
      }

      // color
      const colors = card['effective_cost'] ? card['effective_cost'] : []
      if (this.selectedColors.length) {
        let anycolor = false
        _.each(this.selectedColors, c => {
          c = c.toUpperCase()
          if (_.includes(colors, c)) {
            anycolor = true
          }
          if (c === 'C' && !colors.length) {
            anycolor = true
          }
        })
        keep = keep && anycolor
      }

      if (this.selectedExcludeColors.length) {
        let anyexclude = true
        _.each(this.selectedExcludeColors, c => {
          c = c.toUpperCase()
          if (_.includes(colors, c)) {
            anyexclude = false
          }
          if (c === 'C' && !colors.length) {
            anyexclude = false
          }
        })
        keep = keep && anyexclude
      }

      // price
      let fromkeep = true
      const priceFrom = parseFloat(this.state.filters.price_from)
      if (priceFrom && (priceFrom > card.ck_price || !card.ck_price)) {
        fromkeep = false
      }
      keep = keep && fromkeep
      let tokeep = true
      const priceTo = parseFloat(this.state.filters.price_to)
      if (priceTo && (priceTo < card.ck_price || !card.ck_price)) {
        tokeep = false
      }
      keep = keep && tokeep

      // name
      if (this.state.filters.name) {
        keep = keep && card['name'].toLowerCase().includes(this.state.filters.name.toLowerCase())
      }

      // type
      if (this.state.filters.type) {
        keep = keep && this.state.filters.type === card.type
      }

      // subtype
      if (this.state.filters.subtype) {
        const subtype = card['subtype'] ? card['subtype'] : ''
        keep = keep && subtype.toLowerCase().includes(this.state.filters.subtype.toLowerCase())
      }

      // cmc
      if (this.state.filters.cmc_from || this.state.filters.cmc_from === 0) {
        keep = keep && card['mana_value'] >= this.state.filters.cmc_from
      }
      if (this.state.filters.cmc_to || this.state.filters.cmc_to === 0) {
        keep = keep && card['mana_value'] <= this.state.filters.cmc_to
      }

      // rarity
      if (this.state.filters.rarity) {
        keep = keep && card['rarity'] === this.state.filters.rarity
      }

      // Mana Cost TODO: normalize mana_cost
      if (this.state.filters.mana_cost) {
        const mana_cost = card['mana_cost'] ? card['mana_cost'] : '';
        keep = keep && mana_cost.includes(this.state.filters.mana_cost)
      }

      // Companion
      if (this.state.filters.companion) {
        keep = keep && card['companions'].indexOf(this.state.filters.companion) > -1
      }

      // Rules
      if (this.state.filters.rules) {
        const rules = card['rules'] ? card['rules'] : ''
        keep = keep && rules.toLowerCase().includes(this.state.filters.rules.toLowerCase())
      }

      return keep
    })
  }

  handleOrderChange = (event) => {
    this.setState({order_by: event.target.value})
  }

  orderCards = (specs) => {
    const order = this.state.order_by;
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
        if (order === 'similar') {
          return spec['similar']
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
    return ordered
  }

  renderLeftBlock = () => {
    return (
      <div>
        <div style={{'margin-bottom': '15px'}} className="row">
          <div className="col-lg-12 col-xs-12">
            <Async arrowRenderer={null}
              autoload={false}
              cache={false}
              clearable={false}
              labelKey="name"
              loadOptions={_.debounce(this.handleAutocomplete, 2000)}
              loadingPlaceholder="Searching..."
              onInputChange={this.handleInputChange}
              onInputKeyDown={this.handleEnterSearch}
              onChange={this.handleCurrentChange}
              onCloseResetsInput={false}
              onSelectResetsInput={false}
              onBlurResetsInput={false}
              openOnFocus={true}
              value={this.state.current_name}
              valueKey="slug"/>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-12 col-xs-12">
            <img className="img-responsive" alt={this.state.current.name} src={this.state.current.image} />
          </div>
        </div>
        {this.state.current &&
          <div className="row">
            <div style={{'margin-top': '10px'}} className="col-lg-12 col-xs-12">
              <a className="btn btn-sm btn-default btn-block" href={this.state.current.url}>Card Page</a>
            </div>
          </div>
        }
      </div>
    )
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
        <div className="col-lg-1 col-md-2 col-xs-5">
          <select onChange={this.handleOrderChange} className="form-control input-sm">
            {order_opts}
          </select>
        </div>
        <div className="col-lg-2 col-md-2 col-xs-12">
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
      </div>
    )
  }

  render() {
    if (this.state.loading) {
      return (<div style={{'margin-top': '18px'}}>
        <ProgressBar active now={100} />
      </div>)
    }
    let order_opts = [
      {'label': 'Similar', 'value': 'similar'},
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

    let similar = <ProgressBar active now={100} />
    if (this.state.similar_error) {
      similar = <p>No similar data found. Please try a different card.</p>
    }
    this.selectedFormats = _.keys(this.state.filters.formats).filter(f => this.state.filters.formats[f])
    this.selectedColors = _.keys(this.state.filters.colors).filter(c => this.state.filters.colors[c] === 1)
    this.selectedExcludeColors = _.keys(this.state.filters.colors).filter(c => this.state.filters.colors[c] === -1)
    if (!this.state.loading_similar) {
      const filtered_cards = this.orderCards(this.filterCards(this.state.similar))
      if (this.state.display === 'images') {
        similar = filtered_cards.map(card => {
          return <CardImage width={this.state.images_width} card={card} handleClick={() => this.handleCardClick(card)}/>
        })
        similar = (
          <div style={{'overflow': 'auto', 'height': 'calc(100vh - 200px)', "display": "flex", "flex-wrap": "wrap"}}
               className="col-lg-12 col-xs-12">
            {similar}
          </div>)
      }
      if (this.state.display === 'table') {
        similar = (
          <div className="col-lg-12 col-xs-12">
            <CardTable specs={filtered_cards}
                             choices={this.state.choices}
                             backsides={this.state.backsides}
                             cardClickCB={this.handleCardClick}/>
          </div>
        )
      }
      if (this.state.display === 'list') {
        similar = (
          <div className="col-lg-12 col-xs-12">
            <CardList specs={filtered_cards}
                      choices={this.state.choices}
                      backsides={this.state.backsides}
                      cardClickCB={this.handleCardClick}/>
          </div>
        )
      }
    }
    const leftBlock = this.renderLeftBlock()
    const widthOrder = this.renderWidthOrder(order_opts)

    return (
      <div>
        <div className="row" style={{'margin-top': '18px'}}>
          <div className="col-lg-2 col-md-3 col-xs-12">
            {leftBlock}
          </div>
          <div className="col-lg-10 col-md-9 col-xs-12">
            <Filter filters={this.state.filters} choices={this.state.choices} filterChange={this.handleFilterChange} resetFilters={this.resetFilters} />
            {widthOrder}
            <div className="row">
              {similar}
            </div>
          </div>
        </div>
      </div>
      )
    }
  }

ReactDOM.render(<SimilarCardsApp />, document.getElementById('similar-root'));
