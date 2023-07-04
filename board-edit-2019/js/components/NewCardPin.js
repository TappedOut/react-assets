import React from 'react';
import Cookies from "js-cookie";


export default function NewCardPin(props) {
  let {card, handleCardMoveStart, imagesMaxWidth, toggleImages, isMobile} = props;

  let cardDataImage = card.image;
  const cardLinkClass = toggleImages ? '' : 'board-card-hover';
  const cardSpanClass = toggleImages ? '' : 'board-card';
  const isBg = Cookies.get('totheme') === 'light'
  let cardDivClass = `card-draggable panel panel-default new-card card-color${isBg ? '-bg' : ''}__${card.color_category}`
  if (isMobile) cardDivClass += ' new-card-mobile'

  if (process.env.NODE_ENV === 'development') {
    cardDataImage = cardDataImage.replace('33.33.33.11:8000/media',
      'static.tappedout.net');
  }

  return (
    <div className={cardDivClass}
         data-card={card.cardId}>
      { toggleImages &&
        <div className="panel-heading card-thumbnail"
             style={{width: `${imagesMaxWidth}px`}}>
          <img src={cardDataImage} alt={card.name}
               className="card-thumbnail-img"/>
        </div>
      }
      <div className="panel-body new-card">
        <h5 className="card-name">
          <a key={0} onClick={() => handleCardMoveStart(card.cardId, true)}
             href="javascript: void(0)" className="pull-right">
            <span className="glyphicon glyphicon-plus"/>
          </a>
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
               href={card.url}>{card.name}
             </a>
          </span>
        </h5>
      </div>
    </div>
  );
}
