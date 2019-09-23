import React from 'react';


export default class CardPin extends React.Component {
  componentDidMount() {
    window.jQuery('[data-toggle="tooltip"]').tooltip();
  }

  render() {
    let { card, handleCardDelete, handleCardEditStart, handleCardMoveStart,
          imagesMaxWidth, toggleImages} = this.props;

    let cardSpanClass = `${toggleImages ? '' : 'board-card'} ${card.tags}`;
    let cardLinkClass = `${toggleImages ? '' : 'board-card-hover'} ` +
      `card-link${card.foil ? ' foil-card' : ''}` +
      `${card.alter ? ' alter-card' : ''} `;
    let cardDataImage = `${card.alter_image || card.image_large}`;
    let cardSet = card.tla ? ` (${card.tla})` : '';

    if (process.env.NODE_ENV === 'development' ||
        cardDataImage.search(/static\.tappedout\.net/) < 0) {
      cardDataImage = cardDataImage.replace(/\d+\.\d+\.+\d+\.\d+:\d+\/media/,
        'static.tappedout.net');
    }

    return (
      <div className={"card-draggable panel panel-default" +
                      `${card.hasErrors.length > 0 ? " card-error" : ""}` +
                      ` card-color__${card.color_category}`}
           data-card={card.cardId} data-move="1">
        { toggleImages &&
          <div className={'panel-heading card-thumbnail ' +
              `${ card.foil ? 'card-thumbnail-foil' : '' }`}>
            {card.foil &&
            <img src={`${STATIC_URL}img/foil-card-overlay-2.png`}
                 className="overlay-foil"/>
            }
            <img src={cardDataImage} alt={card.name}
                 className="card-thumbnail-img"
                 style={{width: `${imagesMaxWidth}px`}}/>
          </div>
        }
        <div className="panel-body">
          <h5 className="card-name">
            <span className="card-qty pull-right">x{card.qty}</span>
            { toggleImages ?
              <span className={cardSpanClass}>
                  <a target="_blank" className={cardLinkClass}
                   href={card.url}>{card.alt_name || card.name}</a>
              </span> :
              <span className={cardSpanClass}>
                <a target="_blank" className={cardLinkClass}
                   rel="popover"
                   id={card.cardId}
                   data-foil={card.foil ? card.foil : ''}
                   data-show-price="true"
                   data-tcg-foil-price={card.tcg_foil_price ?
                     card.tcg_foil_price : ''}
                   data-ch-foil-price={card.cardhoarder_foil_price_tix ?
                     card.cardhoarder_foil_price_tix : ''}
                   data-tcg-price={card.tcg_avg_price ? card.tcg_avg_price : ''}
                   data-ch-price={card.cardhoarder_price_tix ?
                     card.cardhoarder_price_tix : ''}
                   data-ck-price={card.ck_price ?
                     card.ck_price : ''}
                   data-ck-foil-price={card.ck_foil_price ?
                     card.ck_foil_price : ''}
                   data-cc-price={card.chaos_price ?
                     card.chaos_price : ''}
                   data-cc-foil-price={card.chaos_foil_price ?
                     card.chaos_foil_price : ''}
                   data-image={cardDataImage}
                   data-name={card.name}
                   href={card.url}>{card.alt_name || card.name}
                 </a>
              </span>
            } {cardSet}
          </h5>
          <div className="card-handlers">
            { !window.django.is_mobile ?
              <a onClick={() => handleCardEditStart(card.cardId)}
                 href="javascript: void(0)">
                <span className="glyphicon glyphicon-wrench pull-right card-settings"/>
              </a> :
              <a onClick={() => handleCardDelete(card.cardId)}
                 href="javascript: void(0)">
                <span className="glyphicon glyphicon-trash pull-right"/>
              </a>
            }
            { !window.django.is_mobile ?
              [
                <span key={0} className="glyphicon glyphicon-stop"
                      data-toggle="tooltip" data-placement="bottom"
                      data-move={card.qty} title="Move all the cards"/>,
                <span key={1} className="glyphicon glyphicon-pause"
                      data-toggle="tooltip" data-placement="bottom"
                      data-move={Math.ceil(card.qty / 2)}
                      title="Move half of the cards"/>
              ] : [
                <a key={0} onClick={() => handleCardMoveStart(card.cardId)}
                 href="javascript: void(0)">
                  <span className="glyphicon glyphicon-move"/>
                </a>,
                <a key={1} onClick={() => handleCardEditStart(card.cardId)}
                   href="javascript: void(0)">
                  <span className="glyphicon glyphicon-wrench"/>
                </a>
              ]
            }
            <span className="card-info">
              { card.alter_pk &&
                <a
                  href={window.django.card_alter_url.replace(/\/0\/$/,
                    `/${card.alter_pk}/`)}>
                  { card.alter &&
                    <img className="card-icon"
                         src={`${STATIC_URL}img/alter-icon.png`}/> }
                  { card.signed &&
                    <img className="card-icon"
                         src={`${STATIC_URL}img/signed-icon.png`}
                         title="Signed/Autographed card"/> }
                </a> }
              { card.foil &&
                <img className="card-icon"
                     src={`${STATIC_URL}img/foil-icon.jpg`}/> }
              { card.language && card.language !== 'EN' &&
                <img className="card-icon"
                     src={`${STATIC_URL}img/flag-icons/${card.language}.png`}
                     alt={card.language}/>}
              { card.condition && card.condition !== 'NM' &&
                <span className="card-condition">{card.condition}</span>}
            </span>
          </div>
        </div>
      </div>
    );
  }
}
