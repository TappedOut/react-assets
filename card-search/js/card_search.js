import React from 'react';
import axios from 'axios';
import Slider from 'react-rangeslider';
import 'react-rangeslider/lib/index.css';
import InfiniteScroll from 'react-infinite-scroll-component';
import {ProgressBar, FormGroup, InputGroup, FormControl, Button, Tabs, Tab} from 'react-bootstrap';
import Cookies from "js-cookie";
import CardImages from '../../set-detail/js/components/cardImages.js';
import CardTable from '../../set-detail/js/components/cardTable.js';
import CardList from '../../set-detail/js/components/cardList.js';
import Filter from "../../set-detail/js/components/filters.js";
import FiltersLLM from "./components/filtersLLM.js"
import 'react-select/dist/react-select.css';
import '../../set-detail/css/set-detail.scss';
const _ = require('lodash');


const CARD_SEARCH_API = window.django.card_filter_api
const LLM_CARD_SEARCH_API = window.django.llm_browser_api
const ALLOWED_PARAMS = [
  'name', 'formats', 'color', 'price_to', 'price_from', 'mana_value_min', 'mana_value_max', 'rarity', 'mana_cost',
  'type', 'subtype', 'rules', 'companion'
]
const FORMATS_MAP_BACK = {}
_.forOwn(window.django.formats_map, (val, key) => {FORMATS_MAP_BACK[val] = key})


export default class CardSearchApp extends React.Component {
  constructor(props) {
    super(props);
    let img_width = localStorage ? parseInt(localStorage.getItem('toImgWidth')) : 300
    if (!img_width || img_width < 100 || img_width > 500) {
      img_width = 300
    }
    const filters = this.buildFilterDefaults()
    const llm_filters = this.buildLLMFilterDefaults()
    this.state = {
      specs: [],
      llm_specs: [],
      total_specs: 0,
      tab_type: 1,
      page: 1,
      loading: true,
      disable_main_inputs: true,
      display: 'images',
      vendors: ['tcg'],
      api_error: '',
      llm_api_error: '',
      order_by: 'name',
      order_dir: '',
      choices: {},
      images_width: img_width,
      backsides: {},
      filters: filters,
      llm_filters : llm_filters,
      feedback_enabled: true,
    }
    this.get_cards(this.state.filters, 'name', 1, true)
    this.debounced_get_cards = _.debounce(
      (filters, order, page, get_choices) => this.get_cards(filters, order, page, get_choices),
      1500
    )
  }

  handleTabTypeChange = (key) => {
    this.setState({ tab_type: key });
  }

  buildFilterDefaults = () => {
    const filters = {
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
      keywords: [],
      sets: []
    }
    const queryParameters = new URLSearchParams(window.location.search)
    for (const [key, value] of queryParameters.entries()) {
      switch(key) {
        case 'formats':
          if (value) filters.formats.push(value)
            break
        case 'color':
          if (value && filters.colors.hasOwnProperty(value.toLowerCase())) filters.colors[value.toLowerCase()] = 1
          break
        case 'color_exclude':
          if (value && filters.colors.hasOwnProperty(value.toLowerCase())) filters.colors[value.toLowerCase()] = -1
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
        case 'keywords':
          if (value) filters.keywords.push(value)
          break
        case 'sets':
          if (value) filters.sets.push(value)
          break
        default:
          if (value && _.includes(ALLOWED_PARAMS, key)) filters[key] = value
      }
    }
    return filters
  }

