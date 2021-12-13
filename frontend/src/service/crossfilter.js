import * as crossFilter from '../js/mapd-crossfilter';

let Crossfilter = null

export function createCf (con, TABLE_NAME) {
  return crossFilter.crossfilter(con, TABLE_NAME).then(cf => {
    Crossfilter = cf
    return Promise.resolve(cf, con)
  })
}

export function getCf () {
  return Crossfilter
}
