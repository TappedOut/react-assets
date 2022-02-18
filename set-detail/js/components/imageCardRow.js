import React from 'react';


export default class ImageCardRow extends React.Component {
  render() {
    const images = this.props.specs.map(spec =>
      <div className="col-lg-3 col-xs-12">
        <a href={spec.url}><img className="img-responsive" src={spec.image_large} /></a>
        <table className="table" style={{"font-size": "10px", "margin-bottom": "0"}}>
          <tr>
            <td style={{"line-height": "0.3", "text-align": "center", "width":"60%"}}>{spec.name}</td>
            <td style={{"line-height": "0.3", "text-align": "center", "width":"40%"}}>{spec.name}</td>
          </tr>
        </table>
      </div>
    )
    return (
      <div style={{"margin-bottom": "10px"}} className="row">
        {images}
      </div>
    )
  }
}
