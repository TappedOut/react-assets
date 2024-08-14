import React from 'react';


export default class CardSpan extends React.Component {
  render() {
    let spec = this.props.spec
    let image = spec.image
    let alteration = ''
    const found_print = spec.printings.find((p) => p.tla === this.props.tla)
    if (found_print && found_print.alterations && found_print.alterations.length) {
        alteration = found_print.alterations[0][0]
    }
    if (spec.tla !== this.props.tla) {
      if (found_print && found_print.image) {
        image = found_print.image
      }
    }
    const isFoil = alteration === 'f'
    if (isFoil) alteration = ''
    let linkClass = 'card-link'
    if (isFoil) linkClass += ' foil-card'
    if (image) linkClass += ' card-hover'
    return (
      <>
        <span className="card">
            <a 
                rel="popover" 
                className={linkClass} 
                href={spec.url}
                data-show-price="true"
                data-name={spec.name}
                data-image={image}
                data-url={spec.url}
                data-card-language={spec.language}
                data-ch-url={spec.cardhoarder_url}
                data-tcg-url={spec.tcg_url ? `${spec.tcg_url}?partner=TPPDOUT&utm_campaign=affiliate&utm_medium=hover&utm_source=TPPDOUT` : undefined}
                data-ck-url={isFoil ? spec.ck_foil_url : spec.ck_url}
                data-tcg-price={spec.tcg_avg_price}
                data-tcg-foil-price={spec.tcg_foil_price}
                data-tcgmk-price={spec.tcg_market_price}
                data-tcghi-price={spec.tcg_high_price}
                data-tcglo-price={spec.tcg_low_price}
                data-tcg-lowest-price={spec.lowest_tcg_avg}
                data-tcghi-lowest-price={spec.lowest_tcg_high}
                data-tcglo-lowest-price={spec.lowest_tcg_low}
                data-tcgmk-lowest-price={spec.lowest_tcg_market}
                data-ch-price={spec.cardhoarder_price_tix}
                data-ch-foil-price={spec.cardhoarder_foil_price_tix}
                data-ck-price={spec.ck_price}
                data-ck-lowest-price={spec.lowest_ck}
                data-ck-foil-price={spec.ck_foil_price}
                data-cc-price={spec.chaos_price}
                data-cc-foil-price={spec.chaos_foil_price}
                data-foil={isFoil ? "true" : "false"}
                data-alteration={alteration ? `${window.django.STATIC_URL}img/alterations/${alteration}.png` : undefined}
                data-tla={spec.tla}
                data-alteration-val={alteration ? alteration : undefined}
            >{ spec.name }
            </a>
        {isFoil && <img alt="foil" className="card-icon" src={`${window.django.STATIC_URL}img/foil-icon.jpg`} />}
        {alteration &&<strong>&nbsp;*{alteration}*</strong>}
        </span>
        {this.props.backside &&
          <span className="card">
              &nbsp;
              <a 
                className="card-hover" 
                href={this.props.backside.url} 
                data-image={this.props.backside.image} 
                data-name={this.props.backside.name}
                data-foil={isFoil}
              >
                <sup>Flip</sup>
            </a>
          </span>
        }
      </>
    )
  }
}