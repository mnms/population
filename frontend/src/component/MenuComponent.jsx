// Handles display of the top menu.

import React from 'react'
import { Link, withRouter } from 'react-router-dom'
import { makeStyles, withTheme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import ToggleButton from '@material-ui/lab/ToggleButton';

// import DateAdapter from '@mui/lab/AdapterMoment';
// import AdapterDateFns from "@date-io/moment";
// import LocalizationProvider from '@mui/lab/LocalizationProvider';
// import DateTimePicker from '@mui/lab/DateTimePicker';
// import TextField from '@mui/material/TextField';
import moment from '../js/moment.js';
import { DatePicker, Space } from "antd";
import "antd/dist/antd.css";

import AuthenticationService from '../service/AuthenticationService';
import { updateCurrDate, updatePrevDate, updateStates, updateDateString } from "../redux/actions"
import {getDateString, setMapForDate, setCurrPrevDateString, setChartOnDraw, timeStamp} from '../service/CustomFunc.js'

import axios from 'axios'

const MapdCon = require("@mapd/connector/dist/browser-connector");
const config = require ("../server.json");

const dateParse = (str) =>  {
    // validate year as 4 digits, month as 01-12, and day as 01-31 
    if ((str = str.match (/^(\d{4})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([01]\d|2[0-3])([0-5]\d)$/))) {
        // make a date
        str[0] = new Date (+str[1], +str[2] - 1, +str[3], +str[4], +str[5]);
        // check if month stayed the same (ie that day number is valid)
        if (str[0].getMonth () === +str[2] - 1) {
            return str[0];
        }
    }
    return undefined;
};

function MenuComponent(props) {
    const isUserLoggedIn = AuthenticationService.isUserLoggedIn();

    // console.log('메뉴 : ' + window.store.getState().states.menuSeleted)
    const [selected, setSelected] = React.useState( window.store.getState().menuSeleted ); //React.useState(false);
    const [dateValue, setDateValue] = React.useState( (window.currentDate === undefined ? window.store.getState().currentDate : window.currentDate) ); //new Date()

    const onChange = event => {
        if(event) {
            document.querySelector('.mapboxgl-ctrl-group').style.display = 'block';
        } else {
            document.querySelector('.mapboxgl-ctrl-group').style.display = 'none';
        }

        setSelected(event);
        props.onChange(event);
        window.store.dispatch(updateStates(event))
    }

    if(window.currentDate == undefined) {
        const loop = setInterval(() => {
	    if(window.beforeMap != undefined) {
                if(window.beforeMap.loaded()) {
	            clearInterval(loop)
	    //axios.post( "https://giraf.sktelecom.com/ltdb/api",
	    //[1,"connect",1,0,{"1":{"str":"ltdb"},"2":{"str":"ltdb"},"3":{"str":"default"}}],
	            axios.post( "https://giraf.sktelecom.com/ltdb/api/query",
	            "select max(dthhmm) from ltdb_fp_history where table_name='mbp_dev.floc_exist_pop_cnt' limit 1",
	            {
		        headers: {
		            'Content-Type': 'application/vnd.apache.thrift.json',
		            'Accept': 'application/vnd.apache.thrift.json'
		        }
		    }).then(response => {
			    return response.data.rowset
                    }).then( result => {
                        if(result.length > 0) {
                            const currentDate = dateParse(result[0]['max(dthhmm)']);
                            window.currentDate = currentDate;
                            setDateValue(currentDate);
                            
                            const currPrevDateString = setCurrPrevDateString(currentDate, window.store.getState().prevHour);
                            window.store.dispatch(updateDateString(currPrevDateString));
                            window.store.dispatch(updateCurrDate(currentDate));

                            var dt = currPrevDateString.curr.substring(0, 8);
                            var hh = currPrevDateString.curr.substring(8, 10);
                            var mm = currPrevDateString.curr.substring(10, 12);

                            if(window.beforeMap.getLayer('vector-tile') != undefined) {
                                return;
                            } else {
                                document.querySelector('.mapLoading').style.display = 'block';
                                window.beforeMove = true;
                                
                                window.beforeMap.addSource('vector-tile', {
                                    type: 'vector',
                                    tilesFunction: `function (tile) {
                                            var host = tile.tilesFunctionParams.host;
                                            var port = tile.tilesFunctionParams.port;  

                                            var sql = "SELECT (exist_m_00 + exist_m_10 + exist_m_20 + exist_m_30 + exist_m_40 + exist_m_50 + exist_m_60 + exist_m_70 + exist_m_80 + exist_m_90 + exist_f_00 + exist_f_10 + exist_f_20 + exist_f_30 + exist_f_40 + exist_f_50 + exist_f_60 + exist_f_70 + exist_f_80 + exist_f_90) as exist, geometry FROM ltdb_fp WHERE dt = '${dt}' and hh = '${hh}' and mm = '${mm}'";
                                            var typeName = "ltdb_fp";
                                            var aggrType = "sum";
                                            var multiple = false;
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
                                            'heatmap-weight': [
                                                'interpolate',
                                                ['linear'],
                                                ['get', 'exist'], 
                                                0, 0,
                                                5000000, 0.5,
                                                10000000, 1
                                            ],
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
                                            'heatmap-opacity': 0.5,
                                            'statistics-max': [
                                                'max',
                                                ['get', 'exist'],
                                            ]
                                        }                  
                                    }
                                );                         
                            }

                            if(window.afterMap.getLayer('vector-tile2') != undefined) {
                                return;
                            } else {

                                window.afterMove = true;

                                window.afterMap.addSource('vector-tile2', {
                                    type: 'vector',
                                    tilesFunction: `function (tile) {
                                            var host = tile.tilesFunctionParams.host;
                                            var port = tile.tilesFunctionParams.port;

                                            var sql1 = "SELECT (exist_m_00 + exist_m_10 + exist_m_20 + exist_m_30 + exist_m_40 + exist_m_50 + exist_m_60 + exist_m_70 + exist_m_80 + exist_m_90 + exist_f_00 + exist_f_10 + exist_f_20 + exist_f_30 + exist_f_40 + exist_f_50 + exist_f_60 + exist_f_70 + exist_f_80 + exist_f_90) as exist, geometry FROM ltdb_fp WHERE dt = '${dt}' and hh = '${hh}' and mm = '${mm}'";
                                            var sql2 = "SELECT (exist_m_00 + exist_m_10 + exist_m_20 + exist_m_30 + exist_m_40 + exist_m_50 + exist_m_60 + exist_m_70 + exist_m_80 + exist_m_90 + exist_f_00 + exist_f_10 + exist_f_20 + exist_f_30 + exist_f_40 + exist_f_50 + exist_f_60 + exist_f_70 + exist_f_80 + exist_f_90) as exist, geometry FROM ltdb_fp WHERE dt = '${dt}' and hh = '${hh}' and mm = '${mm}'";
                                            var typeName = "ltdb_fp";
                                            var aggrType = "sum";
                                            var multiple = false;
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
                                        'heatmap-weight': [
                                            'interpolate',
                                            ['linear'],
                                            ['get', 'sum(exist)'],
                                            0, 0,
                                            5000000, 0.5,
                                            10000000, 1
                                        ],
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
                                        'statistics-max': [
                                            'max',
                                            ['get', 'sum(exist)'],                  
                                        ]                
                                        }                   
                                    }
                                );                                           
                            }
                        }
                    })
                }
            }
        }, 500)
    }

    const useStyles = makeStyles((theme) => ({
        root: {
          flexGrow: 1,
        },
        menuButton: {
          marginRight: theme.spacing(2),
          color: theme.palette.primary.contrastText
        },
        title: {
          flexGrow: 1,
          userSelect: 'none',  
          color: 'white !important',       
        },
        data: {
            // flexGrow: 1,
            textDecoration: 'underline',
            userSelect: 'none',
            color: 'white !important', 
        },
        date: {
            // flexGrow: 1,
            color: 'white !important',
            height: 20
        },
        text: {
            color: 'white !important'
        },
        color: {
            color: 'white !important'
        },
        notchedOutline: {
            borderWidth: '0px !important'
        }
    }));

    const classes = useStyles();

    return (
        <header>
            {/* <nav className="navbar navbar-expand-md navbar-dark bg-dark">
                <div><a className="navbar-brand">LTDB 유동인구 시각화</a></div>
                <ul className="navbar-nav">
                    <li><Link className="nav-link" to="/main">메인</Link></li>
                </ul>
                <ul className="navbar-nav navbar-collapse justify-content-end">
                    {!isUserLoggedIn && <li><Link className="nav-link" to="/login">Login</Link></li>}
                    {isUserLoggedIn && <li><Link className="nav-link" to="/logout" onClick={AuthenticationService.logout}>Logout</Link></li>}
                </ul>
            </nav> */}
            <div className={classes.root}>
                <AppBar position="static">
                    <Toolbar>
                    <Typography variant="h5" className={classes.title}>
                    LTDB 유동인구 시각화
                    </Typography>
                    {isUserLoggedIn && <div className="menuDateForm">
                        <Typography variant="h6" className={classes.data}>
                            {window.currentDate != undefined ? getDateString(dateValue) : getDateString(null)}
                        </Typography>
                    {/* 
                    <LocalizationProvider className={classes.color} dateAdapter={AdapterDateFns} >
                        <DateTimePicker className={classes.date}
                            renderInput={(props) => <TextField className={classes.text} {...props} />}
                            // label="DateTimePicker"
                            value={dateValue}
                            allowKeyboardControl={false}
                            minutesStep={5}
                            // inputFormat={"yyyy-MM-dd"}
                            InputProps={{
                                classes: {
                                  notchedOutline: classes.notchedOutline,
                                }
                            }}
                            onChange={(newValue) => {
                                //console.log('날짜변경');
                                
                            }}
                            onAccept={(newValue) => {
                                document.querySelector('.mapLoading').style.display = 'block';
                                setMapForDate(newValue._d, window.store.getState().prevHour);
                                window.store.dispatch(updateDateString(setCurrPrevDateString(newValue._d, window.store.getState().prevHour)));
                                setDateValue(newValue._d);
                                window.store.dispatch(updateCurrDate(newValue._d));

                                if(document.querySelector('.chart1') != null) {
                                    const data = window.draw.draw.getAll();
                                    if (data.features.length > 0) {
                                        setChartOnDraw(document.querySelector('.chart1'), document.querySelector('.chart2'), data, "YYYYMMDDhhmm", window.beforeExist);           
                                    }
                                }

                            }}
                        />
                    </LocalizationProvider>*/}
                        
                        {/* <TextField
                            className="datetime-local"
                            id="datetime-local"
                            label=""
                            type="datetime-local"
                            defaultValue={timeStamp(dateValue)}
                            //value={timeStamp(dateValue)}
                            // sx={{ width: 250 }}
                            // InputLabelProps={{
                            //     shrink: true,
                            // }}
                            // inputProps={{
                            //     step: 300, // 5 min
                            // }}
                            InputProps={{
                                classes: {
                                  notchedOutline: classes.notchedOutline,
                                },
                                step: 300,
                            }}
                            onChange={(event, props) => {
                                // console.log(event);
                                // console.log(props);
                            }}
                            onBlur={(event, props) => {

                                if(event.target.value == undefined || event.target.value == '') {
                                    return;
                                }
                                
                                if(dateValue.toISOString().substring(0, 16) != event.currentTarget.value) {
                                    
                                    document.querySelector('.mapLoading').style.display = 'block';
                                    const newDate = new Date(event.currentTarget.value);
                                    
                                    setMapForDate(newDate, window.store.getState().prevHour);
                                    window.store.dispatch(updateDateString(setCurrPrevDateString(newDate, window.store.getState().prevHour)));
                                    setDateValue(newDate);
                                    window.store.dispatch(updateCurrDate(newDate));

                                    if(document.querySelector('.chart1') != null) {
                                        const data = window.draw.draw.getAll();
                                        if (data.features.length > 0) {
                                            if(window.draw.draw.getMode() !== 'direct_select') {
                                                setChartOnDraw(document.querySelector('.chart1'), document.querySelector('.chart2'), data, "YYYYMMDDhhmm", window.beforeExist);           
                                            }
                                        }
                                    }
                                }
                                
                            }}
                            // onFocus={(event) => {
                            //     console.log('onFocus');
                            // }}
                           
                        /> */}

                        {
                            <DatePicker
                                className="datepick-style"
                                format="YYYY-MM-DD HH:mm"
                                // disabledDate={disabledDate}
                                // disabledTime={disabledDateTime}
                                // showTime={{ defaultValue: moment("10:00", "HH:mm") }}
                                showTime={{ format: "HH:mm" }}
                                value={moment(dateValue, 'YYYY-MM-DD')}
                                showNow={false}
                                minuteStep={5}
                                //autoFocus={true}
                                inputReadOnly={true}
                                onOk={(event) => {

                                    document.querySelector('.mapLoading').style.display = 'block';
                                    window.currentDate = event._d;
                                    setMapForDate(event._d, window.store.getState().prevHour);
                                    window.store.dispatch(updateDateString(setCurrPrevDateString(event._d, window.store.getState().prevHour)));
                                    setDateValue(event._d);
                                    window.store.dispatch(updateCurrDate(event._d));

                                    if(document.querySelector('.chart1') != null) {
                                        const data = window.draw.draw.getAll();
                                        if (data.features.length > 0) {
                                            if(window.draw.draw.getMode() !== 'direct_select') {
                                                setChartOnDraw(document.querySelector('.chart1'), document.querySelector('.chart2'), data, "YYYYMMDDhhmm", window.beforeExist);           
                                            }
                                        }
                                    }                                    
                                }}
                            />
                        }
                    </div>}
                    {isUserLoggedIn && <ToggleButton value="check"  selected={false} onChange={() => { onChange(!selected); }} className={classes.menuButton}>상세 정보 보기</ToggleButton>}
                    {!isUserLoggedIn && <Link className={classes.color} to="/login">로그인</Link>}
                    {isUserLoggedIn && <Link className={classes.color} to="/logout" onClick={AuthenticationService.logout}>로그아웃</Link>}
                    </Toolbar>
                </AppBar>
            </div>            
        </header>
    )
}
export default withRouter(MenuComponent);
