import React, { Component } from "react";
import Select from 'react-select';

class InventoryFilters extends Component {
  constructor(props) {
    super(props);

    this.state = {
      collapse: true,
      form: {
        rules: '',
        colors: [],
        colors_exclude: [],
        collection: '',
        rarity: '',
        cardtype: '',
        subtype: '',
        sets: [],
        price_from: '',
        price_to: '',
        language: '',
        owned: true,
        display: 'owned',
        foil: '',
        mana_cost: '',
        cmc_from: '',
        cmc_to: '',
        cost_control: '',
        border_color: '',
        frame: '',
        proxy: ''
      }
    };

    this.handleFilterReset = this.handleFilterReset.bind(this);
    this.handleSelectChange = this.handleSelectChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.debouncedFilter = _.debounce(data => {this.props.onFilter(data)}, 1000)
  }

  handleFilterReset() {
    const blank = {
      rules: '',
      colors: [],
      colors_exclude: [],
      collection: '',
      rarity: '',
      cardtype: '',
      subtype: '',
      sets: [],
      price_from: '',
      price_to: '',
      language: '',
      owned: true,
      display: 'owned',
      foil: '',
      mana_cost: '',
      cmc_from: '',
      cmc_to: '',
      cost_control: '',
      border_color: '',
      frame: '',
      proxy: ''
    }
    this.setState({form: blank})
    this.props.onFilter(blank)
  }

  handleInputChange(event) {
    const target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    const new_form = {...this.state.form, [name]: value}
    if (name === 'owned') value ? new_form['display'] = 'owned' : new_form['display'] = 'collapse'
    this.setState({
      form: new_form
    });
    this.debouncedFilter(new_form)
  }

  handleSelectChange(name, selected) {
    let value = ''
    if (selected) {
      value = Array.isArray(selected) ? selected.map(v => {
        return v['value']
      }) : selected['value'];
    }
    const new_form = {...this.state.form, [name]: value}
    this.setState({
      form: new_form
    });
    this.debouncedFilter(new_form)
  }

  render() {
    const proxy_opts = [{'value': true, 'label': 'Yes'}, {'value': false, 'label': 'No'}]
    return (
      <div>
        <div className="row">
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <label className="control-label">Rules contains</label>
              <input name="rules" type="text" className="form-control" onChange={this.handleInputChange} value={this.state.form.rules}/>
              <div className="help-block">Enters the battlefield, Tap target creature, etc.</div>
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <label className="control-label">Color</label>
              <Select
                name="colors"
                multi
                onChange={(v) => this.handleSelectChange('colors', v)}
                value={this.state.form.colors}
                options={this.props.init_data.selects.color}
                multiple={true}
              />
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <label className="control-label">Exclude Color</label>
                <Select
                  name="colors_exclude"
                  multi
                  onChange={(v) => this.handleSelectChange('colors_exclude', v)}
                  value={this.state.form.colors_exclude}
                  options={this.props.init_data.selects.color}
                  multiple={true}
                />
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <label className="control-label">Collection</label>
                <Select
                  name="collection"
                  multi
                  onChange={(v) => this.handleSelectChange('collection', v)}
                  value={this.state.form.collection}
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
                  onChange={(v) => this.handleSelectChange('rarity', v)}
                  value={this.state.form.rarity}
                  options={this.props.init_data.selects.rarity}
                />
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <label className="control-label">Type</label>
                <Select
                  name="cardtype"
                  onChange={(v) => this.handleSelectChange('cardtype', v)}
                  value={this.state.form.cardtype}
                  options={this.props.init_data.selects.type}
                />
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <label className="control-label">Subtype</label>
                <input name="subtype" className="form-control input-sm" onChange={this.handleInputChange} value={this.state.form.subtype} />
                <div className="help-block">Aura, Vampire, Rogue, etc.</div>
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <label className="control-label">Proxy</label>
                <Select
                  name="proxy"
                  onChange={(v) => this.handleSelectChange('proxy', v)}
                  value={this.state.form.proxy}
                  options={proxy_opts}
                />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <label className="control-label">Sets</label>
                <Select
                  multi
                  name="sets"
                  onChange={(v) => this.handleSelectChange('sets', v)}
                  value={this.state.form.sets}
                  multiple={true}
                  options={this.props.init_data.selects.set}
                />
            </div>
          </div>
          <div className="col-lg-5 col-xs-12">
            <div className="form-group">
              <label>{this.props.init_data.price_header}</label>
              <div className="row">
                <div className="col-lg-5"><input name="price_from" type="text" className="form-control" onChange={this.handleInputChange} value={this.state.form.price_from} /></div>
                <div className="col-lg-1">to</div>
                <div className="col-lg-5"><input name="price_to" type="text" className="form-control" onChange={this.handleInputChange} value={this.state.form.price_to} /></div>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-lg-offset-1 col-xs-12">
            <div className="form-group">
              <label className="control-label">Border</label>
              <Select
                name="frame"
                onChange={(v) => this.handleSelectChange('border_color', v)}
                value={this.state.form.border_color}
                options={this.props.init_data.selects.border_color}
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <label className="control-label">Language</label>
                <Select
                  name="language"
                  onChange={(v) => this.handleSelectChange('language', v)}
                  value={this.state.form.language}
                  options={this.props.init_data.selects.language}
                />
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <label className="control-label">Foil</label>
              <Select
                name="foil"
                onChange={(v) => this.handleSelectChange('foil', v)}
                value={this.state.form.foil}
                options={this.props.init_data.selects.filter_foil}
              />
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <div className="checkbox">
                <label htmlFor="owned">
                  <input id="owned" name="owned" type="checkbox" onChange={this.handleInputChange} checked={this.state.form.owned} />
                    Owned cards only
                </label>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-xs-12">
            <div className="form-group">
              <label className="control-label">Frame</label>
              <Select
                name="frame"
                onChange={(v) => this.handleSelectChange('frame', v)}
                value={this.state.form.frame}
                options={this.props.init_data.selects.frame}
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-7 col-xs-12">
            <div className="form-group">
              <label>Cost</label>
              <div className="row">
                <div className="col-lg-3 col-xs-4">
                  <select name="cost_control" className="form-control" onChange={this.handleInputChange} value={this.state.form.cost_control}>
                    <option value="">Exactly</option>
                    <option value="contains">Contains</option>
                  </select>
                </div>
                <div className="col-lg-6 col-xs-8">
                  <input name="mana_cost" className="form-control" placeholder="Mana Cost" onChange={this.handleInputChange} checked={this.state.form.mana_cost} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-5 col-xs-12">
            <label>Converted Cost</label>
            <div className="row">
              <div className="col-lg-5 col-xs-5"><input type="number" name="cmc_from" className="form-control" onChange={this.handleInputChange} checked={this.state.form.cost_from} /></div>
              <div className="col-lg-1 col-xs-1">to</div>
              <div className="col-lg-5 col-xs-5"><input type="number" name="cmc_to" className="form-control" onChange={this.handleInputChange} checked={this.state.form.cost_to} /></div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-5 col-xs-12">
            <p><a className="btn btn-info btn-block" onClick={this.handleFilterReset}>Reset Filters</a></p>
          </div>
        </div>
      </div>
    );
  }
}

export default InventoryFilters;
