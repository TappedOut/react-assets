import React from 'react';


export default class CardPinSpoiler extends React.Component {
  renderPartialCard = (key, dataMove) => {
    let {card, imagesMaxWidth} = this.props;

    return (
      <div key={`${card.cardId}:${key}`}
           className={`panel panel-default card-spoiler-partial card-color__${card.color_category}`}>
        <div className='panel-heading card-spoiler-partial-title'
             data-move={dataMove}
             style={{fontSize: `${imagesMaxWidth/30 + 6}px`}}>
          { card.alt_name || card.name }
        </div>
      </div>
    );
  };

  renderWholeCard = () => {
    let { card, imagesMaxWidth} = this.props;

    let cardDataImage = `${card.alter_image || card.image_large}`;

    if (process.env.NODE_ENV === 'development') {
      cardDataImage = cardDataImage.replace('33.33.33.11:8000/media',
        'static.tappedout.net');
    }

    return (
      <div className={`panel panel-default card-color__${card.color_category}` +
                      `${card.hasErrors.length > 0 ? " card-error" : ""}`} >
        <div className={'panel-heading card-thumbnail ' +
                        `${ card.foil ? 'card-thumbnail-foil' : '' }`}>
          { card.foil &&
            <img src={`${STATIC_URL}img/foil-card-overlay-2.png`}
                 className="overlay-foil"/>
          }
          <img src={cardDataImage} alt={card.name}
               className="card-thumbnail-img"
               style={{width: `${imagesMaxWidth}px`}}/>
          <span className="card-info-spoiler">
            { card.alter_pk &&
              <a href={window.django.card_alter_url.replace(/\/0\/$/, `/${card.alter_pk}/`)}>
                { card.alter &&
                  <img className="card-icon"
                       src={`${STATIC_URL}img/alter-icon.png`}/> }
                { card.signed &&
                  <img className="card-icon"
                       src={`${STATIC_URL}img/signed-icon.png`}
                       title="Signed/Autographed card"/> }
              </a> }
            { card.language && card.language !== 'EN' &&
              <img className="card-icon"
                   src={`${STATIC_URL}img/flag-icons/${card.language}.png`}
                   alt={card.language}/> }
            { card.condition && card.condition !== 'NM' &&
              <span className="card-condition">{card.condition}</span> }
          </span>
        </div>
      </div>
    );
  };

  render() {
    let { card } = this.props;

    let cardQty = parseInt(card.qty || 1);
    let cardCopies = [];

    if (cardQty > 1) {
      cardCopies = [...Array(parseInt(card.qty || 1) - 1).keys()]
        .map(key => this.renderPartialCard(key, cardQty - key));
    }

    return (
      <div className={"card-draggable-spoiler " +
                      `${card.hasErrors.length > 0 ? " card-error" : ""}`}
           data-card={card.cardId} data-move="1">
        { cardCopies }
        { this.renderWholeCard() }
      </div>
    );
  }
}
