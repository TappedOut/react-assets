import React from 'react';
import axios from 'axios';
import {HelpBlock, Modal, Button} from 'react-bootstrap';
import _ from "lodash";
import Select from 'react-select';
import Cookies from "js-cookie";
import FeedbackMessage from './feedbackMessage';

const FEEDBACK_API = window.django.feedback_api


export default class Feedback extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      show: false,
      incorrect_cards: [],
      missing_cards: '',
      feedback_sent: false,
      message: '',
      color: 'green'
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.filters.query !== this.props.filters.query) {
      this.setState({ incorrect_cards: [], missing_cards: '', feedback_sent: false });
    }
  }

  handleClose = () => {
    this.setState({ show: false })
  }

  handleShow = () => {
    this.setState({ show: true })
  }

  handleIncorrectChange = (v) => {
    this.setState({
      incorrect_cards: v
    })
  }

  handleMissingChange = (e) => {
    this.setState({
      missing_cards: e.target.value
    })
  }

  handleSendFeedback = () => {
    const con_color = []
    const exclude_color = []
    _.forOwn(this.props.filters.colors, (cvalue, ckey) => {
      if (cvalue === 1) con_color.push(ckey.toUpperCase())
      if (cvalue === -1) exclude_color.push(ckey.toUpperCase())
    })
    const post_data = {
      query: this.props.filters.query
    }
    if (con_color.length) post_data['con_color'] = con_color
    if (exclude_color.length) post_data['exclude_color'] = exclude_color
    if (this.props.filters.mtg_format) post_data['mtg_format'] = this.props.filters.mtg_format
    if (this.state.incorrect_cards.length) post_data['incorrect_cards'] = this.state.incorrect_cards.map((elem) => elem.value)
    if (this.state.missing_cards) post_data['missing_cards'] = this.state.missing_cards

    axios.post(
      FEEDBACK_API, post_data, {headers: { 'X-CSRFToken': Cookies.get('csrftoken') }}
    ).then(
      response => {
        this.setState({
          show: false,
          feedback_sent: true,
          message_color: 'green',
          message: 'Feedback sent'
        })
      },
      error => {
        this.setState({
        show: false,
        message_color: 'red',
        message: 'Error sending feedback'
      })
      }
    )
    .catch(error => {
      this.setState({
        show: false,
        message_color: 'red',
        message: 'Error sending feedback'
      })
    })
    this.setState({show: false})
  }

  render() {
    const incorrect_opts = this.props.specs.map((spec) => ({label: spec.name, value: spec.pk}))
    return (
      <>
        <Button bsStyle="success" bsSize="small" onClick={this.handleShow} disabled={!(this.props.specs && this.props.specs.length)}>
            Feedback
        </Button>
        {this.state.message && <FeedbackMessage message={this.state.message} color={this.state.message_color} />}

        <Modal show={this.state.show} onHide={this.handleClose}>
            <Modal.Header closeButton>
              <Modal.Title>Modal heading</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>{this.props.filters.query}</p>
              <div className='row'>
                  <div className='col-lg-12 col-md-6 col-xs-12'>
                      <Select
                          name="incorrect_cards"
                          placeholder="Incorrect cards"
                          onChange={(v) => this.handleIncorrectChange(v)}
                          value={this.state.incorrect_cards}
                          options={incorrect_opts}
                          multi={true}
                      />
                      <HelpBlock>Cards you think don't match the query</HelpBlock>
                  </div>
                </div>
                <div className='row'>
                  <div className='col-lg-12 col-md-6 col-xs-12'>
                      <input placeholder="Mana Leak, Doom Blade" className='form-control' type='text' name='missing_cards' value={this.state.missing_cards} onChange={(e) => this.handleMissingChange(e)} />
                      <HelpBlock>Cards you think match the query but weren't shown. Names separated by commas</HelpBlock>
                  </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
              <Button onClick={this.handleClose}>Close</Button>
              <Button 
                bsStyle="success" 
                onClick={this.handleSendFeedback} 
                disabled={(!this.state.missing_cards && !this.state.incorrect_cards.length) || this.state.feedback_sent}
              >Send Feedback
              </Button>
            </Modal.Footer>
        </Modal>
      </>
    )
  }
}