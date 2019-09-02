import React from 'react';

export default class CardMoveModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      card: props.card,
      qty: '1',
      move: false,
      source: props.source,
      target: props.source !== 'main' ? 'main' : 'side'
    };
  }

  componentDidMount() {
    jQuery(this.modalReference)
      .modal('show')
      .on('hide.bs.modal',
        () => this.props
          .handleCardMoveEnd(this.state.move ? this.state.card : null,
            this.state.target, this.state.qty));
  }

  handleInputChange = (event) => {
    let target = event.target;
    let value = target.value.trim();
    if (target.name === "qty" && (parseInt(value) < 1 || isNaN(value)))
      return;
    this.setState({
      [target.name]: value
    });
  };

  handleMove = () => {
    this.setState({qty: parseInt(this.state.qty) || 1, move: true},
      () => jQuery(this.modalReference).modal('hide'));
  };

  render() {
    return (
      <div className="modal fade" id="card-move-modal" tabIndex="-1"
           role="dialog" aria-labelledby="card-move-modal-label"
           ref={modal => this.modalReference = modal}>
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close"
                      data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
              <h4 className="modal-title"
                  id="card-move-modal-label">Move Card</h4>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="card-qty">Quantity:</label>
                <input id="card-qty" type="number" name="qty"
                       value={this.state.qty} className="form-control"
                       onChange={this.handleInputChange}/>
              </div>
              <div className="form-group">
                <label htmlFor="card-board">Target Board:</label>
                <select id="card-board" name="target" value={this.state.target}
                        className="form-control"
                        onChange={this.handleInputChange}>
                  { this.state.source !== 'main' &&
                    <option value="main">Main</option> }
                  { this.state.source !== 'side' &&
                    <option value="side">Side</option> }
                  { this.state.source !== 'maybe' &&
                    <option value="maybe">Maybe</option> }
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-warning"
                      data-dismiss="modal">Cancel</button>
              <button type="button" className="btn btn-success"
                      onClick={this.handleMove}>Move</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
