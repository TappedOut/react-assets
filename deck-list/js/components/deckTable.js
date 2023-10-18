import React from 'react';
import {Row, Table} from 'react-bootstrap'


export default class DeckTable extends React.Component {
  render() {
    const rows = this.props.decks.map(deck =>
      <tr>
        {this.props.is_owner && <td></td>}
        <td><img style={{'width': '50px'}} alt="Pie chart" src={deck.chart} /></td>
        <td><a href={deck.url}>{deck.name}</a></td>
        <td>{deck.format}</td>
        <td>{deck.score}</td>
        <td>{deck.comments}</td>
        <td>{deck.views}</td>
        <td>{deck.folder_count}</td>
        <td>{deck.last_update} ago</td>
      </tr>
    )
    return (
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            {this.props.is_owner && <th></th>}
            <th>Pie</th>
            <th>Name</th>
            <th>Format</th>
            <th>Upvotes</th>
            <th>Comments</th>
            <th>Views</th>
            <th>Folders</th>
            <th>Last update</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </Table>
    )
  }
}
