import React from 'react';
import { Async } from 'react-select';
import axios from 'axios';
import Toggle from 'react-toggle';
import NewCardPin from './NewCardPin';
const _ = require('lodash');


export default class NewCardsBoard extends React.Component {
  constructor(props) {
    super(props);

    this.refSelect = null;
  }

  throttledAutocomplete = _.throttle((searchUrl, callback) => {
    axios.get(searchUrl)
      .then((response) => callback(null, { options: response.data }))
      .catch((error) => callback(error, null))
  }, 1000);

  handleAutocomplete = (input, callback) => {
    if (!input || input.length < 3) {
      callback(null, { options: [] });
    } else {
      let searchUrl = `${this.props.searchInput.invOnly ? this.props.autocompleteUrlInv : this.props.autocompleteUrl}?name=${input}`
      this.throttledAutocomplete(searchUrl, callback);
    }
  };

  handleEnterSearch = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault();

      if(!this.props.searching) {
        this.props.searchCards(true, true, this.refSelect.state.inputValue);
      }
    }
  };

  handleSearch = (e) => {
    e.preventDefault();

    if (!this.props.searching) {
      this.props.searchCards(true, true);
    }
  };

  handleInputChange = (inputValue) => {
    if (inputValue === "") {
      this.props.clearSearchInput();
    }

    return inputValue;
  }

  renderSearch = () => {
    return (
      <form role="form" className="form-horizontal simple-search-form"
            onSubmit={this.handleSearch}>
        <div className="form-group">
          <div className="col-md-3 inv-only-row">
            <span className="toggler">
              <label htmlFor="invOnlyTogglerNewCards">
                Restrict to my Inventory</label>
              <Toggle
                id="invOnlyTogglerNewCards"
                name="invOnly"
                defaultChecked={this.props.searchInput.invOnly}
                onChange={this.props.handleSearchInput}/>
            </span>
          </div>
          <div style={{"margin-bottom": "5px"}} className="col-md-4">
            <Async arrowRenderer={null}
                   autoload={false}
                   cache={false}
                   className="text-left"
                   clearable={false}
                   labelKey="name"
                   loadOptions={_.debounce(this.handleAutocomplete, 2000)}
                   loadingPlaceholder="Searching..."
                   onBlur={this.props.handleSearchInput}
                   onBlurResetsInput={false}
                   onInputChange={this.handleInputChange}
                   onInputKeyDown={this.handleEnterSearch}
                   onChange={this.props.handleSearchCardSelect}
                   onCloseResetsInput={false}
                   onSelectResetsInput={false}
                   openOnFocus={true}
                   placeholder="Search card by name"
                   ref={(ref) => this.refSelect = ref}
                   value={
                     this.props.searchInput.name ?
                       {pk: 0, name: this.props.searchInput.name} : null
                   }
                   valueKey="pk"/>
            <span className="glyphicon glyphicon-search search-form-icon"
                  onClick={this.handleSearch}/>
          </div>
          <div className="col-md-2 text-center">
            <button className="btn btn-warning btn-block"
                    disabled={this.props.searching}
                    type="button"
                    onClick={this.props.handleAdvancedSearch}>
              Advanced Card Search
            </button>
          </div>
          <div className="col-md-2 text-center">
            <button className="btn btn-danger btn-block"
                    disabled={this.props.searching}
                    type="button"
                    onClick={this.props.handleSearchClear}>
              Clear Search
            </button>
          </div>
        </div>
      </form>
    );
  };

  render() {
    const { cards, droppablesRef, handleCardMoveStart, handleSearchScroll, imagesMaxWidth,
       toggleImages, noCardsFound, searching } = this.props;

    return (
      <div className="panel panel-default board-panel search-panel top-borderless-panel">
        <div className="panel-body">
          <div className={"row " +
              `${(cards.length > 0 || searching || noCardsFound) ? 'search-card-panel' : ''}`}
                key={1}>
            <div className="col-md-12 text-center">
              { this.renderSearch() }
            </div>
          </div>
          {
            cards.length > 0 &&
            <div className="row" key={2}>
              <div className="col-md-12">
                <div ref={droppablesRef} data-board-name="new-cards"
                     onScroll={handleSearchScroll}
                     className={"board-droppable compact-board " +
                     "search-card-results"}>
                  {
                    cards.map((card, idx) => {
                      return <NewCardPin
                        key={idx}
                        card={card}
                        handleCardMoveStart={handleCardMoveStart}
                        imagesMaxWidth={imagesMaxWidth}
                        toggleImages={toggleImages}
                      />
                    })
                  }
                </div>
              </div>
            </div>
          }
          {
            searching &&
            <div className="row" key={3}>
              <div className="col-md-6 col-md-offset-3">
                <div className="progress search-progress">
                  <div className={"progress-bar progress-bar-info " +
                  "progress-bar-striped active"}
                       role="progressbar" aria-valuenow="100"
                       aria-valuemin="0" aria-valuemax="100"
                       style={{width: "100%"}}>
                    <strong>Searching...</strong>
                  </div>
                </div>
              </div>
            </div>
          }
          {
            noCardsFound && !searching &&
            <div className="row" key={4}>
              <div className="col-md-12">
                <h3 className="text-center">
                  There were no cards found for &quot;{noCardsFound}&quot;
                </h3>
              </div>
            </div>
          }
        </div>
      </div>
    )
  }
}
