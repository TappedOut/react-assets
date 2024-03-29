import React from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import Dragula from 'react-dragula';
import Slider from 'react-rangeslider';
import Select from 'react-select';
import Toggle from 'react-toggle';
import Rusha from 'rusha';
import { isMobile } from 'react-device-detect';
import BoardHolder from './components/BoardHolder';
import CardEditModal from './components/CardEditModal';
import CardMoveModal from './components/CardMoveModal';
import CardSearchModal from './components/CardSearchModal';
import NewCardsBoard from './components/NewCardsBoard';
import { get_card_id } from "./utils";
import deck_group from './utils/deck_grouping';
import { Collapse } from 'react-bootstrap';
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
const SPOILER = window.location.href.split('/')[5] === 'spoiler';
const INIT_URL = `${DEFAULT_NAMESPACE}mtg-decks/${DECK_SLUG}/board-update/init/`;
const AUTOCOMPLETE_URL = `${DEFAULT_NAMESPACE}api/autocomplete/`;
const AUTOCOMPLETE_URL_INV = `${DEFAULT_NAMESPACE}api/autocomplete/inv-only/`;


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
  card.updated = false;
  card.updateCount = 0;  // Forces re-rendering when needed

  let cardId = get_card_id(card, board);
  card.cardId = cardId;

  if (created) {
    card.ihash = cardId;
    card.effective_cost = card.reg_effective_cost ? card.reg_effective_cost.map((c) => COLORS[c]).join(" ") : "";
  }

  let cardCost = card.effective_cost ? card.effective_cost : "";

  if (cardCost.trim().match(/^\s*$/)) {
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
      advancedSearch: false,
      cardToEdit: null,
      cardToMove: null,
      collapsedBoards: { side: true, maybe: true },
      deck: {},
      deckByCategories: {},
      deckByPositions: [],
      deckHash: '',
      deletedCards: [],
      foundCards: {},
      imagesMaxWidth: 195,
      loading: true,
      nextSearchPage: 1,
      searchOnScroll: false,
      newCard: false,
      redirectAfterSave: false,
      savingInBackground: false,
      searchingCards: false,
      showAddCards: false,
      initializedRecommendations: false,
      simpleSearchInput: {
        name: '',
        invOnly: false
      },
      selectedCategory: 0,
      selectedCategoryType: '',
      // timerSaving: null,
      toggleImages: false,
      warnings: [],
      isMobile: isMobile
    };

    this.droppables = [];
    this.loadingModal = null;
  }

  componentDidMount() {
    this.getInitData();
    this.setupDragula();
    this.toggleLoadingModal();
    TAPPED.observeBoardCards();
    // TODO: Deactivated for now
    // this.setState(
    //   {timerSaving: setInterval(this.handleDeckSaveAuto, 60 * 5 * 1000)}
    // );
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
    // TODO: Deactivated for now
    // this.clearInverval(this.state.timerSaving);
    window.removeEventListener("beforeunload", this.handleUnload);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.toggleImages !== this.state.toggleImages)
      this.setupDragula();
    this.normalizeBoardsHeight();
    this.toggleLoadingModal();
  }

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
        this.loadingModal = null;
        this.loadDeckData()
      },
      error => {
        this.setState({errorInit: true});
      },
    );
  };

  addDroppable = (d) => {
    if (d !== null && !this.droppables.includes(d)) this.droppables.push(d);
  };

  appendWarnings = (warns) => {
    let warnings = [...this.state.warnings].concat(warns);
    this.setState({ warnings });
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

  handleAddCardsToggle = () => {
    this.setState({ showAddCards: !this.state.showAddCards });
    if (!this.state.initializedRecommendations) {
      this.initRecommendations();
      this.setState({ initializedRecommendations: true })
    }
  };

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

  handleBoardCollapseToggle = (boardName) => {
    let collapsedBoards = {...this.state.collapsedBoards};

    if (!collapsedBoards.hasOwnProperty(boardName)) {
      collapsedBoards[boardName] = true;
    } else {
      collapsedBoards[boardName] = !collapsedBoards[boardName];
    }

    this.setState({collapsedBoards});
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

      if (newCard) {
        deckByCategories = rehashDeckByCategories(deck,
          this.state.selectedCategoryType);

        // Only setup new position if the card is new, if it exists then let the original position intact
        deckByPositions = this.handleBoardsChangePosition(newId, originalId);
      }

      this.setState({ cardToEdit: null, deck, deckByPositions, deckByCategories });
    } else if (card !== null && remove) {
      this.handleCardDelete(card.cardId);
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
            () => {
              if (this.state.redirectAfterSave) {
                window.location.href = this.state.initData.deck_url;
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
    this.setState({foundCards: {}, simpleSearchInput, searchInput});
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

        let collapsedBoards = {
          side: !_.some(deck, c => c.b === 'side'),
          maybe: !_.some(deck, c => c.b === 'maybe')
        };

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

        this.setState({collapsedBoards, deck, deckByPositions,
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

  normalizeBoardsHeight = () => {
    // This function is called after every update to normalize the height of the boards
    let i, maxBoardHeight = 0,
      boards = document.querySelectorAll('.desktop-boards .board-droppable');

    for (i = 0; i < boards.length; i++)
      boards[i].style.height = null;

    for (i = 0; i < boards.length; i++) {
      maxBoardHeight = maxBoardHeight > boards[i].scrollHeight ?
        maxBoardHeight : boards[i].scrollHeight;
    }

    for (i = 0; i < boards.length; i++)
      boards[i].style.height = `${maxBoardHeight}px`;
  };

  saveBoardConfig = () => {
    let boardConfig = {
      collapsedBoards: this.state.collapsedBoards,
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
      Object.values(this.state.deck).map(card =>
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
      ).map(specs =>
      specs.alt_color ? specs : _.omit(specs, ['alt_color'])),
      { headers: { 'X-CSRFToken': Cookies.get('csrftoken') } }
    );
  };

  initRecommendations = () => {
    let recommendUrl = `${this.state.initData.deck_recommendations_url}` +
                       `?deck=${DECK_SLUG}&cards=${this.state.initData.deck_cards}`;
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

  searchCards = (newSearch=true, simpleSearch=false, nameOverride=null) => {
    let searchInput = simpleSearch ? {...this.state.simpleSearchInput} :
      {...this.state.searchInput};
    if (!simpleSearch && this.state.simpleSearchInput.invOnly) {
      searchInput['invOnly'] = true
    }
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

    if (searchTerms.trim() !== '' && !this.state.searchingCards) {
      let nextSearchPage = newSearch ? 1 : this.state.nextSearchPage;

      let searchUrl = `${this.state.initData.django.cards_search_url}` +
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

          let nextSearchPage = response.data.next !== null ?
            this.state.nextSearchPage + 1 : null;

          this.setState({foundCards, nextSearchPage, searchingCards: false, searchOnScroll: true});
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
        if (target.dataset.boardName === "new-cards") {
          return false
        } else if (source.dataset.boardName === "new-cards" &&
          target.classList.contains('trash-droppable')) {
          return false
        } else if (target.dataset.boardCategory) {
          return (target.dataset.boardCategory === source.dataset.boardCategory);
        } else {
          return true;
        }
      },
      copy: false,
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
          if (SPOILER) {
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
          if ((source.dataset.boardName === 'new-cards') ||
              (this.state.deck[el.dataset.card].qty || 1 ) > el.dataset.move) {
            let shadow = el.cloneNode(true);
            shadow.id = "drag-shadow";

            if (source.dataset.boardName !== 'new-cards' &&
                shadow.querySelector('.card-qty')) {
              shadow.querySelector('.card-qty').innerHTML =
                `x${this.state.deck[el.dataset.card].qty - el.dataset.move}`;
            }

            if (SPOILER) {
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
          let shadow = source.querySelector('#drag-shadow');
          if (shadow) { source.removeChild(shadow); }
          if (el.classList.contains('gu-hidden')) {
            el.classList.remove('gu-hidden');
          }

          if (SPOILER) {
            let elPartials = el.querySelectorAll('.card-spoiler-partial');
            elPartials.forEach((e) => { e.style.display = "block"; });
          }
        }
      )
      .on(
        'over',
        (el, container) => {
          if (container.dataset.boardName !== 'new-cards') {
            container.classList.add('highlighted');
          }
        }
      )
      .on(
        'out',
        (el, container) => {
          if (container.dataset.boardName !== 'new-cards') {
            container.classList.remove('highlighted');
          }
        }
      )
      .on(
        'shadow',
        (shadow, container, source) => {
          if (container.dataset.boardName !== 'new-cards'
              && !SPOILER) {
            if (container.dataset.boardName !== source.dataset.boardName) {
              shadow.querySelector('.card-qty').innerHTML =
                `x${shadow.dataset.move}`;
            } else {
              shadow.querySelector('.card-qty').innerHTML =
                `x${this.state.deck[shadow.dataset.card].qty}`;
            }
          }

          if (SPOILER) {
            let shadowPartials = shadow.querySelectorAll('.card-spoiler-partial');
            let partialsToRemove = shadowPartials.length - shadow.dataset.move + 1;

            for (let i = 0; i < partialsToRemove; i++) {
              shadowPartials[i].style.display = "none";
            }
          }
        }
      );
  };

  toggleLoadingModal = () => {
    if (this.loadingModal !== null) {
      if (this.state.loading)
        jQuery(this.loadingModal).modal({
          backdrop: 'static',
          keyboard: false,
          show: true
        });
      else
        jQuery(this.loadingModal).modal('hide');
    }
  };

  renderBoardHolder = (boardName, boardCollapse=false) => {
    let categoryGroup = null;

    if (!_.isEmpty(this.state.deckByCategories)) {
      let selectedCategory = _.sortBy(
        Object.keys(this.state.deckByCategories),
        [(cat) => { return isNaN(cat) ? cat : parseInt(cat); } ])[this.state.selectedCategory];
      categoryGroup = this.state.deckByCategories[selectedCategory];
    }

    let boardCards = this.state.deckByPositions
      .map((cardId) => this.state.deck[cardId] || {})
      .filter(card => (card.b === boardName && card.qty >= 1 &&
        (categoryGroup === null || categoryGroup.has(card.cardId)))
      );

    return (
      <BoardHolder
        boardName={boardName}
        boardCards={boardCards}
        droppablesRef={d => this.addDroppable(d)}
        handleBoardCollapseToggle={
          boardCollapse ? this.handleBoardCollapseToggle : null
        }
        handleCardDelete={this.handleCardDelete}
        handleCardEditStart={this.handleCardEditStart}
        handleCardMoveStart={this.handleCardMoveStart}
        imagesMaxWidth={this.state.imagesMaxWidth}
        spoilerView={SPOILER}
        toggleImages={this.state.toggleImages}
        isMobile={this.state.isMobile}
        cardAlterUrl={this.state.initData ? this.state.initData.card_alter_url : ''}
      />
    )
  };

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
    let mainBoardSize;

    let { side, maybe } = this.state.collapsedBoards;

    if (side && maybe) {
      mainBoardSize = 11;
    } else if (side || maybe) {
      mainBoardSize = 8;
    } else {
      mainBoardSize = 6;
    }

    const sideCount = this.state.deckByPositions
      .map((cardId) => this.state.deck[cardId] || {})
      .filter(card => (card.b === 'side' && card.qty >= 1 ))
      .reduce((acc, card) => { return (card.qty || 1) + acc; }, 0);

    const maybeCount = this.state.deckByPositions
      .map((cardId) => this.state.deck[cardId] || {})
      .filter(card => (card.b === 'maybe' && card.qty >= 1 ))
      .reduce((acc, card) => { return (card.qty || 1) + acc; }, 0);

    return (
      <div key={`${this.state.toggleImages ? 'spoiler-view' : 'pin-view'}`}
           className="row desktop-boards">
        <div className={`col-sm-${mainBoardSize} main-board`}>
          { this.renderBoardHolder("main") }
        </div>
        { !side &&
          <div className="col-sm-3 side-board">
            { this.renderBoardHolder("side", true) }
          </div>
        }
        { !maybe &&
          <div className={`col-sm-3 maybe-board ${side ? 'has-side' : ''}`}>
            { this.renderBoardHolder("maybe", true) }
          </div>
        }
        { (side || maybe) &&
          <div className="col-sm-1 side-buttons">
            <div className="list-group side-buttons-boards-collapse">
              { side &&
                <button className="list-group-item" type="button"
                        onClick={() => this.handleBoardCollapseToggle('side')}>
                  Side{!!sideCount && <span> ({sideCount})</span>}
                </button>
              }
              { maybe &&
                <button className="list-group-item" type="button"
                        onClick={() => this.handleBoardCollapseToggle('maybe')}>
                  Maybe{!!maybeCount && <span> ({maybeCount})</span>}
                </button>
              }
            </div>
          </div>
        }
      </div>
    );
  };

  renderMobileBoards = () => {
    return ([
      <div key={1} className="row">
        <div className="col-md-12">
          { this.renderBoardHolder("main") }
        </div>
      </div>,
      <div key={2} className="row">
        <div className="col-md-12">
          { this.renderBoardHolder("side") }
        </div>
      </div>,
      <div key={3} className="row">
        <div className="col-md-12">
          { this.renderBoardHolder("maybe") }
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

  renderLoadingModal = () => {
    return (<div className="modal fade" tabIndex="-1" role="dialog"
         aria-labelledby="loading-modal"
         ref={modal => this.loadingModal = modal}>
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">Loading...</h4>
          </div>
          <div className="modal-body">
            <div className="row">
              <div className="col-md-12">
                <div className="progress">
                  <div className={"progress-bar progress-bar-info " +
                  "progress-bar-striped active"}
                       role="progressbar" aria-valuenow="100"
                       aria-valuemin="0" aria-valuemax="100"
                       style={{width: "100%"}}>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
  };

  renderNewCardsToggle = () => {
    const { showAddCards } = this.state;
    const addLegend = ' Add Cards';
    return (
      <div className="row">
        <div className="col-md-12">
          <div className="panel panel-default accordion-panel">
            <div className="panel-heading board-panel-heading"
              onClick={this.handleAddCardsToggle}
              aria-controls="add-cards-body"
              aria-expanded={showAddCards}
            >
              <h3 className="panel-title">
                <span className="glyphicon glyphicon-plus"/>
                {addLegend}
              </h3>
            </div>
            <Collapse in={showAddCards}>
            {this.renderNewCards()}
            </Collapse>
          </div>
        </div>
      </div>
    )
  };

  renderNewCards = () => {
    return (
      <div id="add-cards-body" className="row" key={this.state.toggleImages ? 0 : 1}>
        <div className="col-md-12">
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
            searching={this.state.searchingCards}
            searchCards={this.searchCards}
            searchInput={this.state.simpleSearchInput}
            toggleImages={this.state.toggleImages}
            autocompleteUrl={AUTOCOMPLETE_URL}
            autocompleteUrlInv={AUTOCOMPLETE_URL_INV}
          />
        </div>
      </div>
    )
  };

  renderImgOptions = () => {
    if (!SPOILER) {
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
                          max={500}
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
                  <div className="col-sm-4">
                    <Select
                      name="form-field-name"
                      value={this.state.selectedCategoryType &&
                      this.state.selectedCategoryType.value}
                      onChange={this.handleCategorySelect}
                      placeholder="Arrange by"
                      options={this.categoryChoices}
                    />
                  </div>
                  <div className="col-sm-2">
                    <span className="slider-container">
                      <label>Images Scaling</label>
                      <Slider
                        min={150}
                        tooltip={false}
                        max={300}
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

    if (this.state.isMobile)
      deleteLegend = 'Click to undo last delete';
    else if (this.state.deletedCards.length >= 1)
      deleteLegend = 'Drag to delete card/Click to undo last delete';
    else
      deleteLegend = 'Drag to delete card';

    if (!SPOILER) {
      return (
        <div className="row">
          <div className="col-md-12">
            <div className="panel panel-default options-panel top-borderless-panel">
              <div className="panel-body">
                <div className="row">
                  <div className="col-md-3">
                    <Select
                      name="form-field-name"
                      value={this.state.selectedCategoryType &&
                      this.state.selectedCategoryType.value}
                      onChange={this.handleCategorySelect}
                      placeholder="Arrange by"
                      options={this.categoryChoices}
                    />
                  </div>
                  <div className="col-md-3">
                    <button
                      className='btn btn-danger btn-block trash-droppable'
                      ref={d => this.addDroppable(d)}
                      disabled={this.state.deletedCards.length < 1}
                      onClick={this.handleCardDeleteUndo}>
                      <span className="glyphicon glyphicon-trash"/>
                      {' ' + deleteLegend}
                    </button>
                  </div>
                  <div className="col-md-2">
                    <button
                      className='btn btn-warning btn-block'
                      onClick={this.handleResetPosition}>
                      Reset Cards Positions
                    </button>
                  </div>
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
                  <div className="col-sm-4">
                    <Select
                      name="form-field-name"
                      value={this.state.selectedCategoryType &&
                      this.state.selectedCategoryType.value}
                      onChange={this.handleCategorySelect}
                      placeholder="Arrange by"
                      options={this.categoryChoices}
                    />
                  </div>
                  <div className="col-sm-2">
                    <span className="slider-container">
                      <label>Images Scaling</label>
                      <Slider
                        min={150}
                        tooltip={false}
                        max={300}
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

  render() {
    let cardToEdit = this.state.cardToEdit ?
      {...this.state.deck[this.state.cardToEdit]} : null;

    let cardToMove = this.state.cardToMove;
    let sourceToMove = 'new';
    if (cardToMove && !this.state.newCard)
      sourceToMove = this.state.deck[cardToMove].b;

    return (
      <div>
        { this.renderWarning() }
        { this.renderImgOptions() }
        { !SPOILER && this.renderNewCardsToggle() }
        { this.renderOptions() }
        { this.state.isMobile ?
          this.renderBoards(this.renderMobileBoards()) :
          this.renderBoards(this.renderDesktopBoards()) }
        { !SPOILER && cardToEdit &&
          <CardEditModal card={cardToEdit}
                         handleCardEditEnd={this.handleCardEditEnd} />
        }
        { !SPOILER && cardToMove &&
          <CardMoveModal card={cardToMove} source={sourceToMove}
                         handleCardMoveEnd={this.handleCardMoveEnd} />
        }
        { !SPOILER && this.state.advancedSearch &&
          this.renderCardSearchModal() }
        { this.renderLoadingModal() }
        { this.renderSaveButtons() }
      </div>
    )
  }
}
