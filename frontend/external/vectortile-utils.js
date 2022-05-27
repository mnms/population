function _decompress(base64) {
    var binary_string = atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    var result = pako.inflate(bytes);
    console.log("decompress", len, result.length);
    return result;
}

function _single(data) {
    return data.buffer;
}

function _multi(data) {
    var buffers = [];
    for (var i = 0; i < data.length; i++) {
        var len = 0;
        len |= data[i++] << 24;
        len |= data[i++] << 16;
        len |= data[i++] << 8;
        len |= data[i++];

        var bytes = new Uint8Array(len);
        for (var j = 0; j < len; j++) {
            bytes[j] = data[i + j];
        }
        buffers.push(bytes.buffer);

        i = i + len - 1;
    }
    return buffers;
}

function renderSqlThrift(host, port, tile, sql, typeName, aggrType, multiple, bbox, valueFilter) {
    var zoom = tile.tileID.canonical.z;
    var tx = tile.tileID.canonical.x;
    var ty = tile.tileID.canonical.y;
    if (bbox) {
        var mercator = new GlobalMercator();
        var xy = mercator.TMSTileFromGoogleTile(tx, ty, zoom);
        var bounds = mercator.TileLatLonBounds(xy[0], xy[1], zoom);

        var minx = Math.min(bounds[1], bounds[3]);
        var miny = Math.min(bounds[0], bounds[2]);
        var maxx = Math.max(bounds[1], bounds[3]);
        var maxy = Math.max(bounds[0], bounds[2]);

        var intersects = !(minx > bbox[2] || maxx < bbox[0] || miny > bbox[3] || maxy < bbox[1]);
        if (!intersects) {
            return new Promise(function (resolve, reject) {
                resolve(typeName);
            });
        }
    }

    var mapdCon = new MapdCon();
    mapdCon._protocol = ['https'];
    mapdCon._sessionId = ['0'];
    return mapdCon
        .host(host)
        .port(port)
        .dbName("default")
        .user("ltdb")
        .password("ltdb")
        .initClients()
        .renderVegaAsync("0", JSON.stringify({
            "sql": sql,
            "zoom": zoom,
            "tx": tx,
            "ty": ty,
            "typeName": typeName,
            "aggrType": aggrType,
            "multiple": multiple ? "true" : "false",
            "valueFilter": valueFilter ? String(valueFilter) : null
        })).then(function (response) {
            // console.log(response);
            if (!multiple) {
                return _single(_decompress(response.image));
            } else {
                return _multi(_decompress(response.image));
            }
        });
}

function renderSqlDiffThrift(host, port, tile, sql1, sql2, typeName, aggrType, multiple, bbox, valueFilter) {
    var zoom = tile.tileID.canonical.z;
    var tx = tile.tileID.canonical.x;
    var ty = tile.tileID.canonical.y;
    if (bbox) {
        var mercator = new GlobalMercator();
        var xy = mercator.TMSTileFromGoogleTile(tx, ty, zoom);
        var bounds = mercator.TileLatLonBounds(xy[0], xy[1], zoom);

        var minx = Math.min(bounds[1], bounds[3]);
        var miny = Math.min(bounds[0], bounds[2]);
        var maxx = Math.max(bounds[1], bounds[3]);
        var maxy = Math.max(bounds[0], bounds[2]);

        var intersects = !(minx > bbox[2] || maxx < bbox[0] || miny > bbox[3] || maxy < bbox[1]);
        if (!intersects) {
            return new Promise(function (resolve, reject) {
                resolve(typeName);
            });
        }
    }

    var mapdCon = new MapdCon();
    mapdCon._protocol = ['https'];
    mapdCon._sessionId = ['0'];
    return mapdCon
        .host(host)
        .port(port)
        .dbName("default")
        .user("ltdb")
        .password("ltdb")
        .initClients()
        .renderVegaAsync("0", JSON.stringify({
            "sql1": sql1,
            "sql2": sql2,
            "zoom": zoom,
            "tx": tx,
            "ty": ty,
            "typeName": typeName,
            "aggrType": aggrType,
            "multiple": multiple ? "true" : "false",
            "valueFilter": valueFilter ? String(valueFilter) : null
        })).then(function (response) {
            // console.log(response);
            if (!multiple) {
                return _single(_decompress(response.image));
            } else {
                return _multi(_decompress(response.image));
            }
        });
}

