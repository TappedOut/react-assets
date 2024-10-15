import React from 'react';
import {Table, Button, Glyphicon} from 'react-bootstrap';
import CardSpan from './cardSpan.js'


export default class CardTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      gaveFeedback: {}
    }
  }

  render() {
    const choices = this.props.choices;
    const rows = this.props.specs.map(spec => {
      let price_url = spec[choices.vendor_url['CK']];
      price_url = price_url ? `${price_url}${choices.vendor_param['CK']}` : ''
      const rank = spec.rank_display !== '--' ? `#${spec.rank_display}` : spec.rank_display;
      return (<tr key={spec.pk}>
        {this.props.feedbackCB && <td>
          <Button 
            bsSize="small" 
            bsStyle="success" 
            block
            onClick={() => {
              this.props.feedbackCB(spec.pk, 'correct');
              this.setState({gaveFeedback: {...this.state.gaveFeedback, [spec.pk]: true}})
            }}
            disabled={!this.props.feedback_enabled || this.state.gaveFeedback[spec.pk]} 
          >
            <Glyphicon glyph="thumbs-up" />
          </Button>
          <Button 
            bsSize="small" 
            bsStyle="danger" 
            block
            onClick={() => {
              this.props.feedbackCB(spec.pk, 'incorrect');
              this.setState({gaveFeedback: {...this.state.gaveFeedback, [spec.pk]: true}})
            }}
            disabled={!this.props.feedback_enabled || this.state.gaveFeedback[spec.pk]} 
          >
            <Glyphicon glyph="thumbs-down" />
          </Button>
        </td>}
        <td>
          <CardSpan spec={spec} backside={this.props.backsides[spec['flip']]} tla={this.props.default_tla} />
        </td>
        <td>{spec.type}</td>
        <td dangerouslySetInnerHTML={{__html: spec.html_mana}}></td>
        <td><a href={price_url} target="_blank">$ {spec.ck_price}</a></td>
        {this.props.rank_label && <td>{rank}</td>}
      </tr>)
    })

    return (
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            {this.props.feedbackCB && <th style={{width: '5%'}}></th>}
            <th>Name</th>
            <th>Type</th>
            <th>Mana Cost</th>
            <th>Price</th>
            {this.props.rank_label && <th>{this.props.rank_label}</th>}
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </Table>
    )
  }
}