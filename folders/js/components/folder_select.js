import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';


class FolderSelect extends Component {
  constructor(props) {
    super(props);

    this.handleClose = this.handleClose.bind(this);
    this._handleSelectChange = this.handleSelectChange.bind(this);
    this._handleInputChange = this.handleInputChange.bind(this);

    this.state = {
      targetFolder: props.targetFolder,
      newFolderName: ''
    }
  }

  handleClose() {
    this.props.onModalClose();
  }

  handleSelectChange(folderId) {
    this.props.onFolderSelect(parseInt(folderId));
  }

  handleInputChange(folderName) {
    this.setState({newFolderName: folderName})
  }

  handleNewFolderBtnClick() {
    this.props.onFolderCreate(this.state.newFolderName);
    this.setState({newFolderName: ''})
  }

  render() {
    let deckName = '';
    if (this.props.deck) {
      deckName = this.props.deck.name
    }

    const foldersOpt = this.props.foldersOpt.filter(folder => {
      if (!this.props.originFolder){
        return true
      }
      return folder.id !== this.props.originFolder
    }).map(folder => {
      return <option value={folder.id}>{folder.name}</option>
    });

    return (
      <Modal show={this.props.show} onHide={this.handleClose}>
        <Modal.Body closeButton>
          <p>{this.props.action} {deckName} to folder:</p>
          <div className="input-group">
            <input onChange={event => this._handleInputChange(event.target.value)}
                   value={this.state.newFolderName}
                   className="form-control"
                   placeholder="New Folder"
            />
            <span className="input-group-btn">
              <button className="btn btn-success"
                      type="button"
                      onClick={event => this.handleNewFolderBtnClick()}
              >Add!</button>
            </span>
          </div>
          <br />
          <select
            onChange={event => this._handleSelectChange(event.target.value)}
            value={this.state.targetFolder}
            className="form-control"
          >
            <option value="">Select existing folder</option>
            {foldersOpt}
          </select>
        </Modal.Body>
      </Modal>
    )
  }
}

export default FolderSelect;