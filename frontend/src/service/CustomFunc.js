import moment from '../js/moment.js';
import * as Highcharts from 'highcharts';

const MapdCon = require("@mapd/connector/dist/browser-connector");
const wellknown = require("wellknown");
const config = require ("../server.json");

function numberWithCommas(x) {
    if( x == 0 || x == undefined ) {
        return 0;
    }
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function numberFloor(x) {
    if( x == 0 || x == undefined ) {
        return 0;
    }
    return Math.floor(Math.floor((x/Math.pow(10, x.toString().length-1))) * Math.pow(10, x.toString().length-1));
}

export function setChartOnDraw(chart1ContainerRef, chart2ContainerRef, data, eventTimeFormat, exist, isQuery) {
    if(isQuery) {

        if( window.statistics.length > 0 ) {
            const currStatistics = window.currStatistics;
            const statistics = window.statistics;
            const eventTime1 = window.store.getState().dateString.curr;
            // const hours = statistics.map(function (s) {
            //     return s.event_time.toString().substr(s.event_time.toString().length - 2, s.event_time.toString().length);
            // })

            let hours = [];
            let standHour = parseInt(eventTime1.substr(eventTime1.length-4, 2));
            for( var i=0 ; i<24; i++ ){
                if(standHour < 0) { 
                    standHour = 23;   
        
                    let hourString = standHour.toString();
                    if(hourString < 10) {
                        hourString = '0' + hourString;
                    }
                    hours.push(hourString);
                    standHour--;
                } else {
                    let hourString = standHour.toString();
                    if(hourString < 10) {
                        hourString = '0' + hourString;
                    }
                    hours.push(hourString);
                    standHour--;
                }
            }

            hours.reverse();

            const currData = currStatistics.map(function (s) {
                let sum = 0;
                for (let key in s) {
                    if(key !== 'event_time') {
                        if(exist != undefined) {
                            if( exist.indexOf(key) > -1 ) {
                                sum += s[key];
                            }
                        } else {
                            sum += s[key];
                        }
                    }
                }
                return parseInt(sum);
            })

            const datas = statistics.map(function (s) {
                let sum = 0;
                for (let key in s) {
                    if(key !== 'event_time') {
                        if(exist != undefined) {
                            if( exist.indexOf(key) > -1 ) {
                                sum += s[key];
                            }
                        } else {
                            sum += s[key];
                        }
                    }
                }
                return {hour: s.event_time.substr(s.event_time.length - 2, s.event_time.length), sum: parseInt(sum)};
            })

            let resultDatas = [];

            if( hours[hours.length-1] === datas[0].hour ) {
                datas.forEach(function(data, index) {
                    if(index != 0) {
                        resultDatas.push(data);
                    }
                });
            } else {
                resultDatas = datas;
            }

            let result = [];
            hours.forEach(function(hour, index) {
                result[index] = 0;
                resultDatas.forEach(function(json, index2) {
                    if(hour === json.hour) {
                        result[index] = json.sum;
                    }
                })
            })

            for(let i=0; i<result.length; i++) {
                if(result[i] === undefined) {
                    result[i] = 0;
                }
            }

            const yAxisMin2 = result.reduce(function(a, b) {
                return Math.min(a, b);
            });

            Highcharts.chart(chart2ContainerRef, {
                chart: {
                    type: 'line',
                    width:chart2ContainerRef.offsetWidth,
                    height: chart2ContainerRef.parentNode.offsetHeight
                },
                credits: {
                    enabled: false
                },        
                title: {
                    text: ''
                },
                subtitle: {
                    text: '영역 내 최근 24시간 유동인구 변화 추이'
                },
                yAxis: {
                    min: numberFloor(parseInt(yAxisMin2 / 2)),
                    title: {
                        text: ''
                    },
                    tickInterval: (numberFloor(parseInt(yAxisMin2 / 2)) / 10),    
                    labels: {
                        formatter: function () {
                            return this.value;
                        }
                    }
                },
                xAxis: {
                    categories: hours,
                    crosshair: true
                },
                series: [{
                    name: '',
                    data: result,
                    showInLegend: false
                }],
            });

            const currSum = (currData.length == 0 ? 0 : currData[0]);
            let prevSum = result[result.length - 2];

            if(prevSum == undefined) {
                prevSum = 0;
            }
            
            let increasePop = 0;
            let increasePer = 0;
            if(result.length > 1) {
                increasePop = (currSum - result[result.length - 2]);
                increasePer = ( (currSum - result[result.length - 2]) / result[result.length - 2] * 100 );
            }
            
            document.querySelector('.curr-sum').textContent  = '영역 내 유동인구 수 : ' + numberWithCommas(currSum) + '명';
            document.querySelector('.prev-sum').textContent  = '최근 1시간 평균 유동인구 수: ' + numberWithCommas(prevSum) + '명';
            document.querySelector('.increase-pop').textContent  = '증감 인구 수: ' + numberWithCommas(increasePop) + '명';
            document.querySelector('.increase-percent').textContent  = '최근 1시간 평균 유동인구 대비: ' + (isNaN(increasePer) ? 'NA' : (increasePer.toFixed(2) + '%'));

            return;
        } else {
            return;
        }
    }

    const wkt = wellknown.stringify(data.features[0].geometry);
    window.shapeWkt = wkt;
    const maxEventTime = moment(window.store.getState().dateString.curr, eventTimeFormat);
    const startMaxHour = moment(window.store.getState().dateString.curr, 'YYYYMMDDHH');
    const eventTime1 = window.store.getState().dateString.curr;

    const time = moment.duration(24, 'hours');
    const timeUnit = moment.duration(1, 'hours');
    const eventTime2 = maxEventTime.subtract(time).format(eventTimeFormat);

    let QueryTimeArray = [];
    QueryTimeArray.push( ("'" + startMaxHour.format('YYYYMMDDHHmm') + "'") );
    for(let i=0; i<23; i ++) {
        QueryTimeArray.push( ("'" + startMaxHour.subtract(timeUnit).format('YYYYMMDDHHmm') + "'") );
    }

    let hours = [];
    let standHour = parseInt(eventTime1.substr(eventTime1.length-4, 2));
    for( var i=0 ; i<24; i++ ){
        if(standHour < 0) { 
            standHour = 23;   

            let hourString = standHour.toString();
            if(hourString < 10) {
                hourString = '0' + hourString;
            }
            hours.push(hourString);
            standHour--;
        } else {
            let hourString = standHour.toString();
            if(hourString < 10) {
                hourString = '0' + hourString;
            }
            hours.push(hourString);
            standHour--;
        }
    }

    hours.reverse();

    const chart1 = Highcharts.chart(chart1ContainerRef, {
        chart: {
            type: 'column',
            width:chart1ContainerRef.offsetWidth,
            height: chart1ContainerRef.parentNode.offsetHeight
        },   
        credits: {
            enabled: false
        },
        title: {
            text: ''
        },   
        subtitle: {
            text: ''
        },
        xAxis: {
            categories: [
                '10대 이하',
                '20대',
                '30대',
                '40대',
                '50대',
                '60대 이상',
            ],
            crosshair: true
        },
        yAxis: {
            min: 0,
            title: {
                text: '인구 수(sum)'
            },
            tickInterval: 10,
            labels: {
                formatter: function () {
                    return this.value;
                }
            }            
        },  
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
            }
        }, 
        legend: {
            align: 'center',
            verticalAlign: 'top',
        },   
        series: [{
            name: '남성',
            color: 'rgb(50,161,255)',
            data: []
        }, {
            name: '여성',
            color: 'rgb(255,91,180)',
            data: []   
        }]                                     
    })

    const chart2 = Highcharts.chart(chart2ContainerRef, {
        chart: {
            type: 'column',
            width:chart2ContainerRef.offsetWidth,
            height: chart2ContainerRef.parentNode.offsetHeight
        },   
        credits: {
            enabled: false
        },
        title: {
            text: ''
        },   
        subtitle: {
            text: '영역 내 최근 24시간 유동인구 변화 추이'
        },     
        yAxis: {
            min: 0,
            title: {
                text: ''
            },
            tickInterval: 10,    
            labels: {
                formatter: function () {
                    return this.value;
                }
            }
        },    
        xAxis: {
            categories: hours,
            crosshair: true
        },        
        series: [{
            name: '',
            data: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
            showInLegend: false
        }],                         
    })    

    chart1.showLoading();
    chart2.showLoading();
    document.querySelector('.curr-sum').textContent  = '영역 내 유동인구 수 : 0명';
    document.querySelector('.prev-sum').textContent  = '최근 1시간 평균 유동인구 수:  0명';
    document.querySelector('.increase-pop').textContent  = '증감 인구 수:  0명';
    document.querySelector('.increase-percent').textContent  = '최근 1시간 평균 유동인구 대비: NA';

    const currDateQuery = `
    SELECT
        (sum(exist_m_00) + sum(exist_m_10)) as exist_m_10, sum(exist_m_20) as exist_m_20, sum(exist_m_30) as exist_m_30,
        sum(exist_m_40) as exist_m_40, sum(exist_m_50) as exist_m_50, (sum(exist_m_60) + sum(exist_m_70) +
        sum(exist_m_80) + sum(exist_m_90)) as exist_m_60,
        (sum(exist_f_00) + sum(exist_f_10)) as exist_f_10, sum(exist_f_20) as exist_f_20, sum(exist_f_30) as exist_f_30,
        sum(exist_f_40) as exist_f_40, sum(exist_f_50) as exist_f_50, (sum(exist_f_60) + sum(exist_f_70) +
        sum(exist_f_80) + sum(exist_f_90)) as exist_f_60, event_time        
    FROM ltdb_fp    
    WHERE ST_CONTAINS(ST_GEOMFROMTEXT('${wkt}'), geometry) AND event_time = '${eventTime1}'
    GROUP BY event_time ORDER BY event_time`;

    const query = `
    SELECT
        (sum(exist_m_00) + sum(exist_m_10)) as exist_m_10, sum(exist_m_20) as exist_m_20, sum(exist_m_30) as exist_m_30,
        sum(exist_m_40) as exist_m_40, sum(exist_m_50) as exist_m_50, (sum(exist_m_60) + sum(exist_m_70) +
        sum(exist_m_80) + sum(exist_m_90)) as exist_m_60,
        (sum(exist_f_00) + sum(exist_f_10)) as exist_f_10, sum(exist_f_20) as exist_f_20, sum(exist_f_30) as exist_f_30,
        sum(exist_f_40) as exist_f_40, sum(exist_f_50) as exist_f_50, (sum(exist_f_60) + sum(exist_f_70) +
        sum(exist_f_80) + sum(exist_f_90)) as exist_f_60,
        substring(event_time, 0, ${eventTimeFormat.length - 2}) as event_time
    FROM ltdb_fp
    WHERE ST_CONTAINS(ST_GEOMFROMTEXT('${wkt}'), geometry) AND event_time IN(${QueryTimeArray.toString()})  GROUP BY event_time ORDER BY event_time`; //AND event_time >= '${eventTime2}' AND event_time <= '${eventTime1}'                 

    // const query = `
    // WITH statistics AS (${subQuery}) 
    // SELECT avg(exist_m_10) as exist_m_10, avg(exist_m_20) as exist_m_20,
    //     avg(exist_m_30) as exist_m_30, avg(exist_m_40) as exist_m_40, avg(exist_m_50) as exist_m_50, avg(exist_m_60) as exist_m_60,
    //     avg(exist_f_10) as exist_f_10, avg(exist_f_20) as exist_f_20, avg(exist_f_30) as exist_f_30, avg(exist_f_40) as exist_f_40, 
    //     avg(exist_f_50) as exist_f_50, avg(exist_f_60) as exist_f_60, event_time
    // FROM statistics GROUP BY event_time ORDER BY event_time`;

    // const query = `
    // SELECT sum(exist_m_10) as exist_m_10, sum(exist_m_20) as exist_m_20,
    //     sum(exist_m_30) as exist_m_30, sum(exist_m_40) as exist_m_40, sum(exist_m_50) as exist_m_50, sum(exist_m_60) as exist_m_60,
    //     sum(exist_f_10) as exist_f_10, sum(exist_f_20) as exist_f_20, sum(exist_f_30) as exist_f_30, sum(exist_f_40) as exist_f_40, 
    //     sum(exist_f_50) as exist_f_50, sum(exist_f_60) as exist_f_60, event_time
    // FROM (${subQuery}) GROUP BY event_time ORDER BY event_time`;

    // console.log(query);
    new MapdCon()
        .host(config.host)
        .port(config.port[1])
        .dbName(config.database)
        .user(config.user)
        .password(config.password)
        .connectAsync()
        .then(function (connector) {
            connector.queryAsync(currDateQuery).then(function (statistics) {
                // if( statistics.length > 0 ) {

                    //if(eventTime1 === statistics[statistics.length - 1].event_time) {

                    window.currStatistics = statistics;

                    const currSumData = statistics.map(function (s) {
                        let sum = 0;
                        for (let key in s) {
                            if(key !== 'event_time') {
                                if(exist != undefined) {
                                    if( exist.indexOf(key) > -1 ) {
                                        sum += s[key];
                                    }
                                } else {
                                    sum += s[key];
                                }
                            }
                        }
                        return parseInt(sum);
                    })

                    connector.queryAsync(query).then(function (statistics2) {
                        // console.log(statistics2);
                        window.statistics = statistics2;

                        // const hours = statistics2.map(function (s) {
                        //     return s.event_time.toString().substr(s.event_time.toString().length - 2, s.event_time.toString().length);
                        // })

                        if(statistics2.length > 0) {

                            const datas = statistics2.map(function (s) {
                                let sum = 0;
                                for (let key in s) {
                                    if(key !== 'event_time') {
                                        if(exist != undefined) {
                                            if( exist.indexOf(key) > -1 ) {
                                                sum += s[key];
                                            }
                                        } else {
                                            sum += s[key];
                                        }
                                    }
                                }
                                return {hour: s.event_time.substr(s.event_time.length - 2, s.event_time.length), sum: parseInt(sum)};
                            })
                            
                            let resultDatas = [];
    
                            if( hours[hours.length-1] === datas[0].hour ) {
                                datas.forEach(function(data, index) {
                                    if(index != 0) {
                                        resultDatas.push(data);
                                    }
                                });
                            } else {
                                resultDatas = datas;
                            }
    
                            let result = [];
                            hours.forEach(function(hour, index) {
                                result[index] = 0;
                                resultDatas.forEach(function(json, index2) {
                                    if(hour === json.hour) {
                                        result[index] = json.sum;
                                    }
                                })
                            })
                
                            for(let i=0; i<result.length; i++) {
                                if(result[i] === undefined) {
                                    result[i] = 0;
                                }
                            }                            
    
                            const currentData = statistics[statistics.length - 1];
                            let manArray = [0,0,0,0,0,0];
                            let womanArray = [0,0,0,0,0,0];
                            for (let key in currentData) {
                                if(key.indexOf('_m_') > -1) {
                                    currentData[key] = parseInt(currentData[key]);
                                    if(key.indexOf('_10') > -1) {
                                        manArray[0] += currentData[key];
                                    } else if(key.indexOf('_20') > -1) {
                                        manArray[1] += currentData[key];
                                    } else if(key.indexOf('_30') > -1) {
                                        manArray[2] += currentData[key];
                                    } else if(key.indexOf('_40') > -1) {
                                        manArray[3] += currentData[key];
                                    } else if(key.indexOf('_50') > -1) {
                                        manArray[4] += currentData[key];
                                    } else if(key.indexOf('_60') > -1) {
                                        manArray[5] += currentData[key];
                                    }
                                } else {
                                    currentData[key] = parseInt(currentData[key]);
                                    if(key.indexOf('_10') > -1) {
                                        womanArray[0] += currentData[key];
                                    } else if(key.indexOf('_20') > -1) {
                                        womanArray[1] += currentData[key];
                                    } else if(key.indexOf('_30') > -1) {
                                        womanArray[2] += currentData[key];
                                    } else if(key.indexOf('_40') > -1) {
                                        womanArray[3] += currentData[key];
                                    } else if(key.indexOf('_50') > -1) {
                                        womanArray[4] += currentData[key];
                                    } else if(key.indexOf('_60') > -1) {
                                        womanArray[5] += currentData[key];
                                    }
                                }
                            }
                            
                            // console.log('manArray : ' + manArray);
                            // console.log('womanArray : ' + womanArray);
                            
                            createCharts(chart1ContainerRef, chart2ContainerRef, hours, result, manArray, womanArray);
                            
                            const currSum = (currSumData.length == 0 ? 0 : currSumData[0]);
                            let prevSum = result[result.length - 2];
        
                            if(prevSum == undefined) {
                                prevSum = 0;
                            }
                            
                            let increasePop = 0;
                            let increasePer = 0;
                            if(result.length > 1) {
                                increasePop = (currSum - result[result.length - 2]);
                                increasePer = ( (currSum - result[result.length - 2]) / result[result.length - 2] * 100 );
                            }
                            
                            document.querySelector('.curr-sum').textContent  = '영역 내 유동인구 수 : ' + numberWithCommas(currSum) + '명';
                            document.querySelector('.prev-sum').textContent  = '최근 1시간 평균 유동인구 수: ' + numberWithCommas(prevSum) + '명';
                            document.querySelector('.increase-pop').textContent  = '증감 인구 수: ' + numberWithCommas(increasePop) + '명';
                            document.querySelector('.increase-percent').textContent  = '최근 1시간 평균 유동인구 대비: ' + (isNaN(increasePer) ? 'NA' : (increasePer.toFixed(2) + '%'));
                            
                        } else {
                            chart1.hideLoading();
                            chart2.hideLoading(); 
                        }

                    });

                // } else {
                //     chart1.hideLoading();
                //     chart2.hideLoading();                    
                // }
            });
        })     
}

