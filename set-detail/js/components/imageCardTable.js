import React from 'react';
import {Table, Popover, OverlayTrigger} from 'react-bootstrap';


export default class ImageCardTable extends React.Component {
  render() {
    const choices = this.props.choices;
    const rows = this.props.specs.map(spec => {
      let price_url = spec[choices.vendor_url['CK']];
      price_url = price_url ? `${price_url}${choices.vendor_param['CK']}` : ''
      const popoverHoverFocus = (
        <Popover id="popover-trigger-hover-focus" title="">
          <img className="img-responsive" style={{'width': '400px'}} src={spec.image_large} />
        </Popover>
      );
      return (<tr>
        <td>
          <OverlayTrigger
            trigger={['hover', 'focus']}
            placement="right"
            overlay={popoverHoverFocus}
          >
            <a href={spec.url}>{spec.name}</a>
          </OverlayTrigger>
        </td>
        <td>{spec.type}</td>
        <td dangerouslySetInnerHTML={{__html: spec.html_mana}}></td>
        <td><a href={price_url} target="_blank">$ {spec.ck_price}</a></td>
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
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </Table>
    )
  }
}