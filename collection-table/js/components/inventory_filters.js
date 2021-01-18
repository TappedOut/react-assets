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

    this.handleFilterReset = this.handleFilterReset.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  handleFilterReset() {
    const blank = {
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
    this.setState({form: blank})
    this.props.onFilter(blank)
  }

  objectsToOptions(objects) {
    return [<option value=""></option>].concat(objects.map(opts => <option value={opts.value}>{opts.name}</option>))
  }

  handleInputChange(event) {
    const target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    if (name === 'sets') {
      value = Array.from(target.selectedOptions, option => option.value);
    }

    const new_form = {...this.state.form, [name]: value}

    this.setState({
      form: new_form
    });
    this.props.onFilter(new_form)
  }

  render() {
    const color_options = this.objectsToOptions(this.props.init_data.selects.color)
    const collection_options = this.objectsToOptions(this.props.init_data.selects.collection);
    const rarity_options = this.objectsToOptions(this.props.init_data.selects.rarity);
    const type_options = this.objectsToOptions(this.props.init_data.selects.type);
    const set_options = this.objectsToOptions(this.props.init_data.selects.set);
    const language_options = this.objectsToOptions(this.props.init_data.selects.language);
    return (
      <div>
        <div className="row">
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <label className="control-label">Rules contains</label>
              <input name="rules" type="text" className="form-control" onChange={this.handleInputChange} value={this.state.form.rules}/>
              <div className="help-block">Enters the battlefield, Tap target creature, etc.</div>
            </div>
          </div>
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <label className="control-label">Color</label>
                <select name="color" className="form-control input-sm" onChange={this.handleInputChange} value={this.state.form.color}>
                  {color_options}
                </select>
            </div>
          </div>
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <label className="control-label">Exclude Color</label>
                <select name="exclude_color" className="form-control input-sm" onChange={this.handleInputChange} value={this.state.form.exclude_color}>
                  {color_options}
                </select>
            </div>
          </div>
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <label className="control-label">Collection</label>
                <select name="collection" className="form-control input-sm" onChange={this.handleInputChange} value={this.state.form.collection}>
                  {collection_options}
                </select>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <label className="control-label">Rarity</label>
                <select name="rarity" className="form-control input-sm" onChange={this.handleInputChange} value={this.state.form.rarity}>
                  {rarity_options}
                </select>
            </div>
          </div>
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <label className="control-label">Type</label>
                <select name="type" className="form-control input-sm" onChange={this.handleInputChange} value={this.state.form.type}>
                  {type_options}
                </select>
            </div>
          </div>
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <label className="control-label">Subtype</label>
                <input name="subtype" className="form-control input-sm" onChange={this.handleInputChange} value={this.state.form.subtype} />
                <div className="help-block">Aura, Vampire, Rogue, etc.</div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <label className="control-label">Sets</label>
                <select name="sets" className="form-control input-sm" onChange={this.handleInputChange} value={this.state.form.sets} multiple={true}>
                  {set_options}
                </select>
            </div>
          </div>
          <div className="col-lg-5 col-xs-12">
            <div className="form-group">
              <label>TCG Player Price</label>
              <div className="row">
                <div className="col-lg-5"><input name="price_from" type="text" className="form-control" onChange={this.handleInputChange} value={this.state.form.price_from} /></div>
                <div className="col-lg-1">to</div>
                <div className="col-lg-5"><input name="price_to" type="text" className="form-control" onChange={this.handleInputChange} value={this.state.form.price_to} /></div>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <label className="control-label">Language</label>
                <select name="language" className="form-control input-sm" onChange={this.handleInputChange} value={this.state.form.language}>
                  {language_options}
                </select>
            </div>
          </div>
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <div className="checkbox">
                <label htmlFor="foil-search">
                  <input name="foil" type="checkbox" onChange={this.handleInputChange} checked={this.state.form.foil} />
                    Foil <img alt="foil img" className="card-icon" src={this.props.foil_img} />
                </label>
              </div>
            </div>
          </div>
          <div className="col-lg-3 col-xs-6">
            <div className="form-group">
              <div className="checkbox">
                <label htmlFor="inventory-search">
                  <input name="owned" type="checkbox" onChange={this.handleInputChange} checked={this.state.form.owned} />
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
                  <select name="cost_control" className="form-control" onChange={this.handleInputChange} value={this.state.form.cost_control}>
                    <option value="">Exactly</option>
                    <option value="contains">Contains</option>
                  </select>
                </div>
                <div className="col-lg-6">
                  <input name="mana_cost" className="form-control" placeholder="Mana Cost" onChange={this.handleInputChange} checked={this.state.form.mana_cost} />
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-5 col-xs-12">
            <label>Converted Cost</label>
            <div className="row">
              <div className="col-lg-5"><input name="cmc_from" className="form-control" onChange={this.handleInputChange} checked={this.state.form.cost_from} /></div>
              <div className="col-lg-1">to</div>
              <div className="col-lg-5"><input name="cmc_to" className="form-control" onChange={this.handleInputChange} checked={this.state.form.cost_to} /></div>
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