export function createCharts(chart1ContainerRef, chart2ContainerRef, hours, data, manArray, womanArray) {

    const yAxisMin1 = manArray.reduce(function(a, b) {
        return Math.min(a, b);
    });

    const yAxisMin2 = data.reduce(function(a, b) {
        return Math.min(a, b);
    });

    // console.log(numberFloor(parseInt(yAxisMin1 / 2)))
    // console.log(numberFloor(parseInt(yAxisMin2 / 2)))

    Highcharts.chart(chart1ContainerRef, {
        chart: {
            type: 'column',
            width:chart1ContainerRef.offsetWidth,
            height: chart1ContainerRef.parentNode.offsetHeight
        },
        credits: {
            enabled: false
        },
        title: {
            text: ''
        },
        subtitle: {
            text: ''
        },
        xAxis: {
            categories: [
                '10대 이하',
                '20대',
                '30대',
                '40대',
                '50대',
                '60대 이상',
            ],
            crosshair: true
        },
        yAxis: {
            min: numberFloor(parseInt(yAxisMin1 / 2)),
            title: {
                text: '인구 수(sum)'
            },
            tickInterval: (numberFloor(parseInt(yAxisMin1 / 2)) / 10),
            labels: {
                formatter: function () {
                    return this.value;
                }
            }            
        },
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y:.1f}</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
            }
        },
        legend: {
            align: 'center',
            verticalAlign: 'top',
        },        
        series: [{
            name: '남성',
            color: 'rgb(50,161,255)',
            data: manArray
        }, {
            name: '여성',
            color: 'rgb(255,91,180)',
            data: womanArray   
        }]
    });
    

    Highcharts.chart(chart2ContainerRef, {
        chart: {
            type: 'line',
            width:chart2ContainerRef.offsetWidth,
            height: chart2ContainerRef.parentNode.offsetHeight
        },
        credits: {
            enabled: false
        },        
        title: {
            text: ''
        },
    
        subtitle: {
            text: '영역 내 최근 24시간 유동인구 변화 추이'
        },
    
        yAxis: {
            min: numberFloor(parseInt(yAxisMin2 / 2)),
            title: {
                text: ''
            },
            tickInterval: (numberFloor(parseInt(yAxisMin2 / 2)) / 10),    
            labels: {
                formatter: function () {
                    return this.value;
                }
            }
        },
    
        xAxis: {
            categories: hours,
            crosshair: true
        },
    
        // legend: {
        //     layout: 'vertical',
        //     align: 'right',
        //     verticalAlign: 'middle'
        // },
    
        series: [{
            name: '',
            data: data,
            showInLegend: false
        }],
    
        // responsive: {
        //     rules: [{
        //         condition: {
        //             maxWidth: 500
        //         },
        //         chartOptions: {
        //             legend: {
        //                 layout: 'horizontal',
        //                 align: 'center',
        //                 verticalAlign: 'bottom'
        //             }
        //         }
        //     }]
        // }
    
    });
}