function renderSqlPost(host, port, tile, sql, typeName, aggrType, multiple, bbox, valueFilter) {
    var zoom = tile.tileID.canonical.z;
    var tx = tile.tileID.canonical.x;
    var ty = tile.tileID.canonical.y;
    if (bbox) {
        var mercator = new GlobalMercator();
        var xy = mercator.TMSTileFromGoogleTile(tx, ty, zoom);
        var bounds = mercator.TileLatLonBounds(xy[0], xy[1], zoom);

        var minx = Math.min(bounds[1], bounds[3]);
        var miny = Math.min(bounds[0], bounds[2]);
        var maxx = Math.max(bounds[1], bounds[3]);
        var maxy = Math.max(bounds[0], bounds[2]);

        var intersects = !(minx > bbox[2] || maxx < bbox[0] || miny > bbox[3] || maxy < bbox[1]);
        if (!intersects) {
            return new Promise(function (resolve, reject) {
                resolve(typeName);
            });
        }
    }

    //var url = "https://" + host + ":" + port + "/query/render_sql";
    var url = "https://" + "giraf.sktelecom.com/ltdb/api" + "/query/render_sql";
    var body = JSON.stringify({
        "queries": [sql],
        "typeName": typeName,
        "zoom": zoom,
        "tx": tx,
        "ty": ty,
        "aggrType": aggrType,
        "multiple": multiple ? multiple : false,
        "valueFilter": valueFilter ? String(valueFilter) : null
    });

    return fetch(url, {
        method: "POST",
        cache: "no-cache",
        headers: {
            "Connection": "keep-alive",
            "Accept-Encoding": "gzip, deflate",
            "Content-Length": String(body.length)
        },
        body: body
    }).then(function (response) {
        if (!multiple) {
            return response.arrayBuffer();
        } else {
            return _multi(response.arrayBuffer());
        }
    });
}

function renderSqlGet(host, port, tile, sql, typeName, aggrType, multiple, bbox, valueFilter) {
    var zoom = tile.tileID.canonical.z;
    var tx = tile.tileID.canonical.x;
    var ty = tile.tileID.canonical.y;
    if (bbox) {
        var mercator = new GlobalMercator();
        var xy = mercator.TMSTileFromGoogleTile(tx, ty, zoom);
        var bounds = mercator.TileLatLonBounds(xy[0], xy[1], zoom);

        var minx = Math.min(bounds[1], bounds[3]);
        var miny = Math.min(bounds[0], bounds[2]);
        var maxx = Math.max(bounds[1], bounds[3]);
        var maxy = Math.max(bounds[0], bounds[2]);

        var intersects = !(minx > bbox[2] || maxx < bbox[0] || miny > bbox[3] || maxy < bbox[1]);
        if (!intersects) {
            return new Promise(function (resolve, reject) {
                resolve(typeName);
            });
        }
    }

    //var url = "https://" + host + ":" + port + "/query/render_sql";
    var url = "https://" + "giraf.sktelecom.com/ltdb/api" + "/query/render_sql";
    url += "?query=" + encodeURIComponent(sql);
    url += "&typeName=" + typeName;
    url += "&zoom=" + String(zoom);
    url += "&tx=" + String(tx);
    url += "&ty=" + String(ty);
    url += "&aggrType=" + aggrType;
    url += "&multiple=" + (multiple ? String(multiple) : "false");
    if (valueFilter) {
        url += "&valueFilter=" + String(valueFilter);
    }

    return fetch(url, {
        method: "GET",
        headers: {
            "Connection": "keep-alive",
            "Accept-Encoding": "gzip, deflate"
        },
    }).then(function (response) {
        if (!multiple) {
            return response.arrayBuffer();
        } else {
            return _multi(response.arrayBuffer());
        }
    });
}

