import React from 'react';
import Select from 'react-select';


function setupChoice(choice) {
  return {value: choice[0], label: choice[1]}
}


export default class CardSearchModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      search: false
    };

    this.typeChoices = this.props.initData.type_choices.map(setupChoice);
    this.rarityChoices = this.props.initData.rarity_choices.map(setupChoice);
    this.keywordsChoices = this.props.initData.keywords_choices.map(setupChoice);
    this.formatsChoices = this.props.initData.formats_choices.map(setupChoice);
    this.setsChoices = this.props.initData.sets_choices.map(setupChoice);
    this.blockChoices = this.props.initData.block_choices.map(setupChoice);
    this.colorChoices = this.props.initData.color_choices.map(setupChoice);
    this.orderChoices = this.props.initData.order_choices.map(setupChoice);
  }

  componentDidMount() {
    jQuery(this.modalReference)
      .modal('show')
      .on('hide.bs.modal', () => this.props.handleSearch(this.state.search));
  }

  handleSearch = () => {
    this.setState({search: true}, () =>
      jQuery(this.modalReference).modal('hide'));
  };

  renderAdvancedSearch = () => {
    return (
      <div className="row">
        <div className="col-lg-6">
          <div className="form-group">
            <label className="control-label" htmlFor="name">Name</label>
            <input id="name" type="text" name="name"
                   value={this.props.searchInput.name}
                   className="form-control"
                   onChange={this.props.handleSearchInput}/>
          </div>
          <div className="form-group">
            <label className="control-label" htmlFor="type">Type</label>
            <Select
              multi
              id="type"
              name="type"
              onChange={(v) => this.props.handleSearchSelect("type", v)}
              options={this.typeChoices}
              simpleValue
              value={this.props.searchInput.type}
            />
          </div>
          <div className="form-group">
            <label className="control-label" htmlFor="subtype">Subtype</label>
            <input id="subtype" type="text" name="subtype"
                   value={this.props.searchInput.subtype}
                   className="form-control"
                   onChange={this.props.handleSearchInput}/>
            <span className="help-block">Aura, Vampire, Rogue, etc.</span>
          </div>
          <div className="form-group">
            <label className="control-label" htmlFor="rarity">Rarity</label>
            <Select
              id="rarity"
              name="rarity"
              onChange={(v) => this.props.handleSearchSelect("rarity", v)}
              options={this.rarityChoices}
              simpleValue
              value={this.props.searchInput.rarity}
            />
          </div>
          <div className="form-group">
            <label className="control-label" htmlFor="keywords">Keywords</label>
            <Select
              multi
              id="keywords"
              name="keywords"
              onChange={(v) => this.props.handleSearchSelect("keywords", v)}
              options={this.keywordsChoices}
              simpleValue
              value={this.props.searchInput.keywords}
            />
          </div>
          <div className="form-group">
            <label className="control-label" htmlFor="order">Order</label>
            <Select
              id="order"
              name="order"
              onChange={(v) => this.props.handleSearchSelect("order", v)}
              options={this.orderChoices}
              simpleValue
              value={this.props.searchInput.order}
            />
          </div>
        </div>
        <div className="col-lg-6">
          <div className="form-group">
            <label className="control-label" htmlFor="formats">Format</label>
            <Select
              id="formats"
              name="formats"
              onChange={(v) => this.props.handleSearchSelect("formats", v)}
              options={this.formatsChoices}
              simpleValue
              value={this.props.searchInput.formats}
            />
          </div>
          <div className="form-group">
            <label className="control-label" htmlFor="sets">Sets</label>
            <Select
              multi
              id="sets"
              name="sets"
              onChange={(v) => this.props.handleSearchSelect("sets", v)}
              options={this.setsChoices}
              simpleValue
              value={this.props.searchInput.sets}
            />
          </div>
          <div className="form-group">
            <label className="control-label" htmlFor="block">Block</label>
            <Select
              id="block"
              name="block"
              onChange={(v) => this.props.handleSearchSelect("block", v)}
              options={this.blockChoices}
              simpleValue
              value={this.props.searchInput.block}
            />
          </div>
          <div className="form-group">
            <label className="control-label" htmlFor="color">Color</label>
            <Select
              multi
              id="color"
              name="color"
              onChange={(v) => this.props.handleSearchSelect("color", v)}
              options={this.colorChoices}
              simpleValue
              value={this.props.searchInput.color}
            />
          </div>
          <div className="form-group">
            <label className="control-label" htmlFor="rules">Rules contains</label>
            <input id="rules" type="text" name="rules"
                   value={this.props.searchInput.rules}
                   className="form-control"
                   onChange={this.props.handleSearchInput}/>
            <span className="help-block">Enters the battlefield, Tap target creature, etc.</span>
          </div>
        </div>
      </div>);
  };

  render() {
    return (
      <div className="modal fade" id="card-search-modal" tabIndex="-1"
           role="dialog" aria-labelledby="card-search-modal-label"
           ref={modal => this.modalReference = modal}>
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close"
                      data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
              <h4 className="modal-title"
                  id="card-search-modal-label">Card Search</h4>
            </div>
            <div className="modal-body">
              { this.renderAdvancedSearch() }
            </div>
            <div className="modal-footer card-search-modal-footer">
              <button type="button" className="btn btn-danger"
                      data-dismiss="modal">Close</button>
              <button type="button" className="btn btn-primary"
                      onClick={this.handleSearch}>Search</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}