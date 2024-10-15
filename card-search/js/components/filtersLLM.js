import React from 'react';
import {FormControl, HelpBlock} from 'react-bootstrap';
import _ from "lodash";
import Select from 'react-select';


export default class FiltersLLM extends React.Component {
  handleInputChange = (event) => {
    const target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    this.props.filterChange(name, value)
  }

  handleSelectChange = (name, selected) => {
    let value = ''
    if (selected) {
      value = Array.isArray(selected) ? selected.map(v => {
        return v['value']
      }) : selected['value'];
    }
    this.props.filterChange(name, value)
  }

  handleColorToggle = (color) => {
    let colors = {...this.props.filters.colors}
    if (this.props.filters.colors[color] === 0) {
      colors[color] = 1
    } else if (this.props.filters.colors[color] === 1) {
      colors[color] = -1
    } else {
      colors[color] = 0
    }
    this.props.filterChange('colors', colors)
  }

  render() {
    let colorCheckboxes = _.keys(this.props.filters.colors).map(color => {
      let icon = 'minus'
      let icon_color = 'white'
      if (this.props.filters.colors[color] === 1) {
        icon = 'ok'
        icon_color = 'green'
      } else if (this.props.filters.colors[color] === -1) {
        icon = 'remove'
        icon_color = 'red'
      }
      return (
        <div className="col-lg-4 col-xs-4">
          <div className="form-group">
            <button onClick={() => this.handleColorToggle(color)} className="btn btn-sm btn-default btn-block" disabled={this.props.disableInputs}>
              <i className={`ms ms-${color} ms-cost ms-shadow ms-1point2x`}></i>&nbsp;&nbsp;
              <span style={{'color': icon_color}} className={`glyphicon glyphicon-${icon}`} aria-hidden="true"></span>
            </button>
          </div>
        </div>
      )
    })
    return (
        <div className="well">
            <div className="row" style={{marginBottom: '10px'}}>
                <div className="col-lg-6 col-md-6 col-xs-12">
                  <FormControl 
                    placeholder="General Details Data" 
                    name="hard_query" 
                    type="text" 
                    componentClass="textarea"
                    className="form-control" 
                    onChange={this.handleInputChange} 
                    disabled={this.props.disableInputs}
                    style={{height: '50px'}}
                  />
                  <HelpBlock>General card data, like costs, color, etc. For example "Costs 3 and is blue"</HelpBlock>
                </div>
                <div className="col-lg-6 col-md-6 col-xs-12">
                    <FormControl 
                      placeholder="Text Semantics Data" 
                      name="semantic_query" 
                      type="text" 
                      componentClass="textarea"
                      className="form-control" 
                      onChange={this.handleInputChange} 
                      disabled={this.props.disableInputs}
                      style={{height: '50px'}}
                    />
                    <HelpBlock>Rules text data. For example "Has flying and creates tokens"</HelpBlock>
                </div>
            </div>
            <div className='row'>
                <div className='col-lg-6 col-md-6 col-xs-12'>
                    <Select
                        name="mtg_format"
                        placeholder="Format"
                        onChange={(v) => this.handleSelectChange('mtg_format', v)}
                        value={this.props.filters.mtg_format}
                        options={this.props.choices.format_opts}
                    />
                </div>
                <div className='col-lg-6 col-md-6 col-xs-12'>
                    <button onClick={this.props.performSearch} className='btn btn-success pull-right'>Search</button>
                </div>
            </div>
        </div>
    )
  }
}