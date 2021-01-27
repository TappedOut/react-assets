import React, { Component } from "react";

class WishlistCard extends Component {

  render() {
    return (
      <tr>
        <td dangerouslySetInnerHTML={{__html: this.props.data.display}} />
        <td>
          <div className="row" align="center">
            <button
              type="button"
              className="btn btn-warning btn-xs btn-inv-qty"
            >
              {this.props.data.qty ? this.props.data.qty : 0}
            </button>
          </div>
        </td>
        <td dangerouslySetInnerHTML={{__html: this.props.data.collection}} />
        <td>{this.props.data.set}</td>
        <td dangerouslySetInnerHTML={{__html: this.props.data.price}} />
        <td>{this.props.data.rarity}</td>
      </tr>
    );
  }
}

export default WishlistCard;
