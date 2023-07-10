import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import 'react-select/dist/react-select.css';
import InfiniteScroll from 'react-infinite-scroll-component';
import {Button, ButtonGroup, Collapse, Modal, ProgressBar, FormGroup, InputGroup, FormControl} from 'react-bootstrap'
import InventoryFilters from "./components/inventory_filters";
import BinderFilters from "./components/binder_filters";
import WishlistFilters from "./components/wishlist_filters";
import InventoryCard from "./components/inventory_card";
import BinderCard from "./components/binder_card";
import WishlistCard from "./components/wishlist_card";
import InventoryHeader from "./components/inventory_headers";
import BinderHeader from "./components/binder_headers";
import WishlistHeader from "./components/wishlist_headers";
import WishlistDecks from "./components/wishlist_decks";
const _ = require('lodash');


const INIT_URL = window.django.init_url;


const RANK_HEADER = {
  '': '',
  'edh': 'Commander',
  'as_commander': 'As commander',
  'legacy': 'Legacy',
  'standard': 'Standard',
  'pauper': 'Pauper',
  'modern': 'Modern'
}


class CollectionTableApp extends React.Component {
  constructor(props) {
    super(props);
    let stored_order = localStorage.getItem('invorder')
    let stored_order_dir = ''
    if (stored_order && stored_order[0] === '-') {
      stored_order = stored_order.slice(1)
      stored_order_dir = '-'
    }
    this.state = {
      cards: [],
      total_cards: 0,
      init_data: {},
      price_header: 'CK Price',
      vendor: 'CK',
      filtered_cards: 0,
      row_qty_editing: -1,
      wants_row_qty_editing: -1,
      page: 1,
      loading: true,
      initializing: true,
      first_load: false,
      filter_open: false,
      error: '',
      ordering: stored_order ? stored_order : 'name',
      order_dir: stored_order_dir,
      rank: '',
      show_price_modal: false,
      ck_price: 0,
      tcg_price: 0,
      card_string: '',
      name_filter: '',
      buy_price: 0,
      card_display: 'in_coll',
      is_mobile: window.django.is_mobile,
      colors: {
        'u': 0,
        'b': 0,
        'g': 0,
        'r': 0,
        'w': 0,
        'c': 0,
      },
      filter_data: {
        rules: '',
        colors: [],
        colors_exclude: [],
        collection: '',
        rarity: '',
        cardtype: '',
        subtype: '',
        sets: [],
        price_from: '',
        price_to: '',
        language: '',
        owned: true,
        display: 'owned',
        foil: '',
        mana_cost: '',
        cmc_from: '',
        cmc_to: '',
        cost_control: '',
        border_color: '',
        frame: '',
        proxy: ''
      }
    }

    this.handleCardEdit = this.handleCardEdit.bind(this);
    this.toggleFilters = this.toggleFilters.bind(this);
    this.handleFilter = this.handleFilter.bind(this);
    this.handleScrollFetch = this.handleScrollFetch.bind(this);
    this.handleOrderChange = this.handleOrderChange.bind(this);
    this.handleAscDescChange = this.handleAscDescChange.bind(this);
    this.handleVendorChange = this.handleVendorChange.bind(this);
    this.handleQtyEditToggle = this.handleQtyToggleEdit.bind(this);
    this.handleWantsQtyEditToggle = this.handleWantsQtyToggleEdit.bind(this);
    this.handleNameFilter = this.handleNameFilter.bind(this);
    this.handleFilterReset = this.handleFilterReset.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSelectChange = this.handleSelectChange.bind(this);
    this.handleColorChange = this.handleColorChange.bind(this);
    this.debouncedSearch = _.debounce((data, order, page, vendor, rank) => {this.searchCards(data, order, page, vendor, rank)}, 1000)
    this.debouncedFilter = _.debounce(() => {this.handleFilter()}, 1000)
    this.initialize(INIT_URL);
  }

  componentDidMount() {
    document.addEventListener('card-added', event => {
        this.searchCards(this.state.filter_data, `${this.state.order_dir}${this.state.ordering}`, 1, this.state.vendor, this.state.rank)
      })
  }

