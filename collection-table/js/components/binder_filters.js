import React, { Component } from "react";
import Select from 'react-select';

class BinderFilters extends Component {
  constructor(props) {
    super(props);

    this.state = {
      collapse: true
    };
  }

  render() {
    return (
      <div>
        <div className="row">
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <label className="control-label">Rules contains</label>
              <input name="rules" type="text" className="form-control" onChange={this.props.handleInputChange} value={this.props.filter_data.rules}/>
              <div className="help-block">Enters the battlefield, Tap target creature, etc.</div>
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <label className="control-label">Type</label>
                <Select
                  name="cardtype"
                  onChange={(v) => this.props.handleSelectChange('cardtype', v)}
                  value={this.props.filter_data.cardtype}
                  options={this.props.init_data.selects.type}
                />
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <label className="control-label">Subtype</label>
                <input name="subtype" className="form-control input-sm" onChange={this.props.handleInputChange} value={this.props.filter_data.subtype} />
                <div className="help-block">Aura, Vampire, Rogue, etc.</div>
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <label className="control-label">Collection</label>
                <Select
                  name="collection"
                  multi
                  onChange={(v) => this.props.handleSelectChange('collection', v)}
                  value={this.props.filter_data.collection}
                  options={this.props.init_data.selects.collection}
                />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <label className="control-label">Rarity</label>
                <Select
                  name="rarity"
                  onChange={(v) => this.props.handleSelectChange('rarity', v)}
                  value={this.props.filter_data.rarity}
                  options={this.props.init_data.selects.rarity}
                />
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <label className="control-label">Sets</label>
                <Select
                  multi
                  name="sets"
                  onChange={(v) => this.props.handleSelectChange('sets', v)}
                  value={this.props.filter_data.sets}
                  multiple={true}
                  options={this.props.init_data.selects.set}
                />
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <label className="control-label">Border</label>
              <Select
                name="frame"
                onChange={(v) => this.props.handleSelectChange('border_color', v)}
                value={this.props.filter_data.border_color}
                options={this.props.init_data.selects.border_color}
              />
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <label className="control-label">Frame</label>
              <Select
                name="frame"
                onChange={(v) => this.props.handleSelectChange('frame', v)}
                value={this.props.filter_data.frame}
                options={this.props.init_data.selects.frame}
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-6 col-xs-12">
            <div className="form-group">
              <label>{this.props.init_data.price_header}</label>
              <div className="row">
                <div className="col-lg-5"><input name="price_from" type="text" className="form-control" onChange={this.props.handleInputChange} value={this.props.filter_data.price_from} /></div>
                <div className="col-lg-1">to</div>
                <div className="col-lg-5"><input name="price_to" type="text" className="form-control" onChange={this.props.handleInputChange} value={this.props.filter_data.price_to} /></div>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <label className="control-label">Language</label>
                <Select
                  name="language"
                  onChange={(v) => this.props.handleSelectChange('language', v)}
                  value={this.props.filter_data.language}
                  options={this.props.init_data.selects.language}
                />
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <label className="control-label">Foil</label>
              <Select
                name="foil"
                onChange={(v) => this.props.handleSelectChange('foil', v)}
                value={this.props.filter_data.foil}
                options={this.props.init_data.selects.filter_foil}
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-6 col-xs-12">
            <div className="form-group">
              <label>Cost</label>
              <div className="row">
                <div className="col-lg-3 col-xs-4">
                  <select name="cost_control" className="form-control" onChange={this.props.handleInputChange} value={this.props.filter_data.cost_control}>
                    <option value="">Exactly</option>
                    <option value="contains">Contains</option>
                  </select>
                </div>
                <div className="col-lg-6 col-xs-8">
                  <input name="mana_cost" className="form-control" placeholder="Mana Cost" onChange={this.props.handleInputChange} checked={this.props.filter_data.mana_cost} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-6 col-xs-12">
            <label>Converted Cost</label>
            <div className="row">
              <div className="col-lg-5 col-xs-5"><input type="number" name="cmc_from" className="form-control" onChange={this.props.handleInputChange} checked={this.props.filter_data.cost_from} /></div>
              <div className="col-lg-1 col-xs-1">to</div>
              <div className="col-lg-5 col-xs-5"><input type="number" name="cmc_to" className="form-control" onChange={this.props.handleInputChange} checked={this.props.filter_data.cost_to} /></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default BinderFilters;