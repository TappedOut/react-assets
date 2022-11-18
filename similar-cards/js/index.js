import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import Slider from 'react-rangeslider';
import 'react-select/dist/react-select.css';
import 'react-rangeslider/lib/index.css';
import '../../set-detail/css/set-detail.scss';
import CardImage from './components/cardImage';
import CardTable from '../../set-detail/js/components/cardTable'
import { Async } from 'react-select';
import {ProgressBar, Button, Modal, Checkbox, ButtonToolbar, ButtonGroup} from 'react-bootstrap'
const _ = require('lodash');
import 'react-select/dist/react-select.css';
import Select from 'react-select';


const SIMILAR_CARD_API = window.django.similar_api.replace(`\/${window.django.card_slug}`, '');
const AUTOCOMPLETE_API = window.django.autocomplete_api


class SimilarCardsApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      loading_similar: false,
      display: 'images',
      order_by: 'similar',
      choices: {},
      backsides: {},
      current: null,
      current_input_value: '',
      current_value: {'name': '', 'slug': ''},
      similar: null,
      similar_error: false,
      images_width: 300,
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
      showFilters: false,
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
  };

  handleDisplayChange = (val) => {
    this.setState({display: val})
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

  handleFilterInputChange = (event) => {
    const target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    const new_filters = {...this.state.filters, [name]: value}
    this.setState({
      filters: new_filters
    });
  }

  handleFilterSelectChange = (name, selected) => {
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
  }

  handleFormatToggle = (format) => {
    let formats = {...this.state.filters.formats}
    formats[format] = !this.state.filters.formats[format]
    this.setState({filters: {...this.state.filters, formats: formats}})
  }

  handleFiltersClose = () => {
    this.setState({showFilters: false});
  }

  handleFiltersShow = () => {
    this.setState({showFilters: true});
  }

  handleColorToggle = (color) => {
    let colors = {...this.state.filters.colors}
    if (this.state.filters.colors[color] === 0) {
      colors[color] = 1
    } else if (this.state.filters.colors[color] === 1) {
      colors[color] = -1
    } else {
      colors[color] = 0
    }
    this.setState({filters: {...this.state.filters, colors: colors}})
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
    this.filterSpecs(empty)
  }

  handlePriceFromChange = (event) => {
    this.setState({filters: {...this.state.filters, price_from: event.target.value}});
  }

  handlePriceToChange = (event) => {
    this.setState({filters: {...this.state.filters, price_to: event.target.value}});
  }

  filterCards = (cards) => {
    return cards.filter(card => {
      let keep = true

      // formats
      const card_formats = card.formats && card.formats.length ? card.formats : []
      let anyfmt = false
      _.each(card_formats, f => {
        if (_.includes(this.selectedFormats, f)) {
          anyfmt = true
        }
      })
      keep = keep && anyfmt

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
      if ((priceFrom && card.ck_price && priceFrom > card.ck_price) || !card.ck_price) {
        fromkeep = false
      }
      keep = keep && fromkeep
      let tokeep = true
      const priceTo = parseFloat(this.state.filters.price_to)
      if ((priceTo && card.ck_price && priceTo < card.ck_price) || !card.ck_price) {
        tokeep = false
      }
      keep = keep && tokeep

      // type
      if (this.state.filters.type) {
        keep = keep && this.state.filters.type === card.type
      }

      // subtype
      if (this.state.filters.subtype){
        const subtype = card['subtype'] ? card['subtype'] : ''
        keep = keep && subtype.toLowerCase().includes(this.state.filters.subtype.toLowerCase())
      }

      // cmc
      if (this.state.filters.cmc_from || this.state.filters.cmc_from === 0){
        keep = keep && card['mana_value'] >= this.state.filters.cmc_from
      }
      if (this.state.filters.cmc_to || this.state.filters.cmc_to === 0){
        keep = keep && card['mana_value'] <= this.state.filters.cmc_to
      }

      return keep
    })
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

  renderFilters = () => {
    let formatCheckboxes = _.keys(this.state.filters.formats).map(formatName => {
      return (
        <div className="col-lg-3 col-xs-6">
          <Checkbox
            onChange={() => this.handleFormatToggle(formatName)}
            checked={this.state.filters.formats[formatName]}
          >{formatName}</Checkbox>
        </div>
      )
    })
    let colorCheckboxes = _.keys(this.state.filters.colors).map(color => {
      let icon = 'minus'
      let icon_color = 'white'
      if (this.state.filters.colors[color] === 1) {
        icon = 'ok'
        icon_color = 'green'
      } else if (this.state.filters.colors[color] === -1) {
        icon = 'remove'
        icon_color = 'red'
      }
      return (
        <div className="col-lg-4 col-xs-4">
          <div className="form-group">
            <button onClick={() => this.handleColorToggle(color)} className="btn btn-sm btn-default btn-block">
              <i className={`ms ms-${color} ms-cost ms-shadow ms-1point2x`}></i>&nbsp;&nbsp;
              <span style={{'color': icon_color}} className={`glyphicon glyphicon-${icon}`} aria-hidden="true"></span>
            </button>
          </div>
        </div>
      )
    })
    return (
      <div className="row">
        <div className="col-lg-12 col-xs-12">
          <div className="well">
            <div className="row">
              <div className="col-lg-3 col-md-4 col-xs-12">
                {colorCheckboxes}
              </div>
              <div className="col-lg-3 col-md-4 col-xs-12">
                <div className="form-group">
                  <label>Price</label>
                  <div className="row">
                    <div className="col-lg-5 col-xs-5"><input name="price_from" type="number" className="form-control" onChange={this.handlePriceFromChange} value={this.state.filters.price_from} /></div>
                    <div className="col-lg-1 col-xs-1">to</div>
                    <div className="col-lg-5 col-xs-5"><input name="price_to" type="number" className="form-control" onChange={this.handlePriceToChange} value={this.state.filters.price_to} /></div>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-md-4 col-xs-12">
                <Button variant="primary" onClick={this.handleFiltersShow} block>
                  More Filters
                </Button>
                <Button variant="primary" onClick={this.resetFilters} block>
                  Reset Filters
                </Button>
                <Modal show={this.state.showFilters} onHide={this.handleFiltersClose}>
                  <Modal.Body>
                    <div className="row">
                      {formatCheckboxes}
                    </div>
                    <div className="row">
                      <div className="col-lg-6 col-xs-12">
                        <div className="form-group">
                          <label className="control-label">Type</label>
                          <Select
                            name="type"
                            onChange={(v) => this.handleFilterSelectChange('type', v)}
                            value={this.state.filters.type}
                            options={this.state.choices.type_opts}
                          />
                        </div>
                      </div>
                      <div className="col-lg-6 col-xs-12">
                        <div className="form-group">
                          <label className="control-label">Subtype</label>
                          <input name="subtype" value={this.state.filters.subtype} className="form-control" onChange={this.handleFilterInputChange}/>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-6 col-xs-12">
                        <div className="form-group">
                          <label>CMC</label>
                          <div className="row">
                            <div className="col-lg-5 col-xs-5"><input name="cmc_from" type="text" className="form-control" onChange={this.handleFilterInputChange} value={this.state.filters.cmc_from} /></div>
                            <div className="col-lg-1 col-xs-1">to</div>
                            <div className="col-lg-5 col-xs-5"><input name="cmc_to" type="text" className="form-control" onChange={this.handleFilterInputChange} value={this.state.filters.cmc_to} /></div>
                            </div>
                          </div>
                      </div>
                    </div>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={this.handleFiltersClose}>
                      Close
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

  renderWidthOrder = () => {
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
    order_opts = order_opts.map(opt => <option value={opt.value}>{opt.label}</option>)
    return (
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
              {/*{window.django.is_mobile &&*/}
              {/*<Button onClick={() => this.handleDisplayChange('list')} disabled={this.state.display === 'list'}>List</Button>}*/}
            </ButtonGroup>
          </ButtonToolbar>
        </div>
        {/*<div className="col-lg-1 col-md-2 col-xs-5">*/}
        {/*  <select onChange={this.handleOrderChange} className="form-control input-sm">*/}
        {/*    {order_opts}*/}
        {/*  </select>*/}
        {/*</div>*/}
      </div>
    )
  }

  render() {
    if (this.state.loading) {
      return (<div style={{'margin-top': '18px'}}>
        <ProgressBar active now={100} />
      </div>)
    }

    let similar = <ProgressBar active now={100} />
    if (this.state.similar_error) {
      similar = <p>No similar data found. Please try a different card.</p>
    }
    this.selectedFormats = _.keys(this.state.filters.formats).filter(f => this.state.filters.formats[f])
    this.selectedColors = _.keys(this.state.filters.colors).filter(c => this.state.filters.colors[c] === 1)
    this.selectedExcludeColors = _.keys(this.state.filters.colors).filter(c => this.state.filters.colors[c] === -1)
    if (!this.state.loading_similar) {
      if (this.state.display === 'images') {
        similar = this.filterCards(this.state.similar).map(card => {
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
            <CardTable specs={this.filterCards(this.state.similar)}
                             choices={this.state.choices}
                             backsides={this.state.backsides}
                             cardClickCB={this.handleCardClick}/>
          </div>
        )
      }
    }
    const leftBlock = this.renderLeftBlock()
    const filters = this.renderFilters()
    const widthOrder = this.renderWidthOrder()

    return (
      <div>
        <div className="row" style={{'margin-top': '18px'}}>
          <div className="col-lg-2 col-md-3 col-xs-12">
            {leftBlock}
          </div>
          <div className="col-lg-10 col-md-9 col-xs-12">
            {filters}
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
