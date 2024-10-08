import React from 'react';

export default class CardEditModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      card: props.card,
      remove: false,
      save: false
    };
  }

  componentDidMount() {
    jQuery(this.modalReference)
      .modal('show')
      .on('hide.bs.modal',
        () => this.props
          .handleCardEditEnd(
            (this.state.save || this.state.remove) ? this.state.card : null,
             this.state.remove));
  }

  handleInputChange = (event) => {
    let target = event.target;
    let value = target.value.trim();
    if (target.name === "need_qty" && (parseInt(value) < 0 || isNaN(value)))
      return;
    let card = {...this.state.card};
    card[target.name] = target.value;
    this.setState({card});
  };

  handleQtyChange = (event) => {
    let value = event.target.value.trim();
    if (parseInt(value) < 1 || isNaN(value)) return;
    let card = {...this.state.card};
    card.qty = value;
    this.setState({card});
  };

  handleRemove = () => {
    this.setState({remove: true}, () =>
      jQuery(this.modalReference).modal('hide'));
  };

  handleSaveChanges = () => {
    let card = {...this.state.card};
    card.qty = parseInt(card.qty) || 1;
    card.need_qty = parseInt(card.need_qty) || 0;
    card.variation = card.variation && card.tla ? card.variation : null;
    if (card.tla) {
      let current_print = this.state.card.printings.find(
        printing => printing.tla === this.state.card.tla
      );

      if (card.variation && current_print.variations && current_print.variations.length) {
        let variation = current_print.variations.find(variation => ''+variation.identifier === card.variation);
        if (variation && variation.image) {
          card.image = variation.image
        } else {
          card.variation = null
        }
      } else {
        card.variation = null;
        if (current_print.image) {
          card.image = current_print.image
        }
      }
    }

    this.setState({card, save: true}, () =>
      jQuery(this.modalReference).modal('hide'));
  };

  render() {
    let card = this.state.card;
    let variations = '';
    let current_print = this.state.card.printings.find(
      printing => printing.tla === this.state.card.tla
    );
    if (current_print && current_print.variations && current_print.variations.length) {
      variations = current_print.variations.map(
        variation => {
          return {
            identifier: variation.identifier ? variation.identifier :
              variation.wizards_id ? variation.wizards_id : variation.code,
            display: variation.display ? variation.display : variation.identifier
          }
        }
      );
    }

    return (
      <div className="modal fade" id="card-edit-modal" tabIndex="-1"
           role="dialog" aria-labelledby="card-edit-modal-label"
           ref={modal => this.modalReference = modal}>
        <div className="modal-dialog modal-sm" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close"
                      data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
              <h4 className="modal-title"
                  id="card-edit-modal-label">Card Editor: {card.name}</h4>
            </div>
            <div className="modal-body">
              <div className={"form-group" +
                `${card.hasErrors.includes('qty') ? " has-error" : ""}`}>
                <label htmlFor="card-qty">Quantity:</label>
                <input id="card-qty" type="number" name="qty"
                       value={this.state.card.qty} className="form-control"
                       onChange={this.handleQtyChange}/>
              </div>
              <div className={"form-group" +
                `${card.hasErrors.includes('need_qty') ? " has-error" : ""}`}>
                <label htmlFor="card-needed-qty">Needed:</label>
                <input id="card-needed-qty" type="number" name="need_qty"
                       value={this.state.card.need_qty} className="form-control"
                       onChange={this.handleInputChange}/>
              </div>
              <div className="form-group">
                <label htmlFor="card-board">Board:</label>
                <select id="card-board" name="b"
                        value={this.state.card.b}
                        className="form-control"
                        onChange={this.handleInputChange}>
                  <option value="main">Main</option>
                  <option value="side">Side</option>
                  <option value="maybe">Maybe</option>
                </select>
              </div>
              {!!this.state.card.printings.length &&
                <div className={"form-group" +
                  `${card.hasErrors.includes('tla') ? " has-error" : ""}`}>
                  <label htmlFor="card-tla">Printing:</label>
                  <select id="card-tla" name="tla" value={this.state.card.tla}
                          className="form-control"
                          onChange={this.handleInputChange}>
                    <option value=''>Default</option>
                    {this.state.card.printings.map((printing, idx) =>
                      <option key={idx} value={printing.tla}>
                        {printing.name}</option>)
                    }
                  </select>
                </div>
              }
              {variations &&
                <div className="form-group">
                  <label htmlFor="card-tla">Variations:</label>
                  <select id="card-variation" name="variation" value={this.state.card.variation}
                          className="form-control"
                          onChange={this.handleInputChange}>
                    <option value=''/>
                    { variations.map((variation, idx) =>
                      <option key={idx} value={variation.identifier}>
                        {variation.display}</option>)
                    }
                  </select>
                </div>
              }
              <div className={"form-group" +
              `${card.hasErrors.includes('language') ? " has-error" : ""}`}>
                <label htmlFor="card-language">Language:</label>
                <select id="card-language" name="language"
                        value={this.state.card.language}
                        className="form-control"
                        onChange={this.handleInputChange}>
                  <option value="EN">English</option>
                  <option value="FR">French</option>
                  <option value="IT">Italian</option>
                  <option value="CN">Chinese Simplified</option>
                  <option value="PR">Portuguese</option>
                  <option value="GE">German</option>
                  <option value="SP">Spanish</option>
                  <option value="RS">Russian</option>
                  <option value="KO">Korean</option>
                  <option value="JA">Japanese</option>
                </select>
              </div>
              <div className={"form-group" +
              `${card.hasErrors.includes('condition') ? " has-error" : ""}`}>
                <label htmlFor="card-condition">Condition:</label>
                <select id="card-condition" name="condition"
                        value={this.state.card.condition}
                        className="form-control"
                        onChange={this.handleInputChange}>
                  <option value="NM">Near Mint/Mint</option>
                  <option value="SL">Slightly Played</option>
                  <option value="MP">Medium Played</option>
                  <option value="HP">Heavily Played</option>
                </select>
              </div>
              <div className={"form-group" +
              `${card.hasErrors.includes('foil') ? " has-error" : ""}`}>
                <label htmlFor="card-foil">Foil:</label>
                <select id="card-foil" name="foil" value={this.state.card.foil}
                        className="form-control"
                        onChange={this.handleInputChange}>
                  <option value="">Not foil</option>
                  <option value="foil">Foil</option>
                  <option value="pre">Pre-release</option>
                </select>
              </div>
            </div>
            <div className="modal-footer card-edit-modal-footer">
              <button type="button" className="btn btn-success"
                      onClick={this.handleSaveChanges}>Save</button>
              <button type="button" className="btn btn-warning"
                      data-dismiss="modal">Dismiss</button>
              <button type="button" className="btn btn-danger"
                      onClick={this.handleRemove}>Delete</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