export function getCurrentDate() {
    var date = new Date();
    var year = date.getFullYear().toString();

    var month = date.getMonth() + 1;
    month = month < 10 ? '0' + month.toString() : month.toString();

    var day = date.getDate();
    day = day < 10 ? '0' + day.toString() : day.toString();

    var hour = date.getHours();
    hour = hour < 10 ? '0' + hour.toString() : hour.toString();

    var minites = date.getMinutes();
    minites = minites < 10 ? '0' + minites.toString() : minites.toString();

    var seconds = date.getSeconds();
    seconds = seconds < 10 ? '0' + seconds.toString() : seconds.toString();

    var milliseconds = date.getMilliseconds();
    return year + month + day + hour + ' ' + minites + ' ' + seconds + ' ' + milliseconds;
}

export function timeStamp(getDate) { 
    let cloneDate = {date : getDate};
    cloneDate = JSON.parse(JSON.stringify(cloneDate));
    cloneDate = new Date(JSON.parse(JSON.stringify(cloneDate)).date);
    cloneDate.setHours(cloneDate.getHours() + 9);
    return cloneDate.toISOString().substring(0, 16); 
}

export function getDateString(getDate) {
    
    if(getDate == null) {
        return '  최신 데이터 가져오는 중...  ';
    }

    let date;
    if(getDate instanceof Date) {
        date = getDate;
    } else {
        date = getDate._d;
    }

    var year = date.getFullYear().toString();

    var month = date.getMonth() + 1;
    month = month < 10 ? '0' + month.toString() : month.toString();

    var day = date.getDate();
    day = day < 10 ? '0' + day.toString() : day.toString();

    var hour = date.getHours();
    hour = hour < 10 ? '0' + hour.toString() : hour.toString();

    var minites = date.getMinutes();
    minites = minites < 10 ? '0' + minites.toString() : minites.toString();

    return '데이터 기준: ' + year + '년 ' + month + '월 ' + day + '일  ' + hour + '시 ' + minites + '분';
}

