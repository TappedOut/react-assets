import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import {ProgressBar, Modal, Button} from 'react-bootstrap'
const _ = require('lodash');


const CARD_ODDS_API = window.django.card_odds_api;


class DeckOddsApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      odds: [],
      on_the_play: true,
      grouping: 'name',
      loading: true,
      visible: false,
      modal: window.django.modal,
      show_odds_modal: false
    }
    if (!window.django.modal) this.getOdds('name')
  }

  handleOddsShow = () => {
    this.getOdds(this.state.grouping);
    this.setState({show_odds_modal: true})
  };
  handleOddsHide = () => this.setState({show_odds_modal: false});

  getOdds = (grouping) => {
    this.setState({loading: true})
    let url = `${CARD_ODDS_API}?grouping=${grouping}`;
    const remaining = document.getElementById('library')
    if (remaining) {
      let children = remaining.children;
      children = Array.prototype.slice.call(children);
      children = children.reduce(function(e1, e2){return e1 + '|' + e2.dataset['pk']}, '');
      children = children.substring(1);
      url += `&remaining=${children}`
    }
    axios.get(
      url,
    ).then(
      response => {
        this.setState({
          odds: response.data.odds,
          loading: false
        })
      }
    )
  }

  handleOnThePlayChange = (event) => {
    const checked = event.target.checked;
    this.setState({
      on_the_play: checked,
    });
  }

  handleGroupingChange = (event) => {
    const val = event.target.value;
    this.setState({
      grouping: val,
    });
    this.getOdds(val)
  }

  render() {
    const grouping_label = this.state.grouping.charAt(0).toUpperCase() + this.state.grouping.slice(1)
    let turns = [];
    _.times(15, (i) => {
      turns.push(<th>{this.state.modal ? 'Draw' : 'Turn'} {i+1}</th>);
    });
    const odds = this.state.odds.map(odd => {
      let percentages = [...odd[1]];
      !this.state.on_the_play ? percentages.shift() : percentages.pop();
      const cols = percentages.map(per => <td>{per}%</td>)
      return (
      <tr>
        <td>{odd[0]}</td>
        {cols}
      </tr>)
    })
    const form = (
      <div>
        <div className="col-lg-6 col-xs-12">
          <div className="form-group">
            <select id="grouping" name="grouping"
                    value={this.state.grouping}
                    className="form-control"
                    onChange={this.handleGroupingChange}>
              <option value="name">Individual Cards</option>
              <option value="color">Color</option>
              <option value="generated">Mana source</option>
              <option value="type">Type</option>
              <option value="subtype">Subtype</option>
              <option value="custom">Custom Categories</option>
            </select>
          </div>
        </div>
        {!this.state.modal && <div className="col-lg-6 col-xs-12">
          <div style={{'margin-top': '5px'}} className="form-group">
            <label htmlFor="on-the-play">
              <input id="on-the-play" type="checkbox" name="on_the_play"
                     checked={this.state.on_the_play} disabled={this.state.loading}
                     onChange={this.handleOnThePlayChange}/> On the play
            </label>
          </div>
        </div>}
      </div>
    )
    let wellBlock;
    if (this.state.modal) {
      wellBlock = <div className="row">{form}</div>
    } else {
      wellBlock = (
        <div className="row">
          <div className="col-lg-12 col-xs-12">
            <div className="well">
              <div className="row">
                {form}
              </div>
            </div>
          </div>
        </div>
      )
    }
    let oddsBlock;
    if (this.state.loading) {
      oddsBlock = <ProgressBar active now={100} />
    } else {
      oddsBlock = (
        <div>
          <div className="row">
            <div className="col-xs-12">
              <div className="table-responsive">
                <table className="table table-hover table-striped table-bordered">
                  <thead>
                  <tr>
                    <th>{grouping_label}</th>
                    {turns}
                  </tr>
                  </thead>
                  <tbody>
                  {odds}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )
    }
    if (this.state.modal) {
      return (
        <div>
          <button className="btn btn-xs" onClick={this.handleOddsShow}>Odds</button>
          <Modal bsSize='lg' show={this.state.show_odds_modal} onHide={this.handleOddsHide}>
            <Modal.Header>
              <Modal.Title>Checkout Binder</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {wellBlock}
              {oddsBlock}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={this.handleOddsHide}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      )
    } else {
      return <div>
        {wellBlock}
        {oddsBlock}
      </div>
    }
  }
}

ReactDOM.render(<DeckOddsApp />, document.getElementById('odds-root'));
