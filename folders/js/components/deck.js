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
          <div className="row deck-btn-group">
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
          <div className="row deck-btn-group">
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
      <div className="col-md-3 col-xs-12 col-sm-6">
        <div className="deck-square-container">
          <a href={deck.url}>
            <div className="deck-square-caption">
              <div className="row">
                <div className="col-md-12">
                  <p>
                    <a href={deck.url}><span className="deck-square-name">{deck.name}</span></a>
                    <br />
                    <span className="deck-square-user">by <span dangerouslySetInnerHTML={{__html: deck.user}}/></span>
                  </p>
                </div>
              </div>
              <div className="row">
                <div className="col-xs-4">
                  <div className="deck-square-mana-chart">
                    <a href={deck.url}>
                      <img className="mana-chart" src={deck.pieChart}/>
                    </a>
                  </div>
                </div>
                <div className="col-xs-8 deck-square-badges text-right">
                  <span className={formatClass}>{deck.formatTLA}</span>
                  <span className="badge badge-tiny" data-toggle="tooltip" title="Upvotes/Comments">
                    {deck.upvotes}
                      <span class="glyphicon glyphicon-arrow-up" aria-hidden="true"></span> / {deck.comments} <span class="glyphicon glyphicon-comment" aria-hidden="true"></span>
                  </span>
                </div>
              </div>
            </div>
          </a>
          <a href={deck.url}>
              <div class="deck-square-card">
                  <img class="deck-square-card-img img-responsive"
                       src={deck.featuredImage}
                       onError="this.onerror=null;$(this).hide();"
                  />
              </div>
          </a>
        </div>
        {deckBtns}
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