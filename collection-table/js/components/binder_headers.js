import React, { Component } from "react";

class BinderHeader extends Component {
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
          <th onClick={this.handleHeaderClick} style={{"text-align": "center", "width": "12%"}}>Has</th>
          <th onClick={this.handleHeaderClick} style={{"text-align": "center", "width": "12%"}}>Wants</th>
          <th onClick={this.handleHeaderClick} style={{"text-align": "center", "width": "15%"}}>Set</th>
          <th onClick={this.handleHeaderClick} style={{"text-align": "center", "width": "15%", "font-size": "12px"}}>Price</th>
        </tr>
      </thead>
    )
  }
}

export default BinderHeader;