import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import FilterModal from "./components/filter_modal";
import {Button, ButtonGroup, Form} from 'react-bootstrap'
import Card from "./components/card";
const _ = require('lodash');


const BASE_INV_URL = window.django.mobile_api_url;


class MobileInvApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cards: [],
      total_cards: 0,
      total_qty: 0,
      total_price: 0,
      filtered_cards: 0,
      page: 1,
      loading: true,
      owned: true
    }
    this.handleOwnedChange = this.handleOwnedChange.bind(this);
    this.searchCards({owned: this.state.owned}, 1);
  }

  searchCards(data, page){
    this.setState({loading: true, page: page})
    const extra = Object.keys(data).map(key => {
      return `&${key}=${data[key]}`
    }).join()
    const url = `${BASE_INV_URL}?start=${50 * (page - 1)}&end=${50 * page}${extra}`;
    axios.get(
      url
    ).then(
      response => {
        this.setState({
          cards: response.data.data,
          total_cards: response.data.recordsTotal,
          filtered_cards: response.data.recordsFiltered,
          total_qty: response.data.quantityTotal,
          total_price: response.data.priceTotal,
          loading: false
        })
      }
    )
  }

  handlePageChange(page) {
    this.searchCards({}, page)
  }

  handleOwnedChange(event) {
    const checked = event.target.checked;
    this.setState({
      owned: checked,
      page: 1
    });
    this.searchCards({owned: checked}, 1)
  }

  render() {
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

    let cards = this.state.cards.map(card => {
      return (
        <Card
          image={card.image}
          name={card.name}
          set={card.set}
          qty={card.qty}
          url={card.url}
          coll_name={card.coll_name}
          coll_url={card.coll_url}
          coll_chart={card.coll_chart}
        />
      );
    });

    if (cards.length) cards = cards.reduce((prev, curr) => [prev, <hr />, curr])

    return (
      <div>
        {/*<div className="row">*/}
        {/*  <div className="col-xs-12">*/}
        {/*    <FilterModal*/}
        {/*      onFilter={this.searchCards}*/}
        {/*    />*/}
        {/*  </div>*/}
        {/*</div>*/}
        <div className="row">
          <div className="col-xs-12">
            <div className="well">
              <ButtonGroup>
                {pages}
              </ButtonGroup>
              <div style={{'margin-top': '5px'}} className="form-group">
                <label htmlFor="owned">
                  <input id="owned" type="checkbox" name="owned"
                        checked={this.state.owned} disabled={this.state.loading}
                        onChange={this.handleOwnedChange}/> Only Owned
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-xs-12">
            <div className="well">
              {this.state.loading && <div className="loading">Loading</div>}
              {!this.state.loading && cards}
            </div>
          </div>
        </div>
      </div>
    )
  }
}


ReactDOM.render(<MobileInvApp />,
  document.getElementById('mobile-inv-root'));