export function getDateFormat(getDate) {
    
    let date;
    if(getDate instanceof Date) {
        date = getDate;
    } else {
        date = getDate._d;
    }

    var year = date.getFullYear().toString();

    var month = date.getMonth() + 1;
    month = month < 10 ? '0' + month.toString() : month.toString();

    var day = date.getDate();
    day = day < 10 ? '0' + day.toString() : day.toString();

    var hour = date.getHours();
    hour = hour < 10 ? '0' + hour.toString() : hour.toString();

    var minites = date.getMinutes();
    minites = minites < 10 ? '0' + minites.toString() : minites.toString();

    return '' + year + '' + month + '' + day + '' + hour + '' + minites;
}

export function setCurrPrevDateString(getDate, hour) {

    let date;
    if(getDate instanceof Date) {
        date = getDate;
    } else {
        date = getDate._d;
    }

    //현재 날짜
    const currentDate = moment(getDateFormat(date), "YYYYMMDDhhmm");

    //ex 1시간 전 날짜
    const time = moment.duration(hour);
    const prevDate = currentDate.subtract(time).format("YYYYMMDDhhmm");

    return {curr: getDateFormat(date), prev: prevDate};
}

export function setMapForDate(getDate, hour) {

    let date;
    if(getDate instanceof Date) {
        date = getDate;
    } else {
        date = getDate._d;
    }

    //현재 날짜
    const currentDate = moment(getDateFormat(date), "YYYYMMDDhhmm");

    //ex 1시간 전 날짜
    const time = moment.duration(hour);
    const prevDate = currentDate.subtract(time).format("YYYYMMDDhhmm");

    updateLayer(getDateFormat(date), prevDate);
}

