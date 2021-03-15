import React, { Component } from "react";

class InventoryHeader extends Component {
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
          <th onClick={this.handleHeaderClick} style={{"text-align": "center", "width": "15%"}}>Qty</th>
          <th onClick={this.handleHeaderClick} style={{"text-align": "center", "width": "10%"}}>Set</th>
          <th onClick={this.handleHeaderClick} style={{"text-align": "center", "width": "10%", "font-size": "12px"}}>{this.props.price_header}</th>
          {this.props.init_data.is_owner &&
            <th style={{"text-align": "center", "width": "5%"}}>Edit</th>
          }
        </tr>
      </thead>
    )
  }

}

export default InventoryHeader;
