import React, { Component } from "react";
import { Dropdown , MenuItem, Glyphicon } from 'react-bootstrap';

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
    const vendor_items = this.props.init_data.selects.price_display.map(
      vendor => <MenuItem onClick={() => this.props.handleVendorChange(vendor.value)} active={this.props.active_vendor === vendor.value}>{vendor.label}</MenuItem>
    )
    const vendor_selector = (
      <Dropdown>
        <Dropdown.Toggle noCaret bsSize='xsmall'>
          <Glyphicon glyph="cog" />
        </Dropdown.Toggle>
        <Dropdown.Menu >
          {vendor_items}
        </Dropdown.Menu>
      </Dropdown>
    )

    return (
      <thead>
        <tr>
          <th onClick={this.handleHeaderClick} style={{"text-align": "center", "vertical-align": "middle", "width": "25%"}}>Card</th>
          <th onClick={this.handleHeaderClick} style={{"text-align": "center", "vertical-align": "middle", "width": "15%"}}>Qty</th>
          <th onClick={this.handleHeaderClick} style={{"text-align": "center", "vertical-align": "middle", "width": "10%"}}>Set</th>
          <th onClick={this.handleHeaderClick} style={{"text-align": "center", "vertical-align": "middle", "width": "10%", "font-size": "12px"}}>Price {vendor_selector}</th>
          {this.props.rank && <th style={{"text-align": "center", "vertical-align": "middle", "width": "10%"}}>{this.props.rank} rank</th>}
          {this.props.init_data.is_owner && <th style={{"text-align": "center", "vertical-align": "middle", "width": "5%"}}>Edit</th>}
        </tr>
      </thead>
    )
  }

}

export default InventoryHeader;
