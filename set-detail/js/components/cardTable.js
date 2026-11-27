import React from 'react';
import {Table, Button, Glyphicon} from 'react-bootstrap';
import CardSpan from './cardSpan.js'
import MatchFeedback from './matchFeedback.js'


export default class CardTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      gaveFeedback: {}
    }
  }

  render() {
    // choices can still be loading (AI tab opened from a #llm link): read them without throwing.
    const choices = this.props.choices || {};
    const vendor_url = choices.vendor_url || {};
    const vendor_param = choices.vendor_param || {};
    const rows = this.props.specs.map(spec => {
      let price_url = spec[vendor_url['CK']];
      price_url = price_url ? `${price_url}${vendor_param['CK'] || ''}` : ''
      const rank = spec.rank_display !== '--' ? `#${spec.rank_display}` : spec.rank_display;
      return (<tr key={spec.pk}>
        <td>
          <CardSpan spec={spec} backside={this.props.backsides[spec['flip']]} tla={this.props.default_tla} />
        </td>
        <td>{spec.type}</td>
        <td dangerouslySetInnerHTML={{__html: spec.html_mana}}></td>
        <td>{spec.ck_price ? <a href={price_url} target="_blank">$ {spec.ck_price}</a> : <span style={{color: '#888'}}>&mdash;</span>}</td>
        {this.props.rank_label && <td>{rank}</td>}
        {this.props.feedbackCB && <td style={{whiteSpace: 'nowrap'}}>
          <MatchFeedback compact pk={spec.pk} vote={(this.props.votes || {})[spec.pk]}
                         onVote={this.props.feedbackCB} disabled={!this.props.feedback_enabled} />
        </td>}
      </tr>)
    })

    return (
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Mana Cost</th>
            <th>Price</th>
            {this.props.rank_label && <th>{this.props.rank_label}</th>}
            {this.props.feedbackCB && <th>Matches your search?</th>}
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </Table>
    )
  }
}