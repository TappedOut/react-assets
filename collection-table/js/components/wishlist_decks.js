import React, { Component } from "react";
import axios from 'axios';
import {Button, Modal} from 'react-bootstrap'
import Cookies from "js-cookie";

class WishlistDecks extends Component {
  constructor(props) {
    super(props);

    this.state = {
      decks: [],
      loading: true,
      show_modal: false
    };
  }

  componentDidMount() {
    axios.get(
      this.props.api_url
    ).then(
      response => {
        this.setState({
          decks: response.data.decks,
          loading: false
        })
      }
    );
  }

  handleModalShow = () => this.setState({show_modal: true});
  handleModalHide = () => this.setState({show_modal: false});

  removeDeck = (remove_url) => {
    axios.post(
      remove_url,
      {},
      {headers: { 'X-CSRFToken': Cookies.get('csrftoken') }}
    ).then(
      response => {
        this.setState({
          decks: this.state.decks.filter((deck) => deck.remove_url !== remove_url),
        })
        this.props.remove_deck_cb()
      }
    );
  }

  render() {
    if (this.state.loading || !this.state.decks.length) return <div />
    const decks = this.state.decks.map(deck =>
      <div>
        <a href={deck.url}>{deck.name}</a>
        <button
          onClick={() => this.removeDeck(deck.remove_url)}
          className="btn btn-sm btn-danger"
          style={{'margin-left': '5px'}}
        >Remove</button>
      </div>)
    return (
      <div>
        <button
          onClick={this.handleModalShow}
          className="btn btn-md btn-block">
          Decks from others
        </button>
        <Modal show={this.state.show_modal} onHide={this.handleModalHide}>
          <Modal.Header>
            <Modal.Title>Decks from others</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {decks}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.handleModalHide}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    )
  }
}

export default WishlistDecks;
