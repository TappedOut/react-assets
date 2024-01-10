import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import {ProgressBar, Modal, Button, Row, Col, InputGroup,
  DropdownButton, MenuItem, FormControl} from 'react-bootstrap'
import DualListBox from 'react-dual-listbox';
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


function expandSpecs(spec) {
  const result = []
  let i = 1
  spec.orig_slug = spec.slug
  _.times(spec.qty, () => {
    spec.slug = spec.orig_slug + `---${spec.b}-${i}`
    result.push({...spec})
    i++
  })
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
          result.data.results.map((spec) => {
            if (spec.cmdr === true) {
              cmdr.push(cmdr)
            }
            if (spec.b === 'main') {
              expandSpecs(spec).map((s) => mainb.push(s))
            }
            if (spec.b === 'side') {
              expandSpecs(spec).map((s) => sideb.push(s))
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
    }).catch((err) => console.log(err)
    ).finally(() => {
      if (isMounted.current) setIsSending(false)
    })

  }, [isSending, deck, odds])

  if (loading) return <ProgressBar active now={100} />

  const dual_opts = []
  const deck_opts = []
  const selected = []
  deck.map((c) => {
    dual_opts.push({'value': c.slug, 'label': c.name})
    if (oddsType === 'exact') {
      deck_opts.push({'value': c.slug, 'label': c.name})
    } else if (oddsType === 'any'){
      const elem = _.find(deck_opts, (o) => o.orig_name === c.name, 0)
      if (elem) {
        const [amount, name] = elem.label.split('x ')
        elem.label = `${parseInt(amount) + 1}x ${name}`
      } else {
        deck_opts.push({'value': c.slug, 'label': `${1}x ${c.name}`, 'orig_name': c.name})
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

  const oddsRender = oddsProbs.map((o) => <p>{o.label}: {o.prob}</p>)

  return (
    <div>
      <Row>
        <Col lg={8} md={8} sm={8} xs={12}>

          <div style={{'display': 'flex', 'justify-content': 'space-between'}}>
            <h4>Mainboard</h4>
            <h4>Cards to draw</h4>
          </div>
          <DualListBox
            canFilter
            options={deck_opts}
            selected={odds}
            onChange={(newValue) => setOdds(newValue)}
          />

          <div style={{'display': 'flex', 'justify-content': 'space-between'}}>
            <Button style={{'margin-top': '20px'}} bsStyle="warning" bsSize="medium" onClick={() => setShowSideModal(!showSideModal)}>
              Sideboard
            </Button>

            <Modal show={showSideModal} onHide={() => setShowSideModal(false)}>
              <Modal.Body>
                <div style={{'display': 'flex', 'justify-content': 'space-between'}}>
                  <h4>Mainboard</h4>
                  <h4>Sideboard</h4>
                </div>
                <MainSideDual allboards={dual_opts} selected={selected} setSideboard={setSideboard} />
              </Modal.Body>
              <Modal.Footer>
                <Button onClick={() => setShowSideModal(false)}>Close</Button>
              </Modal.Footer>
            </Modal>

            <InputGroup style={{'margin-top': '20px'}}>
              <FormControl type="number" min={0} max={deck.length} value={draws} onChange={e => setDraws(e.target.value)} />
              <InputGroup.Addon>Draws</InputGroup.Addon>
              <InputGroup.Button>
                <DropdownButton title={oddsType === 'any' ? 'Any Card' : 'Exact Cards'}>
                  <MenuItem active={oddsType === 'any'} onClick={() => {if (oddsType !== 'any') setOddsType('any')}}>Any Card</MenuItem>
                  <MenuItem active={oddsType === 'exact'} onClick={() => {if (oddsType !== 'exact') setOddsType('exact')}}>Exact Cards</MenuItem>
                </DropdownButton>
              </InputGroup.Button>
              <InputGroup.Button>
                <Button bsStyle="success" disabled={isSending || odds.length === 0} onClick={calculateOdds}>
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
