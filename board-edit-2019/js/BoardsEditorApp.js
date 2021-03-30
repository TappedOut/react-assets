import React from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Dragula from 'react-dragula';
import Slider from 'react-rangeslider';
import Select from 'react-select';
import Toggle from 'react-toggle';
import Rusha from 'rusha';
import {isMobileOnly} from 'react-device-detect';
import BoardHolder from './components/BoardHolder';
import CardEditModal from './components/CardEditModal';
import CardMoveModal from './components/CardMoveModal';
import CardSearchModal from './components/CardSearchModal';
import NewCardsBoard from './components/NewCardsBoard';
import ColorChartWrapper from './components/ColorChart';
import TypeChartWrapper from './components/TypeChart';
import { get_card_id } from "./utils";
import { buildColorSeries, buildLandColorSeries,
  buildTypeSeries, buildCurveSeries } from './utils/charts';
import deck_group from './utils/deck_grouping';
import { Tab, Nav, NavItem, Modal, Button, ProgressBar } from 'react-bootstrap';
import CurveChartWrapper from "./components/CurveChart";
const _ = require('lodash');


const COLORS = {
  'W': 'White',
  'U': 'Blue',
  'B': 'Black',
  'R': 'Red',
  'G': 'Green'
};

// The board config is saved at most 2 weeks without changes.
// The constant is expressed in milliseconds = DAYS * HOURS * MINUTES * SECONDS * 1000
const MAX_CONFIG_STORE_DAYS = 15 * 24 * 60 * 60 * 1000;

const DEFAULT_NAMESPACE = '/';
const DECK_SLUG = window.location.href.split('/')[4];
const INIT_URL = `${DEFAULT_NAMESPACE}mtg-decks/${DECK_SLUG}/board-update/init/`;


function rehashDeckByCategories(deck, selectedCategoryType) {
  let category = selectedCategoryType ? selectedCategoryType.value : 'board';
  return deck_group[category](deck);
}


function cardSetup(originalCard, board='none', created=true) {
  let card = {...originalCard};
  card.created = created;
  card.hasErrors = [];
  card.need_qty = card.need_qty || 0;
  card.tla = !created && card.fixed_tla ? card.tla : '';
  card.original_tla = card.tla;
  card.updated = false;
  card.updateCount = 0;  // Forces re-rendering when needed
  if ([true, 'fnm'].indexOf(card.foil) > -1) card.foil = 'foil';

  let cardId = get_card_id(card, board);
  card.cardId = cardId;

  if (created) {
    card.ihash = cardId;
    card.effective_cost = card.effective_cost.map((c) => COLORS[c]).join(" ");
  }

  let cardCost = card.effective_cost;

  if (!cardCost || cardCost.trim().match(/^\s*$/)) {
    card.color_category = "colorless";
  } else if (cardCost.trim().split(/\s+/).length > 1) {
    card.color_category = "gold";
  } else {
    card.color_category = cardCost.toLowerCase().trim();
  }

  return card;
}

function choicesFromAPI(choices) {
  return choices.map(
    (category) => {
      return {value: category[0], label: category[1]}
    }
  );
}


