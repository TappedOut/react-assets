import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import 'react-select/dist/react-select.css';
import { Async } from 'react-select';
import {ProgressBar, Button, Modal, Checkbox, Badge} from 'react-bootstrap'
const _ = require('lodash');


const SIMILAR_CARD_API = window.django.similar_api.replace(`\/${window.django.card_slug}`, '');
const AUTOCOMPLETE_API = window.django.autocomplete_api


class SimilarCardsApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      loading_similar: false,
      current: null,
      current_input_value: '',
      current_value: {'name': '', 'slug': ''},
      similar: null,
      similar_error: false,
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
        'u': true,
        'b': true,
        'g': true,
        'r': true,
        'w': true,
        'c': true,
      },
      exclude_colors: {
        'u': false,
        'b': false,
        'g': false,
        'r': false,
        'w': false,
        'c': false,
      },
      showFormats: false,
      showColors: false,
      priceFrom: '',
      priceTo: ''
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

  handleFormatToggle = (format) => {
    let formats = {...this.state.formats}
    formats[format] = !this.state.formats[format]
    this.setState({formats: formats})
  }

  handleFormatsClose = () => {
    this.setState({showFormats: false});
  }

  handleFormatsShow = () => {
    this.setState({showFormats: true});
  }

  handleColorToggle = (color) => {
    let colors = {...this.state.colors}
    colors[color] = !this.state.colors[color]
    this.setState({colors: colors})
  }

  handleExcludeColorToggle = (color) => {
    let exclude_colors = {...this.state.exclude_colors}
    exclude_colors[color] = !this.state.exclude_colors[color]
    this.setState({exclude_colors: exclude_colors})
  }

  handleColorsClose = () => {
    this.setState({showColors: false});
  }

  handleColorsShow = () => {
    this.setState({showColors: true});
  }

  handlePriceFromChange = (event) => {
    this.setState({priceFrom: event.target.value});
  }

  handlePriceToChange = (event) => {
    this.setState({priceTo: event.target.value});
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
    const selectedFormats = _.keys(this.state.formats).filter(f => this.state.formats[f])
    const selectedColors = _.keys(this.state.colors).filter(c => this.state.colors[c])
    const selectedExcludeColors = _.keys(this.state.exclude_colors).filter(c => this.state.exclude_colors[c])
    if (!this.state.loading_similar) {
      similar = this.state.similar.filter(card => {
        let keep = true
        const card_formats = card.formats && card.formats.length ? card.formats : []
        let anyfmt = false
        _.each(card_formats, f => {
          if (_.includes(selectedFormats, f)) {
            anyfmt = true
          }
        })
        keep = keep && anyfmt

        const colors = card['effective_cost'] ? card['effective_cost'] : []
        let anycolor = false
        _.each(selectedColors, c => {
          c = c.toUpperCase()
          if (_.includes(colors, c)) {
            anycolor = true
          }
          if (c === 'C' && !colors.length) {
            anycolor = true
          }
        })
        keep = keep && anycolor

        let anyexclude = true
        _.each(selectedExcludeColors, c => {
          c = c.toUpperCase()
          if (_.includes(colors, c)) {
            anyexclude = false
          }
          if (c === 'C' && !colors.length) {
            anyexclude = false
          }
        })
        keep = keep && anyexclude

        let fromkeep = true
        const priceFrom = parseFloat(this.state.priceFrom)
        if ((priceFrom && card.ck_price && priceFrom > card.ck_price) || !card.ck_price) {
          fromkeep = false
        }
        keep = keep && fromkeep

        let tokeep = true
        const priceTo = parseFloat(this.state.priceTo)
        if ((priceTo && card.ck_price && priceTo < card.ck_price) || !card.ck_price) {
          tokeep = false
        }
        keep = keep && tokeep

        return keep
      }).map(card => {
        return (
          <div style={{'margin': '8px 0 8px 0', 'cursor': 'pointer'}} className="col-lg-2 col-md-4 col-xs-12">
            <img onClick={() => this.handleCardClick(card)} className="img-responsive" src={card.image}
                 alt={card.name}/>
          </div>
        )
      })
    }

    let formatCheckboxes = _.keys(this.state.formats).map(formatName => {
      return (
        <div className="col-lg-3 col-xs-6">
          <Checkbox
            onChange={() => this.handleFormatToggle(formatName)}
            checked={this.state.formats[formatName]}
          >{formatName}</Checkbox>
        </div>
      )
    })
    let colorCheckboxes = _.keys(this.state.colors).map(color => {
      return (
        <div className="col-lg-4 col-xs-4">
          <div className="form-group">
            <div className="checkbox">
              <label htmlFor={`${color}-filter`}>
                <input id={`${color}-filter`} type="checkbox" name={`${color}`}
                  checked={this.state.colors[color]}
                  onChange={() => this.handleColorToggle(color)}/>
               <i className={`ms ms-${color} ms-cost ms-shadow ms-1point2x`}></i>
              </label>
            </div>
          </div>
        </div>
      )
    })
    let excludeColorCheckboxes = _.keys(this.state.exclude_colors).map(color => {
      return (
        <div className="col-lg-4 col-xs-4">
          <div className="form-group">
            <div className="checkbox">
              <label htmlFor={`${color}-exclude-filter`}>
                <input id={`${color}-exclude-filter`} type="checkbox" name={`excl_${color}`}
                  checked={this.state.exclude_colors[color]}
                  onChange={() => this.handleExcludeColorToggle(color)}/>
               <i className={`ms ms-${color} ms-cost ms-shadow ms-1point2x`}></i>
              </label>
            </div>
          </div>
        </div>
      )
    })
    return (
      <div>
        <div className="row" style={{'margin-top': '18px'}}>
          <div className="col-lg-2 col-md-3 col-xs-12">
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
          </div>
          <div className="col-lg-10 col-md-9 col-xs-12">
            <div className="row">
              <div className="col-lg-12 col-xs-12">
                <div className="well">
                  <div className="row">
                    <div className="col-lg-2 col-xs-6">
                      <div style={{'margin-top': '25px'}}>
                        <Button variant="primary" onClick={this.handleFormatsShow} block>
                          Formats <Badge>{selectedFormats.length}</Badge>
                        </Button>
                      </div>
                      <Modal show={this.state.showFormats} onHide={this.handleFormatsClose}>
                        <Modal.Body>
                          <div className="row">
                            {formatCheckboxes}
                          </div>
                        </Modal.Body>
                        <Modal.Footer>
                          <Button variant="secondary" onClick={this.handleFormatsClose}>
                            Close
                          </Button>
                        </Modal.Footer>
                      </Modal>
                    </div>
                    <div className="col-lg-2 col-xs-6">
                      <div style={{'margin-top': '25px'}}>
                        <Button variant="primary" onClick={this.handleColorsShow} block>
                          Colors <Badge>{selectedColors.length}/{selectedExcludeColors.length}</Badge>
                        </Button>
                      </div>
                      <Modal show={this.state.showColors} onHide={this.handleColorsClose}>
                        <Modal.Body>
                          <h3>Include</h3>
                          <div className="row">
                            {colorCheckboxes}
                          </div>
                          <h3>Exclude</h3>
                          <div className="row">
                            {excludeColorCheckboxes}
                          </div>
                        </Modal.Body>
                        <Modal.Footer>
                          <Button variant="secondary" onClick={this.handleColorsClose}>
                            Close
                          </Button>
                        </Modal.Footer>
                      </Modal>
                    </div>
                    <div className="col-lg-6 col-xs-12">
                      <div className="form-group">
                        <label>Price</label>
                        <div className="row">
                          <div className="col-lg-5 col-xs-5"><input name="price_from" type="number" className="form-control" onChange={this.handlePriceFromChange} value={this.state.priceFrom} /></div>
                          <div className="col-lg-1 col-xs-1">to</div>
                          <div className="col-lg-5 col-xs-5"><input name="price_to" type="number" className="form-control" onChange={this.handlePriceToChange} value={this.state.priceTo} /></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="row">
              <div style={{'overflow': 'auto', 'height': 'calc(100vh - 200px)'}} className="col-lg-12 col-xs-12">
                {similar}
              </div>
            </div>
          </div>
        </div>
      </div>
      )
    }
  }

ReactDOM.render(<SimilarCardsApp />, document.getElementById('similar-root'));
