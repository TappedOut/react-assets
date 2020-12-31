import React, { Component } from "react";
import {Modal, Button} from "react-bootstrap";

class FilterModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      show: false,
      page: 1,
      form: {
        description: '',
        name: '',
        color: '',
        format: '',
        rarity: '',
        type: '',
        subtype: '',
        set: '',
        price_from: '',
        price_to: '',
        language: '',
        owned: true,
        foil: false,
        cost_from: '',
        cost_to: ''
      }
    };
  }

  handleFilter() {
    this.setState({show: false});
    this.props.onFilter(this.state.form);
  }

  render() {
    const handleClose = () => this.setState({show: false});
    const handleShow = () => this.setState({show: true});
    return (
      <div>
        <Button variant="primary" onClick={handleShow}>
          Filter
        </Button>

        <Modal show={this.state.show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Filter</Modal.Title>
          </Modal.Header>
          <Modal.Body>

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

  onInputChange(term) {
    this.setState({ term });
  }
}

export default FilterModal;
