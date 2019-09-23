import React from 'react';
import Toggle from 'react-toggle';
import CardPin from './CardPin';
import CardPinSpoiler from './CardPinSpoiler';


export default class BoardHolder extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      compactBoard: false,
      minimizeBoard: false,
    };
  }

  handleCompactBoard = (event) => {
    this.setState({
      compactBoard: event.target.checked
    })
  };

  handleMinimizeBoard = (event) => {
    this.setState({
      minimizeBoard: event.target.checked
    });
  };

  renderBoard = () => {
    let { boardName, boardCards, droppablesRef, handleCardDelete,
          handleCardEditStart, handleCardMoveStart, imagesMaxWidth,
          spoilerView, toggleImages } = this.props;
    return (
      <div ref={droppablesRef} data-board-name={boardName}
           className={'panel-body board-droppable ' +
           `${ this.state.compactBoard ?
               'compact-board' :
               window.django.is_mobile ? 'mobile-board' : 'desktop-board'}`}>
        {
          boardCards.map((card, idx) => (
            spoilerView ?
              <CardPinSpoiler
                key={`${card.cardId}:${card.updateCount}:${idx}`}
                card={card}
                imagesMaxWidth={imagesMaxWidth}
              /> :
              <CardPin
                key={`${card.cardId}:${card.updateCount}:${idx}`}
                card={card}
                handleCardDelete={handleCardDelete}
                handleCardEditStart={handleCardEditStart}
                handleCardMoveStart={handleCardMoveStart}
                imagesMaxWidth={imagesMaxWidth}
                toggleImages={toggleImages}
              />
            ))
        }
      </div>
    )
  };

  render() {
    const { boardName, boardCards, handleBoardCollapseToggle } = this.props;
    const boardTitle =
      `${boardName.charAt(0).toUpperCase()}${boardName.slice(1)}`;
    const boardCount = boardCards.reduce(
      (acc, card) => { return (card.qty || 1) + acc; }, 0
    );

    return (
      <div className="panel panel-default board-panel">
        <div className="panel-heading board-title">
          <div className="row">
            <div className="col-md-6">
              <h4 className="panel-title">{boardTitle} ({boardCount})</h4>
            </div>
            <div className="col-md-6">
              { window.django.is_mobile &&
                <span className="toggler">
                  <label htmlFor="minimizeTogglerNewCards">Minimize</label>
                  <Toggle
                    id="minimizeTogglerNewCards"
                    defaultChecked={this.state.minimizeBoard}
                    onChange={this.handleMinimizeBoard} />
                </span>
              }
              { window.django.is_mobile &&
                <span className="toggler">
                  <label htmlFor={`compactToggler${boardName}`}>Collapse</label>
                  <Toggle
                    id={`compactToggler${boardName}`}
                    checked={this.state.compactBoard}
                    onChange={this.handleCompactBoard}/>
                </span>
              }
              { handleBoardCollapseToggle !== null &&
                <button className="btn btn-primary btn-block"
                        type="button"
                        onClick={() => handleBoardCollapseToggle(boardName)}>
                  Collapse
                </button>
              }
            </div>
          </div>
        </div>
        { !this.state.minimizeBoard && this.renderBoard() }
      </div>
    )
  }
}

