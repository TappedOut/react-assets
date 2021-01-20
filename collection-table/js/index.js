import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import InventoryFilters from "./components/inventory_filters";
import {Button, Collapse} from 'react-bootstrap'
import InventoryCard from "./components/inventory_card";
import InventoryHeader from "./components/inventory_headers";
const _ = require('lodash');


const INIT_URL = window.django.init_url;


class CollectionTableApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cards: [],
      init_data: {},
      total_cards: 0,
      total_qty: 0,
      total_price: 0,
      filtered_cards: 0,
      page: 1,
      loading: true,
      initializing: true,
      export_value: '',
      filter_open: false,
      filter_data: {},
      error: ''
    }
    this.handleExport = this.handleExport.bind(this);
    this.handleCardEdit = this.handleCardEdit.bind(this);
    this.toggleFilters = this.toggleFilters.bind(this);
    this.handleFilter = this.handleFilter.bind(this);
    this.initialize(INIT_URL);
  }

  initialize(url) {
    axios.get(
      url
    ).then(
      response => {
        this.setState({
          init_data: response.data,
          initializing: false
        })
        this.searchCards({}, 1);
      }
    )
  }

  searchCards(data, page){
    this.setState({loading: true})
    let get_data = {
      'start': 50 * (page - 1),
      'end': 50 * page
    }
    for (let [key, value] of Object.entries(data)) {
      if (Array.isArray(value) && value.length) {
        get_data[key] = value.join(',')
      } else if (value) {
        get_data[key] = value
      }
    }

    axios.get(
      this.state.init_data.urls.rows_api, {
        'params': get_data
      }
    ).then(response => {
      this.setState({
        cards: response.data.data,
        total_cards: response.data.recordsTotal,
        filtered_cards: response.data.recordsFiltered,
        total_qty: response.data.quantityTotal,
        total_price: response.data.priceTotal,
        loading: false,
        error: ''
      })
      document.addEventListener('card-added', event => {
        this.searchCards(this.state.filter_data, this.state.page)
      })
    }).catch(error => {
    let error_msg = 'Error getting the card data.';
    if (error.response && error.response.data && error.response.data.errors) {
      error_msg = error.response.data.errors
    }
    this.setState({
        cards: [],
        total_cards: 0,
        filtered_cards: 0,
        total_qty: 0,
        total_price: 0,
        loading: false,
        error: error_msg
      })
  });
  }

  toggleFilters() {
    this.setState({filter_open: !this.state.filter_open})
  }

  handleFilter(data) {
    this.setState({filter_data: data});
    this.searchCards(data, this.state.page)
  }

  handleCardEdit() {
    this.searchCards(this.state.filter_data, this.state.page)
  }

  handlePageChange(page) {
    this.setState({page: page});
    this.searchCards(this.state.filter_data, page)
  }

  handleExport(event) {
    const val = event.target.value;
    this.setState({export_value: val})
    window.location.href = `${window.location.href.split('?')[0]}?fmt=${val}`
  }

  render() {
    if (this.state.initializing) return <div className="loading">Loading</div>

    // pages stuff
    const total_pages = Math.ceil(this.state.total_cards / 50);
    let elipsis = false;
    const pages = _.range(1, total_pages + 1).map(i => {
      if (i !== 1 && i !== total_pages && i !== this.state.page &&
          (this.state.page + 5 < i || i < this.state.page - 5)) {
        if (!elipsis) {
          elipsis = true;
          return <Button disabled="true">...</Button>
        }
        return
      }
      const active = i === this.state.page;
      elipsis = false;
      const label = i === 1 ? "Page 1" : `${i}`;
      return <Button
        onClick={event => this.handlePageChange(i)}
        active={active} disabled={active || this.state.loading}>{label}</Button>
    })

    // cards stuff
    const cards = this.state.cards.map(card => {
      return (
        <InventoryCard
          data={card}
          init_data={this.state.init_data}
          onEdit={this.handleCardEdit}
        />
      );
    })

    // export
    const export_options = this.state.init_data.selects.export.map(opts => <option value={opts.value}>{opts.name}</option>)

    return (
      <div>
        <div className="row">
          <div className="col-lg-8 col-xs-12">
            <div className="well">
              <div className="row">
                <div className="col-lg-6 col-xs-6">
                  <button
                    onClick={this.toggleFilters}
                    aria-controls="filter-well"
                    aria-expanded={this.state.filter_open}
                    className="btn btn-md btn-block">
                    Filter
                  </button>
                </div>
                <div className="col-lg-6 col-xs-6">
                  <button className="btn btn-sm btn-success btn-block" data-toggle="modal" data-target="#addModal"><span className="glyphicon glyphicon-plus"></span> Add Card</button>
                </div>
              </div>
              <div className="row" style={{'margin-top': '5px'}}>
                <div className="col-lg-6 col-xs-6">
                  <a className="btn btn-sm btn-primary btn-block" href={this.state.init_data.urls.find_decks}>Find decks</a>
                </div>
                <div className="col-lg-6 col-xs-6">
                  <form action="." method="get" className="navbar-search">
                    <select name="fmt" className="form-control input-sm" onChange={this.handleExport} value={this.state.export_value}>
                      <option value="">Export/Download</option>
                      {export_options}
                    </select>
                  </form>
                </div>
              </div>
              {this.state.init_data.is_owner &&
                <div className="row" style={{'margin-top': '5px'}}>
                  <div id="ck-buylist-container" className="col-lg-6 col-xs-6">
                    <button type="button" id="ck-buylist-button" className="btn btn-sm btn-warning btn-block"
                            disabled>Calculating CK buylist price...
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
          <div className="col-lg-4 col-xs-12">
            <div className="well">
              <table className="table">
                <tbody>
                  <tr>
                    <td>Last Update</td>
                    <td><a href="#diffModal" data-target="#diffModal" data-toggle="modal">{this.state.init_data.last_update} ago</a></td>
                  </tr>
                  <tr>
                    <td>Total Unique</td>
                    <td>{this.state.total_cards}</td>
                  </tr>
                  <tr>
                    <td>Total Cards</td>
                    <td>{this.state.total_qty}</td>
                  </tr>
                  <tr>
                    <td>Total Price</td>
                    <td>${this.state.total_price}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <Collapse in={this.state.filter_open}>
          <div id="filter-well" className="row">
            <div className="col-lg-12 col-xs-12">
              <div className="well">
                <InventoryFilters
                  onFilter={this.handleFilter}
                  init_data={this.state.init_data}
                  foil_image={this.state.init_data.urls.foil_img}
                />
              </div>
            </div>
          </div>
        </Collapse>
        <div style={{'margin-bottom': "10px"}} className="row">
          <div className="col-lg-12 col-xs-12">
            {pages}
          </div>
        </div>
        <div className="row">
          <div className="col-lg-12 col-xs-12">
            <table className="table table-bordered table-hover">
              <InventoryHeader
                is_owner={this.state.init_data.is_owner}
              />
                <tbody>
                  {this.state.loading && <td><div style={{"text-align": "center"}} className="loading">Loading</div></td>}
                  {!this.state.loading && cards.length ? cards : <td><p style={{"text-align": "center"}}>{this.state.error ? this.state.error : 'Collection is empty.'}</p></td>}
                </tbody>
            </table>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-12 col-xs-12">
            {pages}
          </div>
        </div>
      </div>
    )
  }
}


ReactDOM.render(<CollectionTableApp />,
  document.getElementById('table-root'));
