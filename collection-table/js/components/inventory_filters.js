import React, { Component } from "react";

class InventoryFilters extends Component {
  constructor(props) {
    super(props);

    this.state = {
      collapse: true,
      form: {
        rules: '',
        name: '',
        color: '',
        exclude_color: '',
        collection: '',
        rarity: '',
        type: '',
        subtype: '',
        sets: [],
        price_from: '',
        price_to: '',
        language: '',
        owned: true,
        foil: false,
        mana_cost: '',
        cmc_from: '',
        cmc_to: '',
        cost_control: ''
      }
    };

    this.handleCostControlChange = this.handleCostControlChange.bind(this)
    this.handleFilterReset = this.handleFilterReset.bind(this)
  }

  handleFilter() {
    this.setState({show: false});
    this.props.onFilter(this.state.form);
  }

  handleCostControlChange(event) {
    this.setState({cost_control: event.target.value});
  }

  handleFilterReset() {
    const blank = {
      form: {
        rules: '',
        name: '',
        color: '',
        exclude_color: '',
        collection: '',
        rarity: '',
        type: '',
        subtype: '',
        sets: [],
        price_from: '',
        price_to: '',
        language: '',
        owned: true,
        foil: false,
        mana_cost: '',
        cmc_from: '',
        cmc_to: '',
        cost_control: ''
      }
    }
    this.setState({form: blank})
    this.props.onFilter(blank)
  }

  render() {
    const color_options = [];
    const collection_options = [];
    const rarity_options = [];
    const type_options = [];
    const sets_options = [];
    const language_options = [];
    return (
      <div>
        <div className="row">
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <label className="control-label">Rules contains</label>
              <input type="text" className="form-control" onChange={this.handleInputChange} value={this.state.form.rules}/>
              <div className="help-block">Enters the battlefield, Tap target creature, etc.</div>
            </div>
          </div>
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <label className="control-label">Color</label>
                <select className="form-control input-sm" onChange={this.handleInputChange} value={this.state.form.color}>
                  {color_options}
                </select>
            </div>
          </div>
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <label className="control-label">Exclude Color</label>
                <select className="form-control input-sm" onChange={this.handleInputChange} value={this.state.form.exclude_color}>
                  {color_options}
                </select>
            </div>
          </div>
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <label className="control-label">Collection</label>
                <select className="form-control input-sm" onChange={this.handleInputChange} value={this.state.form.collection}>
                  {collection_options}
                </select>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <label className="control-label">Rarity</label>
                <select className="form-control input-sm" onChange={this.handleInputChange} value={this.state.form.rarity}>
                  {rarity_options}
                </select>
            </div>
          </div>
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <label className="control-label">Type</label>
                <select className="form-control input-sm" onChange={this.handleInputChange} value={this.state.form.type}>
                  {type_options}
                </select>
            </div>
          </div>
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <label className="control-label">Subtype</label>
                <input className="form-control input-sm" onChange={this.handleInputChange} value={this.state.form.subtype} />
                <div className="help-block">Aura, Vampire, Rogue, etc.</div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <label className="control-label">Sets</label>
                <select className="form-control input-sm" onChange={this.handleInputChange} value={this.state.form.sets}>
                  {sets_options}
                </select>
            </div>
          </div>
          <div className="col-lg-5 col-xs-12">
            <div className="form-group">
              <label>TCG Player Price</label>
              <div className="row">
                <div className="col-lg-5"><input type="text" className="form-control" onChange={this.handleInputChange} value={this.state.form.price_from} /></div>
                <div className="col-lg-1">to</div>
                <div className="col-lg-5"><input type="text" className="form-control" onChange={this.handleInputChange} value={this.state.form.price_to} /></div>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <label className="control-label">Language</label>
                <select className="form-control input-sm" onChange={this.handleInputChange} value={this.state.form.language}>
                  {language_options}
                </select>
            </div>
          </div>
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <div className="checkbox">
                <label htmlFor="foil-search">
                  <input type="checkbox" onChange={this.handleInputChange} checked={this.state.form.foil} />
                    Foil <img alt="foil img" className="card-icon" src={this.props.foil_img} />
                </label>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <div className="checkbox">
                <label htmlFor="inventory-search">
                  <input type="checkbox" className="" onChange={this.handleInputChange} checked={this.state.form.owned} />
                    Owned cards only
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-7 col-xs-2">
            <div className="form-group">
              <label>Cost</label>
              <div className="row">
                <div className="col-lg-3">
                  <select className="form-control" onChange={this.handleCostControlChange} value={this.state.form.cost_control}>
                    <option value="">Exactly</option>
                    <option value="contains">Contains</option>
                  </select>
                </div>
                <div className="col-lg-6">
                  <input className="form-control" placeholder="Mana Cost" onChange={this.handleInputChange} checked={this.state.form.mana_cost} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-5 col-xs-12">
            <label>Converted Cost</label>
            <div className="row">
              <div className="col-lg-5"><input className="form-control" onChange={this.handleInputChange} checked={this.state.form.cost_from} /></div>
              <div className="col-lg-1">to</div>
              <div className="col-lg-5"><input className="form-control" onChange={this.handleInputChange} checked={this.state.form.cost_to} /></div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-5 col-xs-12">
            <p><a className="btn btn-info btn-block" onClick={this.handleFilter}>Reset Filters</a></p>
          </div>
        </div>
      </div>
    );
  }

  onInputChange(term) {
    this.setState({ term });
  }
}

export default InventoryFilters;
