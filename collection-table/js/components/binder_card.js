import React, { Component } from "react";
import axios from 'axios';
import Cookies from "js-cookie";

class BinderCard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      show_has_qty_edit: false,
      show_wants_qty_edit: false,
      owned_pk : this.props.data.owned_pk,
      qty: this.props.data.qty,
      owned: this.props.data.owned
    };
    this.handleQtyEdit = this.handleQtyEdit.bind(this);
    this.handleHasQtyChangeClick = this.handleHasQtyChangeClick.bind(this);
    this.handleWantsQtyChangeClick = this.handleWantsQtyChangeClick.bind(this);
    this.handleQtyPlusClick = this.handleQtyPlusClick.bind(this);
    this.handleQtyMinusClick = this.handleQtyMinusClick.bind(this);
  }

  handleHasQtyChangeClick () {
    this.setState({show_has_qty_edit: !this.state.show_has_qty_edit})
  }

  handleWantsQtyChangeClick () {
    this.setState({show_wants_qty_edit: !this.state.show_wants_qty_edit})
  }

  handleQtyEdit (qty, owned) {
    let params = {qty: qty, name: this.props.data.name, tla: this.props.data.tla, owned: owned}
    if (this.state.owned_pk && this.props.data.owned === owned) {
      params['owned_pk'] = this.state.owned_pk;
      params['qty'] = 1
    } else {
      if (this.props.data.foil) {
        params['foil'] = this.props.data.foil;
      }
      if (this.props.data.condition) {
        params['condition'] = this.props.data.condition;
      }
      if (this.props.data.alter) {
        params['alter'] = this.props.data.alter;
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
        } else {
          this.props.onEdit()
        }
      }
    )
  }

  handleQtyPlusClick (owned) {
    const new_qty = this.state.qty + 1;
    this.handleQtyEdit(new_qty, owned)
  }

  handleQtyMinusClick (owned){
    const new_qty = this.state.qty - 1;
    this.handleQtyEdit(new_qty, owned)
  }

  render() {
    return (
      <tr>
        <td dangerouslySetInnerHTML={{__html: this.props.data.display}} />
        <td>
          <div className="row" align="center">
            {!this.props.data.edit_disabled &&
              <button
                type="button"
                className="btn btn-danger btn-xs btn-rm-inv-card"
                style={{"display": this.state.show_has_qty_edit ? 'inline-block' : 'none', 'margin-right': '5px'}}
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
              {(this.state.qty && this.props.data.owned) ? this.state.qty : 0}
            </button>
            {!this.props.data.edit_disabled &&
              <button
                type="button"
                className="btn btn-success btn-xs btn-add-inv-card"
                style={{"display": this.state.show_has_qty_edit ? 'inline-block' : 'none', 'margin-left': '5px'}}
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
                style={{"display": this.state.show_wants_qty_edit ? 'inline-block' : 'none', 'margin-right': '5px'}}
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
              {(this.state.qty && !this.props.data.owned) ? this.state.qty : 0}
            </button>
            {!this.props.data.edit_disabled &&
              <button
                type="button"
                className="btn btn-success btn-xs btn-add-inv-card"
                style={{"display": this.state.show_wants_qty_edit ? 'inline-block' : 'none', 'margin-left': '5px'}}
                onClick={e => this.handleQtyPlusClick(false)}
              >
                <span className="glyphicon glyphicon-plus"/>
              </button>
            }
          </div>
        </td>
        <td dangerouslySetInnerHTML={{__html: this.props.data.collection}} />
        <td>{this.props.data.set}</td>
        <td dangerouslySetInnerHTML={{__html: this.props.data.price}} />
      </tr>
    );
  }
}

export default BinderCard;