function updateLayer(currDate, prevDate) {
    let currWeight = window.beforeMap.getLayer('vector-tile').getPaintProperty('heatmap-weight');
    currWeight[currWeight.length - 2] = 10000000;
    currWeight[currWeight.length - 4] = 5000000;
    const currMax = window.beforeMap.getLayer('vector-tile').getPaintProperty('statistics-max');
    let prevWeight = window.afterMap.getLayer('vector-tile2').getPaintProperty('heatmap-weight');
    prevWeight[prevWeight.length - 2] = 10000000;
    prevWeight[prevWeight.length - 4] = 5000000;
    const prevMax = window.afterMap.getLayer('vector-tile2').getPaintProperty('statistics-max');

    window.beforeMap.removeLayer('vector-tile');
    window.beforeMap.removeSource('vector-tile');
    window.afterMap.removeLayer('vector-tile2');
    window.afterMap.removeSource('vector-tile2');

    //////////////////////
    window.beforeMove = true;
    window.afterMove = true;
    /////////////////////

    if(window.selectQuery === undefined) {
        window.selectQuery = '(exist_m_00 + exist_m_10 + exist_m_20 + exist_m_30 + exist_m_40 + exist_m_50 + exist_m_60 + exist_m_70 + exist_m_80 + exist_m_90 + exist_f_00 + exist_f_10 + exist_f_20 + exist_f_30 + exist_f_40 + exist_f_50 + exist_f_60 + exist_f_70 + exist_f_80 + exist_f_90) as exist';
    }

    window.beforeMap.addSource('vector-tile', {
        type: 'vector',
        tilesFunction: `function (tile) {
                var host = tile.tilesFunctionParams.host;
                var port = tile.tilesFunctionParams.port; 

                var sql = "SELECT ${window.selectQuery}, geometry FROM ltdb_fp WHERE event_time = '${currDate}'";
                var typeName = "ltdb_fp";
                var aggrType = "sum";
                var multiple = false;
                var bbox = ${JSON.stringify([126.76487604016523,37.42806780710028,127.18416090045505,37.70130441174812])};
                return renderSqlPost(host, port, tile, sql, typeName, aggrType, multiple, null);
            }`,
        minzoom: 10,
        maxzoom: 16.1
    });
    
    window.beforeMap.addLayer(
        {
        'id': 'vector-tile',
        'type': 'heatmap',
        'source': 'vector-tile',
        'source-layer': 'ltdb_fp',
        'maxzoom': 16.1,
        'minzoom': 10,
        'paint': {
        // Increase the heatmap weight based on frequency and property magnitude
        'heatmap-weight': currWeight,
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
        'statistics-max' : currMax
        }
        }
    ); 

    window.afterMap.addSource('vector-tile2', {
        type: 'vector',
        tilesFunction: `function (tile) {
                var host = tile.tilesFunctionParams.host;
                var port = tile.tilesFunctionParams.port;

                var sql1 = "SELECT ${window.selectQuery}, geometry FROM ltdb_fp WHERE event_time = '${currDate}'";
                var sql2 = "SELECT ${window.selectQuery}, geometry FROM ltdb_fp WHERE event_time = '${prevDate}'";
                var typeName = "ltdb_fp";
                var aggrType = "sum";
                var multiple = false;
                var bbox = ${JSON.stringify([126.76487604016523,37.42806780710028,127.18416090045505,37.70130441174812])};
                return renderSqlDiffPost(host, port, tile, sql1, sql2, typeName, aggrType, multiple, null);
            }`,
        minzoom: 10,
        maxzoom: 16.1
    });
    
    window.afterMap.addLayer(
        {
        'id': 'vector-tile2',
        'type': 'heatmap',
        'source': 'vector-tile2',
        'source-layer': 'ltdb_fp',
        'maxzoom': 16.1,
        'minzoom': 10,
        'paint': {
        // Increase the heatmap weight based on frequency and property magnitude
        'heatmap-weight': prevWeight,
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
        'heatmap-opacity': 0.5,
        'statistics-max' : prevMax
        }
        }
    );           
}

