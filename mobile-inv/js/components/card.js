import React, { Component } from "react";
import {Modal, Button} from "react-bootstrap";

class Card extends Component {
  constructor(props) {
    super(props);

    this.state = {
      show: false,
    };
  }

  handleFilter() {
    this.setState({show: false});
    this.props.onFilter(this.state.form);
  }

  render() {
    const handleClose = () => this.setState({show: false});
    const handleShow = () => this.setState({show: true});
    let card_token = `${this.props.qty}x ${this.props.name}`
    if (this.props.set) card_token += ` (${this.props.set})`
    return (
      <div>
        <a onClick={handleShow}>
          {card_token}
        </a>

        <Modal show={this.state.show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Modal heading</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <img alt={this.props.name} src={this.props.image} />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button variant="primary" onClick={this.handleFilter}>
              Filter
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

export default Card;
