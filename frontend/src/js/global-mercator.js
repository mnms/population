export function GlobalMercator() {
    this.tileSize = 256;
    this.initialResolution = 2 * Math.PI * 6378137 / this.tileSize;
    // 156543.03392804062 for this.tileSize 256 pixels
    this.originShift = 2 * Math.PI * 6378137 / 2.0;
}

/**
 * Converts given lat/lon in WGS84 Datum to XY in Spherical Mercator
 * EPSG:900913
 */
GlobalMercator.prototype.LatLonToMeters = function (lat, lon) {
    var sign = 1;
    if (lat >= 0) {
        sign = -1;
        lat = -lat;
    }
    var mx = lon * this.originShift / 180.0;
    var my = Math.log(Math.tan((90 + lat) * Math.PI / 360.0)) / (Math.PI / 180.0);
    my = my * this.originShift / 180.0;
    return [mx, sign * my];
};

/**
 * Converts XY point from Spherical Mercator EPSG:900913 to lat/lon in WGS84
 * Datum
 */
GlobalMercator.prototype.MetersToLatLon = function (mx, my) {
    var lon = (mx / this.originShift) * 180.0;
    var lat = (my / this.originShift) * 180.0;

    lat = 180.0 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180.0)) - Math.PI / 2.0);
    return [lat, lon];
};

/**
 * Converts pixel coordinates in given zoom level of pyramid to EPSG:900913
 */
GlobalMercator.prototype.PixelsToMeters = function (px, py, zoom) {
    var res = this.Resolution(zoom);
    var mx = px * res - this.originShift;
    var my = py * res - this.originShift;
    return [mx, my];
};

/**
 * Converts EPSG:900913 to pyramid pixel coordinates in given zoom level
 */
GlobalMercator.prototype.MetersToPixels = function (mx, my, zoom) {
    var res = this.Resolution(zoom);
    var px = Math.round((mx + this.originShift) / res);
    var py = Math.round((my + this.originShift) / res);
    return [parseInt(px, 10), parseInt(py, 10)];
};

GlobalMercator.prototype.MetersToPixels_Double = function (mx, my, zoom) {
    var res = this.Resolution(zoom);
    var px = (mx + this.originShift) / res;
    var py = (my + this.originShift) / res;
    return [px, py];
};

/**
 * Returns a tile covering region in given pixel coordinates
 */
GlobalMercator.prototype.PixelsToTile = function (px, py) {
    var tx = Math.ceil(px / this.tileSize - 1);
    var ty = Math.ceil(py / this.tileSize - 1);
    return [parseInt(tx, 10), parseInt(ty, 10)];
};

/**
 * Move the origin of pixel coordinates to top-left corner
 */
GlobalMercator.prototype.PixelsToRaster = function (px, py, zoom) {
    var mapSize = this.tileSize << zoom;
    return [px, parseInt(mapSize - py, 10)];
};

GlobalMercator.prototype.PixelsToRaster_Double = function (px, py, zoom) {
    var mapSize = this.tileSize << zoom;
    return [px, mapSize - py];
};

GlobalMercator.prototype.RasterToPixels = function (px, py, zoom) {
    var mapSize = this.tileSize << zoom;
    return [px, parseInt(mapSize - py, 10)];
};

GlobalMercator.prototype.RasterToPixels_Double = function (px, py, zoom) {
    var mapSize = this.tileSize << zoom;
    return [px, mapSize - py];
};

/**
 * Returns tile for given mercator coordinates
 */
GlobalMercator.prototype.MetersToTile = function (mx, my, zoom) {
    var p = this.MetersToPixels(mx, my, zoom);
    return this.PixelsToTile(p[0], p[1]);
};

/**
 * Returns bounds of the given tile in EPSG:900913 coordinates
 */
GlobalMercator.prototype.TileBounds = function (tx, ty, zoom) {
    var min = this.PixelsToMeters(tx * this.tileSize, ty * this.tileSize, zoom);
    var minx = min[0], miny = min[1];
    var max = this.PixelsToMeters((tx + 1) * this.tileSize, (ty + 1) * this.tileSize, zoom);
    var maxx = max[0], maxy = max[1];
    return [minx, miny, maxx, maxy];
};

/**
 * Returns bounds of the given tile in latitude/longitude using WGS84 datum
 */
GlobalMercator.prototype.TileLatLonBounds = function (tx, ty, zoom) {
    var bounds = this.TileBounds(tx, ty, zoom);
    var mins = this.MetersToLatLon(bounds[0], bounds[1]);
    var maxs = this.MetersToLatLon(bounds[2], bounds[3]);
    return [mins[0], mins[1], maxs[0], maxs[1]];
};

/**
 * Resolution (meters/pixel) for given zoom level (measured at Equator)
 */
GlobalMercator.prototype.Resolution = function (zoom) {
    // return (2 * Math.PI * 6378137) / (this.this.tileSize * 2**zoom)
    return this.initialResolution / Math.pow(2, zoom);
};

/**
 * Maximal scaledown zoom of the pyramid closest to the pixelSize
 */
GlobalMercator.prototype.ZoomForPixelSize = function (pixelSize) {
    for (var i = 0; i < 30; i++) {
        if (pixelSize > this.Resolution(i)) {
            if (i != 0) {
                return i - 1;
            } else {
                return 0; // We don't want to scale up
            }
        }
    }
    return 0;
};

/**
 * Converts TMS tile coordinates to Google Tile coordinates
 */
GlobalMercator.prototype.GoogleTileByTMS = function (tx, ty, zoom) {
    // coordinate origin is moved from bottom-left to top-left corner of the
    // extent
    return [tx, parseInt((Math.pow(2, zoom) - 1) - ty, 10)];
};

GlobalMercator.prototype.TMSTileFromGoogleTile = function (tx, ty, zoom) {
    // coordinate origin is moved from bottom-left to top-left corner of the
    // extent
    return [tx, parseInt((Math.pow(2, zoom) - 1) - ty, 10)];
};

/**
 * Converts a lat long coordinates to Google Tile Coordinates
 */
GlobalMercator.prototype.GoogleTile = function (lat, lon, zoom) {
    var meters = this.LatLonToMeters(lat, lon);
    var tile = this.MetersToTile(meters[0], meters[1], zoom);
    return this.GoogleTileByTMS(tile[0], tile[1], zoom);
};

/**
 * Converts TMS tile coordinates to Microsoft QuadTree
 */
GlobalMercator.prototype.QuadTree = function (tx, ty, zoom) {
    var quadKey = "";
    ty = parseInt((Math.pow(2, zoom) - 1) - ty, 10);
    for (var i = zoom; i < 0; i--) {
        var digit = 0;
        var mask = 1 << (i - 1);
        if ((tx & mask) != 0) {
            digit += 1;
        }
        if ((ty & mask) != 0) {
            digit += 2;
        }
        quadKey += (digit + "");
    }
    return quadKey;
};