// window.afterMap.querySourceFeatures('vector-tile', {
//     'sourceLayer': 'ltdb_fp'
// });
export function calculateSumAndMax(mapObj, sourceName, propertyNames) {

    const features = mapObj.querySourceFeatures(sourceName, {
        'sourceLayer': 'ltdb_fp'
    });

    if(features == undefined || features.length == 0) {
        return;
    }

    //let sum = 0;
    let max = 0;
    let first = true;
    for (let i = 0; i < features.length; i++) {
        let s = 0;
        for (let key in features[i].properties) {
            if (isNaN(features[i].properties[key])) {
                if (first) {
                    // console.log(features[i]);
                    first = false;
                }
                continue;
            }
            if (propertyNames && propertyNames.indexOf(key) === -1) {
                continue;
            }
            s += features[i].properties[key];
        }
        max = Math.max(max, s)
        //sum += s;
    }
    // console.log(max);
    let weight = mapObj.getPaintProperty(sourceName, 'heatmap-weight');
    weight[weight.length - 2] = parseInt(max);//parseInt(sum/max) / 2;
    mapObj.setPaintProperty(sourceName, 'heatmap-weight', weight);

    if( mapObj.getPaintProperty(sourceName, 'heatmap-opacity') == 0 ) {
        mapObj.setPaintProperty(sourceName, 'heatmap-opacity', 0.5);
    }
}

