import React from 'react';
import { Collapse } from 'react-bootstrap';
import PopoverHoverStick from "./PopoverHoverStick";
import Cookies from 'js-cookie';


export default class CardPin extends React.Component {
  topIntervalId = 0;

  constructor(props) {
    super(props);
    this.state = {
      showHandlers: !props.toggleImages,
      showOnTop: false
    }
  }

  componentDidMount() {
    window.jQuery('[data-toggle="tooltip"]').tooltip();
  }

  cardAlter = (card) => {
    let symbols = [];

    if (card.alter)
      symbols.push(<img key={0} className="card-icon" src={`${STATIC_URL}img/alter-icon.png`}/>);

    if (card.signed)
      symbols.push(<img key={1} className="card-icon" src={`${STATIC_URL}img/signed-icon.png`}
                        title="Signed/Autographed card"/>);

    if (card.alter_pk && this.props.cardAlterUrl)
      return (
          <a href={this.props.cardAlterUrl.replace(/\/0\/$/, `/${card.alter_pk}/`)}>
            { symbols }
          </a>
      );
    else
      return symbols;
  }

  handleCardClick = (cardId) => {
    if (this.props.stackBy) {
      if (!this.props.isMobile ||
          cardId === this.props.mobileCardOnTop ||
          (this.props.lastCard && this.props.mobileCardOnTop === null)) {
        this.props.handleCardEditStart(cardId)
      }
      if (this.props.isMobile) {
        this.props.handleMobileCardClick(cardId);
      }

    } else if (this.props.toggleImages) {
      this.setState({showHandlers: !this.state.showHandlers});
    }
  };

  handleTCGClick = (card) => {
    const tla = card.tla ? card.tla : card.latest_tla
    const url = _.find(card.printings, obj => obj.tla === tla).tcg_url
    if (url) {
      window.open(url, "_blank")
    }
  }

  handleCKClick = (card) => {
    const tla = card.tla ? card.tla : card.latest_tla
    const url = _.find(card.printings, obj => obj.tla === tla).ck_url
    if (url) {
      const link = `${url}?partner=tappedout&utm_source=tappedout&utm_medium=affiliate&utm_campaign=tappedoutsearch`
      window.open(link, "_blank")
    }
  }

  onCardMouseOver = () => {
    this.topIntervalId = setInterval(() => this.setState({showOnTop: true}), 2000)
  };

  onCardMouseOut = () => {
    clearInterval(this.topIntervalId);
    this.setState({showOnTop: false})
  };

