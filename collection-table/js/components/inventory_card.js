import React, { Component } from "react";
import {OverlayTrigger, Popover} from "react-bootstrap";
import axios from 'axios';
import Cookies from "js-cookie";
import PopoverStickOnHover from "./popover_sticky";

class InventoryCard extends Component {
  constructor(props) {
    super(props);

    this.state = {
      owned_pk : this.props.data.owned_pk,
      qty: this.props.data.qty,
      edit: {
        tla: this.props.data.tla,
        variation: this.props.data.variation ? this.props.data.variation : '',
        language: this.props.data.language,
        condition: this.props.data.condition,
        alteration: this.props.data.foil,
        alter_pk: this.props.data.alter_pk,
        signed: this.props.data.signed
      }
    };
    this.editCard = this.editCard.bind(this);
    this.deleteCard = this.deleteCard.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleQtyEdit = this.handleQtyEdit.bind(this);
    this.handleQtyChangeClick = this.handleQtyChangeClick.bind(this);
    this.handleQtyPlusClick = this.handleQtyPlusClick.bind(this);
    this.handleQtyMinusClick = this.handleQtyMinusClick.bind(this);
  }

  editCard () {
    let params = {...this.state.edit, owned_pk: this.state.owned_pk, name: this.props.data.name, qty: this.state.qty}
    for (let [key, value] of Object.entries(params)) {
      if (!value) {
        delete params[key];
      }
    }
    params = {'changes': JSON.stringify([params])}
    axios.put(
      this.props.init_data.urls.rows_api,
      params,
      {headers: { 'X-CSRFToken': Cookies.get('csrftoken') }}
    ).then(
      response => {
        this.props.onEdit()
      }
    )
  }

  deleteCard() {
    axios.delete(
      this.props.init_data.urls.rows_api, {
        headers: { 'X-CSRFToken': Cookies.get('csrftoken') },
        data: {owned_pk: this.state.owned_pk}
      }
    ).then(
      response => {
        this.props.onEdit()
      }
    )
  }

  handleQtyChangeClick () {
    this.props.onQtyToggle(this.props.row_number)
  }

