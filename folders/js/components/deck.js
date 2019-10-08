import React, { Component } from 'react';

class Deck extends Component {
  constructor(props){
    super(props);

  };

  render() {
    const deck = this.props.deck;
    let formatClass = 'badge badge-tiny';
    if (deck.formatTLA) {
      formatClass += ' fmt-' + deck.formatTLA.toLowerCase();
    }
    let deckBtns = <div />;
    if (this.props.authenticated) {
      deckBtns = (
        <div>
          <hr className="no-margin-top"/>
          <div className="row">
            <div className="col-md-4 col-sm-4 col-xs-4 col-md-offset-4">
              <btn onClick={this.handleCopyBtnClick.bind(this)}
                   className="btn btn-block btn-primary"
                   data-toggle="tooltip"
                   data-placement="bottom"
                   title="Copy deck to folder">
                <span className="glyphicon glyphicon-duplicate"/>
              </btn>
            </div>
          </div>
        </div>
      )
    }
    if (this.props.canEdit) {
      deckBtns = (
        <div>
          <hr className="no-margin-top"/>
          <div className="row">
            <div className="col-md-4 col-sm-4 col-xs-4">
              <btn onClick={this.handleMoveBtnClick.bind(this)}
                   className="btn btn-block btn-primary"
                   data-toggle="tooltip"
                   data-placement="bottom"
                   title="Move deck to folder">
                <span className="glyphicon glyphicon-share-alt"/>
              </btn>
            </div>
            <div className="col-md-4 col-sm-4 col-xs-4">
              <btn onClick={this.handleCopyBtnClick.bind(this)}
                   className="btn btn-block btn-primary"
                   data-toggle="tooltip"
                   data-placement="bottom"
                   title="Copy deck to folder">
                <span className="glyphicon glyphicon-duplicate"/>
              </btn>
            </div>
            <div className="col-md-4 col-sm-4 col-xs-4">
              <btn onClick={this.handleDeleteBtnClick.bind(this)}
                   className="btn btn-block btn-danger"
                   data-toggle="tooltip"
                   data-placement="bottom"
                   title="Remove deck from this folder">
                <span className="glyphicon glyphicon-remove"/>
              </btn>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="col-md-3 col-sm-4 col-xs-12 deck-snippet">
        <div className="well sm-p-well">
          <div className="row feat-container hidden-xs">
            <div className="col-md-12">
              <a href={deck.url}><img className="img-responsive deck-featured" src={deck.featuredImage}/></a>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <p className="no-overflow"><a href={deck.url}>{deck.name}</a></p>
              <p className="no-overflow">by <span dangerouslySetInnerHTML={{__html: deck.user}}/></p>
              <p>
                <img src={deck.pieChart}/>
                <span className={formatClass}>{deck.formatTLA}</span>&nbsp;
                <span className="badge badge-tiny" data-toggle="tooltip" title="Upvotes/Comments">
                    {deck.upvotes}&nbsp;
                  <span className="glyphicon glyphicon-arrow-up" aria-hidden="true"/>
                  &nbsp;/&nbsp;
                  {deck.comments}&nbsp;
                  <span className="glyphicon glyphicon-comment" aria-hidden="true"/>
                </span>
              </p>
            </div>
          </div>
          {deckBtns}
        </div>
      </div>
    );
  }

  handleCopyBtnClick() {
    this.props.onFolderDeckBtnClick(this.props.deck, 'Copy')
  }

  handleMoveBtnClick() {
    this.props.onFolderDeckBtnClick(this.props.deck, 'Move')
  }

  handleDeleteBtnClick() {
    this.props.onFolderDeckDeleteBtnClick(this.props.deck)
  }

}

export default Deck;