import React from 'react';
import CardPin from './CardPin';
import CardPinSpoiler from './CardPinSpoiler';
import CardStack from './CardStack';
import { Panel, Tab } from 'react-bootstrap';
import deck_group from '../utils/deck_grouping';


export default class BoardHolder extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      compactBoard: false,
      minimizeBoard: false,
    };
  }

  handleBoardClick = (e) => {
    if (e.target.classList.contains('board-droppable')) {
      this.props.handleMobileCardClick(null)
    }
  };

  renderCards() {
    let { boardCards, handleCardChangeQty, handleCardDelete, boardName,
          droppablesRef, handleCardEditStart, handleCardMoveStart,
          imagesMaxWidth, spoilerView, toggleImages, stackBy,
          mobileCardOnTop, handleMobileCardClick } = this.props;
    if (!toggleImages || !stackBy) {
      return boardCards.map((card, idx) => (
        spoilerView ?
          <CardPinSpoiler
            key={`${card.cardId}:${card.updateCount}:${idx}`}
            card={card}
            imagesMaxWidth={imagesMaxWidth}
          /> :
          <CardPin
            key={`${card.cardId}:${card.updateCount}:${idx}`}
            card={card}
            handleCardChangeQty={handleCardChangeQty}
            handleCardDelete={handleCardDelete}
            handleCardEditStart={handleCardEditStart}
            handleCardMoveStart={handleCardMoveStart}
            imagesMaxWidth={imagesMaxWidth}
            toggleImages={toggleImages}
          />
      ))
    }
    let val = stackBy.value !== 'cost' ? stackBy.value : 'stackCost';
    let stacksGroup = deck_group[val](boardCards);
    if (!stacksGroup) return '';
    return Object.keys(stacksGroup).map((cat, idx) => (
        <CardStack
          key={`${cat}:${idx}`}
          cards={boardCards}
          handleCardDelete={handleCardDelete}
          handleCardEditStart={handleCardEditStart}
          handleCardMoveStart={handleCardMoveStart}
          imagesMaxWidth={imagesMaxWidth}
          toggleImages={toggleImages}
          stackBy={cat}
          stacksIds={stacksGroup[cat]}
          boardName={boardName}
          droppablesRef={droppablesRef}
          mobileCardOnTop={mobileCardOnTop}
          handleMobileCardClick={handleMobileCardClick}
        />
    ))
  }

  render() {
    let { boardName, boardCards, droppablesRef, collapseKey} = this.props;
    const boardTitle =
      `${boardName.charAt(0).toUpperCase()}${boardName.slice(1)}`;
    const boardCount = boardCards.reduce(
      (acc, card) => { return (card.qty || 1) + acc; }, 0
    );
    let panelOpts = {className: "board-panel"};
    if (collapseKey) panelOpts["eventKey"] = collapseKey;
    let bodyOpts = {className: "board-panel-body"};
    if (collapseKey) bodyOpts["collapsible"] = true;
    if (window.django.is_mobile) bodyOpts["onClick"] = (e) => this.handleBoardClick(e);
    let bodyClass = `board-droppable  board-${boardName}`;
    if (!window.django.is_mobile) bodyClass += " desktop-board-body";
    if (boardName !== 'main') bodyClass += " well board-e-well";

    if (boardName === 'main') {
      return (
        <Panel {...panelOpts}>
          <Panel.Heading>
            <div
              className="board-droppable suppress-shadow"
              ref={droppablesRef}
              data-board-name={boardName}
              data-is-header="true"
            >
              <Panel.Title toggle>
                {boardTitle} ({boardCount})
              </Panel.Title>
            </div>
          </Panel.Heading>
          <Panel.Body {...bodyOpts}>
            <div
              className={bodyClass}
              ref={droppablesRef}
              data-board-name={boardName}>
              {this.renderCards()}
            </div>
          </Panel.Body>
        </Panel>
      )
    } else {
      return (
        <Tab.Pane eventKey={boardName}>
          <div
            className={bodyClass}
            ref={droppablesRef}
            data-board-name={boardName}>
            {this.renderCards()}
          </div>
        </Tab.Pane>
      )
    }
  }
}