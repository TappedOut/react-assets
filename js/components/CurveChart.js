import React from 'react'
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'

const CurveChartWrapper = (props) => {
    let options = window.buildCurveChart(
      props.curveSeries, true
    );

    options.chart.height = 325;

    return(
            <HighchartsReact
                highcharts={Highcharts}
                options={options}
                oneToOne={true}
            />
    );
};

export default CurveChartWrapper;