  handleQtyEdit (qty) {
    let params = {qty: qty}
    if (this.state.owned_pk) {
      params['owned_pk'] = this.state.owned_pk;
    } else {
      params['name'] = this.props.data.name;
      params['tla'] = this.props.data.tla;
      if (this.props.data.foil) {
        params['alteration'] = this.props.data.foil;
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
    for (let [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) {
        delete params[key];
      }
    }
    params = {'changes': JSON.stringify([params])}
    axios.put(
      this.props.init_data.urls.rows_api,
      params,
      {headers: { 'X-CSRFToken': Cookies.get('csrftoken') }}
    ).then(
      response => {
        this.setState({owned_pk: response.data.pk, qty: qty})
      }
    )
  }

  handleQtyPlusClick () {
    const new_qty = this.state.qty + 1;
    this.handleQtyEdit(new_qty)
  }

  handleQtyMinusClick (){
    const new_qty = this.state.qty - 1;
    this.handleQtyEdit(new_qty)
  }

  handleInputChange(event) {
    const target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    const new_edit = {...this.state.edit, [name]: value}
    this.setState({edit: new_edit});
  }

  render() {
    const id = `inv-qty-${this.props.data.owned_pk}`;
    let edit_popover = <Popover id="edit-popover" />;
    if (this.props.init_data.can_edit) {
      let printing_options = this.props.data.printings.map(opts => <option value={opts[1]}>{opts[0]}</option>);
      let variation_options = this.props.data.all_variations[this.state.edit.tla] ?
        this.props.data.all_variations[this.state.edit.tla].map(opts => <option value={opts.identifier}>{opts.display}</option>) : [];
      let language_options = this.props.init_data.selects.language.map(opts => <option value={opts.value}>{opts.label}</option>);
      let condition_options = this.props.init_data.selects.condition.map(opts => <option value={opts.value}>{opts.label}</option>);
      let tlavar = this.state.edit.tla + this.state.edit.variation;
      let alteration_options = this.props.data.all_alterations[tlavar] ?
        this.props.data.all_alterations[tlavar].map(opts => <option value={opts[0]}>{opts[1]}</option>) :
        [<option value="">Default</option>, <option value="f">Foil</option>]
      edit_popover = (
        <Popover id="edit-popover" title="Edit Card">
          <div className="popover-content popover-edit-content">
            <div className="well edit-content">
              <div className="form-group">
                <select onChange={this.handleInputChange} value={this.state.edit.tla} name="tla" className="form-control printing-edit">
                  {printing_options}
                </select>
              </div>
              {!!variation_options.length &&
                <div className="form-group variation-group">
                  <select onChange={this.handleInputChange} value={this.state.edit.variation} name="variation" className="form-control variation-edit">
                    <option value="">Default Variation</option>
                    {variation_options}
                  </select>
                </div>
              }
              <div className="form-group">
                <select onChange={this.handleInputChange} value={this.state.edit.language} name="language" className="form-control language-edit">
                  {language_options}
                </select>
              </div>
              <div className="form-group">
                <select onChange={this.handleInputChange} value={this.state.edit.condition} name="condition" className="form-control condition-edit">
                  {condition_options}
                </select>
              </div>
              <div className="form-group">
                <select onChange={this.handleInputChange} value={this.state.edit.alteration} name="alteration" className="form-control foil-edit">
                  {alteration_options}
                </select>
              </div>
              <div className="form-group" data-targeted-by="alter_pk">
                <input onChange={this.handleInputChange} value={this.state.edit.alter_pk} className="form-control" type="text" name="alter_pk" placeholder="Alter code" />
              </div>
              <div className="form-group">
                <div className="checkbox">
                  <label className="override-label">
                  <input onChange={this.handleInputChange} value={this.state.edit.signed} name="signed" type="checkbox" className="override-input signed-edit" />
                    Signed
                  </label>
                </div>
              </div>
              <div className="form-group">
                <button onClick={this.editCard} className="btn btn-success btn-block">Confirm</button>
              </div>
              <div className="form-group">
                <button onClick={this.deleteCard} className="btn btn-danger btn-block">Delete Card</button>
              </div>
            </div>
          </div>
        </Popover>
      )
    }
    return (
      <tr>
        <td>
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
                onClick={this.handleQtyMinusClick}
              >
                <span className="glyphicon glyphicon-minus"/>
              </button>
            }
            <button
              type="button"
              id={id}
              className="btn btn-default btn-xs btn-inv-qty"
              onClick={this.handleQtyChangeClick}
            >
              {this.state.qty ? this.state.qty : 0}
            </button>
            {!this.props.data.edit_disabled &&
              <button
                type="button"
                className="btn btn-success btn-xs btn-add-inv-card"
                style={{"display": this.props.show_qty_edit ? 'inline-block' : 'none', 'margin-left': '5px'}}
                onClick={this.handleQtyPlusClick}
              >
                <span className="glyphicon glyphicon-plus"/>
              </button>
            }
          </div>
        </td>
        <td>{this.props.data.set}</td>
        <td dangerouslySetInnerHTML={{__html: this.props.data.price}} />
        {this.props.rank && <td>{this.props.data.rank ? `#${this.props.data.rank}` : '-'}</td>}
        {this.props.init_data.can_edit &&
          <td>
            <div align="center">
              <OverlayTrigger trigger="click" rootClose placement="left" overlay={edit_popover}>
                <button id="popover-btn" className="btn btn-xs btn-success" disabled={this.props.data.edit_disabled || !this.state.owned_pk}>
                  <span className="glyphicon glyphicon-wrench" aria-hidden="true" />
                </button>
              </OverlayTrigger>
            </div>
          </td>
        }
      </tr>
    );
  }
}

export default InventoryCard;
