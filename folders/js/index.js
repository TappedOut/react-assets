import React, { Component } from "react";
import ReactDOM from "react-dom";
import axios from 'axios';
import { Alert } from 'react-bootstrap';
import Folder from './components/folder';
import FolderSelect from './components/folder_select';
import PageSelect from './components/page_select';
import '../css/folders.css';

const API_FOLDERS_LIST = `/api/folder/${window.django.username}/list/`;
const API_DECK_ACTION = `/api/folder/deck-action/`;

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      folders: [],
      foldersOpt: [],
      selectedDeck: null,
      folderAction: 'Move',
      originFolder: null,
      targetFolder: '', // need empty string for select value
      newTargetFolder: null,
      showFolderSelectModal: false,
      errorGettingFolders: false,
      errorOnDeckAction: null,
      foldersPage: 1,
      totalPages: null,
      hasNextPage: null,
      hasPreviousPage: null,
      authenticated: window.django.authenticated,
      canEdit: window.django.canEdit
    };

    this._onDeckBtnClick = this.onDeckBtnClick.bind(this);
    this._onDeckDeleteBtnClick = this.onDeckDeleteBtnClick.bind(this);
    this._onSelectModalClose = this.onSelectModalClose.bind(this);
    this._onFolderSelect = this.onFolderSelect.bind(this);
    this._onFolderCreate = this.onFolderCreate.bind(this);
    this._onFolderEdit = this.onFolderEdit.bind(this);
    this._onFolderDecksGet = this.onFolderDecksGet.bind(this);
    this._onPageBtnClick = this.onPageBtnClick.bind(this);
    this._onErrorMsgDismiss = this.onErrorMsgDismiss.bind(this);

    this.getFolders(this.state.foldersPage)
  }

  deckInFolder(deck, folder) {
    return folder.decks.some(folderDeck => { return folderDeck.id === deck.id})
  }

  addDeckToFolder(deck, folder) {
    folder.decks.unshift(deck);
    folder.deckCount = folder.deckCount + 1;
  }

  getFolders(pageNum) {
    axios.get(
      `${API_FOLDERS_LIST}?page_num=${pageNum}`
    ).then(
      response => {
        this.setState({
          folders: response.data.results,
          foldersOpt: response.data.allFolders,
          totalPages: response.data.totalPages,
          errorGettingFolders: false
        })
      },
      error => {
        this.setState({errorGettingFolders: true})
      }
    )
  }

  deckAction(deck, target_folder, new_target_folder, origin_folder, action) {
    action = action.toLowerCase();
    let data = {
      deck: deck.id,
      target_folder: target_folder,
      origin_folder: origin_folder,
      new_target_folder: new_target_folder,
      action: action,
    };
    if (!data.target_folder) {
      delete data.target_folder
    }
    if (!data.new_target_folder) {
      delete data.new_target_folder
    }
    if (!data.origin_folder) {
      delete data.origin_folder
    }
    axios.post(
      API_DECK_ACTION,
      data
    ).then(
      response => {
        let newFoldersOpt = this.state.foldersOpt.slice();
        let newFolders = this.state.folders;
        if (this.state.canEdit) {
          // We didnt create the folder so it might be in this page already
          if (new_target_folder && !response.data.created) {
            target_folder = response.data.folder
          }
          newFolders = this.state.folders.map(folder => {
            // Remove deck from origin folder unless copy
            if (folder.id === origin_folder && action !== 'copy') {
              folder.decks = folder.decks.filter(folderDeck => {
                return deck.id !== folderDeck.id
              });
              folder.deckCount = folder.deckCount - 1;
              folder.nextDecksIndex = folder.nextDecksIndex - 1;
              if (folder.deckCount <= 0) {
                newFoldersOpt = newFoldersOpt.filter(folder => {
                  return origin_folder !== folder.id
                })
              }
            }
            // Add deck to target folder unless delete or already there
            if (target_folder && folder.id === target_folder &&
              !this.deckInFolder(deck, folder)
            ) {
              this.addDeckToFolder(deck, folder)
            }
            // If folder is uncat, and deck should be added here, add it
            if (folder.name === 'Uncategorized' && response.data.addedToUncat &&
              !this.deckInFolder(deck, folder)
            ) {
              this.addDeckToFolder(deck, folder)
            }
            return folder
          }).filter(folder => {
            // Don't show folders with no decks
            return folder.decks.length
          });
          if (response.data.created) {
            newFolders.push({
              name: new_target_folder,
              description: '',
              id: response.data.folder,
              deckCount: 1,
              decks: [deck]
            });
            newFolders.sort((a, b) => a.name < b.name ? -1 : 1);
          }
        }
        if (response.data.created) {
          newFoldersOpt.push({name: new_target_folder, id: response.data.folder});
          newFoldersOpt.sort((a, b) => a.name < b.name ? -1 : 1);
        }

        this.setState({
          folders: newFolders,
          selectedDeck: null,
          folderAction: 'Move',
          originFolder: null,
          targetFolder: '',
          newTargetFolder: null,
          showFolderSelectModal: false,
          foldersOpt: newFoldersOpt,
          errorOnDeckAction: null
        })
      },
      error => {
        let errorMsg = 'There was a problem when performing that action.';
        if (error.response.status === 400) {
          const key = Object.keys(error.response.data.errors)[0];
          errorMsg = error.response.data.errors[key][0]
        }
        errorMsg += ' If the problem persist, please refresh the page.';
        this.setState({
          selectedDeck: null,
          folderAction: 'Move',
          originFolder: null,
          targetFolder: '',
          newTargetFolder: null,
          showFolderSelectModal: false,
          errorOnDeckAction: errorMsg,
        })
      }
    )
  }

  onDeckBtnClick(deck, action, originFolder) {
    this.setState({
      selectedDeck: deck,
      folderAction: action,
      showFolderSelectModal: true,
      originFolder: originFolder
    });
  }

  onDeckDeleteBtnClick(deck, originFolder) {
    this.deckAction(deck, null, null, originFolder, 'Delete')
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

  onFolderEdit(folder_id, new_folder) {
    const newFolders = this.state.folders.map(folder => {
      // Replace old folder with new values
      if (folder.id === folder_id) {
        folder.name = new_folder.name;
        folder.description = new_folder.description
      }
      return folder
    });
    this.setState({
      folders: newFolders,
    })
  }

  onPageBtnClick(pageNum){
    this.setState({foldersPage: pageNum});
    this.getFolders(pageNum)
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

  onErrorMsgDismiss(){
    this.setState({errorOnDeckAction: null})
  }

  render() {
    if (!this.state.folders.length){
      return <div>Loading...</div>
    }
    if (this.state.errorGettingFolders){
      return (
        <div>We couldn't get your folders.&nbsp;
          <button
          className="btn btn-default"
          onClick={this.getFolders(this.state.foldersPage)}>
            Retry
          </button>
        </div>
      )
    }
    let errorMsg = '';
    if (this.state.errorOnDeckAction) {
      errorMsg = (
      <Alert bsStyle="danger" onDismiss={this._onErrorMsgDismiss}>
        {this.state.errorOnDeckAction}
      </Alert>
      )
    }
    const foldersList = this.state.folders.map(folder => {
      return (
        <Folder
          key={folder.id}
          folder={folder}
          onDeckBtnClick={this._onDeckBtnClick}
          onDeckDeleteBtnClick={this._onDeckDeleteBtnClick}
          onFolderDecksGet={this._onFolderDecksGet}
          onFolderEdit={this._onFolderEdit}
          canEdit={this.state.canEdit}
          authenticated={this.state.authenticated}
        />
      )
    });
    return (
      <div>
        {errorMsg}
        <PageSelect
          totalPages={this.state.totalPages}
          hasNextPage={this.state.hasNextPage}
          hasPreviousPage={this.state.hasPreviousPage}
          currentPage={this.state.foldersPage}
          onPageBtnClick={this._onPageBtnClick}
        />
        {foldersList}
        <PageSelect
          totalPages={this.state.totalPages}
          hasNextPage={this.state.hasNextPage}
          hasPreviousPage={this.state.hasPreviousPage}
          currentPage={this.state.foldersPage}
          onPageBtnClick={this._onPageBtnClick}
        />
        <FolderSelect
          deck={this.state.selectedDeck}
          foldersOpt={this.state.foldersOpt}
          originFolder={this.state.originFolder}
          targetFolder={this.state.targetFolder}
          action={this.state.folderAction}
          show={this.state.showFolderSelectModal}
          onModalClose={this._onSelectModalClose}
          onFolderSelect={this._onFolderSelect}
          onFolderCreate={this._onFolderCreate}
        />
      </div>)
  }
}


ReactDOM.render(<App />, document.getElementById('folders-app-container'));