  render() {
    let { card, handleCardChangeQty, handleCardDelete, handleCardEditStart, handleCardMoveStart,
          imagesMaxWidth, toggleImages, stackBy, stackTop, mobileCardOnTop } = this.props;

    let cardSpanClass = `${toggleImages ? '' : 'board-card'} ${card.tags}`;
    let cardLinkClass = `${toggleImages ? '' : 'board-card-hover'} ` +
      `card-link${card.foil ? ' foil-card' : ''}` +
      `${card.alter ? ' alter-card' : ''} `;
    let cardDataImage = `${card.alter_image || card.image}`;
    let cardSet = card.tla ? ` (${card.tla})` : '';
    let panelClass = `panel-body ${toggleImages ? '' : 'full-panel'}`;
    const isBg = Cookies.get('totheme') === 'light'
    let divClass = `card-draggable panel panel-default card-color${isBg ? '-bg' : ''}__${card.color_category}`

    if ((!this.props.isMobile && this.state.showOnTop) ||
        (this.props.isMobile && card.cardId === mobileCardOnTop)) {
      divClass += ' card-zindex';
    }
    let divStyle = {};
    if (card.hasErrors.length > 0) divClass += " card-error";
    if (stackBy) {
      if(stackTop) {
        divClass += " card-stack-elem";
        divStyle = {top: `${stackTop}px`}
      } else {
        divClass += " card-stack-elem-first"
      }
    }

    if (process.env.NODE_ENV === 'development' ||
        cardDataImage.search(/static\.tappedout\.net/) < 0) {
      cardDataImage = cardDataImage.replace(/\d+\.\d+\.+\d+\.\d+:\d+\/media/,
        'static.tappedout.net');
    }

    let cardName = (
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
    );

    let cardOpts = {
      className: divClass,
      'data-card': card.cardId,
      'data-move': "1",
      style: divStyle
    };

    if (stackBy && !this.props.isMobile) {
      cardOpts['onMouseOver'] = this.onCardMouseOver;
      cardOpts['onMouseOut'] = this.onCardMouseOut;
    }

    let result = (
      <div {...cardOpts}>
        { toggleImages &&
          <div className={'panel-heading card-thumbnail ' +
              `${ card.foil ? 'card-thumbnail-foil' : '' }`}
              onClick={() => this.handleCardClick(card.cardId)}
              aria-expanded={this.state.showHandlers}
              style={{width: `${imagesMaxWidth}px`, 'min-height': `${imagesMaxWidth * 1.42}px`}}
          >
            {card.foil &&
            <img src={`${STATIC_URL}img/foil-card-overlay-2.png`}
                 className="overlay-foil"/>
            }
            { card.qty > 1 && <div className="qty-box">x{card.qty}</div> }
            <img src={cardDataImage} alt={card.name}
                 className="card-thumbnail-img"/>
          </div>
        }
        <Collapse in={this.state.showHandlers || !this.props.toggleImages}>
          <div>
            <div className={panelClass}>
              { !toggleImages && cardName }
              <div className="card-handlers">
                { !this.props.isMobile ?
                  [
                    <a key={0} onClick={() => handleCardEditStart(card.cardId)}
                        href="javascript: void(0)">
                      <span className="glyphicon glyphicon-wrench pull-right card-settings"/>
                    </a>,
                    <a key={1} onClick={() => confirm(`Do you want to delete ${card.name}?`) &&
                                              handleCardDelete(card.cardId)}
                        href="javascript: void(0)">
                      <span className="glyphicon glyphicon-trash pull-right"/>
                    </a>,
                    <a key={2} onClick={() => handleCardChangeQty(card.cardId, true)}
                        href="javascript: void(0)">
                      <span className="qty-modifier pull-right">+1</span>
                    </a>,
                    <a key={3} onClick={() => card.qty > 1 &&
                                              handleCardChangeQty(card.cardId, false)}
                        href="javascript: void(0)">
                        <span className={`pull-right qty-modifier ` +
                                         `${card.qty == 1 && "disabled-modifier"}`}>-1</span>
                    </a>
                  ] :
                  [
                    <a key={0} onClick={() => confirm(`Do you want to delete ${card.name}?`) &&
                                              handleCardDelete(card.cardId)}
                        href="javascript: void(0)">
                      <span className="glyphicon glyphicon-trash pull-right"/>
                    </a>,
                    <a key={1} onClick={() => handleCardChangeQty(card.cardId, true)}
                        href="javascript: void(0)">
                      <span className="qty-modifier pull-right">+1</span>
                    </a>,
                    <a key={2} onClick={() => card.qty > 1 &&
                                              handleCardChangeQty(card.cardId, false)}
                        href="javascript: void(0)">
                        <span className={`pull-right qty-modifier ` +
                                         `${card.qty == 1 && "disabled-modifier"}`}>-1</span>
                    </a>
                  ]
                }
                { !this.props.isMobile ?
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
                  { this.cardAlter(card) }
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
        </Collapse>
      </div>
    );

    if (toggleImages) {
      const pricePopover = (
        <table style={{'background-color': 'black', 'margin-bottom': 0}} className="table table-bordered">
          {card.tcg_market_price &&
          <tr style={{'border': '1px solid #ddd'}}>
            <td onClick={() => this.handleTCGClick(card)} style={{"text-align": "center", "width":"60%", "cursor": "pointer", "padding": "4px"}}>TCG Market Price</td>
            <td onClick={() => this.handleTCGClick(card)} style={{"text-align": "center", "width":"40%", "cursor": "pointer", "padding": "4px"}}>${card.tcg_market_price}</td>
          </tr>}
          {card.ck_price &&
          <tr style={{'border': '1px solid #ddd'}}>
            <td onClick={() => this.handleCKClick(card)} style={{"text-align": "center", "width":"60%", "cursor": "pointer", "padding": "4px"}}>Card Kingdom</td>
            <td onClick={() => this.handleCKClick(card)} style={{"text-align": "center", "width":"40%", "cursor": "pointer", "padding": "4px"}}>${card.ck_price}</td>
          </tr>}
        </table>
      );
      result = (
        <PopoverHoverStick
          trigger={['hover', 'focus']}
          component={pricePopover}
          placement='bottom'
          delay={1000}
        >
          {result}
        </PopoverHoverStick>
      )
    }

    return result;
  }
}
