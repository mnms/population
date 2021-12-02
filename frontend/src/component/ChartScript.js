import React from 'react';
import { useEffect, useRef } from 'react';
import "mapd-charting/dist/mapdc.css";
import circle from '@turf/circle';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import {setChartOnDraw} from '../service/CustomFunc.js'

const useStyles = makeStyles({
    root: {
        minWidth: 275,
    },
    title: {
        fontSize: 14,
    },
    pos: {
        marginBottom: 12,
    },
    height: {
        height: '100%',
    },
});

const ChartScript = () => {

    const chart1ContainerRef = useRef(null);
    const chart2ContainerRef = useRef(null);

    // initialize map when component mounts
    useEffect(() => {

        let circleRadius = 0.5;
        if(window.beforeMap.getZoom() > 15) {
            circleRadius = 0.1;
        } else if(window.beforeMap.getZoom() > 14) {
            circleRadius = 0.3;
        } else if(window.beforeMap.getZoom() > 13) {
            circleRadius = 0.5;
        } else if(window.beforeMap.getZoom() > 12) {
            circleRadius = 1.5;
        } else if(window.beforeMap.getZoom() > 11) {
            circleRadius = 2;
        } else if(window.beforeMap.getZoom() > 10) {
            circleRadius = 3;
        } else if(window.beforeMap.getZoom() > 9) {
            circleRadius = 5;
        } else {
            circleRadius = 10;
        }

        let initCircle = circle([window.beforeMap.getCenter().lng, window.beforeMap.getCenter().lat], circleRadius, {steps: 64, units: 'kilometers', properties: {center: [window.beforeMap.getCenter().lng, window.beforeMap.getCenter().lat], isCircle: true, radiusInKm: circleRadius}});

        const featureCollection = {
            type: "FeatureCollection",
            features: [initCircle]
        }

        window.draw.draw.set(featureCollection);

        // Generate the chart
        setChartOnDraw(chart1ContainerRef.current, chart2ContainerRef.current, featureCollection, "YYYYMMDDhhmm", window.beforeExist);

    }, []); 

    const classes = useStyles();

    return  <div className="mainChart">
                <div className="chartInfo-container">
                    <Card className={classes.height} variant="outlined">
                        <CardContent >
                            <Typography className="curr-sum" variant="h6" component="h2">
                                영역 내 유동인구 수 : 0명
                            </Typography>
                            <Typography className="prev-sum" color="textSecondary" gutterBottom>
                                최근 1시간 평균 유동인구 수: 0명
                            </Typography>
                            <Typography className={classes.pos}>
                            </Typography>

                            <Typography className="increase-pop" variant="h6" component="h2">
                                증감 인구 수: 0명
                            </Typography>
                            <Typography className="increase-percent" color="textSecondary" gutterBottom>
                                최근 1시간 평균 유동인구 대비: NA
                            </Typography>
                        </CardContent>
                    </Card>
                </div>
                <div className="chart1-container">
                    <div className="chart1" ref={chart1ContainerRef}></div>
                </div>
                <div className="chart2-container">
                    <div className="chart2" ref={chart2ContainerRef}></div>
                </div>
            </div>;
};
  
export default ChartScript;