import React from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

const ColorChartWrapper = (props) => {
    let options = window.buildColorChart(
      props.colorSeries, props.landSeries, true
    );

    return(
            <HighchartsReact
                highcharts={Highcharts}
                options={options}
                oneToOne={true}
            />
    );
};

export default ColorChartWrapper;
