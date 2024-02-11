import _ from "lodash";
import React, { Component } from "react";
import ReactDOM from "react-dom";
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroller';
import FolderSelect from '../../folders/js/components/folder_select';
import Deck from '../../folders/js/components/deck'
import '../../folders/css/folders.css';

const API_DECK_ACTION = `/api/folder/deck-action/`;

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

const PER_PAGE_AMOUNT = 40;

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      folderId: window.django.folderId,
      folderName: null,
      folderDesc: null,
      managed: false,
      decks: [],
      foldersOpt: [],
      selectedDeck: null,
      nextDecksIndex: 1,
      folderAction: 'Move',
      targetFolder: '', // need empty string for select value
      newTargetFolder: null,
      showFolderSelectModal: false,
      errorGettingFolder: false,
      canEdit: window.django.canEdit,
      authenticated: window.django.authenticated
    };

    this._onDeckBtnClick = this.onDeckBtnClick.bind(this);
    this._onDeckDeleteBtnClick = this.onDeckDeleteBtnClick.bind(this);
    this._onSelectModalClose = this.onSelectModalClose.bind(this);
    this._onFolderSelect = this.onFolderSelect.bind(this);
    this._onFolderCreate = this.onFolderCreate.bind(this);
    this._onFolderDecksGet = this.onFolderDecksGet.bind(this);
    this._getDecks = this.getDecks.bind(this);

    this.getFolder(window.django.folderId)
  }

  getFolder(folderId) {
    axios.get(
      `/api/folder/${folderId}/detail/`
    ).then(
      response => {
        this.setState({
          folderName: response.data.folder.name,
          folderDesc: response.data.folder.description,
          managed: response.data.folder.managed,
          nextDecksIndex: response.data.folder.nextDecksIndex,
          decks: response.data.folder.decks,
          foldersOpt: response.data.allFolders,
          hasMoreDecks: response.next,
          errorGettingFolder: false
        })
      },
      error => {
        this.setState({errorGettingFolder: true})
      }
    )
  }

  getDecks(index) {
    const API_FOLDER_DECKS = `/api/folder/${this.state.folderId}/decks/`;
    axios.get(
      `${API_FOLDER_DECKS}?start=${this.state.nextDecksIndex}&amount=${PER_PAGE_AMOUNT}`
    ).then(
      response => {
        this.setState({
          nextDecksIndex: response.data.nextDecksIndex,
          decks: this.state.decks.concat(response.data.results)
        });
      },
      error => {
        this.setState({getMoreDecksText: 'Error getting decks. Click again to retry'})
      }
    )
  }

  deckAction(deck, target_folder, new_target_folder, origin_folder, action) {
    action = action.toLowerCase();
    let data = {
      deck: deck.id,
      target_folder: target_folder,
      origin_folder: this.state.folderId,
      new_target_folder: new_target_folder,
      action: action,
    };
    if (!data.target_folder) {
      delete data.target_folder
    }
    if (!data.new_target_folder) {
      delete data.new_target_folder
    }
    axios.post(
      API_DECK_ACTION,
      data
    ).then(
      response => {
        let newFoldersOpt = this.state.foldersOpt.slice();
        let nextIndex = this.state.nextDecksIndex;
        // Remove deck from origin folder unless copy
        let decks = this.state.decks;
        if (action !== 'copy') {
          decks = this.state.decks.filter(folderDeck => {
            return deck.id !== folderDeck.id
          });
          nextIndex -= 1;
        }
        if (response.data.created) {
          newFoldersOpt.push({name: new_target_folder, id: response.data.folder});
          newFoldersOpt.sort((a, b) => a.name < b.name ? -1 : 1);
        }
        this.setState({
          decks: decks,
          selectedDeck: null,
          folderAction: 'Move',
          targetFolder: '',
          newTargetFolder: null,
          showFolderSelectModal: false,
          foldersOpt: newFoldersOpt,
          nextDecksIndex: nextIndex
        })
      },
      error => {
        //TODO: ERROR HANDLING!
      }
    )
  }

  onDeckBtnClick(deck, action) {
    this.setState({
      selectedDeck: deck,
      folderAction: action,
      showFolderSelectModal: true,
      originFolder: this.state.folderId
    });
  }

  onDeckDeleteBtnClick(deck) {
    this.deckAction(deck, null, null, null, 'Delete')
  }

  onSelectModalClose() {
    this.setState({
      showFolderSelectModal: false
    });
  }

  onFolderSelect(target_folder) {
    this.setState({targetFolder: target_folder});
    this.deckAction(
      this.state.selectedDeck,
      target_folder,
      null,
      this.state.originFolder,
      this.state.folderAction)
  }

  onFolderCreate(new_target_folder) {
    this.setState({targetFolder: new_target_folder});
    this.deckAction(
      this.state.selectedDeck,
      null,
      new_target_folder,
      this.state.originFolder,
      this.state.folderAction)
  }

  onFolderDecksGet(new_decks, folder_id){
    const newFolders = this.state.folders.map(folder => {
      // Add new decks to folder
      if (folder.id === folder_id) {
        folder.decks = folder.decks.concat(new_decks)
      }
      return folder
    });
    this.setState({folders: newFolders})
  }

  render() {
    const getDecksDB = _.debounce(index => {
      this._getDecks(index);
    }, 3000);

    if (!this.state.decks.length){
      return <div>Loading...</div>
    }
    if (this.state.errorGettingFolder){
      return (
        <div>We couldn't get the folder info.&nbsp;
          <button
          className="btn btn-default"
          onClick={this.getFolder(this.state.folderId)}>
            Retry
          </button>
        </div>
      )
    }
    let groupSize = 4;
    const decks = this.state.decks.map(deck => {
      return (
        <Deck
        key={deck.id}
        deck={deck}
        onFolderDeckBtnClick={this._onDeckBtnClick}
        onFolderDeckDeleteBtnClick={this._onDeckDeleteBtnClick}
        canEdit={this.state.canEdit && !this.state.managed}
        authenticated={this.state.authenticated}
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
    return (
      <div>
        <InfiniteScroll
          pageStart={this.state.nextDecksIndex}
          loadMore={getDecksDB}
          hasMore={this.state.nextDecksIndex > -1}
          loader={<div key={this.state.nextDecksIndex} >Loading...</div>}
        >
        {decks}
        </InfiniteScroll>
        <FolderSelect
          deck={this.state.selectedDeck}
          foldersOpt={this.state.foldersOpt}
          originFolder={this.state.originFolder}
          targetFolder={this.state.folderId}
          action={this.state.folderAction}
          show={this.state.showFolderSelectModal}
          onModalClose={this._onSelectModalClose}
          onFolderSelect={this._onFolderSelect}
          onFolderCreate={this._onFolderCreate}
        />
      </div>)
  }
}

ReactDOM.render(<App />, document.getElementById('folder-app-container'));
