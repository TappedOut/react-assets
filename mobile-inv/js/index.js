import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import FilterModal from "./components/filter_modal";
import Card from "./components/card";


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
    }
    this.searchCards({});
  }

  searchCards(data){
    axios.get(
      BASE_INV_URL
    ).then(
      response => {
        this.setState({
          cards: response.data.data,
          total_cards: response.data.recordsTotal,
          filtered_cards: response.data.recordsFiltered,
          total_qty: response.data.quantityTotal,
          total_price: response.data.priceTotal
        })
      }
    )
  }

  render() {
    const cards = this.state.cards.map(card => {
    return (
      <Card
        image={card.image}
        name={card.name}
        set={card.set}
        qty={card.qty}
      />
    );
  });
    return (
      <div>
        <div className="row">
          <div className="col-xs-12">
            <FilterModal
              onFilter={this.searchCards}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-xs-12">
            <div className="well">
              {cards}
            </div>
          </div>
        </div>
      </div>
    )
  }
}


ReactDOM.render(<MobileInvApp />,
  document.getElementById('mobile-inv-root'));
