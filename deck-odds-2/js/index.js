import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import {ProgressBar, Modal, Button, Row, Col, InputGroup,
  DropdownButton, MenuItem, FormControl} from 'react-bootstrap';
import DualListBox from 'react-dual-listbox';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import 'react-dual-listbox/lib/react-dual-listbox.css';
const _ = require('lodash');
import '../css/deck_odds.scss';


const BOARD_API = window.django.board_api;
const CARD_ODDS_API = window.django.card_odds_api;


function MainSideDual(props) {
    return (
        <DualListBox
            canFilter
            options={props.allboards}
            selected={props.selected}
            onChange={(newValue) => props.setSideboard(newValue)}
        />
    );
}


function expandSpecs(spec, duplicates) {
  const result = []
  let i = duplicates[spec.slug] ? duplicates[spec.slug] + 1 : 1
  spec.orig_slug = spec.slug
  _.times(spec.qty, () => {
    spec.slug = spec.orig_slug + `---${spec.b}-${i}`
    result.push({...spec})
    i++
  })
  duplicates[spec.orig_slug] = i
  return result
}


function CardOdds() {
  const [deck, setDeck] = useState([])
  const [side, setSide] = useState([])
  const [odds, setOdds] = useState([])
  const [draws, setDraws] = useState(7)
  const [oddsType, setOddsType] = useState('any')
  const [loading, setLoading] = useState(true)
  const [showSideModal, setShowSideModal] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [oddsProbs, setOddsProbs] = useState([])
  const [runTour, setRunTour] = useState(!localStorage.getItem('hasCompletedTour'))
  const [steps, setSteps] = useState([
    {
      target: '.rdl-list-box',
      content: 'Select cards from your main board and add them to “Wanted Cards".',
      disableBeacon: true
    },
    {
      target: '#cards-to-draw',
      content: 'Select the amount of cards to draw.',
      disableBeacon: true
    },
    {
      target: '#odds-type',
      content: 'Select "Any Card" for odds of drawing any amount of the wanted cards without distinction.',
      disableBeacon: true
    },
    {
      target: '#odds-type',
      content: 'Select "Exact Cards" for odds of drawing the wanted set of cards together.',
      disableBeacon: true
    },
    {
      target: '#calculate-odds',
      content: 'Calculate the odds to draw the cards in "Wanted Cards" with the selected parameters.',
      disableBeacon: true
    },
    {
      target: '#perform-sideboard',
      content: 'Modify your deck with your sideboard if needed.', 
      disableBeacon: true
    }
  ])
  const isMounted = useRef(true)
  const cmdr = []

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    axios({
      method: "GET",
      url: BOARD_API
    }).then((result) => {
        if (result.data.results) {
          const mainb = []
          const sideb = []
          const duplicates = {}
          result.data.results.map((spec) => {
            if (spec.cmdr === true) {
              cmdr.push(cmdr)
              return
            }
            if (spec.b === 'main') {
              expandSpecs(spec, duplicates).map((s) => mainb.push(s))
            }
            if (spec.b === 'side') {
              expandSpecs(spec, duplicates).map((s) => sideb.push(s))
            }
          })
          setDeck(mainb)
          setSide(sideb)
        }
      }
    ).catch((err) => console.log(err)
    ).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setOdds([])
  }, [oddsType])

  const calculateOdds = useCallback(async () => {
    if (isSending) return
    setIsSending(true)
    axios.get(CARD_ODDS_API,
      {params: {
        'draw': draws,
        'odds_type': oddsType,
        'cards': deck.map((s) => s.orig_slug).join(','),
        'want_card': odds.map((s) => s.split('---')[0]).join(',')
      }}
    ).then((result) => {
      setIsSending(false)
      setOddsProbs(result.data.odds)
    }).catch((err) => setOddsProbs([{'label': 'Error', 'prob': 'Failed to get odds. Please refresh the page and try again'}])
    ).finally(() => {
      if (isMounted.current) setIsSending(false)
    })

  }, [isSending, deck, odds, draws])

  if (loading) return <ProgressBar active now={100} />

  const dual_opts = []
  const deck_opts = []
  const selected = []
  const quantities = {}
  deck.map((c) => {
    dual_opts.push({'value': c.slug, 'label': c.name})
    if (oddsType === 'exact') {
      deck_opts.push({'value': c.slug, 'label': c.name})
    } else if (oddsType === 'any'){
      const elem = _.find(deck_opts, (o) => o.orig_name === c.name, 0)
      if (elem) {
        const [amount, name] = elem.label.split('x ')
        elem.label = `${parseInt(amount) + 1}x ${name}`
        quantities[elem.value] += 1
      } else {
        deck_opts.push({'value': c.slug, 'label': `${1}x ${c.name}`, 'orig_name': c.name})
        quantities[c.slug] = 1
      }
    }
  })
  side.map((c) => {
    dual_opts.push({'value': c.slug, 'label': c.name})
    selected.push(c.slug)
  })

  function setSideboard(new_selected) {
    const allboards = deck.concat(side)
    const new_deck = []
    const new_side = []
    _.each(allboards, (c) => {
      if (new_selected.indexOf(c.slug) < 0) {
        new_deck.push(c)
      } else {
        new_side.push(c)
      }
    })
    setDeck(_.sortBy(new_deck, 'name'))
    setSide(_.sortBy(new_side, 'name'))
  }

  function handleJoyrideCallback(data){
    const { action, status } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status) || action === ACTIONS.CLOSE) {
      localStorage.setItem('hasCompletedTour', 'true')
      setRunTour(false);
    }
  };

  function handleHelpClick(){
    setRunTour(true)
  }

  const oddsRender = oddsProbs.map((o) => <p>{o.label}: {o.prob}</p>)

  const odds_length = oddsType == 'exact' ? odds.length : _.sum(_.values(_.pick(quantities, odds)));
  const main_length = oddsType == 'exact' ? deck.length - odds_length : _.sum(_.values(_.pick(quantities, deck.map((obj) => obj.slug)))) - odds_length

  const sideb_length = selected.length
  const mainb_length = dual_opts.length - sideb_length

  return (
    <div>
      <Joyride 
        steps={steps} 
        continuous={true}
        showSkipButton={true}
        run={runTour}
        showProgress={true}
        callback={handleJoyrideCallback}
      />
      <Row>
        <Col lg={8} md={8} sm={8} xs={12}>

          <div style={{'display': 'flex', 'justify-content': 'space-between'}}>
            <h4>Mainboard ({main_length})</h4>
            <h4>Wanted Cards ({odds_length})</h4>
          </div>
          <DualListBox
            canFilter
            options={deck_opts}
            selected={odds}
            onChange={(newValue) => setOdds(newValue)}
          />

          <div style={{'display': 'flex', 'justify-content': 'space-between'}}>
            <div>
              <Button id="perform-sideboard" style={{'margin-top': '20px'}} bsStyle="warning" bsSize="medium" onClick={() => setShowSideModal(!showSideModal)}>
                Sideboard
              </Button>
              <Button id="perform-sideboard" style={{'margin-top': '20px'}} bsStyle="info" bsSize="medium" onClick={handleHelpClick}>
                Help
              </Button>

              <Modal show={showSideModal} onHide={() => setShowSideModal(false)}>
                <Modal.Body>
                  <div style={{'display': 'flex', 'justify-content': 'space-between'}}>
                    <h4>Mainboard ({mainb_length})</h4>
                    <h4>Sideboard ({sideb_length})</h4>
                  </div>
                  <MainSideDual allboards={dual_opts} selected={selected} setSideboard={setSideboard} />
                </Modal.Body>
                <Modal.Footer>
                  <Button onClick={() => setShowSideModal(false)}>Close</Button>
                </Modal.Footer>
              </Modal>
            </div>

            <InputGroup style={{'margin-top': '20px'}}>
              <FormControl id="cards-to-draw" type="number" min={0} max={deck.length} value={draws} onChange={e => setDraws(e.target.value)} />
              <InputGroup.Addon>Draws</InputGroup.Addon>
              <InputGroup.Button>
                <DropdownButton id="odds-type" title={oddsType === 'any' ? 'Any Card' : 'Exact Cards'}>
                  <MenuItem active={oddsType === 'any'} onClick={() => {if (oddsType !== 'any') setOddsType('any')}}>Any Card</MenuItem>
                  <MenuItem active={oddsType === 'exact'} onClick={() => {if (oddsType !== 'exact') setOddsType('exact')}}>Exact Cards</MenuItem>
                </DropdownButton>
              </InputGroup.Button>
              <InputGroup.Button>
                <Button id="calculate-odds" bsStyle="success" disabled={isSending || odds.length === 0} onClick={calculateOdds}>
                  Calculate
                </Button>
              </InputGroup.Button>
            </InputGroup>

          </div>

        </Col>
        <Col style={{'text-align': 'center'}} lg={4} md={4} sm={4} xs={12}>
          <h4>Odds</h4>
          {oddsRender}
        </Col>
      </Row>

    </div>
  )
}

ReactDOM.render(<CardOdds />, document.getElementById('odds-root'));