  componentWillUnmount() {
    document.removeEventListener('card-added', event => {
        this.searchCards(this.state.filter_data, `${this.state.order_dir}${this.state.ordering}`, 1, this.state.vendor, this.state.rank)
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
        this.searchCards({owned: true}, `${this.state.order_dir}${this.state.ordering}`, 1, response.data.vendor, '');
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

  searchCards(data, order, page, vendor, rank, append) {
    this.setState({loading: !append})
    let get_data = {
      'start': 50 * (page - 1),
      'end': 50 * page,
      'ordering': order,
      'vendor': vendor,
      'rank': rank
    }
    const selectedColors = _.keys(this.state.colors).filter(c => this.state.colors[c] === 1)
    const selectedExcludeColors = _.keys(this.state.colors).filter(c => this.state.colors[c] === -1)
    data['colors'] = selectedColors
    data['colors_exclude'] = selectedExcludeColors
    for (let [key, value] of Object.entries(data)) {
      if (Array.isArray(value) && value.length) {
        get_data[key] = value.join(',')
      } else if (value || value === false) {
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
      const cards = append ? this.state.cards.concat(response.data.data) : response.data.data
      if (document.getElementById('total-unique')) document.getElementById('total-unique').innerHTML = response.data.recordsTotal
      if (document.getElementById('total-cards')) document.getElementById('total-cards').innerHTML = response.data.quantityTotal
      if (document.getElementById('total-price')) document.getElementById('total-price').innerHTML = '$' + response.data.priceTotal

      this.setState({
        cards: cards,
        total_cards: response.data.recordsTotal,
        filtered_cards: response.data.recordsFiltered,
        price_header: response.data.priceHeader,
        loading: false,
        ck_price: price_cards.map((c) => c['qty'] * (c['ck_price'] ? c['ck_price'] : 0)).reduce((a, b) => a + b, 0),
        tcg_price:  price_cards.map((c) => c['qty'] * (c['tcgp_market_price'] ? c['tcgp_market_price'] : 0)).reduce((a, b) => a + b, 0),
        card_string: price_cards.map((c) => `${c['qty']} ${c['name']}`).join('||'),
        error: '',
        first_load: true,
        buy_price: response.data.buyPriceTotal,
        page: page
      })
    }).catch(error => {
      let error_msg = 'Error getting the card data.';
      if (error.response && error.response.data && error.response.data.errors) {
        error_msg = error.response.data.errors
      }
      if (document.getElementById('total-unique')) document.getElementById('total-unique').innerHTML = '0'
      if (document.getElementById('total-cards')) document.getElementById('total-cards').innerHTML = '0'
      if (document.getElementById('total-price')) document.getElementById('total-price').innerHTML = '0'
      this.setState({
          cards: [],
          total_cards: 0,
          filtered_cards: 0,
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

  handleFilter() {
    this.searchCards(this.state.filter_data, `${this.state.order_dir}${this.state.ordering}`, 1, this.state.vendor, this.state.rank)
  }

  handleFilterReset() {
    const blank = {
      rules: '',
      colors: [],
      colors_exclude: [],
      collection: '',
      rarity: '',
      cardtype: '',
      subtype: '',
      sets: [],
      price_from: '',
      price_to: '',
      language: '',
      owned: true,
      display: 'owned',
      foil: '',
      mana_cost: '',
      cmc_from: '',
      cmc_to: '',
      cost_control: '',
      border_color: '',
      frame: '',
      proxy: ''
    }
    const color_blank = {
      'u': 0,
      'b': 0,
      'g': 0,
      'r': 0,
      'w': 0,
      'c': 0,
    }
    this.setState({filter_data: blank, colors: color_blank, name_filter: ''})
    this.debouncedFilter()
  }

  handleInputChange(event) {
    const target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    const new_data = {...this.state.filter_data, [name]: value}
    if (name === 'owned') value ? new_data['display'] = 'owned' : new_data['display'] = 'collapse'
    this.setState({filter_data: new_data});
    this.debouncedFilter()
  }

  handleSelectChange(name, selected) {
    let value = ''
    if (selected) {
      value = Array.isArray(selected) ? selected.map(v => {
        return v['value']
      }) : selected['value'];
    }
    const new_data = {...this.state.filter_data, [name]: value}
    this.setState({
      filter_data: new_data
    });
    this.debouncedFilter()
  }

  handleColorChange = (color) => {
    let colors = {...this.state.colors}
    if (this.state.colors[color] === 0) {
      colors[color] = 1
    } else if (this.state.colors[color] === 1) {
      colors[color] = -1
    } else {
      colors[color] = 0
    }
    this.setState({colors: colors})
    this.debouncedFilter()
  }

  handleCardEdit(oldSpec, newSpec) {
    const old_index = this.state.cards.findIndex((elem) => elem.owned_pk === oldSpec.owned_pk);
    let newCards = this.state.cards;
    if (newSpec) {
      const new_index = this.state.cards.findIndex((elem) => elem.owned_pk === newSpec.owned_pk);
      if (new_index > -1) {
        newCards[new_index] = newSpec
        newCards.splice(old_index, 1)
      } else {
        newCards[old_index] = newSpec
      }
    } else {
       newCards.splice(old_index, 1)
    }
    this.setState({cards: newCards})
  }

  handleScrollFetch() {
    const new_page = this.state.page + 1
    this.setState({page: new_page});
    this.searchCards(this.state.filter_data, `${this.state.order_dir}${this.state.ordering}`, new_page, this.state.vendor, this.state.rank, true)
  }

  handleOrderChange(event) {
    let value = event.target.value
    if (value.startsWith('rank-')) {
      value = value.replace('rank-', '')
      this.setState({rank: value});
      this.searchCards(this.state.filter_data, `${this.state.order_dir}${this.state.ordering}`, 1, this.state.vendor, value)
    } else {
      this.setState({ordering: value, rank: ''})
      value = `${this.state.order_dir}${value}`
      localStorage.setItem('invorder', value)
      this.searchCards(this.state.filter_data, value, 1, this.state.vendor, '')
    }
  }

  handleAscDescChange() {
    const new_dir = this.state.order_dir === '' ? '-' : ''
    this.setState({order_dir: new_dir})
    const value = `${new_dir}${this.state.ordering}`
    localStorage.setItem('invorder', value);
    this.searchCards(this.state.filter_data, value, 1, this.state.vendor, this.state.rank)
  }

  handleVendorChange(value) {
    this.setState({vendor: value});
    this.searchCards(this.state.filter_data, `${this.state.order_dir}${this.state.ordering}`, 1, value)
  }

  handleNameFilter(event) {
    const val = event.target.value;
    const filter_data = {...this.state.filter_data, name: val};
    this.setState({name_filter: val, filter_data: filter_data});
    this.debouncedSearch(filter_data, `${this.state.order_dir}${this.state.ordering}`, 1, this.state.vendor, this.state.rank)
  }

  handleInBinderBtnClick = () => {
    if (this.state.in_binder === true) return
    const new_data = {...this.state.filter_data, display: 'owned'}
    this.setState({
      filter_data: new_data,
      card_display: 'in_coll'
    });
    this.searchCards(new_data, `${this.state.order_dir}${this.state.ordering}`, 1, this.state.vendor, this.state.rank)
  }

  handleAllCardsBtnClick = () => {
    if (this.state.all_cards === true) return
    const new_data = {...this.state.filter_data, display: 'collapse'}
    this.setState({
      filter_data: new_data,
      card_display: 'all'
    });
    this.searchCards(new_data, `${this.state.order_dir}${this.state.ordering}`, 1, this.state.vendor, this.state.rank)
  }

  handleHaveMatchesBtnClick = () => {
    if (this.state.in_binder === true) return
    const new_data = {...this.state.filter_data, display: 'matches_h'}
    this.setState({
      filter_data: new_data,
      card_display: 'matches_h'
    });
    this.searchCards(new_data, `${this.state.order_dir}${this.state.ordering}`, 1, this.state.vendor, this.state.rank)
  }

  handleWantMatchesBtnClick = () => {
    if (this.state.in_binder === true) return
    const new_data = {...this.state.filter_data, in_binder: false, all_cards: false, matches_h: false, matches_w: false, display: 'matches_w'}
    this.setState({
      filter_data: new_data,
      card_display: 'matches_w'
    });
    this.searchCards(new_data, `${this.state.order_dir}${this.state.ordering}`, 1, this.state.vendor, this.state.rank)
  }

  removeDeckCB = () => {
    this.debouncedSearch(this.state.filter_data, `${this.state.order_dir}${this.state.ordering}`, 1, this.state.vendor, this.state.rank)
  }

  render() {
    if (this.state.error && !this.state.first_load) return <div style={{'font-size': '28px', 'margin-bottom': '15px'}}>{ this.state.error }</div>
    if (this.state.initializing || !this.state.first_load) return <ProgressBar active now={100} />

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
            rank={this.state.rank}
            is_mobile={this.state.is_mobile}
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
            is_mobile={this.state.is_mobile}
          />
        )
      }
      if (this.state.init_data.type === 'wishlist') {
        return (
          <WishlistCard
            data={card}
            init_data={this.state.init_data}
            is_mobile={this.state.is_mobile}
          />
        )
      }
    })

    // selects
    let order_options = this.state.init_data.selects.ordering.map(opts => <option value={opts.value}>{opts.label}</option>)
    const order_val = this.state.rank ? `rank-${this.state.rank}` : this.state.ordering

    // colors
    let colorCheckboxes = _.keys(this.state.colors).map(color => {
      let icon = 'minus'
      let icon_color = 'white'
      if (this.state.colors[color] === 1) {
        icon = 'ok'
        icon_color = 'green'
      } else if (this.state.colors[color] === -1) {
        icon = 'remove'
        icon_color = 'red'
      }
      return (
        <div className="col-lg-2 col-xs-4">
          <div className="form-group">
            <button onClick={() => this.handleColorChange(color)} className="btn btn-sm btn-default btn-block">
              <i className={`ms ms-${color} ms-cost ms-shadow ms-1point2x`}></i>&nbsp;&nbsp;
              <span style={{'color': icon_color}} className={`glyphicon glyphicon-${icon}`} aria-hidden="true"></span>
            </button>
          </div>
        </div>
      )
    })

    // price
    const handlePriceShow = () => this.setState({show_price_modal: true})
    const handlePriceHide = () => this.setState({show_price_modal: false})

    // Collection specific
    let row_amount = 0
    let headers = []
    let filters = <div />
    let big_button = <div />
    let decks = <div />
    let card_display = <div />

    if (this.state.init_data.type === 'inventory') {
      order_options.push(<option value="-" disabled="disabled">Ranks:</option>)
      order_options = order_options.concat(this.state.init_data.selects.rank.map(opts => <option value={`rank-${opts.value}`}>{opts.label}</option>))
      let row_amount = 5
      if (this.state.init_data.can_edit) row_amount++;
      if (this.state.rank) row_amount++;
      headers = <InventoryHeader init_data={this.state.init_data} price_header={this.state.price_header}
                                 rank={RANK_HEADER[this.state.rank]} active_vendor={this.state.vendor} handleVendorChange={this.handleVendorChange} />
      filters = <InventoryFilters init_data={this.state.init_data} filter_data={this.state.filter_data}
                                  handleInputChange={this.handleInputChange} handleSelectChange={this.handleSelectChange} />
      if (this.state.init_data.can_edit) {
        big_button = (
          <a style={{'margin-bottom': '10px'}} className="btn btn-lg btn-warning btn-block"
             href={this.state.init_data.urls.find_decks}>Build deck from inventory</a>
        )
      }
    }
    if (this.state.init_data.type === 'binder') {
      row_amount = 5
      headers = <BinderHeader init_data={this.state.init_data} price_header={this.state.price_header}
                              active_vendor={this.state.vendor} handleVendorChange={this.handleVendorChange} />
      filters = <BinderFilters init_data={this.state.init_data} filter_data={this.state.filter_data}
                               handleInputChange={this.handleInputChange} handleSelectChange={this.handleSelectChange} />
      if (this.state.init_data.can_edit) {
        big_button = (
          <div>
            <button className="btn btn-block btn-lg btn-warning" onClick={handlePriceShow}><span className="glyphicon glyphicon-shopping-cart"/> Checkout Binder</button>
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
        )
      }
      const in_coll_label = this.state.init_data.is_owner ? 'In Binder' : 'All'
      const display_matches = !this.state.init_data.is_owner && this.state.init_data.is_authenticated;
      if (this.state.init_data.is_authenticated) {
        card_display = (
          <div className="form-group">
            <ButtonGroup>
              {display_matches && <Button onClick={this.handleWantMatchesBtnClick} disabled={this.state.card_display === 'matches_w'}>Matches Wants</Button>}
              {display_matches && <Button onClick={this.handleHaveMatchesBtnClick} disabled={this.state.card_display === 'matches_h'}>Matches Haves</Button>}
              <Button onClick={this.handleInBinderBtnClick} disabled={this.state.card_display === 'in_coll'}>{in_coll_label}</Button>
              {this.state.init_data.is_owner && <Button onClick={this.handleAllCardsBtnClick} disabled={this.state.card_display === 'all'}>All</Button>}
            </ButtonGroup>
          </div>
        )
      }
    }
    if (this.state.init_data.type === 'wishlist') {
      row_amount = 5
      headers = <WishlistHeader init_data={this.state.init_data} price_header={this.state.price_header}
                                active_vendor={this.state.vendor} handleVendorChange={this.handleVendorChange} />
      filters = <WishlistFilters init_data={this.state.init_data} filter_data={this.state.filter_data}
                                 handleInputChange={this.handleInputChange} handleSelectChange={this.handleSelectChange} />
      decks = <WishlistDecks api_url={this.state.init_data.urls.wishlist_decks} remove_deck_cb={this.removeDeckCB} />
      big_button = (
        <div>
          <button className="btn btn-block btn-lg btn-warning" onClick={handlePriceShow}><span className="glyphicon glyphicon-shopping-cart"/> Checkout Wishlist</button>
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
      )
    }

    return (
      <div>
        <Collapse in={this.state.filter_open}>
          <div id="filter-well" className="row">
            <div className="col-lg-12 col-xs-12">
              <div className="well">
                {filters}
                <div className="row">
                  {colorCheckboxes}
                </div>
              </div>
            </div>
          </div>
        </Collapse>
        <div style={{'margin-bottom': "10px"}} className="row">
          <div className="col-lg-4 col-xs-12">
            <FormGroup>
              <InputGroup>
                <FormControl componentClass="select" onChange={this.handleOrderChange} value={order_val}>
                  {order_options}
                </FormControl>
                <InputGroup.Button>
                  <Button onClick={this.handleAscDescChange}>
                    {this.state.order_dir === '' ?
                      <span className="glyphicon glyphicon-sort-by-attributes" aria-hidden="true"></span>
                      :
                      <span className="glyphicon glyphicon-sort-by-attributes-alt" aria-hidden="true"></span>}
                  </Button>
                </InputGroup.Button>
              </InputGroup>
            </FormGroup>
          </div>
          <div className="col-lg-4 col-xs-12">
            <FormGroup>
              <InputGroup>
                <FormControl placeholder="Search" name="name" type="text" className="form-control" onChange={this.handleNameFilter} value={this.state.name_filter} />
                <InputGroup.Button>
                  <Button bsStyle="info" onClick={this.toggleFilters}><span className="glyphicon glyphicon-filter" aria-hidden="true"></span></Button>
                  <Button bsStyle="danger" onClick={this.handleFilterReset}><span className="glyphicon glyphicon-remove" aria-hidden="true"></span></Button>
                </InputGroup.Button>
              </InputGroup>
            </FormGroup>
          </div>
          <div className="col-lg-4 col-xs-12">
            {big_button}
          </div>
        </div>
        <div className="row">
          <div className="col-lg-4 col-xs-12">
            {card_display}
            {decks}
          </div>
        </div>
        <div className="row">
          <div className="col-lg-12 col-xs-12">
            <div className="table-responsive">
              <InfiniteScroll
                dataLength={this.state.cards.length}
                next={this.handleScrollFetch}
                hasMore={this.state.cards.length < this.state.total_cards}
                loader={<ProgressBar active now={100} />}
              >
                <table className="table table-bordered table-hover">
                  {headers}
                  {!this.state.loading && (
                    <tbody>
                    {cards.length ?
                      cards
                      :
                      <td style={{'background-color': 'black', 'height': '50px'}} colSpan={row_amount}>
                        <p style={{"text-align": "center"}}>{this.state.error ? this.state.error : 'Collection is empty.'}</p>
                      </td>}
                    </tbody>)}
                </table>
              </InfiniteScroll>
              {this.state.loading && <ProgressBar active now={100} />}
            </div>
          </div>
        </div>
      </div>
    )
  }
}


ReactDOM.render(<CollectionTableApp />,
  document.getElementById('table-root'));
