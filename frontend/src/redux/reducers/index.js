import * as types from "../constants/action-types";
const MapdCon = require("@mapd/connector/dist/browser-connector");
const config = require ("../../../src/server.json");

const initialState = {
    menuSeleted : false,
    currentDate : new Date('2021-03-15 10:00'),
    prevHour : "01:00:00",
    dateString : {
        curr : '202103151000',
        prev : '202103150900'
    }
};

function rootReducer(state = initialState, action) {

    if(action.type === types.ROOT_STATES) {
        return Object.assign({}, state, {
            menuSeleted: action.payload
        });
    } else if(action.type === types.SET_C_DATE) {
        return Object.assign({}, state, {
            currentDate: action.payload
        });        
    } else if(action.type === types.SET_P_HOUR) {
        return Object.assign({}, state, {
            prevHour: action.payload
        });        
    } else if(action.type === types.SET_DATE_STRING) {
        return Object.assign({}, state, {
            dateString: action.payload
        });        
    }

    return state;
}

export default rootReducer;

