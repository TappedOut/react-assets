import React from 'react';
import Cookies from "js-cookie";


export default class CardPinSpoiler extends React.Component {
  renderPartialCard = (key, dataMove) => {
    let {card, imagesMaxWidth} = this.props;

    let divClass = `panel panel-default card-spoiler-partial card-color__${card.color_category}`
    if (Cookies.get('totheme') === 'light') divClass += ` card-color-bg__${card.color_category}`

    return (
      <div key={`${card.cardId}:${key}`}
           className={divClass}>
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

    let cardDataImage = `${card.alter_image || card.image}`;

    if (process.env.NODE_ENV === 'development') {
      cardDataImage = cardDataImage.replace('33.33.33.11:8000/media',
        'static.tappedout.net');
    }

    let divClass = `panel panel-default card-color__${card.color_category}`
    if (Cookies.get('totheme') === 'light') divClass += ` card-color-bg__${card.color_category}`
    if (card.hasErrors.length > 0) divClass += ' card-error'

    return (
      <div className={divClass} >
        <div className={'panel-heading card-thumbnail ' +
                        `${ card.foil ? 'card-thumbnail-foil' : '' }`}
             style={{width: `${imagesMaxWidth}px`, 'min-height': `${imagesMaxWidth * 1.42}px`}}>
          { card.foil &&
            <img src={`${STATIC_URL}img/foil-card-overlay-2.png`}
                 className="overlay-foil"/>
          }
          <img src={cardDataImage} alt={card.name}
               className="card-thumbnail-img"/>
          <span className="card-info-spoiler">
            { card.alter_pk && this.props.cardAlterUrl &&
              <a href={this.props.cardAlterUrl.replace(/\/0\/$/, `/${card.alter_pk}/`)}>
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
    let { card, stackTop, stackBy } = this.props;

    let divStyle = {};
    let divClass = "card-draggable-spoiler";
    if (stackBy) {
      if(stackTop) {
        divClass += " card-stack-elem";
        divStyle = {top: `${stackTop}px`}
      } else {
        divClass += " card-stack-elem-first"
      }
    }

    let cardOpts = {
      className: divClass,
      'data-card': card.cardId,
      'data-move': "1",
      style: divStyle
    };

    let cardQty = parseInt(card.qty || 1);
    let cardCopies = [];

    if (cardQty > 1) {
      cardCopies = [...Array(parseInt(card.qty || 1) - 1).keys()]
        .map(key => this.renderPartialCard(key, cardQty - key));
    }

    return (
      <div {...cardOpts}>
        { cardCopies }
        { this.renderWholeCard() }
      </div>
    );
  }
}
