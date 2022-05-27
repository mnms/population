import React from 'react';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import LinearProgress from '@mui/material/LinearProgress';
import mapboxgl from '../js/mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Compare from 'mapbox-gl-compare';
import 'mapbox-gl-compare/dist/mapbox-gl-compare.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import Turf from "turf";
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import {CircleMode, DirectMode, DragCircleMode, SimpleSelectMode,} from "mapbox-gl-draw-circle";
import { useEffect, useRef } from 'react';
import {GlobalMercator} from '../js/global-mercator.js'

import {setChartOnDraw, getCurrentDate, calculateSumAndMax, calculateSumAndMax2, getCalculateMax} from '../service/CustomFunc.js'

import { updatePrevHour, updateDateString } from "../redux/actions"

import moment from '../js/moment.js';

const MapdCon = require("@mapd/connector/dist/browser-connector");
const wellknown = require("wellknown");
const config = require ("../server.json");
// const Compare = require('../js/mapbox-gl-compare');

// const weightValue = 1000;
// const currentDate = '202103151000';
const ports = [80];
const bbox = [126.76487604016523,37.42806780710028,127.18416090045505,37.70130441174812]; // seoul
const eventTimeFormat = "YYYYMMDDHHmm";

mapboxgl.maxParallelImageRequests = 32;
window.mapboxgl = mapboxgl;

