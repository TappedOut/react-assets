import React, { Component } from "react";
import {Modal, Button} from "react-bootstrap";

class InventoryCard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      show: false,
    };
  }

  render() {
    const id = `inv-qty-${this.props.data.owned_pk}`
    return (
      <tr>
        <td dangerouslySetInnerHTML={{__html: this.props.data.display}} />
        <td>
          <div className="row" align="center">
            {!this.props.data.edit_disabled &&
              <button
                type="button"
                className="btn btn-danger btn-xs btn-rm-inv-card"
                data-pk={this.props.data.owned_pk}
                style={{"display": "none"}}>
                <span className="glyphicon glyphicon-minus"/>
              </button>
            }
            <button
              type="button"
              id={id}
              className="btn btn-default btn-xs btn-inv-qty"
              data-pk={this.props.data.owned_pk}>
              {this.props.data.qty ? this.props.data.qty : 0}
            </button>
            {!this.props.data.edit_disabled &&
              <button
                type="button"
                className="btn btn-success btn-xs btn-add-inv-card"
                data-pk={this.props.data.owned_pk}
                data-qty={this.props.data.qty}
                style={{"display": "none"}}>
                <span className="glyphicon glyphicon-plus"/>
              </button>
            }
          </div>
        </td>
        <td dangerouslySetInnerHTML={{__html: this.props.data.collection}} />
        <td>{this.props.data.type}</td>
        <td dangerouslySetInnerHTML={{__html: this.props.data.mana_cost}} />
        <td>{this.props.data.set}</td>
        <td dangerouslySetInnerHTML={{__html: this.props.data.marked_price}} />
        {this.props.is_owner && <td></td>}
      </tr>
    );
  }
}

export default InventoryCard;
