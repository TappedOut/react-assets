import React, { Component } from "react";
import PopoverStickOnHover from "./popover_sticky";

class WishlistCard extends Component {

  render() {
    const name_font_size = this.props.is_mobile && this.props.data.name.length > 14 ? '12px' : '14px';
    return (
      <tr>
        <td style={{'font-size': name_font_size}}>
          <span dangerouslySetInnerHTML={{__html: this.props.data.display}} />
          {this.props.data.collection &&
            <PopoverStickOnHover
             id="coll-popover"
             component={
              <div className="popover-content popover-edit-content">
                  <div className="well edit-content">
                    <span dangerouslySetInnerHTML={{__html: this.props.data.collection}} />
                  </div>
              </div>}
             placement="right"
             onMouseEnter={() => { }}
             delay={200}
            >
              <button className="btn btn-success btn-xs pull-right">
                <span className="glyphicon glyphicon-refresh" />
              </button>
            </PopoverStickOnHover>
          }
        </td>
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
        <td style={{'text-align': 'center'}}>{this.props.data.set}</td>
        <td style={{'text-align': 'center'}} dangerouslySetInnerHTML={{__html: this.props.data.price}} />
        <td style={{'text-align': 'center'}}>{this.props.data.rarity}</td>
      </tr>
    );
  }
}

export default WishlistCard;
