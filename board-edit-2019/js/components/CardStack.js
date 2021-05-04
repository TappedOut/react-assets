import React from 'react';
import CardPin from './CardPin';
import CardPinSpoiler from "./CardPinSpoiler";


export default class CardStack extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      accumulatedTop: 0
    }
  }

  render() {
    let { cards, handleCardDelete, stacksIds, boardName, droppablesRef,
          handleCardEditStart, handleCardMoveStart, imagesMaxWidth,
          spoilerView, toggleImages, stackBy,
          mobileCardOnTop, handleMobileCardClick } = this.props;


    let currentCards = _.sortBy(cards
      .filter(card => (stacksIds.has(card.cardId))), 'name');
    let heights = currentCards.map((card, idx) => (
      card.qty > 1 ? imagesMaxWidth/2 : imagesMaxWidth/4.5
    ));
    let minHeight = _.sum(heights) + imagesMaxWidth*1.35;
    let stackStyle = {"minHeight": minHeight};
    if (!cards) return '';

    return (
      <div
        className="card-stack board-droppable"
        style={stackStyle}
        ref={droppablesRef}
        data-board-name={boardName}
        data-is-stack="true"
      >
        {
          currentCards.map((card, idx) => (
            spoilerView ?
              <CardPinSpoiler
                key={`${card.cardId}:${card.updateCount}:${idx}`}
                card={card}
                stackTop={_.sum(heights.slice(0, idx))}
                stackBy={stackBy}
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
                stackTop={_.sum(heights.slice(0, idx))}
                stackBy={stackBy}
                mobileCardOnTop={mobileCardOnTop}
                handleMobileCardClick={handleMobileCardClick}
                lastCard={currentCards.length === idx + 1}
              />
            ))
          }
      </div>
    )
  }
}