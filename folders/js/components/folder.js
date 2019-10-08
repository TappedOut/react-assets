import React, { Component } from "react";
import { Collapse, Modal, FormControl, ControlLabel } from 'react-bootstrap';
import axios from 'axios';
import Deck from "./deck";


class Folder extends Component {
  constructor(props) {
    super(props);

    this.handleModalClose = this.handleModalClose.bind(this);
    this._handleNameInputChange = this.handleNameInputChange.bind(this);
    this._handleDescInputChange = this.handleDescInputChange.bind(this);
    this._handleEditBtnClick = this.handleEditBtnClick.bind(this);
    this._onFolderDeckBtnClick = this.onFolderDeckBtnClick.bind(this);
    this._onFolderDeckDeleteBtnClick = this.onFolderDeckDeleteBtnClick.bind(this);
    this._getFolderDecks = this.getFolderDecks.bind(this);

    this.state = {
      open: true,
      showEditModal: false,
      btnGlyph: 'chevron-down',
      nextDecksIndex: this.props.folder.nextDecksIndex,
      nameInputValue: props.folder.name,
      descInputValue: props.folder.description ? props.folder.description : '',
      getMoreDecksText: 'Load more decks',
      errorEditingFolder: '',
    }
  }

  handleModalClose() {
    this.setState({showEditModal: false});
  }

  handleNameInputChange(value) {
    this.setState({nameInputValue: value})
  }

  handleDescInputChange(value) {
    this.setState({descInputValue: value})
  }

  handleEditBtnClick() {
    const folder_data = {
      name: this.state.nameInputValue,
      description: this.state.descInputValue
    };
    axios.post(
      `api/folder/${this.props.folder.id}/edit/`,
      folder_data
    ).then(
      response => {
        this.props.onFolderEdit(this.props.folder.id, folder_data);
        this.handleModalClose()
      },
      error => {
        this.setState({errorEditingFolder: 'There was an error while editing.'})
      }
    );
  }

  onFolderDeckBtnClick(deck, action) {
    this.props.onDeckBtnClick(deck, action, this.props.folder.id)
  }

  onFolderDeckDeleteBtnClick(deck) {
    this.props.onDeckDeleteBtnClick(deck, this.props.folder.id)
  }

  onCollapseBtnClick() {
    if (this.state.open) {
      this.setState({
        btnGlyph: 'chevron-right',
        open: false
      })
    } else {
      this.setState({
        btnGlyph: 'chevron-down',
        open: true
      })
    }
  }

  getFolderDecks() {
    const API_FOLDER_DECKS = `api/folder/${this.props.folder.id}/decks/`;
    axios.get(
      `${API_FOLDER_DECKS}?start=${this.state.nextDecksIndex}`
    ).then(
      response => {
        this.setState({
          nextDecksIndex: response.data.nextDecksIndex,
          getMoreDecksText: 'Load more decks'
        });
        this.props.onFolderDecksGet(response.data.results, this.props.folder.id)
      },
      error => {
        this.setState({getMoreDecksText: 'Error getting decks. Click again to retry'})
      }
    )
  }

  render() {
    let groupSize = 4;
    const deckItems = this.props.folder.decks.map(deck => {
      return (
        <Deck
          key={deck.id}
          deck={deck}
          onFolderDeckBtnClick={this._onFolderDeckBtnClick}
          onFolderDeckDeleteBtnClick={this._onFolderDeckDeleteBtnClick}
          canEdit={ this.props.canEdit }
          authenticated={this.props.authenticated}
        />
      )
    }).reduce(function(r, element, index) {
        // create element groups with size 3, result looks like:
        // [[elem1, elem2, elem3], [elem4, elem5, elem6], ...]
        index % groupSize === 0 && r.push([]);
        r[r.length - 1].push(element);
        return r;
    }, []).map(function(rowContent) {
        // surround every group with 'row'
        return <div className="row">{rowContent}</div>;
    });
    let deckString = 'Deck';
    if (this.props.folder.deckCount > 1) {
      deckString = `${deckString}s`
    }
    let header = this.props.folder.name;
    if (this.state.nextDecksIndex > -1) {
      header = <a href={this.props.folder.url}>{header}</a>
    }
    let editBtn = null;
    if (this.props.canEdit) {
      editBtn = (
        <button
          className="btn btn-default"
          onClick={event => this.setState({showEditModal: true})}>
            <span className="glyphicon glyphicon-edit" />
        </button>
      )
    }
    let getMoreDecksBtn = null;
    let showAllBtn = null;
    if (this.state.nextDecksIndex > -1) {
      getMoreDecksBtn = (
          <button className="btn btn-default" onClick={event => this._getFolderDecks()}>
            {this.state.getMoreDecksText}
          </button>
        );
      showAllBtn = (
        <a className="btn btn-default" href={this.props.folder.url}>
          Show All
        </a>
        )
    }

    return (
      <div className="row">
        <div className="col-md-12" key={this.props.folder.id}>
          <div className="row">
            <div className="col-md-12 folder-header">
              <h2>
                {header}&nbsp;
                ({this.props.folder.deckCount} {deckString})&nbsp;
                {editBtn}&nbsp;
                <button className="btn btn-primary"
                        onClick={event => this.onCollapseBtnClick()}>
                  <span className={`glyphicon glyphicon-${this.state.btnGlyph}`} aria-hidden="true" />
                </button>&nbsp;
              </h2>
            </div>
          </div>
          <Collapse in={this.state.open}>
            <div>
              {deckItems}
              <div className="row">
                <div className="col-md-12 col-xs-12">
                  {getMoreDecksBtn} {showAllBtn}
                </div>
              </div>
            </div>
          </Collapse>
          <Modal show={this.state.showEditModal} onHide={this.handleModalClose}>
            <Modal.Body closeButton>
              <ControlLabel>Name</ControlLabel>
              <FormControl
                type="text"
                onChange={event => this._handleNameInputChange(event.target.value)}
                value={this.state.nameInputValue}
              />
              <br />
              <ControlLabel>Description</ControlLabel>
              <FormControl
                type="text"
                onChange={event => this._handleDescInputChange(event.target.value)}
                componentClass="textarea"
                value={this.state.descInputValue}
              />
              <br />
              <button
                className="btn btn-success"
                onClick={event => this._handleEditBtnClick()}>
                Save</button>
            </Modal.Body>
          </Modal>
        </div>
      </div>
    );
  }
}

export default Folder;
