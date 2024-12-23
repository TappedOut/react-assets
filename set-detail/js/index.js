import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import Slider from 'react-rangeslider';
import '../css/set-detail.scss';
import 'react-rangeslider/lib/index.css';
import {ProgressBar} from 'react-bootstrap'
import CardImages from './components/cardImages.js';
import CardTable from './components/cardTable.js';
import CardList from './components/cardList.js';
import Filter from "./components/filters";
import 'react-select/dist/react-select.css';
const _ = require('lodash');


const SET_DETAIL_API = window.django.set_specs_api
const SET_TLA = window.django.tla


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
        formats: [],
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
        companion: '',
        keywords: []
      },
    }
    axios.get(
      SET_DETAIL_API,
    ).then(
      response => {
        let found = []
        let backsides = {}
        const specs = _.sortBy(response.data.specs.filter((spec) => {
          const duplicate = found.indexOf(spec.name) > -1
          found.push(spec.name)
          if (spec.flip && !spec.is_front) {
            backsides[spec.name] = spec
            return false
          }
          return !duplicate
        }), (spec) => spec['name'])

        let card_display = response.data.reduce_images ? 'table' : 'images'
        if (localStorage) {
          const saved_display = localStorage.getItem('toCardDisplay')
          if (_.includes(['images', 'table', 'list'], saved_display) && !(saved_display === 'list' && window.django.is_mobile)) {
            card_display = saved_display;
          }
        }

        this.setState({
          display: card_display,
          specs: specs,
          vendors: response.data.vendors,
          choices: response.data.choices,
          backsides: backsides,
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
    return cards.filter(card => {
      const backside = card.flip && this.state.backsides[card.flip] ? this.state.backsides[card.flip] : null
      let keep = true

      // color
      let colors = card['effective_cost'] ? card['effective_cost'] : []
      if (backside && backside['effective_cost']) colors = colors.concat(backside['effective_cost'])
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
        let namekeep = card['name'].toLowerCase().includes(this.state.filters.name.toLowerCase())
        if (backside) namekeep = namekeep || backside['name'].toLowerCase().includes(this.state.filters.name.toLowerCase())
        keep = keep && namekeep
      }

      // type
      if (this.state.filters.type) {
        let typekeep = _.startCase(this.state.filters.type) === card.type
        if (backside) typekeep = typekeep || _.startCase(this.state.filters.type) === backside.type
        keep = keep && typekeep
      }

      // subtype
      if (this.state.filters.subtype) {
        const subtype = card['subtype'] ? card['subtype'] : ''
        let subkeep = subtype.toLowerCase().includes(this.state.filters.subtype.toLowerCase())
        if (backside && backside['subtype']) subkeep = subkeep || backside['subtype'].toLowerCase().includes(this.state.filters.subtype.toLowerCase())
        keep = keep && subkeep
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
        let ruleskeep = rules.toLowerCase().includes(this.state.filters.rules.toLowerCase())
        if (backside && backside['rules']) ruleskeep = ruleskeep || backside['rules'].toLowerCase().includes(this.state.filters.rules.toLowerCase())
        keep = keep && ruleskeep
      }

      // Keywords
      if (this.state.filters.keywords.length) {
        let slugified_kws = card.keywords.map((kw) => _.kebabCase(kw))
        if (backside && backside.keywords && backside.keywords.length) {
          slugified_kws = slugified_kws.concat(card.keywords.map((kw) => _.kebabCase(kw)))
        }
        _.forEach(this.state.filters.keywords, (kw) =>{
          keep = keep && _.includes(slugified_kws, kw)
        })
      }

      // Formats
      if (this.state.filters.formats.length) {
        let slugified_formats = card.formats.map((fmt) => this.state.choices.format_map[fmt])
        _.forEach(this.state.filters.formats, (fmt) =>{
          keep = keep && _.includes(slugified_formats, fmt)
        })
      }

      return keep
    })
  }

  resetFilters = () => {
    const empty = {
      name: '',
        formats: [],
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
      companion: '',
      keywords: []
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
          return parseInt(spec['number'])
        }
        if (order === 'type') {
          return spec['type']
        }
        if (order.startsWith('rank_')) {
          if (order === 'rank_cmdr' && spec['cmdr_rank'] && spec['cmdr_rank']['edh']) {
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
      {'label': 'Mana value', 'value': 'cmc'},
      {'label': 'Number', 'value': 'number'},
      {'label': 'Type', 'value': 'type'},
      {'label': 'Commander format rank', 'value': 'rank_edh'},
      {'label': 'As commander rank', 'value': 'rank_cmdr'},
      {'label': 'Standard rank', 'value': 'rank_standard'},
      {'label': 'Modern rank', 'value': 'rank_modern'},
      {'label': 'Legacy rank', 'value': 'rank_legacy'}
    ]
    this.selectedColors = _.keys(this.state.filters.colors).filter(c => this.state.filters.colors[c] === 1)
    this.selectedExcludeColors = _.keys(this.state.filters.colors).filter(c => this.state.filters.colors[c] === -1)
    let filtered_specs = this.orderCards(this.filterCards(this.state.specs))

    if (this.state.loading) {
      main_content = <ProgressBar active now={100} />
    } else if (!filtered_specs.length) {
      main_content = <p style={{'height': '500px'}}>No cards found</p>
    } else {
      let rank_label = 'Commander rank';
      let rank_key = 'rank_edh'
      if (this.state.order_by.startsWith('rank_')) {
        rank_key = this.state.order_by;
        rank_label = order_opts.find((o) => o.value === rank_key).label.replace(' format', '');
      }
      rank_key = rank_key.replace('rank_', '')
      filtered_specs = filtered_specs.map((spec) => {
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
        main_content = <CardImages specs={filtered_specs} choices={this.state.choices} default_tla={SET_TLA}
                                   width={this.state.images_width} backsides={this.state.backsides} rank_label={rank_label} />;
      }
      if (this.state.display === 'table') {
        main_content = <CardTable specs={filtered_specs} choices={this.state.choices} backsides={this.state.backsides} rank_label={rank_label} default_tla={SET_TLA} />
      }
      if (this.state.display === 'list') {
        main_content = <CardList specs={filtered_specs} choices={this.state.choices} backsides={this.state.backsides} rank_label={rank_label} />;
      }
    }
    const widthOrder = this.renderWidthOrder(order_opts, filtered_specs.length)
    return (
      <div>
        <Filter filters={this.state.filters} choices={this.state.choices} filterChange={this.handleFilterChange} resetFilters={this.resetFilters} modalCloseCB={() => {}} disableInputs={this.state.loading} />
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

ReactDOM.render(<SetDetailApp />, document.getElementById('set-detail-root'));
