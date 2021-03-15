import React, { Component } from "react";
import {Modal, Button} from "react-bootstrap";

class Card extends Component {
  constructor(props) {
    super(props);

    this.state = {
      show: false,
    };
  }

  handleCollClick(url){
    window.Android.openInBrowser(url)
  }

  handleCardPageClick(url){
    window.Android.openInBrowser(url)
  }

  render() {
    const handleClose = () => this.setState({show: false});
    const handleShow = () => this.setState({show: true});
    return (
      <div style={{'margin-bottom': '4px'}}>
        {this.props.qty && <span>{this.props.qty}x&nbsp;</span>}
        <a onClick={handleShow}>
          {this.props.name}
        </a>
        {this.props.set && <span>&nbsp;({this.props.set})</span>}
        {this.props.coll_chart &&
          <div className="pull-right">
            <a onClick={event => this.handleCollClick(this.props.coll_url)}>
              <img style={{'height': '40px', 'margin-top': '-10px'}} alt={this.props.coll_name} src={this.props.coll_chart}/>
            </a>
          </div>
        }
        <Modal show={this.state.show} onHide={handleClose}>
          <Modal.Body>
            <img alt={this.props.name} src={this.props.image} />
            <Button variant="primary" onClick={event => this.handleCardPageClick(this.props.url)}>View card page</Button>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

export default Card;
