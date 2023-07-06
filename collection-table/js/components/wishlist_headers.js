import React, { Component } from "react";

class WishlistHeader extends Component {
  constructor(props) {
    super(props);

    this.state = {
      order_type: 'asc',
      order_param: 'name'
    }
  };

  handleHeaderClick() {
  }

  render() {
    return (
      <thead>
        <tr>
          <th onClick={this.handleHeaderClick} style={{"text-align": "center", "width": "25%"}}>Card</th>
          <th onClick={this.handleHeaderClick} style={{"text-align": "center", "width": "12%"}}>Qty</th>
          <th onClick={this.handleHeaderClick} style={{"text-align": "center", "width": "15%"}}>Set</th>
          <th onClick={this.handleHeaderClick} style={{"text-align": "center", "width": "15%", "font-size": "12px"}}>Price</th>
          <th onClick={this.handleHeaderClick} style={{"text-align": "center", "width": "15%"}}>Rarity</th>
        </tr>
      </thead>
    )
  }

}

export default WishlistHeader;