import React from 'react';
import {Table, Popover, OverlayTrigger} from 'react-bootstrap';


export default class CardTable extends React.Component {
  renderBackside = (spec) => {
    const popoverHoverFocus = (
        <Popover id="popover-trigger-hover-focus" title="">
          <img className="img-responsive" style={{'width': '400px'}} src={spec.image_large} />
        </Popover>
      );
    return (
      <OverlayTrigger
            trigger={['hover', 'focus']}
            placement="right"
            overlay={popoverHoverFocus}
          >
          <span>
            &nbsp;<a href={spec.url} ><sup>Flip</sup></a>
          </span>
      </OverlayTrigger>
    )
  }

  render() {
    const choices = this.props.choices;
    const rows = this.props.specs.map(spec => {
      const hasBackside = spec.flip && spec.is_front && this.props.backsides[spec.flip];
      let price_url = spec[choices.vendor_url['CK']];
      price_url = price_url ? `${price_url}${choices.vendor_param['CK']}` : ''
      const popoverHoverFocus = (
        <Popover id="popover-trigger-hover-focus" title="">
          <img className="img-responsive" style={{'width': '400px'}} src={spec.image_large}/>
        </Popover>
      );
      const rank = spec.rank_display !== '--' ? `#${spec.rank_display}` : spec.rank_display;
      return (<tr>
        <td>
          <OverlayTrigger
            trigger={['hover', 'focus']}
            placement="right"
            overlay={popoverHoverFocus}
          >
            <a href={spec.url}>{spec.name}</a>
          </OverlayTrigger>
          {hasBackside && this.renderBackside(this.props.backsides[spec.flip])}
        </td>
        <td>{spec.type}</td>
        <td dangerouslySetInnerHTML={{__html: spec.html_mana}}></td>
        <td><a href={price_url} target="_blank">$ {spec.ck_price}</a></td>
        <td>{rank}</td>
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
            <th>{this.props.rank_label}</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </Table>
    )
  }
}