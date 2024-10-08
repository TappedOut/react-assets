import React from 'react';
import {Row, Col, Well, Modal, Button, FormGroup, InputGroup, FormControl} from 'react-bootstrap';
import _ from "lodash";
import Select, { Async } from 'react-select';
import axios from 'axios';


const AUTOCOMPLETE_API = window.django.autocomplete_api


export default class Filters extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      changes: false,
      action: ''
    }
  }

  capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  handleModalClose = () => {
    this.setState({showModal: false});
    if (this.state.changes) this.props.modalCloseCB();
    this.setState({changes: false})
  }

  handleModalShow = () => {
    this.setState({showModal: true});
  }

  handleInputChange = (event) => {
    const target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    this.props.filterChange(name, value)
    this.setState({changes: true})
  }

  handleCheckboxToggle = (attr) => {
    let attrs = {...this.props.filters.checkboxes}
    if (this.props.filters.checkboxes[attr] === 0) {
      attrs[attr] = 1
    } else if (this.props.filters.checkboxes[attr] === 1) {
      attrs[attr] = -1
    } else {
      attrs[attr] = 0
    }
    this.props.filterChange('checkboxes', attrs)
    this.setState({changes: true})
  }

  handleSelectChange = (name, selected) => {
    let value = ''
    if (selected) {
      value = Array.isArray(selected) ? selected.map(v => {
        return v['value']
      }) : selected['value'];
    }
    this.props.filterChange(name, value)
    this.setState({changes: true})
  }

  handleActionChange = (event) => {
    this.setState({action: event.target.value})
  }

  handleActionPerform = () => {
    this.props.actionCB(this.state.action)
    this.setState({action: ''})
  }

  handleAsyncChange = (value) => {
    this.props.filterChange('card_name', value)
  }

  throttledAutocomplete = _.throttle((searchUrl, callback) => {
    axios.get(searchUrl)
      .then((response) => callback(null, { options: response.data }))
      .catch((error) => callback(error, null))
  }, 1000);

  handleAutocomplete = (input, callback) => {
    if (input && input.length >= 3) {
      let searchUrl = `${AUTOCOMPLETE_API}?name=${input}`
      this.throttledAutocomplete(searchUrl, callback);
    }
  };

  handleCurrentChange = (card) => {
    if (card) {
      this.props.filterChange('card_name', card.name)
      this.setState({changes: true})
    }
  }

  render() {
    let checkboxes = _.keys(this.props.filters.checkboxes).map(attr => {
      let icon = 'minus'
      let icon_color = 'white'
      if (this.props.filters.checkboxes[attr] === 1) {
        icon = 'ok'
        icon_color = 'green'
      } else if (this.props.filters.checkboxes[attr] === -1) {
        icon = 'remove'
        icon_color = 'red'
      }
      const label = this.capitalizeFirstLetter(attr).replace('_', ' ')
      return (
        <Col lg={3} xs={6}>
          <div className="form-group">
            <button onClick={() => this.handleCheckboxToggle(attr)} className="btn btn-default btn-block" disabled={this.props.disableInputs}>
              <span>{label}</span>&nbsp;&nbsp;
              <span style={{'color': icon_color}} className={`glyphicon glyphicon-${icon}`} aria-hidden="true"></span>
            </button>
          </div>
        </Col>
      )
    })
    const color_opts = [
      {label: 'White', value: 'W'},
      {label: 'Black', value: 'B'},
      {label: 'Blue', value: 'U'},
      {label: 'Green', value: 'G'},
      {label: 'Red', value: 'R'}
    ]
    const action_placeholder = this.props.decksSelected ? 'Choose action' : 'Select decks first'
    const action_opts = [
      <option value hidden >{action_placeholder}</option>,
      <option value={'archive'}>Archive</option>,
      <option value={'private'}>Mark as private</option>,
      <option value={'public'}>Mark as public</option>,
      <option value={'delete'}>Delete</option>
    ]
    let left_content = <div></div>
    if (this.props.canEdit) {
      left_content = (
        <InputGroup>
          <FormControl placeholder={action_placeholder} componentClass="select" onChange={this.handleActionChange} value={this.state.action} disabled={!this.props.decksSelected}>
            {action_opts}
          </FormControl>
          <InputGroup.Button>
            <Button onClick={this.handleActionPerform} disabled={!this.props.decksSelected}>
              Go
            </Button>
          </InputGroup.Button>
        </InputGroup>
      )
    } else{
      left_content = <p style={{'font-size': '20px'}}><span dangerouslySetInnerHTML={{__html: this.props.owner}}></span>'s decks</p>
    }
    const mobile_margin = window.django.is_mobile ? {'margin-top': '10px'} : {}
    return (
      <Row>
        <Col lg={6} xs={12}>
          <Well>
            <Row>
              <Col lg={6} md={6} xs={12}>
                {left_content}
              </Col>
              <Col lg={6} md={6} xs={12} style={mobile_margin}>
                <FormGroup>
                  <InputGroup>
                    <FormControl placeholder="Search" name="name" type="text" className="form-control" onChange={this.handleInputChange} value={this.props.filters.name} disabled={this.props.disableInputs}/>
                    <InputGroup.Button>
                      <Button bsStyle="info" onClick={this.handleModalShow}><span className="glyphicon glyphicon-filter" aria-hidden="true"></span></Button>
                      <Button bsStyle="danger" onClick={this.props.resetFilters}><span className="glyphicon glyphicon-remove" aria-hidden="true"></span></Button>
                    </InputGroup.Button>
                  </InputGroup>
                </FormGroup>
                <Modal bsSize="lg" show={this.state.showModal} onHide={this.handleModalClose}>
                  <Modal.Body>
                    <Row>
                      <Col lg={6} md={6} xs={12}>
                        <input placeholder="Description contains" name="description" value={this.props.filters.description} className="form-control" onChange={this.handleInputChange}/>
                      </Col>
                      <Col lg={6} md={6} xs={12}>
                        <Select
                            name="mtg_format"
                            placeholder="Format"
                            onChange={(v) => this.handleSelectChange('mtg_format', v)}
                            value={this.props.filters.mtg_format}
                            options={window.django.format_opts}
                          />
                      </Col>
                    </Row>
                    <Row style={{'margin-top': '20px'}}>
                      {checkboxes}
                      <Col lg={6} xs={12}>
                        <div className="form-group">
                          <Select
                            name="colors"
                            placeholder="Colors"
                            onChange={(v) => this.handleSelectChange('colors', v)}
                            value={this.props.filters.colors}
                            options={color_opts}
                            multi={true}
                          />
                        </div>
                      </Col>
                    </Row>
                    <Row style={{'margin-top': '20px'}}>
                      <Col lg={6} xs={12}>
                        <Async 
                          arrowRenderer={null}
                          autoload={false}
                          cache={false}
                          clearable={false}
                          labelKey="name"
                          loadOptions={_.debounce(this.handleAutocomplete, 2000)}
                          loadingPlaceholder="Searching..."
                          placeholder='Has Card'
                          onInputChange={this.handleAsyncChange}
                          onChange={this.handleCurrentChange}
                          onCloseResetsInput={false}
                          onSelectResetsInput={false}
                          onBlurResetsInput={false}
                          openOnFocus={true}
                          value={this.props.filters.card_name}
                          valueKey="name"/>
                      </Col>
                    </Row>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onClick={this.handleModalClose}>
                      Confirm
                    </Button>
                  </Modal.Footer>
                </Modal>
              </Col>
            </Row>
          </Well>
        </Col>
      </Row>
    )
  }
}