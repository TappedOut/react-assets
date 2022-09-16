import React from 'react';

export default class CardMoveModal extends React.Component {
  constructor(props) {
    super(props);
    let currentInfo;
    let currentImg;
    let tla;
    if (props.newCard) {
      currentInfo = props.cardInfo[props.card];
      currentImg = currentInfo.image;
      tla = currentInfo.cannonical_set
    }
    this.state = {
      card: props.card,
      cardInfo: currentInfo,
      currentImg: currentImg,
      tla: tla,
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
            this.state.target, this.state.qty, this.state.tla));
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

  handleTLAChange = (event) => {
    let target = event.target;
    let value = target.value.trim();
    let img = this.state.cardInfo.printings.find(
        printing => printing.tla === value
      ).image;
    this.setState({
      tla: value,
      currentImg: img
    });
  }

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
              {this.state.currentImg && <img style={{'margin': 'auto', 'max-width': '300px'}} className="img-responsive" src={this.state.currentImg} />}
              {this.state.tla &&
                <div className="form-group">
                  <label htmlFor="card-tla">Printing:</label>
                  <select id="card-tla" name="tla" value={this.state.tla}
                          className="form-control"
                          onChange={this.handleTLAChange}>
                    {this.state.cardInfo.printings.map((printing, idx) =>
                      <option key={idx} value={printing.tla}>
                        {printing.name}</option>)
                    }
                  </select>
                </div>
              }
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
