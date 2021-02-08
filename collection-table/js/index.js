import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import 'react-select/dist/react-select.css';
import {Button, ButtonGroup, Collapse, Modal, ProgressBar} from 'react-bootstrap'
import InventoryFilters from "./components/inventory_filters";
import BinderFilters from "./components/binder_filters";
import WishlistFilters from "./components/wishlist_filters";
import InventoryCard from "./components/inventory_card";
import BinderCard from "./components/binder_card";
import WishlistCard from "./components/wishlist_card";
import InventoryHeader from "./components/inventory_headers";
import BinderHeader from "./components/binder_headers";
import WishlistHeader from "./components/wishlist_headers";
const _ = require('lodash');


const INIT_URL = window.django.init_url;


class CollectionTableApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cards: [],
      init_data: {},
      price_header: 'CK Price',
      vendor: 'CK',
      total_cards: 0,
      total_qty: 0,
      total_price: 0,
      filtered_cards: 0,
      row_qty_editing: -1,
      wants_row_qty_editing: -1,
      page: 1,
      loading: true,
      initializing: true,
      first_load: false,
      export_value: '',
      filter_open: false,
      filter_data: {owned: true},
      error: '',
      ordering: 'name',
      show_price_modal: false,
      ck_price: 0,
      tcg_price: 0,
      card_string: '',
      name_filter: '',
      buy_price: 0
    }

    this.handleExport = this.handleExport.bind(this);
    this.handleCardEdit = this.handleCardEdit.bind(this);
    this.toggleFilters = this.toggleFilters.bind(this);
    this.handleFilter = this.handleFilter.bind(this);
    this.handleOrderChange = this.handleOrderChange.bind(this);
    this.handleVendorChange = this.handleVendorChange.bind(this);
    this.handleQtyEditToggle = this.handleQtyToggleEdit.bind(this);
    this.handleWantsQtyEditToggle = this.handleWantsQtyToggleEdit.bind(this);
    this.handleNameFilter = this.handleNameFilter.bind(this);
    this.debouncedSearch = _.debounce((data, order, page, vendor) => {this.searchCards(data, order, page, vendor)}, 1000)
    this.initialize(INIT_URL);
  }

  componentDidMount() {
    document.addEventListener('card-added', event => {
        this.searchCards(this.state.filter_data, this.state.ordering, this.state.page, this.state.vendor)
      })
  }

  componentWillUnmount() {
    document.removeEventListener('card-added', event => {
        this.searchCards(this.state.filter_data, this.state.ordering, this.state.page, this.state.vendor)
      })
  }

  initialize(url) {
    axios.get(
      url
    ).then(
      response => {
        this.setState({
          init_data: response.data,
          initializing: false,
          vendor: response.data.vendor,
          price_header: response.data.price_header
        })
        this.searchCards({owned: true}, 'name', 1, response.data.vendor);
      }
    ).catch(error => {
      let error_msg = 'Error getting the card data.';
      if (error.response && error.response.data && error.response.data.errors) {
        error_msg = error.response.data.errors
      }
      this.setState({
          error: error_msg
        })
    });
  }

  searchCards(data, order, page, vendor) {
    this.setState({loading: true})
    let get_data = {
      'start': 50 * (page - 1),
      'end': 50 * page,
      'ordering': order,
      'vendor': vendor
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
      const price_cards = response.data.data.filter((c) => {
        if (this.state.init_data.type === 'binder') return !c['owned']
        return true
      })
      this.setState({
        cards: response.data.data,
        total_cards: response.data.recordsTotal,
        filtered_cards: response.data.recordsFiltered,
        total_qty: response.data.quantityTotal,
        total_price: response.data.priceTotal,
        price_header: response.data.priceHeader,
        loading: false,
        ck_price: price_cards.map((c) => c['qty'] * (c['ck_price'] ? c['ck_price'] : 0)).reduce((a, b) => a + b, 0),
        tcg_price:  price_cards.map((c) => c['qty'] * (c['tcgp_market_price'] ? c['tcgp_market_price'] : 0)).reduce((a, b) => a + b, 0),
        card_string: price_cards.map((c) => `${c['qty']} ${c['name']}`).join('||'),
        error: '',
        first_load: true,
        buy_price: response.data.buyPriceTotal
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

  handleQtyToggleEdit(number) {
    if (this.state.row_qty_editing === number) {
      number = -1
    }
    this.setState({row_qty_editing: number, wants_row_qty_editing: -1})
  }

  handleWantsQtyToggleEdit(number) {
    if (this.state.wants_row_qty_editing === number) {
      number = -1
    }
    this.setState({wants_row_qty_editing: number, row_qty_editing: -1})
  }

  toggleFilters() {
    this.setState({filter_open: !this.state.filter_open})
  }

  handleFilter(data) {
    const filter_data = {...this.state.filter_data, ...data};
    this.setState({filter_data: filter_data, page: 1});
    this.searchCards(filter_data, this.state.ordering, 1, this.state.vendor)
  }

  handleCardEdit() {
    this.searchCards(this.state.filter_data, this.state.ordering, this.state.page, this.state.vendor)
  }

  handlePageChange(page) {
    this.setState({page: page});
    this.searchCards(this.state.filter_data, this.state.ordering, page, this.state.vendor)
  }

  handleOrderChange(event) {
    const value = event.target.value;
    this.setState({ordering: value});
    this.searchCards(this.state.filter_data, value, this.state.page, this.state.vendor)
  }

  handleVendorChange(event) {
    const value = event.target.value;
    this.setState({vendor: value});
    this.searchCards(this.state.filter_data, this.state.ordering, this.state.page, value)
  }

  handleNameFilter(event) {
    const val = event.target.value;
    const filter_data = {...this.state.filter_data, name: val};
    this.setState({name_filter: val, filter_data: filter_data});
    this.debouncedSearch(filter_data, this.state.ordering, this.state.page)
  }

  handleExport(event) {
    const val = event.target.value;
    this.setState({export_value: val})
    window.location.href = `${window.location.href.split('?')[0]}?fmt=${val}`
  }

  render() {
    if (this.state.error) return <div style={{'font-size': '28px', 'margin-bottom': '15px'}}>{ this.state.error }</div>
    if (this.state.initializing || !this.state.first_load) return <ProgressBar active now={100} />

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
    const cards = this.state.cards.map((card, i) => {
      if (this.state.init_data.type === 'inventory') {
        return (
          <InventoryCard
            data={card}
            init_data={this.state.init_data}
            onEdit={this.handleCardEdit}
            onQtyToggle={this.handleQtyEditToggle}
            row_number={i}
            show_qty_edit={i === this.state.row_qty_editing}
          />
        )
      }
      if (this.state.init_data.type === 'binder') {
        return (
          <BinderCard
            data={card}
            init_data={this.state.init_data}
            onEdit={this.handleCardEdit}
            onHasQtyToggle={this.handleQtyEditToggle}
            onWantsQtyToggle={this.handleWantsQtyEditToggle}
            row_number={i}
            show_qty_edit={i === this.state.row_qty_editing}
            show_wants_qty_edit={i === this.state.wants_row_qty_editing}
          />
        )
      }
      if (this.state.init_data.type === 'wishlist') {
        return (
          <WishlistCard
            data={card}
            init_data={this.state.init_data}
            onEdit={this.handleCardEdit}
          />
        )
      }
    })

    // selects
    const export_options = this.state.init_data.selects.export.map(opts => <option value={opts.value}>{opts.label}</option>)
    const order_options = this.state.init_data.selects.ordering.map(opts => <option value={opts.value}>{opts.label}</option>)
    const price_display_options = this.state.init_data.selects.price_display.map(opts => <option value={opts.value}>{opts.label}</option>)

    //price
    const handlePriceShow = () => this.setState({show_price_modal: true});
    const handlePriceHide = () => this.setState({show_price_modal: false});

    // Collection specific
    let row_amount = 0;
    let headers = [];
    let filters = <div />
    let buttons = <div />

    if (this.state.init_data.type === 'inventory') {
      row_amount = this.state.init_data.is_owner ? '6' : '5'
      headers = <InventoryHeader init_data={this.state.init_data} price_header={this.state.price_header} />
      filters = <InventoryFilters onFilter={this.handleFilter} init_data={this.state.init_data} />
      buttons = (
        <div>
          {this.state.init_data.is_owner &&
            <div className="row">
              <div className="col-lg-6 col-xs-6">
                <button className="btn btn-sm btn-success btn-block" data-toggle="modal" data-target="#addModal"><span className="glyphicon glyphicon-plus" /> Add Card</button>
              </div>
              <div id="ck-buylist-container" className="col-lg-6 col-xs-6">
                <button type="button" id="ck-buylist-button" className="btn btn-sm btn-warning btn-block"
                        disabled>CK Buy Price $ {this.state.buy_price}
                </button>
              </div>
            </div>
          }
          <div className="row" style={{'margin-top': '15px'}}>
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
          <div className="row" style={{'margin-top': '15px'}}>
            <div className="col-lg-6 col-xs-6">
              <div className="row">
                <div className="col-lg-4 col-xs-4">
                  Price
                </div>
                <div className="col-lg-8 col-xs-8">
                  <select name="vendor" className="form-control" onChange={this.handleVendorChange} value={this.state.vendor}>
                    {price_display_options}
                  </select>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-xs-6">
              <div className="row">
                <div className="col-lg-4 col-xs-4">
                  Order by
                </div>
                <div className="col-lg-8 col-xs-8">
                  <select name="ordering" className="form-control" onChange={this.handleOrderChange} value={this.state.ordering}>
                    {order_options}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="row" style={{'margin-top': '15px'}}>
            <div className="col-lg-6 col-xs-6">
              <button
                onClick={this.toggleFilters}
                aria-controls="filter-well"
                aria-expanded={this.state.filter_open}
                className="btn btn-md btn-block">
                Filter
              </button>
            </div>
          </div>
        </div>
      )
    }
    if (this.state.init_data.type === 'binder') {
      row_amount = 5
      headers = <BinderHeader init_data={this.state.init_data} price_header={this.state.price_header} />
      filters = <BinderFilters onFilter={this.handleFilter} init_data={this.state.init_data} />
      buttons = (
        <div>
          {this.state.init_data.is_owner &&
            <div className="row">
              <div id="ck-buylist-container" className="col-lg-6 col-xs-6">
                <button type="button" id="ck-buylist-button" className="btn btn-sm btn-warning btn-block"
                        disabled>Calculating CK buylist price...
                </button>
              </div>
              <div className="col-lg-6 col-xs-12">
                <button className="btn btn-block btn-warning" onClick={handlePriceShow}><span className="glyphicon glyphicon-shopping-cart"/> Checkout Binder</button>
                <Modal show={this.state.show_price_modal} onHide={handlePriceHide}>
                  <Modal.Header>
                    <Modal.Title>Checkout Binder</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <form target="_newtcg" name="tcg_checkout" method="post"
                        action="https://store.tcgplayer.com/massentry/?utm_campaign=affiliate&amp;utm_medium=binder&amp;utm_source=TPPDOUT">
                    <input type="hidden" name="c"  value={this.state.card_string}/>
                    <input type="hidden" name="partner" value="TPPDOUT" />
                    <input type="hidden" name="utm_campaign" value="affiliate"  />
                    <input type="hidden" name="utm_medium" value={this.state.init_data.type} />
                    <input type="hidden" name="utm_source" value="TPPDOUT" />
                    <button type="submit" className="btn btn-block btn-warning">
                      <span className="glyphicon glyphicon-shopping-cart"/> <span>{`TCG Player $${this.state.tcg_price}`}</span>
                    </button>
                    </form>

                    <form target="_newck" name="ck_checkout" method="post" action="https://www.cardkingdom.com/builder/?utm_source=tappedout&amp;utm_medium=affiliate&amp;utm_campaign=tappedoutbinder&amp;partner=tappedout">
                      <input type="hidden" name="c" value={this.state.card_string} />
                      <input type="hidden" name="partner" value="tappedout" />
                      <button style={{'margin-top': '10px'}} type="submit" className="btn btn-block btn-warning">
                        <span className="glyphicon glyphicon-shopping-cart" /> <span>{`Card Kingdom $${this.state.tcg_price}`}</span>
                      </button>
                    </form>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={handlePriceHide}>
                      Close
                    </Button>
                  </Modal.Footer>
                </Modal>
              </div>
            </div>
          }
          <div className="row" style={{'margin-top': '15px'}}>
            <div className="col-lg-6 col-xs-6">
              <form action="." method="get" className="navbar-search">
                <select name="fmt" className="form-control input-sm" onChange={this.handleExport} value={this.state.export_value}>
                  <option value="">Export/Download</option>
                  {export_options}
                </select>
              </form>
            </div>
          </div>
          <div className="row" style={{'margin-top': '15px'}}>
            <div className="col-lg-6 col-xs-6">
              <div className="row">
                <div className="col-lg-4 col-xs-4">
                  Price
                </div>
                <div className="col-lg-8 col-xs-8">
                  <select name="vendor" className="form-control" onChange={this.handleVendorChange} value={this.state.vendor}>
                    {price_display_options}
                  </select>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-xs-6">
              <div className="row">
                <div className="col-lg-4 col-xs-4">
                  Order by
                </div>
                <div className="col-lg-8 col-xs-8">
                  <select name="ordering" className="form-control" onChange={this.handleOrderChange} value={this.state.ordering}>
                    {order_options}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="row" style={{'margin-top': '15px'}}>
            <div className="col-lg-6 col-xs-6">
              <button
                onClick={this.toggleFilters}
                aria-controls="filter-well"
                aria-expanded={this.state.filter_open}
                className="btn btn-md btn-block">
                Filter
              </button>
            </div>
          </div>
        </div>
      )
    }
    if (this.state.init_data.type === 'wishlist') {
      row_amount = 5
      headers = <WishlistHeader init_data={this.state.init_data} price_header={this.state.price_header} />
      filters = <WishlistFilters onFilter={this.handleFilter} init_data={this.state.init_data} />
      buttons = (
        <div>
          <div className="row" style={{'margin-top': '15px'}}>
            <div className="col-lg-6 col-xs-6">
              <form action="." method="get" className="navbar-search">
                <select name="fmt" className="form-control input-sm" onChange={this.handleExport} value={this.state.export_value}>
                  <option value="">Export/Download</option>
                  {export_options}
                </select>
              </form>
            </div>
            <div className="col-lg-6 col-xs-12">
              <button className="btn btn-block btn-warning" onClick={handlePriceShow}><span className="glyphicon glyphicon-shopping-cart"/> Checkout Wishlist</button>
              <Modal show={this.state.show_price_modal} onHide={handlePriceHide}>
                <Modal.Header>
                  <Modal.Title>Checkout Wishlist</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <form target="_newtcg" name="tcg_checkout" method="post"
                      action="https://store.tcgplayer.com/massentry/?utm_campaign=affiliate&amp;utm_medium=wishlist&amp;utm_source=TPPDOUT">
                  <input id="tcg-cards-input" type="hidden" name="c"  value={this.state.card_string}/>
                  <input type="hidden" name="partner" value="TPPDOUT" />
                  <input type="hidden" name="utm_campaign" value="affiliate"  />
                  <input type="hidden" name="utm_medium" value={this.state.init_data.type} />
                  <input type="hidden" name="utm_source" value="TPPDOUT" />
                  <button type="submit" className="btn btn-block btn-warning">
                    <span className="glyphicon glyphicon-shopping-cart"/> <span>{` TCG Player $${this.state.tcg_price}`}</span>
                  </button>
                  </form>

                  <form target="_newck" name="ck_checkout" method="post" action="https://www.cardkingdom.com/builder/?utm_source=tappedout&amp;utm_medium=affiliate&amp;utm_campaign=tappedoutbinder&amp;partner=tappedout">
                    <input type="hidden" name="c" value={this.state.card_string} />
                    <input type="hidden" name="partner" value="tappedout" />
                    <button style={{'margin-top': '10px'}} type="submit" className="btn btn-block btn-warning">
                      <span className="glyphicon glyphicon-shopping-cart" /> <span>{`Card Kingdom $${this.state.tcg_price}`}</span>
                    </button>
                  </form>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={handlePriceHide}>
                    Close
                  </Button>
                </Modal.Footer>
              </Modal>
            </div>
          </div>
          <div className="row" style={{'margin-top': '15px'}}>
            <div className="col-lg-6 col-xs-6">
              <div className="row">
                <div className="col-lg-4 col-xs-4">
                  Price
                </div>
                <div className="col-lg-8 col-xs-8">
                  <select name="vendor" className="form-control" onChange={this.handleVendorChange} value={this.state.vendor}>
                    {price_display_options}
                  </select>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-xs-6">
              <div className="row">
                <div className="col-lg-4 col-xs-4">
                  Order by
                </div>
                <div className="col-lg-8 col-xs-8">
                  <select name="ordering" className="form-control" onChange={this.handleOrderChange} value={this.state.ordering}>
                    {order_options}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="row" style={{'margin-top': '15px'}}>
            <div className="col-lg-6 col-xs-6">
              <button
                onClick={this.toggleFilters}
                aria-controls="filter-well"
                aria-expanded={this.state.filter_open}
                className="btn btn-md btn-block">
                Filter
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div>
        <div className="row">
          <div className="col-lg-8 col-xs-12">
            <div className="well">
              {buttons}
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
                {filters}
              </div>
            </div>
          </div>
        </Collapse>
        <div style={{'margin-bottom': "10px"}} className="row">
          <div className="col-lg-9 col-xs-12">
            <ButtonGroup>
              {pages}
            </ButtonGroup>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-inline pull-right">
              <label style={{'margin-right': '10px'}} className="control-label">Search</label>
              <input name="name" type="text" className="form-control" onChange={this.handleNameFilter} value={this.state.name_filter}/>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-12 col-xs-12">
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                {headers}
                {!this.state.loading && (
                  <tbody>
                  {cards.length ? cards :
                    <td style={{'background-color': 'black', 'height': '50px'}} colSpan={row_amount}>
                      <p style={{"text-align": "center"}}>{this.state.error ? this.state.error : 'Collection is empty.'}</p>
                    </td>}
                  </tbody>)}
              </table>
              {this.state.loading && <ProgressBar active now={100} />}
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-12 col-xs-12">
            <ButtonGroup>
              {pages}
            </ButtonGroup>
          </div>
        </div>
      </div>
    )
  }
}


ReactDOM.render(<CollectionTableApp />,
  document.getElementById('table-root'));
