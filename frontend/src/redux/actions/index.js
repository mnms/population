import { ROOT_STATES, SET_C_DATE, SET_P_HOUR, SET_DATE_STRING } from "../constants/action-types";

export function updateStates(payload) {
    return {type: ROOT_STATES, payload}
}

export function updateCurrDate(payload) {
    return {type: SET_C_DATE, payload}
}

export function updatePrevHour(payload) {
    return {type: SET_P_HOUR, payload}
}

export function updateDateString(payload) {
    return {type: SET_DATE_STRING, payload}
}