import React from 'react';
import {Table} from 'react-bootstrap';
import CardSpan from './cardSpan.js'


export default class CardTable extends React.Component {
  render() {
    const choices = this.props.choices;
    const rows = this.props.specs.map(spec => {
      let price_url = spec[choices.vendor_url['CK']];
      price_url = price_url ? `${price_url}${choices.vendor_param['CK']}` : ''
      const rank = spec.rank_display !== '--' ? `#${spec.rank_display}` : spec.rank_display;
      return (<tr key={spec.pk}>
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