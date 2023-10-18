import React from 'react';
import axios from 'axios';
import 'react-rangeslider/lib/index.css';
import InfiniteScroll from 'react-infinite-scroll-component';
import {ProgressBar, FormGroup, InputGroup, FormControl, Button, Col, Row} from 'react-bootstrap'
import DeckCards from './components/deckCards.js';
import DeckTable from './components/deckTable.js';
import Filter from "./components/filters.js";
import 'react-select/dist/react-select.css';
import '../../set-detail/css/set-detail.scss';
const _ = require('lodash');


const DECK_LIST_API = window.django.deck_list_api


export default class DeckListApp extends React.Component {
  constructor(props) {
    super(props);
    const filters = this.buildFilterDefaults()
    this.state = {
      decks: [],
      selected_decks: [],
      total_decks: 0,
      page: 1,
      loading: true,
      disable_main_inputs: true,
      display: 'cards',
      api_error: '',
      order_by: 'date_updated',
      order_dir: '-',
      filters: filters,
    }
    this.get_decks(this.state.filters, `${this.state.order_dir}${this.state.order_by}`, 1)
    this.debounced_get_decks = _.debounce(
      (filters, order, page) => this.get_decks(filters, order, page),
      1500
    )
  }

  buildFilterDefaults = () => {
    return {
      name: '',
      description: '',
      mtg_format: '',
      colors: [],
      checkboxes: {
        is_prototype: 0,
        is_archived: 0
      }
    }
  }