export function getCalculateMax(mapObj, sourceName, propertyNames) {

    const features = mapObj.querySourceFeatures(sourceName, {
        'sourceLayer': 'ltdb_fp'
    });

    if(features == undefined || features.length == 0) {
        return;
    }

    //let sum = 0;
    let max = 0;
    let first = true;
    for (let i = 0; i < features.length; i++) {
        let s = 0;
        for (let key in features[i].properties) {
            if (isNaN(features[i].properties[key])) {
                if (first) {
                    // console.log(features[i]);
                    first = false;
                }
                continue;
            }
            if (propertyNames && propertyNames.indexOf(key) === -1) {
                continue;
            }
            s += features[i].properties[key];
        }
        max = Math.max(max, s)
        //sum += s;
    }
    return max;
}

export function calculateShape(mapObj, sourceName) {
    const features = mapObj.querySourceFeatures(sourceName, {
        'sourceLayer': 'ltdb_fp'
    });

    if(features == undefined || features.length == 0) {
        return;
    }

    const resultFeatures = features.filter(function(feature, index) {
        return window.Turf.intersect(feature, window.draw.draw.getAll().features[0]);
    })

    var resultSum = {};
    for (let i = 0; i < resultFeatures.length; i++) {
        for (let key in resultFeatures[i].properties) {
            if(resultSum[key] == undefined) {
                resultSum[key] = 0;
            }
            resultSum[key] += resultFeatures[i].properties[key];              
        }
    }

    var result = [];
    for (let key in resultSum) {
        let json = {};
        //json[key] = resultSum[key];
        json.sum = resultSum[key];
        json.gender = (key.indexOf('_f_') > -1 ? 'f' : 'm');
        json.age = key.substr(key.length-2);

        result.push(json);
    }
    // console.log(result);
    return result;
}