function renderSqlDiffPost(host, port, tile, sql1, sql2, typeName, aggrType, multiple, bbox, valueFilter) {
    var zoom = tile.tileID.canonical.z;
    var tx = tile.tileID.canonical.x;
    var ty = tile.tileID.canonical.y;
    if (bbox) {
        var mercator = new GlobalMercator();
        var xy = mercator.TMSTileFromGoogleTile(tx, ty, zoom);
        var bounds = mercator.TileLatLonBounds(xy[0], xy[1], zoom);

        var minx = Math.min(bounds[1], bounds[3]);
        var miny = Math.min(bounds[0], bounds[2]);
        var maxx = Math.max(bounds[1], bounds[3]);
        var maxy = Math.max(bounds[0], bounds[2]);

        var intersects = !(minx > bbox[2] || maxx < bbox[0] || miny > bbox[3] || maxy < bbox[1]);
        if (!intersects) {
            return new Promise(function (resolve, reject) {
                resolve(typeName);
            });
        }
    }

    //var url = "https://" + host + ":" + port + "/query/render_sql";
    var url = "https://" + "giraf.sktelecom.com/ltdb/api" + "/query/render_sql";
    var body = JSON.stringify({
        "queries": [sql1, sql2],
        "typeName": typeName,
        "zoom": zoom,
        "tx": tx,
        "ty": ty,
        "aggrType": aggrType,
        "multiple": multiple ? multiple : false,
        "valueFilter": valueFilter ? String(valueFilter) : null
    });

    return fetch(url, {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        body: body,
        headers: {
            "Connection": "keep-alive",
            "Accept-Encoding": "gzip, deflate",
            "Content-Length": String(body.length)
        },
    }).then(function (response) {
        if (!multiple) {
            return response.arrayBuffer();
        } else {
            return _multi(response.arrayBuffer());
        }
    });
}

function renderSqlDiffGet(host, port, tile, sql1, sql2, typeName, aggrType, multiple, bbox, valueFilter) {
    var zoom = tile.tileID.canonical.z;
    var tx = tile.tileID.canonical.x;
    var ty = tile.tileID.canonical.y;
    if (bbox) {
        var mercator = new GlobalMercator();
        var xy = mercator.TMSTileFromGoogleTile(tx, ty, zoom);
        var bounds = mercator.TileLatLonBounds(xy[0], xy[1], zoom);

        var minx = Math.min(bounds[1], bounds[3]);
        var miny = Math.min(bounds[0], bounds[2]);
        var maxx = Math.max(bounds[1], bounds[3]);
        var maxy = Math.max(bounds[0], bounds[2]);

        var intersects = !(minx > bbox[2] || maxx < bbox[0] || miny > bbox[3] || maxy < bbox[1]);
        if (!intersects) {
            return new Promise(function (resolve, reject) {
                resolve(typeName);
            });
        }
    }

    //var url = "https://" + host + ":" + port + "/query/render_sql";
    var url = "https://" + "giraf.sktelecom.com/ltdb/api" + "/query/render_sql";
    url += "?query1=" + encodeURIComponent(sql1);
    url += "&query2=" + encodeURIComponent(sql2);
    url += "&typeName=" + typeName;
    url += "&zoom=" + String(zoom);
    url += "&tx=" + String(tx);
    url += "&ty=" + String(ty);
    url += "&aggrType=" + aggrType;
    url += "&multiple=" + (multiple ? String(multiple) : "false");
    if (valueFilter) {
        url += "&valueFilter=" + String(valueFilter);
    }

    return fetch(url, {
        method: "GET",
        headers: {
            "Connection": "keep-alive",
            "Accept-Encoding": "gzip, deflate"
        },
    }).then(function (response) {
        if (!multiple) {
            return response.arrayBuffer();
        } else {
            return _multi(response.arrayBuffer());
        }
    });
}
