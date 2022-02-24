import React from 'react';


const iconMap = {
  'infinite': 'infinity',
  'pw': 'wp',
  'pb': 'bp',
  'pr': 'rp',
  'pu': 'up',
  'pg': 'gp',
  't': 'tap',
  'ut': 'untap',
  'snow': 's'
}


export default class ImageCardList extends React.Component {
  fixManaSymbols = (rules) => {
    const regex = /\[\[(.*?)]]/g
    let matches = [];
    let match = regex.exec(rules);
    while (match != null) {
      matches.push(match[1]);
      match = regex.exec(rules);
    }
    _.forEach(matches, (m) => {
      let icon = m.replace('symbol:', '').toLowerCase();
      icon = iconMap[icon] ? iconMap[icon] : icon;
      icon = `<i class="ms ms-${icon} ms-cost ms-shadow ms-1point2x"></i>`;
      rules = rules.replace(`[[${m}]]`, icon);
    })
    return rules
  }
  render() {
    const choices = this.props.choices;
    const rows = this.props.specs.map(spec => {
      let mtgtype = spec.type
      if (spec.subtype) {
        mtgtype += ` - ${spec.subtype}`
      }
      let ck_price_url = spec[choices.vendor_url['CK']];
      ck_price_url = ck_price_url ? `${ck_price_url}${choices.vendor_param['CK']}` : '';
      let tcg_price_url = spec[choices.vendor_url['TCGMK']];
      tcg_price_url = tcg_price_url ? `${tcg_price_url}${choices.vendor_param['TCGMK']}` : ''
      return (
        <div className="row">
          <div className="col-xs-12">
            <div className="row" style={{'margin-bottom': "10px"}}>
              <div className="col-xs-6">
                <span><a href={spec.url}>{spec.name}</a></span>
              </div>
              <div className="col-xs-6">
                <span dangerouslySetInnerHTML={{__html: spec.html_mana}} className="pull-right"></span>
              </div>
            </div>
            <div className="row" style={{'margin-bottom': "10px"}}>
              <div className="col-xs-12">
                {mtgtype}
              </div>
            </div>
            <div className="row" style={{'margin-bottom': "10px"}}>
              <div dangerouslySetInnerHTML={{__html: this.fixManaSymbols(spec.rules)}} className="col-xs-12"></div>
            </div>
            {!!spec.power_toughness &&
            <div className="row" style={{'margin-bottom': "10px"}}>
              <div className="col-xs-12">
                <span className="pull-right">{spec.power_toughness}</span>
              </div>
            </div>
            }
            <div className="row">
              {!!spec.tcg_market_price &&
                <div className="col-xs-6">
                  <a href={tcg_price_url} target="_blank">TCG Market Price: ${spec.tcg_market_price}</a>
                </div>
              }
              {!!spec.ck_price &&
                <div className="col-xs-6">
                  <a href={ck_price_url} target="_blank">CK Price: ${spec.ck_price}</a>
                </div>
              }
            </div>
            <div className="row">
              <div className="col-xs-12">
                <hr />
              </div>
            </div>
          </div>
        </div>
      )
    })
    return (
      <div>{rows}</div>
    )
  }
}