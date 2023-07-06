import React, { Component } from "react";
import Select from 'react-select';

class InventoryFilters extends Component {
  constructor(props) {
    super(props);

    this.state = {
      collapse: true,
    };
  }

  render() {
    const proxy_opts = [{'value': true, 'label': 'Yes'}, {'value': false, 'label': 'No'}]
    return (
      <div>
        <div className="row">
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <input placeholder="Rules contain" name="rules" type="text" className="form-control" onChange={this.props.handleInputChange} value={this.props.filter_data.rules}/>
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <Select
                name="cardtype"
                onChange={(v) => this.props.handleSelectChange('cardtype', v)}
                value={this.props.filter_data.cardtype}
                options={this.props.init_data.selects.type}
                placeholder="Type"
              />
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
                <input placeholder="Subtype" name="subtype" className="form-control input-sm" onChange={this.props.handleInputChange} value={this.props.filter_data.subtype} />
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
                <Select
                  name="collection"
                  multi
                  onChange={(v) => this.props.handleSelectChange('collection', v)}
                  value={this.props.filter_data.collection}
                  options={this.props.init_data.selects.collection}
                  placeholder="Collection"
                />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
                <Select
                  name="rarity"
                  onChange={(v) => this.props.handleSelectChange('rarity', v)}
                  value={this.props.filter_data.rarity}
                  options={this.props.init_data.selects.rarity}
                  placeholder="Rarity"
                />
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
                <Select
                  multi
                  name="sets"
                  onChange={(v) => this.props.handleSelectChange('sets', v)}
                  value={this.props.filter_data.sets}
                  multiple={true}
                  options={this.props.init_data.selects.set}
                  placeholder="Sets"
                />
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <Select
                name="border"
                onChange={(v) => this.props.handleSelectChange('border_color', v)}
                value={this.props.filter_data.border_color}
                options={this.props.init_data.selects.border_color}
                placeholder="Border"
              />
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <Select
                name="frame"
                onChange={(v) => this.props.handleSelectChange('frame', v)}
                value={this.props.filter_data.frame}
                options={this.props.init_data.selects.frame}
                placeholder="Frame"
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-6 col-xs-12">
            <div className="form-group">
              <div className="row">
                <div className="col-lg-5"><input placeholder={this.props.init_data.price_header} name="price_from" type="text" className="form-control" onChange={this.props.handleInputChange} value={this.props.filter_data.price_from} /></div>
                <div className="col-lg-1">to</div>
                <div className="col-lg-5"><input name="price_to" type="text" className="form-control" onChange={this.props.handleInputChange} value={this.props.filter_data.price_to} /></div>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
                <Select
                  name="language"
                  onChange={(v) => this.props.handleSelectChange('language', v)}
                  value={this.props.filter_data.language}
                  options={this.props.init_data.selects.language}
                  placeholder="Language"
                />
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <Select
                name="foil"
                onChange={(v) => this.props.handleSelectChange('foil', v)}
                value={this.props.filter_data.foil}
                options={this.props.init_data.selects.filter_foil}
                placeholder="Foil"
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-6 col-xs-12">
            <div className="form-group">
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
            <div className="row">
              <div className="col-lg-5 col-xs-5"><input placeholder="Mana value" type="number" name="cmc_from" className="form-control" onChange={this.props.handleInputChange} checked={this.props.filter_data.cost_from} /></div>
              <div className="col-lg-1 col-xs-1">to</div>
              <div className="col-lg-5 col-xs-5"><input type="number" name="cmc_to" className="form-control" onChange={this.props.handleInputChange} checked={this.props.filter_data.cost_to} /></div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
                <Select
                  name="proxy"
                  onChange={(v) => this.props.handleSelectChange('proxy', v)}
                  value={this.props.filter_data.proxy}
                  options={proxy_opts}
                  placeholder="Proxy"
                />
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <div className="checkbox">
                <label htmlFor="owned">
                  <input id="owned" name="owned" type="checkbox" onChange={this.props.handleInputChange} checked={this.props.filter_data.owned} />
                    Owned cards only
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default InventoryFilters;