export function calculateSumAndMax2(mapObj, sourceName) {
   
    if(mapObj.getLayer(sourceName) == undefined) {
        document.querySelector('.mapLoading').style.display = 'block';
        return;
    }
    
    document.querySelector('.mapLoading').style.display = 'none';
    
    let max = Number.MIN_VALUE;
    let config = mapObj.getProgramConfigurations(sourceName, sourceName);
    for (let i = 0; i < config.length; i++) {
        // console.log(config[i].programConfigurations['vector-tile']);
        const maxValue = config[i].programConfigurations[sourceName].binders['statistics-max'].maxValue;
        //const sumValue = config[i].programConfigurations['vector-tile'].binders['statistics-sum'].sumValue;
    
        max = Math.max(max, maxValue);
        //sum += sumValue;
    }
    // console.log(max);  

    if(max == 5e-324) {
        max = 10000000;
    } 

    let weight = mapObj.getPaintProperty(sourceName, 'heatmap-weight');
    weight[weight.length - 2] = parseInt(max);//parseInt(sum/max) / 2;
    weight[weight.length - 4] = parseInt(max/4);//parseInt(sum/max) / 2;
    mapObj.setPaintProperty(sourceName, 'heatmap-weight', weight);

    if( mapObj.getPaintProperty(sourceName, 'heatmap-opacity') == 0 ) {
        mapObj.setPaintProperty(sourceName, 'heatmap-opacity', 0.5);
    }    
}

export function getCalculateMax2(mapObj, sourceName, propertyNames) {

    const features = mapObj.querySourceFeatures(sourceName, {
        'sourceLayer': 'ltdb_fp'
    });

    if(features == undefined || features.length == 0) {
        return;
    }

    //let sum = 0;
    let max = 0;
    let first = true;
    for (let i = 0; i < features.length; i++) {
        let s = 0;
        for (let key in features[i].properties) {
            if (isNaN(features[i].properties[key])) {
                if (first) {
                    // console.log(features[i]);
                    first = false;
                }
                continue;
            }
            if (propertyNames && propertyNames.indexOf(key) === -1) {
                continue;
            }
            s += features[i].properties[key];
        }
        max = Math.max(max, s)
        //sum += s;
    }
    return max;
}

export function checkFieldToAge(key) {
    if(key.indexOf('_00') > -1) {
        return '00';
    } else if(key.indexOf('_10') > -1) {

    }
}