  get_decks = (filters, order, page) => {
    let initial = {disable_main_inputs: true}
    if (page === 1) initial.loading = true
    this.setState(initial)
    let get_params = `?p=${page}`
    if (filters) get_params += this.buildFilterGET(filters)
    if (order) get_params += this.buildOrderGET(order)
    axios.get(
      `${DECK_LIST_API}${get_params}`,
    ).then(
      response => {
        let card_display = response.data.reduce_images ? 'table' : 'cards'
        if (localStorage) {
          const saved_display = localStorage.getItem('toDeckDisplay')
          if (_.includes(['cards', 'table'], saved_display)) {
            card_display = saved_display;
          }
        }
        const decks = page === 1 ? response.data.results : this.state.decks.concat(response.data.results)
        this.setState({
          display: card_display,
          decks: decks,
          total_decks: response.data.total_decks,
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
        case 'checkboxes':
          _.forOwn(filters.checkboxes, (cvalue, ckey) => {
            if (cvalue === 1) get_params += `&${ckey}=true`
            if (cvalue === -1) get_params += `&${ckey}=false`
          })
          break
        case 'colors':
          _.forEach(filters.colors, (val) => {
            if (val) get_params += `&colors=${val.toUpperCase()}`
          })
          break
        default:
          if (value) get_params += `&${key}=${value}`
      }
    });
    return get_params
  }

  buildOrderGET = (order) => {
    const allowed = ['date_updated', '-date_updated', 'name', '-name', 'color', '-color', 'format', '-format']
    if (_.includes(allowed, order)) return `&o=${order}`
    return ''
  }

  handleDisplayChange = (val) => {
    this.setState({display: val})
    if (localStorage) localStorage.setItem('toDeckDisplay', val)
  }

  resetFilters = () => {
    const empty = this.buildFilterDefaults()
    this.setState({filters: empty, disable_main_inputs: true})
    this.get_decks({}, `${this.state.order_dir}${this.state.order_by}`, 1)
  }

  handleFilterChange = (name, value) => {
    const new_filters = {...this.state.filters, [name]: value}
    this.setState({
      filters: new_filters,
    });
    if (name === 'name') this.debounced_get_decks(new_filters, `${this.state.order_dir}${this.state.order_by}`, 1)
  }

  handleOrderChange = (event) => {
    this.setState({order_by: event.target.value})
    this.get_decks(this.state.filters, `${this.state.order_dir}${event.target.value}`, 1)
  }

  handleAscDescChange = () => {
    const new_dir = this.state.order_dir === '' ? '-' : ''
    this.setState({order_dir: new_dir})
    this.get_decks(this.state.filters, `${new_dir}${this.state.order_by}`, 1)
  }

  handleFilterModalClose = () => {
    this.get_decks(this.state.filters, `${this.state.order_dir}${this.state.order_by}`, 1)
  }

  handleDeckCheckboxToggle = (deck_id) => {
    const selected = this.state.selected_decks
    const i = selected.indexOf(deck_id)
    if (i >= 0) {
      selected.splice(i, 1)
    } else {
      selected.push(deck_id)
    }
    this.setState({'selected_decks': selected})
  }

  renderWidthOrder = (order_opts) => {
    order_opts = order_opts.map(opt => <option value={opt.value}>{opt.label}</option>)
    return (
      <div style={{"margin-bottom": "15px"}} className="row">
        <div className="col-lg-2 col-md-2 col-xs-7">
          <div className="btn-group" role="group" style={{'display': 'flex'}}>
            <button className="btn btn-default btn-sm" style={{'flex': 1}} onClick={() => this.handleDisplayChange('table')} disabled={this.state.display === 'table'}>Table</button>
            <button className="btn btn-default btn-sm" style={{'flex': 1}} onClick={() => this.handleDisplayChange('cards')} disabled={this.state.display === 'cards'}>Cards</button>
          </div>
        </div>
        <div className="col-lg-2 col-md-2 col-xs-5">
          <FormGroup>
            <InputGroup style={{'z-index': '0'}}>
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
        <div className="col-lg-2 col-md-2 col-xs-4">{this.state.decks.length} / {this.state.total_decks}</div>
      </div>
    )
  }

  render() {
    let main_content;
    let order_opts = [
      {'label': 'Date Updated', 'value': 'date_updated'},
      {'label': 'Name', 'value': 'name'},
      {'label': 'Color', 'value': 'color'},
      {'label': 'Format', 'value': 'format'}
    ]
    let decks = this.state.decks

    if (this.state.loading) {
      main_content = <ProgressBar active now={100} />
    } else if (!decks.length) {
      main_content = <p style={{'height': '500px'}}>No decks found</p>
    } else {
      if (this.state.display === 'cards') {
        main_content = (
          <Row>
            <InfiniteScroll
              dataLength={this.state.decks.length}
              next={() => this.get_decks(this.state.filters, this.state.order_by, this.state.page)}
              hasMore={this.state.decks.length < this.state.total_decks && !this.state.loading}
              loader={<ProgressBar active now={100} />}
            >
             <DeckCards decks={decks} selectedDecks={this.state.selected_decks} deckCheckboxToggle={this.handleDeckCheckboxToggle}/>
            </InfiniteScroll>
          </Row>
        )
      }
      if (this.state.display === 'table') {
        main_content = (
          <InfiniteScroll
            dataLength={this.state.decks.length}
            next={() => this.get_decks(this.state.filters, this.state.order_by, this.state.page)}
            hasMore={this.state.decks.length < this.state.total_decks && !this.state.loading}
            loader={<ProgressBar active now={100} />}
          >
           <DeckTable decks={decks} selectedDecks={this.state.selected_decks} deckCheckboxToggle={this.handleDeckCheckboxToggle}/>
          </InfiniteScroll>
        )
      }
    }
    const widthOrder = this.renderWidthOrder(order_opts)
    return (
      <div>
        <Filter filters={this.state.filters} filterChange={this.handleFilterChange} decksSelected={!!this.state.selected_decks.length}
                resetFilters={this.resetFilters} modalCloseCB={this.handleFilterModalClose} disableInputs={this.state.disable_main_inputs}/>
        {widthOrder}
        <Row>
          <Col xs={12} sm={12} md={12} lg={12}>
            {main_content}
          </Col>
        </Row>
      </div>
    )
  }
}
