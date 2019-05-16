import React from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

const TypeChartWrapper = (props) => {
    let options = window.buildTypeChart(
      props.typeSeries, true
    );
    options.chart.height = 250;

    return(
            <HighchartsReact
                highcharts={Highcharts}
                options={options}
                oneToOne={true}
            />
    );
};

export default TypeChartWrapper;