export default class BoardsEditorApp extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      activeBoardPill: 'side',
      advancedSearch: false,
      cardToEdit: null,
      cardToMove: null,
      deck: {},
      deckByCategories: {},
      deckByPositions: [],
      selectedStackType: '',
      isGrabbing: false,
      deckHash: '',
      deletedCards: [],
      foundCards: {},
      imagesMaxWidth: 200,
      loading: true,
      nextSearchPage: 1,
      searchOnScroll: false,
      newCard: false,
      noCardsFound: '',
      redirectAfterSave: false,
      savingInBackground: false,
      searchingCards: false,
      initializedRecommendations: false,
      simpleSearchInput: {
        name: '',
        invOnly: false
      },
      searchInput: {},
      selectedCategory: 0,
      selectedCategoryType: '',
      toggleImages: true,
      warnings: [],
      mobileCardOnTop: null,
      initData: {},
      errorInitializing: false,
      isMobile: isMobileOnly,
      showSettingsModal: false,
      showChartsModal: false
    };
    this.droppables = [];
  }

  componentDidMount() {
    this.getInitData();
    this.setupDragula();
    TAPPED.observeBoardCards();
    window.addEventListener("load", this.normalizeBoardsHeight);
    window.addEventListener("beforeunload", this.handleUnload);

    /* Check the last time this board was updated and reset it
       if it was more than `MAX_CONFIG_STORE_DAYS` */
    let lastBoardUpdate = localStorage.getItem("lastBoardUpdate");
    if (lastBoardUpdate) {
      lastBoardUpdate = Date.parse(lastBoardUpdate);

      if (new Date() - lastBoardUpdate > MAX_CONFIG_STORE_DAYS) {
        // The board configuration expired, drop it
        localStorage.removeItem("boardConfig");
        localStorage.removeItem("deckByPositions");
      }
    } else {
      // If the lastUpdate parameter hasn't been set then
      // clear the state to avoid incompatibility problems
      localStorage.removeItem("boardConfig");
      localStorage.removeItem("deckByPositions");
    }

    if (localStorage.getItem("boardConfig")) {
      let boardConfig = JSON.parse(localStorage.getItem("boardConfig"));
      this.setState(boardConfig);
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextState.toggleImages !== this.state.toggleImages) {
      this.droppables = [];
    }
  }

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.handleUnload);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.toggleImages !== this.state.toggleImages)
      this.setupDragula();
    this.normalizeBoardsHeight();
  }

  normalizeBoardsHeight = () => {
    // This function is called after every update to normalize the height of the boards
    let i, maxBoardHeight = 0,
      boards = document.querySelectorAll('.desktop-boards .desktop-board-body');

    for (i = 0; i < boards.length; i++)
      boards[i].style.height = null;

    for (i = 0; i < boards.length; i++) {
      if (boards[i].scrollHeight > maxBoardHeight) maxBoardHeight = boards[i].scrollHeight
    }

    for (i = 0; i < boards.length; i++)
      boards[i].style.height = `${boards[i].classList.contains('board-main') ?
        maxBoardHeight : maxBoardHeight + 9}px`;
  };

  handleSettingsModalToggle = () => {
    this.setState({ showSettingsModal: !this.state.showSettingsModal })
  };

  handleChartsModalToggle = () => {
    this.setState({ showChartsModal: !this.state.showChartsModal })
  };

  getInitData = () => {
    axios.get(
      INIT_URL
    ).then(
      response => {
        this.setState({
          initData: response.data,
          searchInput: {
            name: '',
            type: '',
            subtype: '',
            rarity: '',
            keywords: '',
            formats: response.data.deck_format,
            sets: '',
            block: '',
            color: response.data.deck_colors,
            rules: '',
            order: 'name_sort'
          },
        });
        this.categoryChoices = choicesFromAPI(response.data.category_choices);
        this.foilChoices = choicesFromAPI(response.data.foil_choices);
        this.rarityChoices = choicesFromAPI(response.data.rarity_choices);
        this.colorChoices = choicesFromAPI(response.data.alt_color_choices);
        this.loadDeckData()
      },
      error => {
        this.setState({errorInit: true});
      },
    );
  };

  handleBoardPillChange = (pill) => {
    this.setState({activeBoardPill: pill});
    setTimeout(this.normalizeBoardsHeight, 500);
  };

  addDroppable = (d) => {
    if (d !== null && !this.droppables.includes(d)) this.droppables.push(d);
  };

  appendWarnings = (warns) => {
    let warnings = [...this.state.warnings].concat(warns);
    this.setState({ warnings });
  };

  isStacked = () => {
    return this.state.toggleImages && this.state.selectedStackType
  };

  handleMobileCardClick = (cardId) => {
    this.setState({ mobileCardOnTop: cardId })
  };

  deckHasChanges = () => {
    let deck = this.state.deck;
    let deckHash = Rusha.createHash();
    Object.keys(deck).sort().forEach((cardId) => {
      if (!deck[cardId].created || deck[cardId].qty >= 1) {
        // Ignore created and deleted cards
        deckHash.update(`${cardId}+${deck[cardId].qty}`);
      }
    });
    return this.state.deckHash !== deckHash.digest('hex');
  };

  /* FIXME: This gets removed since the collapse is no more.
            What happens with the recommendations? */
  // handleAddCardsToggle = () => {
  //   this.setState({ showAddCards: !this.state.showAddCards });
  //   if (!this.state.initializedRecommendations) {
  //     this.initRecommendations();
  //     this.setState({ initializedRecommendations: true })
  //   }
  // };

  handleAdvancedSearchStart = () => {
    this.setState({ advancedSearch: true });
  };

  handleAdvancedSearchEnd = (search) => {
    this.setState({ advancedSearch: false }, () => {
      if (search) {
        this.searchCards();
      }
    })
  };

  handleBoardsChangePosition = (targetCardId, siblingCardId, newCard=false) => {
    let deckByPositions = [...this.state.deckByPositions];

    if (!newCard && siblingCardId !== targetCardId) {
      // Remove the card from the current position if it exists on the target board
      // and the sibling card is not the target card
      let targetCardPosition = _.findIndex(deckByPositions,
        (cardId) => cardId === targetCardId);
      if (targetCardPosition > 0)
        deckByPositions.splice(targetCardPosition, 1);
    }

    // Move the card accordingly
    if (siblingCardId === null) {
      // Add the card to the end when there is no sibling
      deckByPositions.push(targetCardId);
    } else if (siblingCardId !== targetCardId) {
      // Add the card before the sibling if this exists and is not the same as the
      // target card (otherwise it will maintain it's original position)
      let siblingCardPosition = _.findIndex(deckByPositions,
        (cardId) => cardId === siblingCardId);
      if (siblingCardPosition > 0) {
        deckByPositions.splice(siblingCardPosition, 1,
          targetCardId, siblingCardId);
      } else {
        // This should not happen, but just in case it does
        deckByPositions.push(targetCardId, siblingCardId);
      }
    }

    return _.uniq(deckByPositions);
  };

  handleBoardsMove = (sourceCard, targetBoardName, qty, siblingCardId,
                      sourceCardId=null) => {
    let deck = {...this.state.deck};
    let deckByCategories = {...this.state.deckByCategories};
    let newCard = false;
    let targetCardId = get_card_id(sourceCard, targetBoardName);

    // Get the amount of cards in the source board
    let cardsQty = parseInt(qty) || 1;

    if (deck.hasOwnProperty(targetCardId)) {
      /* If the cards exists in the board we only add the
      number of cards to move */
      deck[targetCardId].qty = deck[targetCardId].qty + cardsQty;
      deck[targetCardId].updated = true;
      deck[targetCardId].updateCount++;
    } else {
      /* If the card doesn't exist create it and assign the number of
      cards to move in quantity */
      deck[targetCardId] = {
        ...sourceCard,
        b: targetBoardName,
        cardId: targetCardId,
        created: true,
        qty: cardsQty,
        updateCount: 0
      };
      newCard = true;  // Needed otherwise won't show card on first drag
    }

    // If we are moving the card from another board (not from the found cards) then
    // update the quantity on the source card
    if (sourceCardId !== null) {
      let remainingCards = deck[sourceCardId].qty - cardsQty;
      deck[sourceCardId].qty = remainingCards <= 0 ? 0 : remainingCards;
      deck[sourceCardId].updated = true;
      deck[sourceCardId].updateCount++;
    }

    if (newCard) {
      deckByCategories =
        rehashDeckByCategories(deck, this.state.selectedCategoryType);
    }

    let deckByPositions =
      this.handleBoardsChangePosition(targetCardId, siblingCardId, newCard);

    return {deck, deckByPositions, deckByCategories};
  };

  handleBoardsAdd = (sourceCardId, targetBoardName,
                     qty=null, siblingCardId=null) => {
    let sourceCard = {...this.state.foundCards[sourceCardId]};

    let latest_print = sourceCard.printings.find(
      printing => printing.tla === sourceCard.latest_set
    );

    if (latest_print.foil_only) sourceCard['foil'] = 'foil';

    let {deck, deckByPositions, deckByCategories} =
      this.handleBoardsMove(sourceCard, targetBoardName, qty, siblingCardId);

    this.setState({ deck, deckByCategories, deckByPositions });
  };

  handleBoardsUpdate = (sourceCardId, targetBoardName, qty, siblingCardId) => {
    let sourceCard = {...this.state.deck[sourceCardId]};

    let {deck, deckByPositions, deckByCategories} =
      this.handleBoardsMove(sourceCard, targetBoardName,
                            qty, siblingCardId, sourceCardId);

    this.setState({ deck, deckByCategories, deckByPositions });
  };

  handleCardChangeQty = (cardId, increment=true) => {
    let deck = {...this.state.deck};

    if (increment)
      deck[cardId].qty++;
    else if (deck[cardId].qty > 1)
      deck[cardId].qty--;
    else  // No update if qty is equal to 1 and the user wants to decrement (it shouldn't be possible)
      return;

    deck[cardId].updated = true;

    this.setState({ deck });
  }

  handleCardDelete = (cardId) => {
    let deck = {...this.state.deck};
    let deletedCards = [...this.state.deletedCards];

    deletedCards.push({...deck[cardId]});
    deck[cardId].qty = 0;

    this.setState({ deck, deletedCards });
  };

  handleCardDeleteUndo = (event) => {
    event.preventDefault();

    let deck = {...this.state.deck};
    let deletedCards = [...this.state.deletedCards];
    let lastDeleted = deletedCards.pop();

    if (deck.hasOwnProperty(lastDeleted.cardId))
      deck[lastDeleted.cardId].qty = deck[lastDeleted.cardId].qty
        + lastDeleted.qty;
    else
      deck[lastDeleted.cardId] = {...lastDeleted, created: true};

    this.setState({ deck, deletedCards });
  };

  handleCardEditStart = (cardId) => {
    this.setState({ cardToEdit: cardId });
  };

  handleCardEditEnd = (card, remove=false) => {
    if (card !== null && !remove) {
      let originalId = card.cardId.slice();
      let newId = get_card_id(card, card.b);
      card.cardId = newId;
      let deck = {...this.state.deck};
      let deckByCategories = {...this.state.deckByCategories};
      let newCard = false;

      if (originalId === newId && card.qty === deck[originalId].qty) {
        this.setState({ cardToEdit: null });
        return;
      }

      if (deck.hasOwnProperty(newId)) {
        /* Merge if the card already exists and is not the original card else
           update to new value of quantity */
        if (originalId !== newId) deck[newId].qty = deck[newId].qty + card.qty;
        else deck[newId].qty = card.qty;
        deck[newId].updated = true;
        deck[newId].updateCount++;
      } else {
        deck[newId] = {
          ...card,
          created: true,
          updateCount: 0
        };
        newCard = true;
      }

      deck[newId].hasErrors = []; // Reset all possible errors

      if (originalId !== newId) deck[originalId].qty = 0;

      let deckByPositions = [...this.state.deckByPositions];

      deckByCategories = rehashDeckByCategories(deck,
          this.state.selectedCategoryType);

      if (newCard) {
        // Only setup new position if the card is new, if it exists then let the original position intact
        deckByPositions = this.handleBoardsChangePosition(newId, originalId);
      }

      this.setState({ cardToEdit: null, deck, deckByPositions, deckByCategories });
    } else if (card !== null && remove) {
      this.setState({ cardToEdit: null }, () => this.handleCardDelete(card.cardId) );
    } else {
      this.setState({ cardToEdit: null });
    }
  };

  handleCardMoveStart = (cardId, newCard) => {
    this.setState({ newCard: !!newCard, cardToMove: cardId });
  };

  handleCardMoveEnd = (cardId, target, qty) => {
    let newCard = this.state.newCard;
    this.setState(
      { newCard: false, cardToMove: null },
      () => {
        if (cardId !== null && newCard)
          this.handleBoardsAdd(cardId, target, qty);
        else if (cardId !== null)
          this.handleBoardsUpdate(cardId, target, qty);
      });
  };

  handleCategorySelect = (selectedCategoryType) => {
    let deckByCategories = rehashDeckByCategories(this.state.deck,
                                                  selectedCategoryType);

    this.setState({deckByCategories, selectedCategory: 0,
                   selectedCategoryType});
  };

  handleStackSelect = (selectedStackType) => {
    this.setState({selectedStackType})
  };

  handleDeckSave = (redirectAfterSave) => {
    if (this.state.savingInBackground) {
      this.appendWarnings([{
        msg: "Currently there is an automatic save in process. " +
          "Please try again in a few seconds.",
        type: "warning"
      }]);
    } else {
      this.setState({loading: true, redirectAfterSave},
        () => {
          this.saveDeck().then(
            (response) => {
              if (this.state.redirectAfterSave) {
                let redir = this.state.initData.deck_url;
                if (response.data && response.data.cb) {
                  redir = `${redir}?cb=${response.data.cb}`
                }
                window.location.href = redir;
              } else {
                this.loadDeckData();
                this.appendWarnings([{
                  msg: "The deck was saved successfully.",
                  type: "success"
                }]);
              }
            },
            error => {
              let deck = {...this.state.deck};

              if (error.response && error.response.status >= 500) {
                this.appendWarnings([{
                  msg: "There was a site-error while attempting to save. " +
                  "Please try again in a few minutes",
                  type: "warning"
                }]);
              } else if (error.response && error.response.data) {
                if (error.response.data.cardId) {
                  let cardId = error.response.data.cardId;
                  deck[cardId] = {
                    ...deck[cardId],
                    hasErrors: Object.keys(error.response.data.errors)
                  };

                  this.appendWarnings([{
                    msg: "The marked card has errors.",
                    type: "danger"
                  }]);
                } else {
                  this.appendWarnings([{
                    msg: "There was a problem while attempting to save: " +
                    error.message,
                    type: "danger"
                  }]);
                }
              } else {
                this.appendWarnings([{
                  msg: "There was a problem while attempting to save: " +
                  error.message,
                  type: "danger"
                }]);
              }
              this.setState({deck, loading: false, redirectAfterSave: false});
            }
          ).finally(() => this.saveBoardConfig());
        }
      )
    }
  };

  handleDeckSaveAuto = () => {
    // Only save if there's no current saving or loading of data,
    // no current card edition and changes in the deck
    if (!this.state.savingInBackground && !this.state.loading &&
         this.state.cardToEdit === null) {
      this.setState({savingInBackground: true},
        () => {
          if (this.deckHasChanges()) {
            let deck = Object.values(this.state.deck)
              .filter((card) => card.qty > 0)
              .reduce(
                (deck, card) => {
                  deck[card.cardId] = {...card};
                  deck[card.cardId].created = false;
                  deck[card.cardId].updated = false;

                  return deck;
                },
                {}
              );

            this.saveDeck().then(
              () => this.setState({savingInBackground: false}),
              error => {
                if (error.response && error.response.status >= 500) {
                  this.appendWarnings([{
                    msg: "There was a site-error while attempting to autosave.",
                    type: "warning"
                  }]);
                }
                this.setState({savingInBackground: false});
              }
            );

            this.setState({deck});
          } else {
            this.setState({savingInBackground: false});
          }
        });
    }
  };

  handleImagesMaxWidth = (value) => {
    this.setState({
      imagesMaxWidth: value
    })
  };

  handleImagesToggle = (event) => {
    this.setState({
      toggleImages: event.target.checked
    })
  };

  handleStackToggle = (event) => {
    this.setState({
      deckStacked: event.target.checked
    })
  };

  handleResetPosition = () => {
    let deckByPositions = _.sortBy(this.state.deck, 'slug')
      .map((card) => card.cardId);

    localStorage.removeItem("deckByPositions");

    this.setState({deckByPositions});
  };

  handleSearchClear = (event) => {
    event.preventDefault();
    let simpleSearchInput = { name: '', invOnly: false };
    let searchInput = { name: '', type: '', subtype: '', rarity: '',
      keywords: '', formats: '', sets: '', block: '', color: '', rules: '',
      invOnly: false, order: 'name_sort' };
    this.setState({foundCards: {}, noCardsFound: '', simpleSearchInput, searchInput});
  };

  clearSearchInput = () => {
    let simpleSearchInput = {...this.state.simpleSearchInput};
    simpleSearchInput["name"] = "";
    this.setState({simpleSearchInput});
  }

  handleSearchInput = (event) => {
    event.preventDefault();
    let target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    let searchInput = {...this.state.searchInput};
    searchInput[target.name] = value;
    this.setState({searchInput});
  };

  handleSearchScroll = (event) => {
    event.preventDefault();

    let target = event.target;

    if ((!this.state.searchingCards) && (this.state.nextSearchPage !== null) &&
        (target.scrollLeft + target.offsetWidth >= target.scrollWidth) &&
        this.state.searchOnScroll)
      this.searchCards(false);
  };

  handleSearchSelect = (selectInput, selectValue) => {
    let searchInput = {...this.state.searchInput};
    searchInput[selectInput] = selectValue !== null ? selectValue : '';
    this.setState({searchInput});
  };

  handleSimpleSearchCardSelect = (card) => {
    let newCards = {};

    let foundCard = cardSetup(card);
    newCards[foundCard.cardId] = foundCard;

    let foundCards = {...newCards, ...this.state.foundCards};

    this.setState({foundCards}, () => {
      this.handleCardMoveStart(card.cardId, true);
    });
  };

  handleSimpleSearchInput = (event) => {
    let target = event.target;
    let simpleSearchInput = {...this.state.simpleSearchInput};
    if (target.type === 'checkbox') {
      simpleSearchInput.invOnly = target.checked;
      this.searchCards(true, false, null, target.checked)
    } else {
      simpleSearchInput.name = target.value;
    }
    this.setState({simpleSearchInput});
  };

  handleUnload = (event) => {
    this.saveBoardConfig();

    if(this.deckHasChanges() && !this.state.redirectAfterSave) {
      let retValue = "You have unsaved changes on your deck. Are you sure you want to exit?";
      event.returnValue = retValue;
      return retValue;
    }
  };

  loadDeckData = () => {
    axios.get(
      this.state.initData.deck_get_url
    ).then(
      response => {
        let deck = response.data.results.reduce(
          (deck, card) => {
            let newCard = cardSetup(card, card.b, false);

            deck[newCard.cardId] = newCard;

            return deck;
          },
          {}
        );

        // Check if it's the first time loading the deck
        let deckByPositions = [...this.state.deckByPositions];
        if (deckByPositions.length === 0) {
          deckByPositions = localStorage.getItem("deckByPositions") ?
            JSON.parse(localStorage.getItem("deckByPositions")) || [] :
            _.sortBy(deck, 'slug').map(card => card.cardId);
        }

        _.sortBy(deck, 'slug').forEach((card) => {
          // If the cardId is not in the positional array, add it as the last element
          if (deckByPositions.findIndex((cardId) => cardId === card.cardId) < 0)
            deckByPositions.push(card.cardId);
        });

        // Normalize `deckByPositions` array by removing duplicates and leaving
        // only entries present in `deck` object
        deckByPositions = _.uniq(deckByPositions)
          .filter((cardId) => deck.hasOwnProperty(cardId));

        let deckHash = Rusha.createHash();
        Object.keys(deck).sort().forEach((cardId) => {
          deckHash.update(`${cardId}+${deck[cardId].qty}`);
        });

        this.setState({deck, deckByPositions,
                       deckHash: deckHash.digest('hex'),
                       loading: false});
      },
      error => {
        if (error.response && error.response.status >= 500) {
          this.appendWarnings([{
            msg: "There was a site-error while attempting to load your deck. " +
            "Please refresh the site again in a few minutes.",
            type: "warning"
          }]);
        } else {
          this.appendWarnings([{
            msg: "There was a problem while attempting to load your deck: " +
              error.message,
            type: "danger"
          }]);
        }

        this.setState({loading: false})
      }
    )
  };

  saveBoardConfig = () => {
    let boardConfig = {
      imagesMaxWidth: this.state.imagesMaxWidth,
      toggleImages: this.state.toggleImages
    };

    let now = new Date();

    localStorage.setItem("boardConfig", JSON.stringify(boardConfig));
    localStorage.setItem("deckByPositions",
                         JSON.stringify(this.state.deckByPositions));
    localStorage.setItem("lastBoardUpdate", now.toString());
  };

  saveDeck = () => {
    return axios.post(
      this.state.initData.deck_save_url,
      {'changes': Object.values(this.state.deck).map(card =>
        _.pick(
          card,
          ['alter', 'alter_pk', 'b', 'cardId', 'categories', 'cmdr',
           'condition', 'created', 'foil', 'ihash', 'language', 'name',
           'need_qty', 'qty', 'signed', 'tla', 'variation', 'updated',
           'alt_cmc', 'alt_rarity', 'alt_color', 'alt_mana_cost'
          ]
        )
      ).filter(specs =>
        !specs.created || specs.qty >= 1
      ).map(specs =>
        specs.foil ? specs : _.omit(specs, ['foil'])
      ).map(specs =>
        specs.tla ? specs : _.omit(specs, ['tla'])
      )},
      { headers: { 'X-CSRFToken': Cookies.get('csrftoken') } }
    );
  };

  initRecommendations = () => {
    let recommendUrl = `${this.state.initData.deck_recommendations_url}` +
                       `?deck=${this.state.initData.deck_slug}&cards=${this.state.initData.deck_cards}`;
    axios.get(
        recommendUrl
      ).then(
        response => {
          let foundCards = response.data.results.reduce(
            (foundCards, card) => {
              let foundCard = cardSetup(card);
              foundCards[foundCard.cardId] = foundCard;
              return foundCards;
            },
            {}
          );

          this.setState({foundCards});
        }
      )

  };

  searchCards = (newSearch=true, simpleSearch=false, nameOverride=null, invOnly=null) => {
    let searchInput = simpleSearch ? {...this.state.simpleSearchInput} :
      {...this.state.searchInput};
    let searchTerms = _.reduce(searchInput, (acc, value, key) => {
      let values = value.toString().split(',')
        .map((v) => {
          if (nameOverride !== null && key === 'name') {
            return `name=${nameOverride}`;
          } else if (key === 'order') {
            return `o=${v}`
          } else {
            return `${key}=${v}`;
          }
        });
      return value ? acc.concat(values) : acc;
    }, []).join('&');

    if (invOnly !== null) {
      if (invOnly) searchTerms += '&inv_only=True'
    } else if (!simpleSearch && this.state.simpleSearchInput.invOnly) {
      searchTerms += '&inv_only=True'
    }

    if (searchTerms.trim() !== '' && !this.state.searchingCards) {
      let nextSearchPage = newSearch ? 1 : this.state.nextSearchPage;

      let searchUrl = `${this.state.initData.cards_search_url}` +
        `?page=${nextSearchPage}&${searchTerms}`;

      axios.get(
        searchUrl
      ).then(
        response => {
          let foundCards = response.data.results.reduce(
            (foundCards, card) => {
              let foundCard = cardSetup(card);
              foundCards[foundCard.cardId] = foundCard;
              return foundCards;
            },
            {}
          );

          if (this.state.nextSearchPage > 1)
            foundCards = {...this.state.foundCards, ...foundCards};

          let noCardsFound = _.size(foundCards) > 0 ? '' : searchInput.name.slice();
          let nextSearchPage = response.data.next !== null ?
            this.state.nextSearchPage + 1 : null;

          this.setState({
            foundCards,
            nextSearchPage,
            noCardsFound,
            searchingCards: false,
            searchOnScroll: true
          });
        },
        error => {
          if (error.response && error.response.status >= 500) {
            this.appendWarnings([{
              msg: "There was a site-error while searching possible cards. " +
              "Please refresh the site again in a few minutes.",
              type: "warning"
            }]);
          } else {
            this.appendWarnings([{
              msg: "There was a problem while searching for possible cards: " +
              error.message,
              type: "danger"
            }]);
          }

          this.setState({foundCards: {},
            searchingCards: false, nextSearchPage: null});
        }
      );

      this.setState({nextSearchPage, searchingCards: true});
    } else if (this.state.searchingCards) {
      this.appendWarnings([{
        msg: "Currently there is search in progress. " +
        "Please try again in a few seconds.",
        type: "warning"
      }]);
    }

    if (nameOverride !== null) {
      let simpleSearchInput = {...this.state.simpleSearchInput};
      simpleSearchInput.name = nameOverride;
      this.setState({simpleSearchInput})
    }
  };

  setupDragula = () => {
    if (this.state.isMobile) return; // No drag on mobile

    let options = {
      accepts: (el, target, source) => {
        // Only move between boards
        if (target.dataset.boardName === "new-cards" || target.dataset.isStack) {
          return false
        } else if (source.dataset.boardName === "new-cards" &&
          target.classList.contains('trash-droppable')) {
          return false
        } else if (this.isStacked() && target.dataset.boardName === source.dataset.boardName) {
          return false
        } else if (target.dataset.boardCategory) {
          return (target.dataset.boardCategory === source.dataset.boardCategory);
        } else {
          return true
        }
      },
      copy: !!this.isStacked(),
      moves: (el, source, handle) => {
        if (handle.classList.contains('card-settings') ||
            handle.classList.contains('card-link') ||
            source.classList.contains('trash-droppable')) {
          return false;
        }

        if (handle.dataset.toggle)
          window.jQuery(handle).tooltip('hide');

        el.dataset.move = parseInt(handle.dataset.move) || 1;
        return true;
      },
      revertOnSpill: true
    };

    this.drake = Dragula(this.droppables, options)
      .on(
        'drop',
        (el, target, source, sibling) => {
          // Cancel the drag action before setting the new state
          this.drake.cancel(true);

          if (target.dataset.boardName === source.dataset.boardName) {
            if (this.isStacked()) return;
            let deck = {...this.state.deck};
            deck[el.dataset.card].updateCount++;
            if (sibling !== null && sibling.dataset.card !== el.dataset.card) {
              deck[sibling.dataset.card].updateCount++;
            }
            let deckByPositions =
              this.handleBoardsChangePosition(el.dataset.card,
                                              sibling !== null ?
                                                sibling.dataset.card : null);
            this.setState({deck, deckByPositions});
          } if (source.dataset.boardName === 'new-cards') {
            this.handleBoardsAdd(el.dataset.card,
                                 target.dataset.boardName, null,
                                 sibling !== null ? sibling.dataset.card : null);
          }
          else if (target.classList.contains('board-droppable')) {
            this.handleBoardsUpdate(el.dataset.card, target.dataset.boardName,
                                    el.dataset.move,
                                    sibling !== null ?
                                      sibling.dataset.card : null);
          } else if (target.classList.contains('trash-droppable')) {
            this.handleCardDelete(el.dataset.card);
          }

          window.jQuery('.popover').hide(); // Cleaning left pop overs
        }
      )
      .on('cloned',
        (clone, original, type) => {
          if (this.isStacked()) {
            original.classList.add('card-shadow');
            return false;
          }
          if (this.props.spoilerView) {
            let clonedPartials = clone.querySelectorAll('.card-spoiler-partial');
            let originalPartials = original.querySelectorAll('.card-spoiler-partial');
            let partialsToRemove = clonedPartials.length - clone.dataset.move + 1;

            for (let i = 0; i < partialsToRemove; i++) {
              clone.removeChild(clonedPartials[i]);
              originalPartials[i].style.display = "none";
            }
          }

          if (type === 'mirror' && clone.querySelector('.card-qty')) {
            clone.querySelector('.card-qty').innerHTML = '';
          } else if (type === 'mirror' &&
                     original.classList.contains('new-card')) {
            original.classList.add('gu-hidden');
          }
        }
      )
      .on(
        'drag',
        (el, source) => {
          if (this.isStacked()) return false;
          if ((source.dataset.boardName === 'new-cards') ||
              (this.state.deck[el.dataset.card].qty || 1 ) > el.dataset.move) {
            let shadow = el.cloneNode(true);
            shadow.id = "drag-shadow";

            if (source.dataset.boardName !== 'new-cards' &&
                shadow.querySelector('.card-qty')) {
              shadow.querySelector('.card-qty').innerHTML =
                `x${this.state.deck[el.dataset.card].qty - el.dataset.move}`;
            }

            if (this.props.spoilerView) {
              let shadowPartials = shadow.querySelectorAll('.card-spoiler-partial');
              let partialsToRemove = el.dataset.move;

              for (let i = 0; i < partialsToRemove; i++) {
                shadow.removeChild(shadowPartials[i]);
              }
            }

            if (el.nextSibling === null) {
              source.appendChild(shadow);
            } else {
              source.insertBefore(shadow, el.nextSibling);
            }
          }
        }
      )
      .on(
        'cancel',
        (el, container, source) => {
          if (this.isStacked()) {
            let i = 0;
            let shadows = document.querySelectorAll('.card-shadow');
            for (i = 0; i < shadows.length; i++)
              shadows[i].classList.remove('card-shadow');
            return false
          }
          let shadow = source.querySelector('#drag-shadow');
          if (shadow) { source.removeChild(shadow); }
          if (el.classList.contains('gu-hidden')) {
            el.classList.remove('gu-hidden');
          }

          if (this.props.spoilerView) {
            let elPartials = el.querySelectorAll('.card-spoiler-partial');
            elPartials.forEach((e) => { e.style.display = "block"; });
          }
        }
      )
      .on(
        'over',
        (el, container) => {
          if (container.dataset.isHeader &&
              ['side', 'maybe'].indexOf(container.dataset.boardName) > -1) {
            this.handleBoardPillChange(container.dataset.boardName);
          }
          if (['new-cards', 'side', 'maybe'].indexOf(container.dataset.boardName) < 0) {
            container.classList.add('highlighted')
          }
          if (this.isStacked()) {
            container.classList.add("suppress-shadow")
          }
        }
      )
      .on(
        'out',
        (el, container) => {
          if (['new-cards', 'side', 'maybe'].indexOf(container.dataset.boardName) < 0) {
            container.classList.remove('highlighted')
          }
          if (this.isStacked() && !container.dataset.isHeader) {
            container.classList.remove("suppress-shadow")
          }
        }
      )
      .on(
        'shadow',
        (shadow, container, source) => {
          if (this.isStacked()) return false;
          if (container.dataset.boardName !== 'new-cards'
              && !this.props.spoilerView
              && shadow.querySelector('.card-qty')) {
            if (container.dataset.boardName !== source.dataset.boardName) {
              shadow.querySelector('.card-qty').innerHTML =
                `x${shadow.dataset.move}`;
            } else {
              shadow.querySelector('.card-qty').innerHTML =
                `x${this.state.deck[shadow.dataset.card].qty}`;
            }
          }

          if (this.props.spoilerView) {
            let shadowPartials = shadow.querySelectorAll('.card-spoiler-partial');
            let partialsToRemove = shadowPartials.length - shadow.dataset.move + 1;

            for (let i = 0; i < partialsToRemove; i++) {
              shadowPartials[i].style.display = "none";
            }
          }
        }
      );
  };

  getCardCountForBoard = (boardName) => {
    let categoryGroup = null;
    let selectedCategory = null;

    if (!_.isEmpty(this.state.deckByCategories)) {
      selectedCategory = _.sortBy(
        Object.keys(this.state.deckByCategories),
        [(cat) => { return isNaN(cat) ? cat : parseInt(cat); } ])[this.state.selectedCategory];
      categoryGroup = this.state.deckByCategories[selectedCategory];
    }

    let boardCards = this.state.deckByPositions
      .map((cardId) => this.state.deck[cardId] || {})
      .filter(card => (card.b === boardName && card.qty >= 1 &&
        (categoryGroup === null || categoryGroup.has(card.cardId)))
      );

    return boardCards.reduce(
      (acc, card) => { return (card.qty || 1) + acc; }, 0
    );
  };

  renderBoardHolder = (boardName, collapseKey=false) => {
    let categoryGroup = null;
    let selectedCategory = null;

    if (!_.isEmpty(this.state.deckByCategories)) {
      selectedCategory = _.sortBy(
        Object.keys(this.state.deckByCategories),
        [(cat) => { return isNaN(cat) ? cat : parseInt(cat); } ])[this.state.selectedCategory];
      categoryGroup = this.state.deckByCategories[selectedCategory];
    }

    let boardCards = this.state.deckByPositions
      .map((cardId) => this.state.deck[cardId] || {})
      .filter(card => (card.b === boardName && card.qty >= 1 &&
        (categoryGroup === null || categoryGroup.has(card.cardId)))
      );

    if (selectedCategory !== null || this.isStacked())
      boardCards = _.sortBy(boardCards, 'name');

    return (
      <BoardHolder
        boardName={boardName}
        boardCards={boardCards}
        droppablesRef={d => this.addDroppable(d)}
        handleCardChangeQty={this.handleCardChangeQty}
        handleCardDelete={this.handleCardDelete}
        handleCardEditStart={this.handleCardEditStart}
        handleCardMoveStart={this.handleCardMoveStart}
        imagesMaxWidth={this.state.imagesMaxWidth}
        spoilerView={this.props.spoilerView}
        toggleImages={this.state.toggleImages}
        collapseKey={collapseKey}
        stackBy={this.isStacked() ? this.state.selectedStackType : null}
        mobileCardOnTop={this.state.mobileCardOnTop}
        handleMobileCardClick={this.handleMobileCardClick}
        isMobile={this.state.isMobile}
        cardAlterUrl={this.state.initData.card_alter_url}
      />
    )
  };

  renderMobileNavbar = () => {
    return (
      <nav className="navbar navbar-inverse navbar-fixed-top tapped-menu-navbar bottom-divider" role="navigation">
        <div className="container">
          <div className="row">
            <div className="col-sm-12">
              <div className="navbar-header">
                <div className="row">
                  <div className="col-xs-2" style={{"margin-top": "2px"}}>
                    <a href={this.state.initData.deck_url}><img style={{display: "inline"}} src={this.state.initData.deck_thumbnail} className="img-responsive" /></a>
                  </div>
                  <div className="col-xs-6" style={{padding: "10px 0px", 'font-size': '16px', overflow: "hidden", "white-space": "nowrap", display: "block", "text-overflow": "ellipsis"}}>
                    <a style={{color: "white"}} href={this.state.initData.deck_url}>
                      {this.state.initData.deck_name}
                    </a>
                  </div>
                  <div className="col-xs-4" style={{"padding-left": "0"}}>
                    <ul style={{margin: "4px"}}  className="nav navbar-nav pull-right">
                      <li style={{display: "inline-block"}}><a onClick={this.handleChartsModalToggle}><span className="glyphicon glyphicon-stats" /></a></li>
                      <Modal show={this.state.showChartsModal} onHide={this.handleChartsModalToggle}>
                        <Modal.Body>
                          <div className="row">
                            <div className="col-xs-12">
                              {this.renderCharts()}
                            </div>
                          </div>
                        </Modal.Body>
                        <Modal.Footer>
                          <Button variant="secondary" onClick={this.handleChartsModalToggle}>
                            Close
                          </Button>
                        </Modal.Footer>
                      </Modal>
                      <li style={{display: "inline-block"}}><a onClick={this.handleSettingsModalToggle}><span className="glyphicon glyphicon-cog" /></a></li>
                      <Modal show={this.state.showSettingsModal} onHide={this.handleSettingsModalToggle}>
                        <Modal.Body>
                          <div className="row">
                            <div className="col-xs-12"
                                 style={{paddingTop: '5px', marginBottom: '10px'}}>
                              <span className="toggler">
                                <label style={{'margin-right': '5px'}} htmlFor='toggleImagesButton'>
                                  Display Thumbnails</label>
                                <span>
                                  <Toggle
                                    id="toggleImagesButton"
                                    checked={this.state.toggleImages}
                                    onChange={this.handleImagesToggle} />
                                </span>
                              </span>
                            </div>
                            { this.state.toggleImages &&
                              <div className="col-xs-12">
                                <label>Images Scaling</label>
                                <span className="slider-container">
                                  <Slider
                                    min={100}
                                    tooltip={false}
                                    max={250}
                                    step={1}
                                    value={this.state.imagesMaxWidth}
                                    onChange={this.handleImagesMaxWidth}
                                  />
                                </span>
                              </div>
                            }
                            <div className="col-xs-12">
                              <a className="btn btn-default" href={this.state.initData.old_board_edit_url}>Switch to legacy editor</a>
                            </div>
                          </div>
                        </Modal.Body>
                        <Modal.Footer>
                          <Button variant="secondary" onClick={this.handleSettingsModalToggle}>
                            Close
                          </Button>
                        </Modal.Footer>
                      </Modal>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  renderBoards = (boards) => {
    if (_.isEmpty(this.state.deckByCategories)) {
      return boards;
    } else {
      let sortedCategories = _.sortBy(
        Object.keys(this.state.deckByCategories),
        [ (category) => { return isNaN(category) ?
                                 category : parseInt(category); } ]
      );

      return (
        <div className="categories-board-tabs">
          <ul className="nav nav-tabs">
            {
              sortedCategories.map((category, idx) => {
                let activeClass = this.state.selectedCategory === idx ?
                                    'active' : '';

                return (
                  <li key={idx} role="presentation" className={activeClass}>
                    <a onClick={() =>
                      this.setState({ selectedCategory: idx}) }>
                      { category }
                    </a>
                  </li>
                );
              })
            }
          </ul>
          { boards }
        </div>
      )
    }
  };

  renderDesktopBoards = () => {
    return (
      <div key={`${this.state.toggleImages ? 'spoiler-view' : 'pin-view'}`}
           className="row desktop-boards">
        <div className="col-lg-9 col-md-9 col-sm-9 col-xs-12">
          { this.renderBoardHolder("main") }
        </div>
        <div className="col-lg-3 col-md-3 col-sm-3 col-xs-12 sec-boards-container">
          <Tab.Container
            activeKey={this.state.activeBoardPill}
            onSelect={this.handleBoardPillChange}
          >
            <div className="row">
              <div className="col-lg-12 col-xs-12">
                <Nav bsStyle="tabs" className="nav-justified">
                  <NavItem
                    className="board-pill"
                    eventKey="side"
                  >
                    <div
                      className="board-droppable suppress-shadow"
                      ref={(d) => this.addDroppable(d)}
                      data-board-name="side"
                      data-is-header="true"
                    >
                      Side ({this.getCardCountForBoard('side')})
                    </div>
                  </NavItem>
                  <NavItem
                    className="board-pill"
                    eventKey="maybe"
                  >
                    <div
                      className="board-droppable suppress-shadow"
                      ref={(d) => this.addDroppable(d)}
                      data-board-name="maybe"
                      data-is-header="true"
                    >
                      Maybe ({this.getCardCountForBoard('maybe')})
                    </div>
                  </NavItem>
                </Nav>
                <Tab.Content>
                  { this.renderBoardHolder("side", "1") }
                  { this.renderBoardHolder("maybe", "2") }
                </Tab.Content>
              </div>
            </div>
          </Tab.Container>
        </div>
      </div>
    );
  };

  renderMobileBoards = () => {
    return ([
      <div key={1} className="row">
        <div className="col-md-12">
          { this.renderBoardHolder("main", "1") }
        </div>
      </div>,
      <div key={2} className="row">
        <div className="col-md-12">
          { this.renderBoardHolder("side", "2") }
        </div>
      </div>,
      <div key={3} className="row">
        <div className="col-md-12">
          { this.renderBoardHolder("maybe", "3") }
        </div>
      </div>
    ]);
  };

  renderCardSearchModal = () => {
    return (
      <CardSearchModal
        handleSearchInput={this.handleSearchInput}
        handleSearchSelect={this.handleSearchSelect}
        handleSearch={this.handleAdvancedSearchEnd}
        searchInput={this.state.searchInput}
        initData={this.state.initData}
      />
    );
  };

  renderNewCardsToggle = () => {
    let panelClass = `panel panel-default${this.state.isMobile ? ' top-panel' : ' accordion-panel'}`
    if (this.state.isMobile) {
      return (
        <div>
          {this.renderNewCards()}
        </div>
      )
    }
    return (
      <div className="row">
        <div className="col-md-12">
          <div className={panelClass}>
            {this.renderNewCards()}
          </div>
        </div>
      </div>
    )
  };

  renderNewCards = () => {
    return (
      <div id="add-cards-body" key={this.state.toggleImages ? 0 : 1}>
        <NewCardsBoard
          cards={Object.values(this.state.foundCards)}
          clearSearchInput={this.clearSearchInput}
          droppablesRef={d => this.addDroppable(d)}
          handleAdvancedSearch={this.handleAdvancedSearchStart}
          handleCardMoveStart={this.handleCardMoveStart}
          handleSearchCardSelect={this.handleSimpleSearchCardSelect}
          handleSearchClear={this.handleSearchClear}
          handleSearchInput={this.handleSimpleSearchInput}
          handleSearchScroll={this.handleSearchScroll}
          handleSearchSelect={this.handleSearchSelect}
          imagesMaxWidth={this.state.imagesMaxWidth}
          noCardsFound={this.state.noCardsFound}
          searching={this.state.searchingCards}
          searchCards={this.searchCards}
          searchInput={this.state.simpleSearchInput}
          toggleImages={this.state.toggleImages}
          autocompleteUrl={this.state.initData.autocomplete_search}
          autocompleteUrlInv={this.state.initData.autocomplete_search_inv}
          isMobile={this.state.isMobile}
        />
      </div>
    )
  };

  renderImgOptions = () => {
    if (!this.props.spoilerView) {
      return (
        <div className="row">
          <div className="col-md-12">
            <div className="panel panel-default top-panel options-panel">
              <div className="panel-body">
                <div className="row">
                  <div className="col-md-2 text-center"
                       style={{paddingTop: '5px'}}>
                  <span className="toggler">
                    <label htmlFor='toggleImagesButton'>
                      Display Thumbnails</label>
                    <Toggle
                      id="toggleImagesButton"
                      checked={this.state.toggleImages}
                      onChange={this.handleImagesToggle} />
                  </span>
                  </div>
                  { this.state.toggleImages &&
                    <div className="col-md-2">
                      <span className="slider-container">
                        <label>Images Scaling</label>
                        <Slider
                          min={100}
                          tooltip={false}
                          max={250}
                          step={1}
                          value={this.state.imagesMaxWidth}
                          onChange={this.handleImagesMaxWidth}
                        />
                      </span>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div className="row">
          <div className="col-md-12">
            <div className={"panel panel-default options-panel " +
                            "options-panel-spoiler-view"}>
              <div className="panel-body">
                <div className="row">
                  <div style={{"margin-bottom": "5px"}} className="col-sm-2">
                    <Select
                      name="form-field-name"
                      value={this.state.selectedCategoryType &&
                      this.state.selectedCategoryType.value}
                      onChange={this.handleCategorySelect}
                      placeholder="Group by"
                      options={this.categoryChoices}
                    />
                  </div>
                  {this.state.toggleImages &&
                  <div style={{"margin-bottom": "5px"}}  className="col-md-2">
                    <Select
                      name="form-field-name"
                      value={this.state.selectedStackType &&
                      this.state.selectedStackType.value}
                      onChange={this.handleStackSelect}
                      placeholder="Unstacked"
                      options={this.categoryChoices}
                    />
                  </div>
                  }
                  <div className="col-sm-2">
                    <span className="slider-container">
                      <label>Images Scaling</label>
                      <Slider
                        min={100}
                        tooltip={false}
                        max={250}
                        step={1}
                        value={this.state.imagesMaxWidth}
                        onChange={this.handleImagesMaxWidth}
                      />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  };

  renderOptions = () => {
    let deleteLegend = '';

    if (this.state.deletedCards.length >= 1)
      deleteLegend = 'Drag to delete card/Click to undo last delete';
    else
      deleteLegend = 'Drag to delete card';

    const content = (
      <div className="row">
        <div className="col-md-2 col-xs-6" style={{"margin-bottom": "5px"}}>
          <Select
            name="form-field-name"
            value={this.state.selectedCategoryType &&
            this.state.selectedCategoryType.value}
            onChange={this.handleCategorySelect}
            placeholder="Group by"
            options={this.categoryChoices}
          />
        </div>
        {this.state.toggleImages &&
        <div className="col-md-2 col-xs-6" style={{"margin-bottom": "5px"}}>
          <Select
            name="form-field-name"
            value={this.state.selectedStackType &&
            this.state.selectedStackType.value}
            onChange={this.handleStackSelect}
            placeholder="Unstacked"
            options={this.categoryChoices}
          />
        </div>
        }
        {!this.state.isMobile &&
          <div className="col-md-3">
            <button
              className='btn btn-danger btn-block trash-droppable suppress-shadow'
              ref={d => this.addDroppable(d)}
              disabled={this.state.deletedCards.length < 1}
              onClick={this.handleCardDeleteUndo}
              data-is-header="true">
              <span className="glyphicon glyphicon-trash"/>
              {' ' + deleteLegend}
            </button>
          </div>
        }
      </div>
    )

    const spoilerContent = (
      <div className="row">
        <div className="col-md-1 field-label">Group by:</div>
        <div className="col-sm-2">
          <Select
            name="form-field-name"
            value={this.state.selectedCategoryType &&
            this.state.selectedCategoryType.value}
            onChange={this.handleCategorySelect}
            placeholder="Group by"
            options={this.categoryChoices}
          />
        </div>
        {this.state.toggleImages &&
        <div className="col-md-2">
          <Select
            name="form-field-name"
            value={this.state.selectedStackType &&
            this.state.selectedStackType.value}
            onChange={this.handleStackSelect}
            placeholder="Unstacked"
            options={this.categoryChoices}
          />
        </div>
        }
        <div className="col-sm-2">
          <span className="slider-container">
            <label>Images Scaling</label>
            <Slider
              min={100}
              tooltip={false}
              max={250}
              step={1}
              value={this.state.imagesMaxWidth}
              onChange={this.handleImagesMaxWidth}
            />
          </span>
        </div>
      </div>
    )

    if (!this.props.spoilerView) {
      if (this.state.isMobile) return content
      return (
        <div className="row">
          <div className="col-md-12">
            <div className="panel panel-default options-panel top-borderless-panel">
              <div className="panel-body">
                {content}
              </div>
            </div>
          </div>
        </div>
      )
    } else {
      if (this.state.isMobile) return spoilerContent
      return (
        <div className="row">
          <div className="col-md-12">
            <div className="panel panel-default options-panel options-panel-spoiler-view">
              <div className="panel-body">
                {spoilerContent}
              </div>
            </div>
          </div>
        </div>
      )
    }
  };

  renderSaveButtons = () => {
    return (
      <div className="row">
        <div className="col-md-12">
          <hr />
          <button
            onClick={() => this.handleDeckSave(true)}
            className="btn btn-primary"
            disabled={this.state.savingInBackground}
            style={{marginRight: "0.25em"}}>
            { this.state.savingInBackground && this.deckHasChanges() ?
              [ <span key={1} className="spinner-loader"/>,
                <span key={2}>&nbsp;Autosaving</span>] :
              `Save${ this.deckHasChanges() ? '*' : '' }`
            }
          </button>
          <button
            onClick={() => this.handleDeckSave(false)}
            className="btn btn-primary"
            disabled={this.state.savingInBackground}
            style={{marginRight: "0.25em"}}>
            { this.state.savingInBackground && this.deckHasChanges() ?
              [ <span key={1} className="spinner-loader"/>,
                <span key={2}>&nbsp;Autosaving</span>] :
              `Save and continue editing${ this.deckHasChanges() ? '*' : '' }`
            }
          </button>
        </div>
      </div>
    )
  };

  renderWarning = () => {
    return (
      this.state.warnings
        .map((warning, idx) => {
          return (
            <div className={"alert alert-dismissible " +
                            `alert-${warning.type || 'warning'}`}
                 role="alert" key={idx}>
              <button type="button" className="close"
                      data-dismiss="alert"
                      aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
              {warning.msg}
            </div>
          )
        })
    )
  };

  renderCharts = () => {
    let deck = Object.values(this.state.deck).filter((card) => card.b === 'main');
    if (!deck.length) return '';
    let colorSeries = buildColorSeries(deck);
    let landSeries = buildLandColorSeries(deck);
    let typeSeries = buildTypeSeries(deck);
    let curveSeries = buildCurveSeries(deck);
    return (
      <div className="row">
        <div className="col-lg-4 col-xs-12">
          <ColorChartWrapper
            colorSeries={colorSeries}
            landSeries={landSeries}
          />
        </div>
        <div className="col-lg-4 col-xs-12 type-chart-container">
          <TypeChartWrapper
            typeSeries={typeSeries}
          />
        </div>
        <div className="col-lg-4 col-xs-12">
          <CurveChartWrapper
            curveSeries={curveSeries}
          />
        </div>
      </div>
    )
  };

  render() {
    let cardToEdit = this.state.cardToEdit ?
      {...this.state.deck[this.state.cardToEdit]} : null;

    let cardToMove = this.state.cardToMove;
    let sourceToMove = 'new';
    if (cardToMove && !this.state.newCard)
      sourceToMove = this.state.deck[cardToMove].b;
    if (this.state.isMobile) {
      if (this.state.loading) {
        return (
          <div>
            {this.renderMobileNavbar()}
            { <div style={{"margin-top": "60px"}} /> }
            <ProgressBar active now={100}/>
          </div>
        )
      }
      return (
        <div>
          { this.renderMobileNavbar() }
          { <div style={{"margin-top": "60px"}} /> }
          { this.renderWarning() }
          { !this.props.spoilerView && this.renderNewCardsToggle() }
          { this.renderOptions() }
          { this.renderBoards(this.renderMobileBoards()) }
          { !this.props.spoilerView && cardToEdit &&
          <CardEditModal card={cardToEdit}
                         handleCardEditEnd={this.handleCardEditEnd}
                         foilChoices={this.foilChoices}
                         colorChoices={this.colorChoices}
                         rarityChoices={this.rarityChoices}
          />
          }
          { !this.props.spoilerView && cardToMove &&
          <CardMoveModal card={cardToMove} source={sourceToMove}
                         handleCardMoveEnd={this.handleCardMoveEnd} />
          }
          { !this.props.spoilerView && this.state.advancedSearch &&
          this.renderCardSearchModal() }
          { this.renderSaveButtons() }
        </div>
      )
    } else {
      if (this.state.loading) return <div style={{padding: "10px 23%"}}><ProgressBar active now={100}/></div>
      return (
        <div>
          { this.renderWarning() }
          { this.renderImgOptions() }
          { !this.props.spoilerView && this.renderNewCardsToggle() }
          { this.renderOptions() }
          { this.renderBoards(this.renderDesktopBoards()) }
          <div className="row">
            <div className="col-md-12">
              <div className="well board-e-well">
                { this.renderCharts() }
              </div>
            </div>
          </div>
          { !this.props.spoilerView && cardToEdit &&
          <CardEditModal card={cardToEdit}
                         handleCardEditEnd={this.handleCardEditEnd}
                         foilChoices={this.foilChoices}
                         colorChoices={this.colorChoices}
                         rarityChoices={this.rarityChoices}
          />
          }
          { !this.props.spoilerView && cardToMove &&
          <CardMoveModal card={cardToMove} source={sourceToMove}
                         handleCardMoveEnd={this.handleCardMoveEnd} />
          }
          { !this.props.spoilerView && this.state.advancedSearch &&
          this.renderCardSearchModal() }
          { this.renderSaveButtons() }
        </div>
      )
    }
  }
}