  buildLLMFilterDefaults = () => {
    const filters = {
      semantic_query: '',
      hard_query: '',
      mtg_format: '',
      colors: {
        'u': 0,
        'b': 0,
        'g': 0,
        'r': 0,
        'w': 0,
        'c': 0,
      },
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
          page: page + 1,
          api_error: ''
        })
      },
      error => {
        this.setState({
          loading: false,
          api_error: 'Error getting card info. Please refresh the page.'
        })
      }
    )
  }

  getLLMCards = () => {
    if (!this.state.llm_filters.semantic_query && !this.state.llm_filters.hard_query) {
      this.setState({
        loading: false,
        disable_main_inputs: false,
        llm_api_error: 'General or rules query is required.'
      })
      return
    }
    this.setState({
      disable_main_inputs: true,
      loading: true
    })
    const get_params = this.buildFilterGET(this.state.llm_filters)
    axios.get(
      `${LLM_CARD_SEARCH_API}?${get_params}`,
    ).then(
      response => {
        const specs = response.data.results
        this.setState({
          llm_specs: specs,
          loading: false,
          disable_main_inputs: false,
          llm_api_error: ''
        })
      },
      error => {
        this.setState({
          loading: false,
          disable_main_inputs: false,
          llm_api_error: error.response.data.error ? error.response.data.error : 'Error getting card info. Please refresh the page.'
        })
      }
    )
  }

  buildFilterGET = (filters) => {
    let get_params = ''
    _.forOwn(filters, (value, key) => {
      switch(key) {
        case 'formats':
          _.forEach(value, (kw) => {
            if (kw) get_params += `&formats=${kw}`
          })
          break
        case 'colors':
          _.forOwn(filters.colors, (cvalue, ckey) => {
            if (cvalue === 1) get_params += `&con_color=${ckey.toUpperCase()}`
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
        case 'keywords':
          _.forEach(value, (kw) => {
            if (kw) get_params += `&keywords=${kw}`
          })
          break
        case 'sets':
          _.forEach(value, (kw) => {
            if (kw) get_params += `&sets=${kw}`
          })
          break
        default:
          if (value) get_params += `&${key}=${value}`
      }
    });
    return get_params
  }

  buildOrderGET = (order) => {
    if (order === 'name') return '&o=name_sort'
    if (order === '-name') return '&o=-name_sort'
    if (order === 'mana_value') return '&o=mana_cost_converted'
    if (order === '-mana_value') return '&o=-mana_cost_converted'
    if (order === 'color') return '&o=cannonical_color'
    if (order === '-color') return '&o=-cannonical_color'
    const allowed = ['type', '-type']
    if (_.includes(allowed, order)) return `&o=${order}`
    return ''
  }

  formatGET = (format) => {
    return FORMATS_MAP_BACK[format]
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
      keywords: [],
      sets: []
    }
    this.setState({filters: empty, disable_main_inputs: true})
    this.get_cards({}, `${this.state.order_dir}${this.state.order_by}`, 1, true)
  }

  handleFilterChange = (name, value) => {
    const main_input = _.includes(['colors', 'name'], name)
    const new_filters = {...this.state.filters, [name]: value}
    this.setState({
      filters: new_filters,
    });
    if (main_input) this.debounced_get_cards(new_filters, `${this.state.order_dir}${this.state.order_by}`, 1, true)
  }

  handleLLMFilterChange = (name, value) => {
    const new_filters = {...this.state.llm_filters, [name]: value}
    this.setState({
      llm_filters: new_filters,
    });
  }

  handleOrderChange = (event) => {
    this.setState({
      order_by: event.target.value,
    })
    this.get_cards(this.state.filters, `${this.state.order_dir}${event.target.value}`, 1, false)
  }

  handleAscDescChange = () => {
    const new_dir = this.state.order_dir === '' ? '-' : ''
    this.setState({order_dir: new_dir})
    this.get_cards(this.state.filters, `${new_dir}${this.state.order_by}`, 1, false)
  }

  handleFilterModalClose = () => {
    this.get_cards(this.state.filters, `${this.state.order_dir}${this.state.order_by}`, 1, true)
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
        {this.state.tab_type === 1 && 
          <div className="col-lg-2 col-md-2 col-xs-5">
            <FormGroup>
              <InputGroup>
                <FormControl bsSize="small" componentClass="select" onChange={this.handleOrderChange} value={this.state.order_by}>
                  {order_opts}
                </FormControl>
                <InputGroup.Button>
                  <Button bsSize="small" onClick={this.handleAscDescChange} style={{'font-size': '16px'}}>
                    {this.state.order_dir === '' ?
                      <span className="glyphicon glyphicon-sort-by-attributes" aria-hidden="true"></span>
                      :
                      <span className="glyphicon glyphicon-sort-by-attributes-alt" aria-hidden="true"></span>}
                  </Button>
                </InputGroup.Button>
              </InputGroup>
            </FormGroup>
          </div>
        }
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
        {this.state.tab_type === 1 && 
          <div className="col-lg-2 col-md-2 col-xs-4">{this.state.specs.length} / {this.state.total_specs}</div>
        }
        {/* {this.state.tab_type === 2 && 
          <div className="col-lg-3 col-md-3 col-xs-4"><Feedback specs={this.state.llm_specs} filters={this.state.llm_filters} /></div>
        } */}
      </div>
    )
  }

  sendFeedback = (card_pk, action) => {
    this.setState({feedback_enabled: false})
    const post_data = {
      'card_pk': card_pk,
      'action': action
    }
    if (this.state.llm_filters.hard_query) post_data['hard_query'] = this.state.llm_filters.hard_query
    if (this.state.llm_filters.semantic_query) post_data['semantic_query'] = this.state.llm_filters.semantic_query
    if (this.state.llm_filters.mtg_format) post_data['mtg_format'] = this.state.llm_filters.mtg_format
    
    axios.post(
      window.django.feedback_api, post_data, {headers: { 'X-CSRFToken': Cookies.get('csrftoken') }}
    ).then(
      response => {
        this.setState({
          feedback_enabled: true
        })
      },
      error => {
        this.setState({
          feedback_enabled: true
        })
      }
    )
    .catch(error => {
      this.setState({
        feedback_enabled: true
      })
    })
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
    this.selectedColors = _.keys(this.state.filters.colors).filter(c => this.state.filters.colors[c] === 1)
    this.selectedExcludeColors = _.keys(this.state.filters.colors).filter(c => this.state.filters.colors[c] === -1)
    let specs = this.state.tab_type === 1 ? this.state.specs : this.state.llm_specs
    let error = this.state.tab_type === 1 ? this.state.api_error : this.state.llm_api_error

    let feedbackCB;
    if (this.state.tab_type === 2) {
      feedbackCB = this.sendFeedback
    }

    if (this.state.loading) {
      main_content = <ProgressBar active now={100} />
    } else if (error) {
      main_content = <p style={{'height': '500px'}} dangerouslySetInnerHTML={{ __html: error }} />
    } else if (!specs.length) {
      main_content = <p style={{'height': '500px'}}>No cards found</p>
    } else {
      if (this.state.display === 'images') {
        main_content = <CardImages specs={specs} choices={this.state.choices} feedbackCB={feedbackCB} feedback_enabled={this.state.feedback_enabled}
                                   width={this.state.images_width} backsides={this.state.backsides} rank_label={''} />;
      }
      if (this.state.display === 'table') {
        main_content = <CardTable specs={specs} choices={this.state.choices} backsides={this.state.backsides} 
                                  rank_label={''} feedbackCB={feedbackCB} feedback_enabled={this.state.feedback_enabled} />
      }
      if (this.state.display === 'list') {
        main_content = <CardList specs={specs} choices={this.state.choices} backsides={this.state.backsides} rank_label={''} />;
      }
    }

    if (this.state.tab_type === 1) {
      main_content = (
        <InfiniteScroll
          dataLength={this.state.specs.length}
          next={() => this.get_cards(this.state.filters, this.state.order_by, this.state.page, false)}
          hasMore={this.state.specs.length < this.state.total_specs && !this.state.loading}
          loader={<ProgressBar active now={100} />}
        >
          {main_content}
        </InfiniteScroll>
      )
    }
    
    const widthOrder = this.renderWidthOrder(order_opts)
    return (
      <div>
        <div className="row">
          <div className="col-lg-6 col-xs-12">
            <Tabs
              activeKey={this.state.tab_type}
              onSelect={this.handleTabTypeChange}
            >
              <Tab eventKey={1} title="Search">
                <Filter filters={this.state.filters} choices={this.state.choices} filterChange={this.handleFilterChange}
                        resetFilters={this.resetFilters} modalCloseCB={this.handleFilterModalClose} disableInputs={this.state.disable_main_inputs}/>
              </Tab>
              <Tab eventKey={2} title="GPT Search">
                <FiltersLLM filters={this.state.llm_filters} choices={this.state.choices} disableInputs={this.state.disable_main_inputs} 
                            filterChange={this.handleLLMFilterChange} performSearch={this.getLLMCards} />
              </Tab>
            </Tabs>
          </div>
        </div>
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