const MapScript = () => {

    // const radius = (function () {
    //     const mercator = new GlobalMercator();
    //     const BIN_SIZE = 500.0;
    //     const longitude = 126.96099658228684;
    //     const latitude = 37.54371621174512;
    //     const meters1 = mercator.LatLonToMeters(latitude, longitude);
    //     const radius = [
    //         'interpolate',
    //         ['linear'],
    //         ['zoom']
    //     ]
    //     for (let zoom = 0; zoom <= 22; zoom++) {
    //         const pixels = mercator.MetersToPixels_Double(meters1[0], meters1[1], zoom);
    //         const raster1 = mercator.PixelsToRaster_Double(pixels[0], pixels[1], zoom);
    //         const raster2 = [raster1[0] + 1, raster1[1]];
    //         const meters2 = (function () {
    //             const pixels = mercator.RasterToPixels_Double(raster2[0], raster2[1], zoom);
    //             return mercator.PixelsToMeters(pixels[0], pixels[1], zoom);
    //         })();
    //         const calc = Math.max(1, Math.round(BIN_SIZE / Math.abs(meters1[0] - meters2[0])));
    //         radius.push(zoom);
    //         radius.push(calc);
    //         // console.log(zoom, Math.abs(meters1[0] - meters2[0]), calc);
    //     }
    //     return radius;
    // })();
    const currentDate = window.store.getState().dateString.curr;
    const prevDate = window.store.getState().dateString.prev;
    const prevHour = window.store.getState().prevHour;
    
    const [genderValue, setGenderValue] = React.useState('t');
    const [ageValue, setAgeValue] = React.useState('t');
    const [timeValue, setTimeValue] = React.useState(prevHour);

    const genderHandleChange = (e) => {
        setGenderValue(e.target.value);
        updateMap(e.target.value, ageValue);
    };
    const ageHandleChange = (e) => {
        setAgeValue(e.target.value);
        updateMap(genderValue, e.target.value);
    };
    const timeHandleChange = (e) => {
        setTimeValue(e.target.value);
        window.store.dispatch(updatePrevHour(e.target.value));
        const weight = window.afterMap.getLayer('vector-tile2').getPaintProperty('heatmap-weight');
        const max = window.afterMap.getLayer('vector-tile2').getPaintProperty('statistics-max');

        if( e.target.value == '01:00:00') {
            window.afterMap.removeLayer('vector-tile2');
            window.afterMap.removeSource('vector-tile2');
            updateAfterMap(max, weight, window.store.getState().dateString, 0.5);
        } else if( e.target.value == '02:00:00') {
            window.afterMap.removeLayer('vector-tile2');
            window.afterMap.removeSource('vector-tile2');
            updateAfterMap(max, weight, window.store.getState().dateString, 0.5);
        } else {
            window.afterMap.removeLayer('vector-tile2');
            window.afterMap.removeSource('vector-tile2');
            updateAfterMap(max, weight, window.store.getState().dateString, 0.5);
        }

    };    

    function updateAfterMap(max, weight, getDate, opacity) {
        var curr_dt = getDate.curr.substring(0, 8);
        var curr_hh = getDate.curr.substring(8, 10);
        var curr_mm = getDate.curr.substring(10, 12)
        var prev_dt = getDate.prev.substring(0, 8);
        var prev_hh = getDate.prev.substring(8, 10);
        var prev_mm = getDate.prev.substring(10, 12)

        window.afterMove = true;
        document.querySelector('.mapLoading').style.display = 'block';
        
        if(window.selectQuery === undefined) {
            window.selectQuery = '(exist_m_00 + exist_m_10 + exist_m_20 + exist_m_30 + exist_m_40 + exist_m_50 + exist_m_60 + exist_m_70 + exist_m_80 + exist_m_90 + exist_f_00 + exist_f_10 + exist_f_20 + exist_f_30 + exist_f_40 + exist_f_50 + exist_f_60 + exist_f_70 + exist_f_80 + exist_f_90) as exist';
        }

        window.afterMap.addSource('vector-tile2', {
            type: 'vector',
            tilesFunction: `function (tile) {
                    var host = tile.tilesFunctionParams.host;
                    var port = tile.tilesFunctionParams.port;

                    var sql1 = "SELECT ${window.selectQuery}, geometry FROM ltdb_fp WHERE dt = '${curr_dt}' and hh = '${curr_hh}' and mm = '${curr_mm}'";
                    var sql2 = "SELECT ${window.selectQuery}, geometry FROM ltdb_fp WHERE dt = '${prev_dt}' and hh = '${prev_hh}' and mm = '${prev_mm}'";
                    var typeName = "ltdb_fp";
                    var aggrType = "sum";
                    var multiple = false;
                    var bbox = ${JSON.stringify(bbox)};
                    return renderSqlDiffPost(host, port, tile, sql1, sql2, typeName, aggrType, multiple, null);
                }`,
            minzoom: 0,
            maxzoom: 16.1
        });
        
        window.afterMap.addLayer(
            {
            'id': 'vector-tile2',
            'type': 'heatmap',
            'source': 'vector-tile2',
            'source-layer': 'ltdb_fp',
            'maxzoom': 16.1,
            'minzoom': 0,
            'paint': {
            // Increase the heatmap weight based on frequency and property magnitude
            'heatmap-weight': weight,
            // Increase the heatmap color weight weight by zoom level
            // heatmap-intensity is a multiplier on top of heatmap-weight
            // 'heatmap-intensity': [
            // 'interpolate',
            // ['linear'],
            // ['zoom'],
            // 0, 1,
            // 22, 3
            // ],
            // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
            // Begin color ramp at 0-stop with a 0-transparancy color
            // to create a blur-like effect.
            "heatmap-color": [
                'step', ['heatmap-density'], 'rgba(255,255,255,0)',
                0.05,
                'rgb(255, 255, 229)',
                0.1,
                'rgb(248, 252, 193)',
                0.2,
                'rgb(229, 244, 171)',
                0.3,
                'rgb(199, 232, 154)',
                0.4,
                'rgb(162, 216, 137)',
                0.5,
                'rgb(120, 198, 121)',
                0.6,
                'rgb(75, 176, 98)',
                0.8,
                'rgb(47, 147, 77)',
                0.9,
                'rgb(20, 120, 62)',                
                1,
                'rgb(0, 96, 52)'
            ],
            // Adjust the heatmap radius by zoom level
            //'heatmap-radius': radius,
            'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 1,
                1, 2,
                2, 2,
                3, 2,
                4, 3,
                5, 3,
                6, 3,
                7, 10,
                8, 10,
                9, 10,
                10, 11,
                11, 15,
                12, 20,
                13, 20,
                14, 50,
                15, 70,
                16, 70,
                17, 80,
                18, 80,
                19, 80,
                20, 80,
                21, 90,
                22, 100
            ],             
            // Transition from heatmap to circle layer by zoom level
            'heatmap-opacity': opacity,
            'statistics-max' : max
            }
            }
        );          
    }

    function updateMap(gender, age) {
        document.querySelector('.mapLoading').style.display = 'block';

        if(window.beforeMap != null) {
            window.beforeMap.removeLayer('vector-tile');
            window.beforeMap.removeSource('vector-tile');  

            window.beforeMove = true;

            const heatmapWeight = [
                'interpolate',
                ['linear'],
                ['get', 'exist'], 
                0, 0,
                5000000, 0.5,
                10000000, 1
            ];

            const statisticsMax = [
                'max',
                ['get', 'exist'], 
            ];  

            if(gender === 't' && age === 't' ) {
                // getCalculateMax(window.beforeMap, 'vector-tile', window.beforeExist)
                window.beforeExist = ["exist_m_10", "exist_m_20", "exist_m_30", "exist_m_40", "exist_m_50", "exist_m_60",
                "exist_f_10", "exist_f_20", "exist_f_30", "exist_f_40", "exist_f_50", "exist_f_60"];
                
                window.selectQuery = '(exist_m_00 + exist_m_10 + exist_m_20 + exist_m_30 + exist_m_40 + exist_m_50 + exist_m_60 + exist_m_70 + exist_m_80 + exist_m_90 + exist_f_00 + exist_f_10 + exist_f_20 + exist_f_30 + exist_f_40 + exist_f_50 + exist_f_60 + exist_f_70 + exist_f_80 + exist_f_90) as exist';                  

            } else if(gender !== 't' && age === 't' ) {
                window.beforeExist = ["exist_"+gender+"_10", "exist_"+gender+"_20", "exist_"+gender+"_30", "exist_"+gender+"_40", "exist_"+gender+"_50", "exist_"+gender+"_60"];
                
                window.selectQuery = '(exist_' + gender + '_00 + exist_' + gender + '_10 + exist_' + gender + '_20 + exist_' + gender + '_30 + exist_' + gender + '_40 + exist_' + gender + '_50 + exist_' + gender + '_60 + exist_' + gender + '_70 + exist_' + gender + '_80 + exist_' + gender + '_90) as exist';   

            } else if(gender === 't' && age !== 't' ) {
                
                window.beforeExist = ['exist_m_'+age, 'exist_f_'+age];

                if(age === "10") {
                    window.selectQuery = '(exist_m_00 + exist_m_10 + exist_f_00 + exist_f_10) as exist';
                } else if(age === "60") {
                    window.selectQuery = '(exist_m_60 + exist_m_70 + exist_m_80 + exist_m_90 + exist_f_60 + exist_f_70 + exist_f_80 + exist_f_90) as exist';
                } else {
                    window.selectQuery = '(exist_m_'+ age + ' + ' + 'exist_f_' + age + ') as exist';
                }   

            } else {

                window.beforeExist = ["exist_" + gender  + "_" + age];

                if(age === "10") {
                    window.selectQuery = '(exist_'+gender+'_00 + exist_'+gender+'_10) as exist';
                } else if(age === "60") {
                    window.selectQuery = '(exist_'+gender+'_60 + exist_'+gender+'_70 + exist_'+gender+'_80 + exist_'+gender+'_90) as exist';
                } else {
                    window.selectQuery = 'exist_'+gender+'_'+ age + ' as exist';
                }
                
            }

            var currDate = window.store.getState().dateString.curr;
            var dt = currDate.substring(0, 8);
            var hh = currDate.substring(8, 10);
            var mm = currDate.substring(10, 12);
            window.beforeMap.addSource('vector-tile', {
                type: 'vector',
                tilesFunction: `function (tile) {
                        var host = tile.tilesFunctionParams.host;
                        var port = tile.tilesFunctionParams.port;

                        var sql = "SELECT ${window.selectQuery}, geometry FROM ltdb_fp WHERE dt = '${dt}' and hh = '${hh}' and mm = '${mm}'";
                        var typeName = "ltdb_fp";
                        var aggrType = "sum";
                        var multiple = false;
                        var bbox = ${JSON.stringify(bbox)};
                        return renderSqlPost(host, port, tile, sql, typeName, aggrType, multiple, null);
                    }`,
                minzoom: 0,
                maxzoom: 16.1
            });

            window.beforeMap.addLayer(
                {
                    'id': 'vector-tile',
                    'type': 'heatmap',
                    'source': 'vector-tile',
                    'source-layer': 'ltdb_fp',
                    'maxzoom': 16.1,
                    'minzoom': 0,
                    'paint': {
                        // Increase the heatmap weight based on frequency and property magnitude
                        'heatmap-weight': heatmapWeight,
                        "heatmap-color": [
                            'step', ['heatmap-density'], 'rgba(255,255,255,0)',
                            0.05,
                            'rgb(255, 255, 204)',
                            0.1,
                            'rgb(255, 240, 168)',
                            0.2,
                            'rgb(254, 225, 134)',
                            0.3,
                            'rgb(254, 201, 101)',
                            0.4,
                            'rgb(253, 170, 72)',
                            0.5,
                            'rgb(253, 141, 60)',
                            0.6,
                            'rgb(252, 90, 45)',
                            0.8,
                            'rgb(237, 46, 33)',
                            0.9,
                            'rgb(211, 15, 32)',                
                            1,
                            'rgb(176, 0, 38)'
                        ],
                        // Adjust the heatmap radius by zoom level
                        //'heatmap-radius': radius,
                        'heatmap-radius': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            0, 1,
                            1, 2,
                            2, 2,
                            3, 2,
                            4, 3,
                            5, 3,
                            6, 3,
                            7, 10,
                            8, 10,
                            9, 10,
                            10, 10,
                            11, 10,
                            12, 20,
                            13, 20,
                            14, 40,
                            15, 80,
                            16, 90,
                            17, 40,
                            18, 50,
                            19, 60,
                            20, 70,
                            21, 80,
                            22, 100
                            ],                
                        // Transition from heatmap to circle layer by zoom level
                        'heatmap-opacity': 0.5,
                        'statistics-max': statisticsMax
                    }                  
                }
            );             
        }
 
        if(window.afterMap != null) {

            window.afterMap.removeLayer('vector-tile2');
            window.afterMap.removeSource('vector-tile2');

            window.afterMove = true;    

            const heatmapWeight = [
                'interpolate',
                ['linear'],
                ['get', 'sum(exist)'],
                0, 0,
                5000000, 0.5,
                10000000, 1
            ];

            const statisticsMax = [
                'max',
                ['get', 'sum(exist)'],
            ]; 

            if(gender === 't' && age === 't' ) {
                window.afterExist = ["sum(exist_m_10)", "sum(exist_m_20)", "sum(exist_m_30)", "sum(exist_m_40)", "sum(exist_m_50)", "sum(exist_m_60)",
                "sum(exist_f_10)", "sum(exist_f_20)", "sum(exist_f_30)", "sum(exist_f_40)", "sum(exist_f_50)", "sum(exist_f_60)"];
                                
                window.selectQuery = '(exist_m_00 + exist_m_10 + exist_m_20 + exist_m_30 + exist_m_40 + exist_m_50 + exist_m_60 + exist_m_70 + exist_m_80 + exist_m_90 + exist_f_00 + exist_f_10 + exist_f_20 + exist_f_30 + exist_f_40 + exist_f_50 + exist_f_60 + exist_f_70 + exist_f_80 + exist_f_90) as exist'; 
              

            } else if(gender !== 't' && age === 't' ) {
                window.afterExist = ["sum(exist_"+gender+"_10)", "sum(exist_"+gender+"_20)", "sum(exist_"+gender+"_30)", "sum(exist_"+gender+"_40)", "sum(exist_"+gender+"_50)", "sum(exist_"+gender+"_60)"];
                
                window.selectQuery = '(exist_' + gender + '_00 + exist_' + gender + '_10 + exist_' + gender + '_20 + exist_' + gender + '_30 + exist_' + gender + '_40 + exist_' + gender + '_50 + exist_' + gender + '_60 + exist_' + gender + '_70 + exist_' + gender + '_80 + exist_' + gender + '_90) as exist';

            } else if(gender === 't' && age !== 't' ) {
                window.afterExist = ['sum(exist_m_'+age+')', 'sum(exist_f_'+age+')'];

                if(age === "10") {
                    window.selectQuery = '(exist_m_00 + exist_m_10 + exist_f_00 + exist_f_10) as exist';
                } else if(age === "60") {
                    window.selectQuery = '(exist_m_60 + exist_m_70 + exist_m_80 + exist_m_90 + exist_f_60 + exist_f_70 + exist_f_80 + exist_f_90) as exist';
                } else {
                    window.selectQuery = '(exist_m_'+ age + ' + ' + 'exist_f_' + age + ') as exist';
                } 
  
            } else {

                window.afterExist = ["sum(exist_" + gender  + "_" + age+')'];
                
                if(age === "10") {
                    window.selectQuery = '(exist_'+gender+'_00 + exist_'+gender+'_10) as exist';
                } else if(age === "60") {
                    window.selectQuery = '(exist_'+gender+'_60 + exist_'+gender+'_70 + exist_'+gender+'_80 + exist_'+gender+'_90) as exist';
                } else {
                    window.selectQuery = 'exist_'+gender+'_'+ age + ' as exist';
                }

            }       

            var getDate = window.store.getState().dateString.curr;
            var curr_dt = getDate.curr.substring(0, 8);
            var curr_hh = getDate.curr.substring(8, 10);
            var curr_mm = getDate.curr.substring(10, 12)
            var prev_dt = getDate.prev.substring(0, 8);
            var prev_hh = getDate.prev.substring(8, 10);
            var prev_mm = getDate.prev.substring(10, 12);
            window.afterMap.addSource('vector-tile2', {
                type: 'vector',
                tilesFunction: `function (tile) {
                        var host = tile.tilesFunctionParams.host;
                        var port = tile.tilesFunctionParams.port;

                        var sql1 = "SELECT ${window.selectQuery}, geometry FROM ltdb_fp WHERE dt = '${curr_dt}' and hh = '${curr_hh}' and mm = '${curr_mm}'";
                        var sql2 = "SELECT ${window.selectQuery}, geometry FROM ltdb_fp WHERE dt = '${prev_dt}' and hh = '${prev_hh}' and mm = '${prev_mm}'";
                        var typeName = "ltdb_fp";
                        var aggrType = "sum";
                        var multiple = false;
                        var bbox = ${JSON.stringify(bbox)};
                        return renderSqlDiffPost(host, port, tile, sql1, sql2, typeName, aggrType, multiple, null);
                    }`,
                minzoom: 0,
                maxzoom: 16.1
            }); 
            
            window.afterMap.addLayer(
                {
                    'id': 'vector-tile2',
                    'type': 'heatmap',
                    'source': 'vector-tile2',
                    'source-layer': 'ltdb_fp',
                    'maxzoom': 16.1,
                    'minzoom': 0,
                    'paint': {
                    'heatmap-weight': heatmapWeight,
                    "heatmap-color": [
                        'step', ['heatmap-density'], 'rgba(255,255,255,0)',
                        0.05,
                        'rgb(255, 255, 229)',
                        0.1,
                        'rgb(248, 252, 193)',
                        0.2,
                        'rgb(229, 244, 171)',
                        0.3,
                        'rgb(199, 232, 154)',
                        0.4,
                        'rgb(162, 216, 137)',
                        0.5,
                        'rgb(120, 198, 121)',
                        0.6,
                        'rgb(75, 176, 98)',
                        0.8,
                        'rgb(47, 147, 77)',
                        0.9,
                        'rgb(20, 120, 62)',                
                        1,
                        'rgb(0, 96, 52)'
                    ],
                    'heatmap-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0, 1,
                        1, 2,
                        2, 2,
                        3, 2,
                        4, 3,
                        5, 3,
                        6, 3,
                        7, 10,
                        8, 10,
                        9, 10,
                        10, 11,
                        11, 15,
                        12, 20,
                        13, 20,
                        14, 50,
                        15, 70,
                        16, 70,
                        17, 80,
                        18, 80,
                        19, 80,
                        20, 80,
                        21, 90,
                        22, 100
                        ], 
                        'heatmap-opacity': 0.5,
                        'statistics-max': statisticsMax               
                    }                  
                }
            );                
        }     
        
        const data = window.draw.draw.getAll();

        if (data.features.length > 0) {
            if(document.querySelector('.chart1') != null) {
                if(window.draw.draw.getMode() !== 'direct_select') {
                    setChartOnDraw(document.querySelector('.chart1'), document.querySelector('.chart2'), data, eventTimeFormat, window.beforeExist, true);           
                }
            }
        }
    };

    mapboxgl.accessToken = 'pk.eyJ1IjoibGVlc2giLCJhIjoiY0thWXdQbyJ9.fPGnL5s0k8ptNPY7P1S1aA';
    // mapboxgl.workerCount = 6;
    mapboxgl.maxParallelImageRequests = 32;

    //mapboxgl.Compare = Compare;
    
    const mapContainerRef = useRef(null);
    const beforeMapContainerRef = useRef(null);
    const afterMapContainerRef = useRef(null);

    // initialize map when component mounts
    useEffect(() => {
        mapboxgl.Compare = Compare;
        // window.mapboxgl = mapboxgl;
        // Promise.all([
        //     new Promise(function (resolve, reject) {
        //         const script = document.createElement('script');
        //         script.src = "http://fbg01:8077/js/mapbox-gl-compare.js";
        //         script.async = false;
        //         document.body.appendChild(script);
        //         script.addEventListener('load', resolve, {
        //             once: true
        //         });
        //     })            
        // ]).then(function (result) {

            
        // });

        class extendDrawBar {
            constructor(opt) {
                let ctrl = this;
                ctrl.draw = opt.draw;
                ctrl.buttons = opt.buttons || [];
                ctrl.onAddOrig = opt.draw.onAdd;
                ctrl.onRemoveOrig = opt.draw.onRemove;
            }
            onAdd(map) {
                let ctrl = this;
                ctrl.map = map;
                ctrl.elContainer = ctrl.onAddOrig(map);
                ctrl.buttons.forEach((b) => {
                ctrl.addButton(b);
                });
                return ctrl.elContainer;
            }
            onRemove(map) {
                let ctrl = this;
                ctrl.buttons.forEach((b) => {
                ctrl.removeButton(b);
                });
                ctrl.onRemoveOrig(map);
            }
            addButton(opt) {
                let ctrl = this;
                var elButton = document.createElement('button');
                elButton.className = 'mapbox-gl-draw_ctrl-draw-btn';
                if (opt.classes instanceof Array) {
                opt.classes.forEach((c) => {
                    elButton.classList.add(c);
                });
                }
                elButton.addEventListener(opt.on, opt.action);
                ctrl.elContainer.appendChild(elButton);
                opt.elButton = elButton;
            }
            removeButton(opt) {
                opt.elButton.removeEventListener(opt.on, opt.action);
                opt.elButton.remove();
            }
        }

        // window.beforeMap.queryRenderedFeatures('vector-tile')
        // window.beforeMap.querySourceFeatures('vector-tile', {
        //     sourceLayer: 'ltdb_fp'
        // })

        window.beforeMap = new mapboxgl.Map({
            container: beforeMapContainerRef.current,
            hash: true,
            style: {
                'version': 8,
                'sources': {
                    'raster-tiles': {
                        'type': 'raster',
                        'tiles': [
                            //'https://mts0.google.com/vt/src=app&hl=ko&x={x}&y={y}&z={z}&s=.png'
                            'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                        ],
                        'tileSize': 256
                    }
                },
                'layers': [{
                    'id': 'base-map',
                    'type': 'raster',
                    'source': 'raster-tiles',
                    'minzoom': 0,
                    'maxzoom': 22
                }]
            },
            center: [127, 37.55], //126.986, 37.565
            zoom: 11,
            maxZoom: 16,
            minZoom: 8.5,
            tilesFunctionParams: function (tile) {
                const port = ports.shift();
                ports.push(port);
    
                return {
                    host: config.host,
                    port: port,
                    eventTime1: null,
                    eventTime2: null
                }
            }            
            //interactive: false
        });

        window.afterMap = new mapboxgl.Map({
            container: afterMapContainerRef.current,
            hash: true,
            style: {
                'version': 8,
                'sources': {
                    'raster-tiles': {
                        'type': 'raster',
                        'tiles': [
                            //'https://mts0.google.com/vt/src=app&hl=ko&x={x}&y={y}&z={z}&s=.png'
                            'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                        ],
                        'tileSize': 256
                    }
                },
                'layers': [{
                    'id': 'base-map',
                    'type': 'raster',
                    'source': 'raster-tiles',
                    'minzoom': 0,
                    'maxzoom': 22
                }]
            },
            center: [127, 37.55],
            zoom: 11,
            maxZoom: 16,
            minZoom: 8.5,
            tilesFunctionParams: function (tile) {
                const port = ports.shift();
                ports.push(port);
    
                // const maxEventTime = moment(eventTime.max, eventTimeFormat);
                // const eventTime1 = maxEventTime.format(eventTimeFormat);
    
                // const time = moment.duration("00:01:00");
                // const eventTime2 = maxEventTime.subtract(time).format(eventTimeFormat);
    
                // console.log(eventTime1, eventTime2);
    
                return {
                    host: config.host,
                    port: port,
                    eventTime1: null,
                    eventTime2: null
                }
            }              
            //interactive: false
        });

        window.beforeMap.on('load', function() {

            window.beforeMap.style.dispatcher.broadcast('loadWorkerSource', {
                name: "pako",
                url: `http://${window.location.host}/ltdb/web/static/js/pako.js` //`http://giraf.sktelecom.comhttp://${window.location.host}/ltdb/web/api/pako` //"http://fbg01:8077/js/pako.js"//`http:localhost:${config.appPort}/static/pako.js` //`${axios.get('/api/pako')}`
            }, function (e) {
                if (e) {
                    console.log(e);
                }
            });

            window.beforeMap.style.dispatcher.broadcast('loadWorkerSource', {
                name: "global-mercator",
                url: `http://${window.location.host}/ltdb/web/static/js/global-mercator.js`
            }, function (e) {
                if (e) {
                    console.log(e);
                }
            });            
            
            // window.beforeMap.style.dispatcher.broadcast('loadWorkerSource', {
            //     name: "browser-connector",
            //     url: "http://fbg01:8077/js/browser-connector.js"
            // }, function (e) {
            //     if (e) {
            //         console.log(e);
            //     }
            // });

            window.beforeMap.style.dispatcher.broadcast('loadWorkerSource', {
                name: "vectortile-utils",
                url: `http://${window.location.host}/ltdb/web/static/js/vectortile-utils.js` //`${axios.get('/api/vectorUtils')}`
            }, function (e) {
                if (e) {
                    console.log(e);
                }
            });            

            window.beforeMap.on('idle', function(e) {
                if(window.beforeMove) {
                    window.beforeMove = false;
                    calculateSumAndMax2(window.beforeMap, 'vector-tile');
                }
            });

            // window.beforeMap.on('wheel', function(e) {
            //     console.log(e);
            // });

            window.beforeMap.on('move', function(e) {
                window.beforeMove = false;
                window.afterMove = false;
            });

            window.beforeMap.on('moveend', function(e) {
                window.beforeMove = true;
                window.afterMove = true;
                document.querySelector('.mapLoading').style.display = 'block';
                //console.log('현재 Zoom Level: ' + window.beforeMap.getZoom());

                document.querySelector('.zoom-level-container').textContent = ('Zoom Level : ' + Math.round(window.beforeMap.getZoom() * 100) / 100);
            });

            window.beforeMap.resize();
        });
        
        window.afterMap.on('load', function() {
            window.afterMap.style.dispatcher.broadcast('loadWorkerSource', {
                name: "pako",
                url: `http://${window.location.host}/ltdb/web/static/js/pako.js` //`${axios.get('/api/pako')}`
            }, function (e) {
                if (e) {
                    console.log(e);
                }
            });

            window.afterMap.style.dispatcher.broadcast('loadWorkerSource', {
                name: "global-mercator",
                url: `http://${window.location.host}/ltdb/web/static/js/global-mercator.js` //`${axios.get('/api/mercator')}`
            }, function (e) {
                if (e) {
                    console.log(e);
                }
            });  

            // window.afterMap.style.dispatcher.broadcast('loadWorkerSource', {
            //     name: "browser-connector",
            //     url: "http://fbg01:8077/js/browser-connector.js"
            // }, function (e) {
            //     if (e) {
            //         console.log(e);
            //     }
            // });

            window.afterMap.style.dispatcher.broadcast('loadWorkerSource', {
                name: "vectortile-utils",
                url: `http://${window.location.host}/ltdb/web/static/js/vectortile-utils.js` //`${axios.get('/api/vectorUtils')}`
            }, function (e) {
                if (e) {
                    console.log(e);
                }
            });  

            window.afterMap.on('idle', function(e) {
                if(window.afterMove) {
                    window.afterMove = false;
                    calculateSumAndMax2(window.afterMap, 'vector-tile2');
                    //document.querySelector('.mapLoading').style.display = 'none';
                }
            });

            window.afterMap.resize();

        });

        // const container = '#mainMap';
        const map = new mapboxgl.Compare(window.beforeMap, window.afterMap, mapContainerRef.current, {
        // Set this to enable comparing two maps by mouse movement:
            //mousemove: true,
            overlay: {
                center: [window.beforeMap.getCenter().lng, window.beforeMap.getCenter().lat], //126.986, 37.565
                zoom: window.beforeMap.getZoom(),
                minZoom: 8.5,
                maxZoom: 16,
                // center: [126.986, 37.565],
                // zoom: 11
            },
        });      

        const defaultDraw = new MapboxDraw({
            displayControlsDefault: false,
            userProperties: true,
            defaultMode: "simple_select",
            clickBuffer: 10,
            touchBuffer: 10,
            controls: {
                point: false,
                line_string: false,
                combine_features: false,
                uncombine_features: false,
                polygon: true,
                trash: false
            },            
            modes: {
              ...MapboxDraw.modes,
              draw_circle: CircleMode,
              direct_select: DirectMode,
              simple_select: SimpleSelectMode,
              drag_circle: DragCircleMode
            },
            styles: [
                // {
                //     'id': 'highlight-active-points',
                //     'type': 'circle',
                //     'filter': ['all',
                //         ['==', '$type', 'Point'],
                //         ['==', 'meta', 'feature'],
                //         ['==', 'active', 'true']],
                //     'paint': {
                //         'circle-radius': 7,
                //         'circle-color': '#000000'
                //     }
                // },
                // {
                //     'id': 'points-are-blue',
                //     'type': 'circle',
                //     'filter': ['all',
                //         ['==', '$type', 'Point'],
                //         ['==', 'meta', 'feature'],
                //         ['==', 'active', 'false']],
                //     'paint': {
                //         'circle-radius': 5,
                //         'circle-color': '#000088'
                //     }
                // },                
                // ACTIVE (being drawn)
                // line stroke
                {
                    "id": "gl-draw-line",
                    "type": "line",
                    "filter": ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"]],
                    "layout": {
                      "line-cap": "round",
                      "line-join": "round"
                    },
                    "paint": {
                      "line-color": "#D20C0C",
                      "line-dasharray": [0.2, 2],
                      "line-width": 3
                    }
                },
                // polygon fill
                {
                  "id": "gl-draw-polygon-fill",
                  "type": "fill",
                  "filter": ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
                  "paint": {
                    "fill-color": "#D20C0C",
                    "fill-outline-color": "#D20C0C",
                    "fill-opacity": 0.1
                  }
                },
                // polygon mid points
                {
                    'id': 'gl-draw-polygon-midpoint',
                    'type': 'circle',
                    'filter': ['all',
                        ['==', '$type', 'Point'],
                        ['==', 'meta', 'midpoint']],
                    'paint': {
                        'circle-radius': 8,
                        'circle-color': '#fbb03b'
                    }
                },                
                // polygon outline stroke
                // This doesn't style the first edge of the polygon, which uses the line stroke styling instead
                {
                    'id': 'gl-draw-point-stroke-active',
                    'type': 'circle',
                    'filter': ['all', ['==', '$type', 'Point'],
                        ['==', 'active', 'true'],
                        ['!=', 'meta', 'midpoint']
                    ],
                    'paint': {
                        'circle-radius': 15,
                        'circle-color': '#0000FF'
                    }
                },     
                // {
                //     'id': 'gl-draw-point-active',
                //     'type': 'circle',
                //     'filter': ['all',
                //       ['==', '$type', 'Point'],
                //       ['!=', 'meta', 'midpoint'],
                //       ['==', 'active', 'true']],
                //     'paint': {
                //       'circle-radius': 5,
                //       'circle-color': '#0000FF'
                //     }
                // },                           
                {
                  "id": "gl-draw-polygon-stroke-active",
                  "type": "line",
                  "filter": ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
                  "layout": {
                    "line-cap": "round",
                    "line-join": "round"
                  },
                  "paint": {
                    "line-color": "#D20C0C",
                    "line-dasharray": [0.2, 2],
                    "line-width": 3
                  }
                },
                // {
                //     'id': 'gl-draw-polygon-stroke-inactive',
                //     'type': 'line',
                //     'filter': ['all', ['==', 'active', 'false'],
                //         ['==', '$type', 'Polygon'],
                //         ['!=', 'mode', 'static']
                //     ],
                //     'layout': {
                //         'line-cap': 'round',
                //         'line-join': 'round'
                //     },
                //     'paint': {
                //         'line-color': '#3bb2d0',
                //         'line-width': 3
                //     }
                // },                
                // vertex point halos                
                {
                  "id": "gl-draw-polygon-and-line-vertex-halo-active",
                  "type": "circle",
                  "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
                  "paint": {
                    "circle-radius": 8,
                    "circle-color": "#FFF"
                  }
                },             
                // {
                //     'id': 'gl-draw-polygon-and-line-vertex-stroke-inactive',
                //     'type': 'circle',
                //     'filter': ['all', ['==', 'meta', 'vertex'],
                //         ['==', '$type', 'Point'],
                //         ['!=', 'mode', 'static']
                //     ],
                //     'paint': {
                //         'circle-radius': 5,
                //         'circle-color': '#ff0000'
                //     }
                // },                
                // vertex points
                {
                  "id": "gl-draw-polygon-and-line-vertex-active",
                  "type": "circle",
                  "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
                  "paint": {
                    "circle-radius": 7,
                    "circle-color": "#D20C0C",
                  }
                },   
                // {
                //     "id": "gl-draw-polygon-and-line-vertex-inactive",
                //     "type": "circle",
                //     "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["==", "mode", "static"]],
                //     "paint": {
                //       "circle-radius": 7,
                //       "circle-color": "#ff00ff",
                //     }
                // },                   

                // INACTIVE (static, already drawn)
                // line stroke
                {
                    "id": "gl-draw-line-static",
                    "type": "line",
                    "filter": ["all", ["==", "$type", "LineString"], ["==", "mode", "static"]],
                    "layout": {
                      "line-cap": "round",
                      "line-join": "round"
                    },
                    "paint": {
                      "line-color": "#000",
                      "line-width": 3
                    }
                },
                // polygon fill
                {
                  "id": "gl-draw-polygon-fill-static",
                  "type": "fill",
                  "filter": ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
                  "paint": {
                    "fill-color": "#000",
                    "fill-outline-color": "#000",
                    "fill-opacity": 0.1
                  }
                },
                // polygon outline
                {
                  "id": "gl-draw-polygon-stroke-static",
                  "type": "line",
                  "filter": ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
                  "layout": {
                    "line-cap": "round",
                    "line-join": "round"
                  },
                  "paint": {
                    "line-color": "#000",
                    "line-width": 3
                  }
                },

                //커스텀 스타일
                // {
                //     "id": "gl-draw-polygon-color-picker",
                //     'type': 'fill',
                //     "filter": ["all", ["==", "$type", "Polygon"], ['has', 'user_portColor']],
                //     "paint": {
                //         'fill-color': ['get', 'user_portColor'],
                //         'fill-outline-color': ['get', 'user_portColor'],
                //         'fill-opacity': 0.5
                //     }
                // },
                // {
                //     'id': 'gl-draw-line-color-picker',
                //     'type': 'line',
                //     'filter': ['all', ['==', '$type', 'LineString'],
                //         ['has', 'user_portColor']
                //     ],
                //     'paint': {
                //         'line-color': ['get', 'user_portColor'],
                //         'line-width': 2
                //     }
                // },
                // {
                //     'id': 'gl-draw-point-color-picker',
                //     'type': 'circle',
                //     'filter': ['all', ['==', '$type', 'Point'],
                //         ['has', 'user_portColor']
                //     ],
                //     'paint': {
                //         'circle-radius': 20,
                //         'circle-color': ['get', 'user_portColor']
                //     }
                // },                
            ]            
        });  

        let getDrawFeature = null;
        if( window.draw != undefined ) {
            if( window.draw.draw.getAll().features.length > 0 ) {
                getDrawFeature = window.draw.draw.getAll();
            }
        }

        const draw = new extendDrawBar({
            buttons: [{
                on: 'click',
                action: draw_circle,
                classes: ['mapbox-gl-draw_circle']
            }],
            draw: defaultDraw
        });

        function draw_circle() {

            if(window.beforeMap.getZoom() < 13) {
                alert('도형의 크기와 모양 수정은 13레벨부터 가능합니다.');
                draw.draw.changeMode('simple_select');
                return;
            }   

            defaultDraw.deleteAll();

            let circleRadius = 2;//0.5;

            // if(window.beforeMap.getZoom() > 15) {
            //     circleRadius = 0.1;
            // } else if(window.beforeMap.getZoom() > 14) {
            //     circleRadius = 0.3;
            // } else if(window.beforeMap.getZoom() > 13) {
            //     circleRadius = 0.5;
            // } else if(window.beforeMap.getZoom() > 12) {
            //     circleRadius = 1.5;
            // } else if(window.beforeMap.getZoom() > 11) {
            //     circleRadius = 2;
            // } else if(window.beforeMap.getZoom() > 10) {
            //     circleRadius = 3;
            // } else if(window.beforeMap.getZoom() > 9) {
            //     circleRadius = 2;
            // } else {
            //     circleRadius = 10;
            // }

            defaultDraw.changeMode('draw_circle', {initialRadiusInKm: circleRadius})
        }

        window.draw = draw;
        window.Turf = Turf;

        map.overlay().addControl(draw);
        
        map.overlay().on('draw.create', updateArea);
        map.overlay().on('draw.delete', updateArea);
        map.overlay().on('draw.update', debounce(updateArea, 1000));

        const popup1 = new mapboxgl.Popup({ offset: -80 })
            .setLngLat([0, 0]);
        const popup2 = new mapboxgl.Popup({ offset: -80 })
            .setLngLat([0, 0]);       

        map.overlay().on('draw.modechange', (e) => {
            // const data = draw.draw.getAll();
            if (draw.draw.getMode() == 'draw_polygon') {

                if(window.beforeMap.getZoom() < 13) {
                    alert('도형의 크기와 모양 수정은 13레벨부터 가능합니다.');
                    draw.draw.changeMode('simple_select');
                    return;
                }
                
                defaultDraw.deleteAll();
                draw.draw.deleteAll();
                draw.draw.changeMode('draw_polygon');
            } else if(draw.draw.getSelected().features.length > 0 && draw.draw.getMode() === 'simple_select') {
                // popup1.options.offset = -100;
                // popup2.options.offset = -100;

                // popup1.setHTML('<b>선택 모드입니다<br>도형을 이동시킬 수 있습니다</b>');
                // popup2.setHTML('<b>선택 모드입니다<br>도형을 이동시킬 수 있습니다</b>');
                draw.draw.changeMode('direct_select', {featureId: draw.draw.getSelectedIds()[0]});
              
            } else if(draw.draw.getSelected().features.length > 0 && draw.draw.getMode() === 'direct_select') {

                if(window.beforeMap.getZoom() < 13) {
                    //alert('편집은 지도 13레벨부터 가능 합니다.');
                    draw.draw.changeMode('simple_select');
                    return;
                }

                popup1.options.offset = -100;
                popup2.options.offset = -100;

                popup1.setHTML('<b>편집 모드입니다<br>포인트 클릭/드래그로 변경할 수 있습니다</b>');
                popup2.setHTML('<b>편집 모드입니다<br>포인트 클릭/드래그로 변경할 수 있습니다</b>');                   
            } else if(draw.draw.getSelected().features.length == 0 && draw.draw.getMode() === 'simple_select') {
                if(popup1.isOpen()) {
                    popup1.remove();
                }
    
                if(popup2.isOpen()) {
                    popup2.remove();
                }                        
            }
        });

        map.overlay().on('draw.selectionchange', (e) => {

            const data = draw.draw.getAll();

            if (data.features.length > 0) {

                if(draw.draw.getMode() === 'simple_select' && draw.draw.getSelected().features.length == 0) {
                    if(document.querySelector('.chart1') != null) {
                        
                        const wkt = wellknown.stringify(data.features[0].geometry);

                        if( window.shapeWkt !== undefined ) {
                            if(wkt !== window.shapeWkt) {
                                setChartOnDraw(document.querySelector('.chart1'), document.querySelector('.chart2'), data, eventTimeFormat, window.beforeExist); 
                            }        
                        }
                                  
                    }
                } else if(draw.draw.getMode() === 'simple_select' && draw.draw.getSelectedIds().length > 0) {
                    if(window.beforeMap.getZoom() < 13) {
                        //alert('편집은 지도 13레벨부터 가능 합니다.');
                        //draw.draw.changeMode('simple_select');
                    } else {
                        draw.draw.changeMode('direct_select', {featureId: draw.draw.getSelectedIds()[0]});
                    }
                }
            } 
             
        });

        document.getElementsByClassName('mapboxgl-ctrl-group')[0].onmouseover = function() {
            if(popup1.isOpen()) {
                popup1.remove();
            }

            if(popup2.isOpen()) {
                popup2.remove();
            } 
        } 
        
        map.overlay().on('mousemove', (e) => {
            
            if(popup1.isOpen()) {
                popup1.remove();
            }

            if(popup2.isOpen()) {
                popup2.remove();
            }
            
            if(draw.draw.getMode() === 'draw_circle') {
                popup1.options.offset = -80;
                popup2.options.offset = -80;

                popup1.setLngLat(e.lngLat)
                .setHTML('<b>임의의 위치에 클릭해 주세요</b>')
                .addTo(window.beforeMap);

                popup2.setLngLat(e.lngLat)
                .setHTML('<b>임의의 위치에 클릭해 주세요</b>')
                .addTo(window.afterMap);
            } else if(draw.draw.getMode() === 'draw_polygon') {
                popup1.options.offset = -80;
                popup2.options.offset = -80;

                popup1.setLngLat(e.lngLat)
                .setHTML('<b>임의의 위치에 클릭해 도형을 그려주세요</b>')
                .addTo(window.beforeMap);

                popup2.setLngLat(e.lngLat)
                .setHTML('<b>임의의 위치에 클릭해 도형을 그려주세요</b>')
                .addTo(window.afterMap);               
            } else if(draw.draw.getSelected().features.length > 0 && draw.draw.getMode() === 'simple_select') {
                popup1.options.offset = -100;
                popup2.options.offset = -100;

                popup1.setLngLat(e.lngLat)
                .setHTML('<b>선택 모드입니다 (이동만 가능)</b><br><b>13레벨 이상부터 크기 변경이 가능합니다<b>')
                .addTo(window.beforeMap);

                popup2.setLngLat(e.lngLat)
                .setHTML('<b>선택 모드입니다 (이동만 가능)</b><br><b>13레벨 이상부터 크기 변경이 가능합니다<b>')
                .addTo(window.afterMap);                    
            } else if(draw.draw.getSelected().features.length > 0 && draw.draw.getMode() === 'direct_select') {
                popup1.options.offset = -100;
                popup2.options.offset = -100;

                popup1.setLngLat(e.lngLat)
                .setHTML('<b>편집 모드입니다<br>포인트 클릭/드래그로 변경할 수 있습니다</b>')
                .addTo(window.beforeMap);

                popup2.setLngLat(e.lngLat)
                .setHTML('<b>편집 모드입니다<br>포인트 클릭/드래그로 변경할 수 있습니다</b>')
                .addTo(window.afterMap);                   
            }

        });

        map.overlay().on('mouseout', (e) => {
            if(popup1.isOpen()) {
                popup1.remove();
            }

            if(popup2.isOpen()) {
                popup2.remove();
            }
        })

        // map.overlay().on('moveend', (e) => {
        //     console.log('moveend ' + e.target.getZoom());
        // })

        // map.overlay().on('movestart', (e) => {
        //     console.log('movestart ' + e.target.getZoom());
        // })
        
        
        map.overlay().on('wheel', (e) => {
            
            // console.log(e.target._zooming);
            // console.log('e.target : ' + e.target.getZoom());
            // console.log('beforemap : ' + window.beforeMap.getZoom());
            // console.log('aftermap : ' + window.afterMap.getZoom());

            if( e.target.getZoom() < 13 ) {
                if(draw.draw.getSelected().features.length > 0) {
                    draw.draw.changeMode('simple_select');

                    if(popup1.isOpen()) {
                        popup1.remove();
                    }
        
                    if(popup2.isOpen()) {
                        popup2.remove();
                    }
                }
            }
        });

        function debounce(fn, delay) {
            var timer;
            return function() {
              var context = this;
              var args = arguments;
              clearTimeout(timer);
              timer = setTimeout(function(){
                fn.apply(context, args);
              }, delay);
            }
        }

        function throttle(fn, delay) {
            var timer = null;
            return function () {
              var context = this;
              var args = arguments;
              if (!timer) {
                timer = setTimeout(function() {
                  fn.apply(context, args);
                  timer = null;
                }, delay);
              }
            };
        }        

        function updateArea(e) {
            const data = draw.draw.getSelected();

            if (data.features.length > 0) {

                if(draw.draw.getMode() !== 'direct_select') {
                    if(document.querySelector('.chart1') != null) {
                        setChartOnDraw(document.querySelector('.chart1'), document.querySelector('.chart2'), data, eventTimeFormat, window.beforeExist);           
                    }
                }

            } else {
                if (e.type !== 'draw.delete') {
                    console.log('draw.delete');
                } else {
                    draw.draw.deleteAll();  
                }
            }
        }

        if(getDrawFeature != null) {
            draw.draw.set(getDrawFeature);
        }

        // geocoder
        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl,
            flyTo: { duration: 0 },
            placeholder: '주소 검색',
            marker: false,
            countries: 'kr',
            // bbox: [126.76487604016523,37.42806780710028,127.18416090045505,37.70130441174812],
            // filter: function (item) {
            //     // returns true if item contains New South Wales region
            //     return item.context.some((i) => {
            //         return (
            //             i.id.split('.').shift() === 'region' &&
            //             i.text === 'New South Wales'
            //         );
            //     });
            // },
        });
        window.beforeMap.addControl(geocoder, 'top-left');      

        //draw element 순서변경
        let el_circle = document.getElementsByClassName('mapbox-gl-draw_ctrl-draw-btn mapbox-gl-draw_circle')[0]; //getElementById
        if(el_circle != undefined || el_circle != null) {
            let el_parent = el_circle.parentNode;
            //el_circle.textContent = 'C';
            el_parent.insertBefore(el_circle, el_parent.firstChild);	
        }

        document.querySelector('.mapboxgl-ctrl-group').style.display = 'none';

        // clean up on unmount
        return () => {
            map.remove();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return <div id="mainMap" className="mainMap" ref={mapContainerRef}>
                <LinearProgress className="mapLoading" color="secondary" />
                <div className="genderAge-container">
                    <RadioGroup aria-label="gender" row name="gender" value={genderValue} onChange={genderHandleChange}>
                        <FormControlLabel value="t" control={<Radio />} label="전체" />
                        <FormControlLabel value="m" control={<Radio />} label="남성" />
                        <FormControlLabel value="f" control={<Radio />} label="여성" />
                    </RadioGroup>      
                    <RadioGroup aria-label="age" row name="age" value={ageValue} onChange={ageHandleChange}>
                        <FormControlLabel value="t" control={<Radio />} label="전체" />
                        <FormControlLabel value="10" control={<Radio />} label="10대 이하" />
                        <FormControlLabel value="20" control={<Radio />} label="20대" />
                        <FormControlLabel value="30" control={<Radio />} label="30대" />
                        <FormControlLabel value="40" control={<Radio />} label="40대" />
                        <FormControlLabel value="50" control={<Radio />} label="50대" />
                        <FormControlLabel value="60" control={<Radio />} label="60대 이상" />
                    </RadioGroup>                                     
                </div>
                <div className='zoom-level-container'>
                    Zoom Level : 11
                </div>
                <div className='fake-container'>
                </div>
                <div id='before' className='childMap' ref={beforeMapContainerRef}>
                    <div className='beforeTitle'>
                        현 재  유 동 인 구
                    </div>
                    <div className='beforeLegend'>
                        <div>
                            <span className='legend-key' style={{"backgroundColor": "rgb(176, 0, 38)"}}/>
                            <span>High</span>
                        </div>
                        <div>
                            <span className='legend-key' style={{"backgroundColor": "rgb(211, 15, 32)"}}/>
                            <span/>
                        </div>
                        <div>
                            <span className='legend-key' style={{"backgroundColor": "rgb(237, 46, 33)"}}/>
                            <span/>
                        </div>
                        <div>
                            <span className='legend-key' style={{"backgroundColor": "rgb(252, 90, 45)"}}/>
                            <span/>
                        </div>
                        <div>
                            <span className='legend-key' style={{"backgroundColor": "rgb(253, 141, 60)"}}/>
                            <span/>
                        </div>
                        <div>
                            <span className='legend-key' style={{"backgroundColor": "rgb(253, 170, 72)"}}/>
                            <span/>
                        </div>
                        <div>
                            <span className='legend-key' style={{"backgroundColor": "rgb(254, 201, 101)"}}/>
                            <span/>
                        </div>
                        <div>
                            <span className='legend-key' style={{"backgroundColor": "rgb(254, 225, 134)"}}/>
                            <span/>
                        </div>
                        <div>
                            <span className='legend-key' style={{"backgroundColor": "rgb(255, 240, 168)"}}/>
                            <span/>
                        </div>
                        <div>
                            <span className='legend-key' style={{"backgroundColor": "rgb(255, 255, 204)"}}/>
                            <span>Low</span>
                        </div>
                    </div>                    
                </div>
                <div id='after' className='childMap' ref={afterMapContainerRef}>
                    <div className="time-container">
                        <RadioGroup aria-label="time" row name="time" value={timeValue} onChange={timeHandleChange}>
                            <FormControlLabel value="01:00:00" control={<Radio />} label="1시간" />
                            <FormControlLabel value="02:00:00" control={<Radio />} label="2시간" />
                            <FormControlLabel value="03:00:00" control={<Radio />} label="3시간" />
                        </RadioGroup>                            
                    </div>
                    
                    <div className='afterTitle'>
                        증 감  유 동 인 구
                    </div>

                    <div className='afterLegend'>
                        <div>
                            <span className='legend-key' style={{"backgroundColor": "rgb(0, 96, 52)"}}/>
                            <span>High</span>
                        </div>
                        <div>
                            <span className='legend-key' style={{"backgroundColor": "rgb(20, 120, 62)"}}/>
                            <span/>
                        </div>
                        <div>
                            <span className='legend-key' style={{"backgroundColor": "rgb(47, 147, 77)"}}/>
                            <span/>
                        </div>
                        <div>
                            <span className='legend-key' style={{"backgroundColor": "rgb(75, 176, 98)"}}/>
                            <span/>
                        </div>
                        <div>
                            <span className='legend-key' style={{"backgroundColor": "rgb(120, 198, 121)"}}/>
                            <span/>
                        </div>
                        <div>
                            <span className='legend-key' style={{"backgroundColor": "rgb(162, 216, 137)"}}/>
                            <span/>
                        </div>
                        <div>
                            <span className='legend-key' style={{"backgroundColor": "rgb(199, 232, 154)"}}/>
                            <span/>
                        </div>
                        <div>
                            <span className='legend-key' style={{"backgroundColor": "rgb(229, 244, 171)"}}/>
                            <span/>
                        </div>
                        <div>
                            <span className='legend-key' style={{"backgroundColor": "rgb(248, 252, 193)"}}/>
                            <span/>
                        </div>
                        <div>
                            <span className='legend-key' style={{"backgroundColor": "rgb(255, 255, 229)"}}/>
                            <span>Low</span>
                        </div>
                    </div>                     
                </div>
        </div>;
};
  
export default MapScript;






//   const map = new mapboxgl.Map({
//     container: mapContainerRef.current,
//     // See style options here: https://docs.mapbox.com/api/maps/#styles
//     style: 'mapbox://styles/mapbox/streets-v11',
//     center: [-104.9876, 39.7405],
//     zoom: 12.5,
//   });
