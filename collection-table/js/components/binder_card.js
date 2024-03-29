import React, { Component } from "react";
import axios from 'axios';
import Cookies from "js-cookie";
import PopoverStickOnHover from "./popover_sticky";

class BinderCard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      show_wants_qty_edit: false,
      owned: this.props.data.owned
    };
    this.handleQtyEdit = this.handleQtyEdit.bind(this);
    this.handleHasQtyChangeClick = this.handleHasQtyChangeClick.bind(this);
    this.handleWantsQtyChangeClick = this.handleWantsQtyChangeClick.bind(this);
    this.handleQtyPlusClick = this.handleQtyPlusClick.bind(this);
    this.handleQtyMinusClick = this.handleQtyMinusClick.bind(this);
  }

  handleHasQtyChangeClick () {
    this.props.onHasQtyToggle(this.props.row_number)
  }

  handleWantsQtyChangeClick () {
    this.props.onWantsQtyToggle(this.props.row_number)
  }

  handleQtyEdit (qty, owned) {
    let params = {qty: qty, owned: owned}
    if (this.props.data.owned_pk && this.props.data.owned === owned) {
      params['owned_pk'] = this.props.data.owned_pk;
    } else {
      params['name'] = this.props.data.name;
      params['tla'] = this.props.data.tla;
      if (this.props.data.foil) {
        params['foil'] = this.props.data.foil;
      }
      if (this.props.data.condition) {
        params['condition'] = this.props.data.condition;
      }
      if (this.props.data.alter_pk) {
        params['alter_pk'] = this.props.data.alter_pk;
      }
      if (this.props.data.variation) {
        params['variation'] = this.props.data.variation;
      }
      if (this.props.data.signed) {
        params['signed'] = this.props.data.signed;
      }
      if (this.props.data.language) {
        params['language'] = this.props.data.language;
      }
      params['qty'] = 1
    }

    params = {'changes': JSON.stringify([params])}
    axios.put(
      this.props.init_data.urls.rows_api,
      params,
      {headers: { 'X-CSRFToken': Cookies.get('csrftoken') }}
    ).then(
      response => {
        if (this.state.owned === owned) {
          this.setState({owned_pk: response.data.pk, qty: qty})
        }
      }
    )
  }

  handleQtyPlusClick (owned) {
    this.handleQtyEdit(this.props.data.qty + 1, owned)
  }

  handleQtyMinusClick (owned){
    this.handleQtyEdit(this.props.data.qty - 1, owned)
  }

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
            {!this.props.data.edit_disabled &&
              <button
                type="button"
                className="btn btn-danger btn-xs btn-rm-inv-card"
                style={{"display": this.props.show_qty_edit ? 'inline-block' : 'none', 'margin-right': '5px'}}
                onClick={e => this.handleQtyMinusClick(true)}
              >
                <span className="glyphicon glyphicon-minus"/>
              </button>
            }
            <button
              type="button"
              className="btn btn-primary btn-xs btn-inv-qty"
              onClick={this.handleHasQtyChangeClick}
            >
              {(this.props.data.qty && this.props.data.owned) ? this.props.data.qty : 0}
            </button>
            {!this.props.data.edit_disabled &&
              <button
                type="button"
                className="btn btn-success btn-xs btn-add-inv-card"
                style={{"display": this.props.show_qty_edit ? 'inline-block' : 'none', 'margin-left': '5px'}}
                onClick={e => this.handleQtyPlusClick(true)}
              >
                <span className="glyphicon glyphicon-plus"/>
              </button>
            }
          </div>
        </td>
        <td>
          <div className="row" align="center">
            {!this.props.data.edit_disabled &&
              <button
                type="button"
                className="btn btn-danger btn-xs btn-rm-inv-card"
                style={{"display": this.props.show_wants_qty_edit ? 'inline-block' : 'none', 'margin-right': '5px'}}
                onClick={e => this.handleQtyMinusClick(false)}
              >
                <span className="glyphicon glyphicon-minus"/>
              </button>
            }
            <button
              type="button"
              className="btn btn-warning btn-xs btn-inv-qty"
              onClick={this.handleWantsQtyChangeClick}
            >
              {(this.props.data.qty && !this.props.data.owned) ? this.props.data.qty : 0}
            </button>
            {!this.props.data.edit_disabled &&
              <button
                type="button"
                className="btn btn-success btn-xs btn-add-inv-card"
                style={{"display": this.props.show_wants_qty_edit ? 'inline-block' : 'none', 'margin-left': '5px'}}
                onClick={e => this.handleQtyPlusClick(false)}
              >
                <span className="glyphicon glyphicon-plus"/>
              </button>
            }
          </div>
        </td>
        <td style={{'text-align': 'center'}}>{this.props.data.set}</td>
        <td style={{'text-align': 'center'}} dangerouslySetInnerHTML={{__html: this.props.data.price}} />
      </tr>
    );
  }
}

export default BinderCard;
