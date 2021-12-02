(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';
/* global mapboxgl */

var syncMove = require('@mapbox/mapbox-gl-sync-move');
var EventEmitter = require('events').EventEmitter;

/**
 * @param {Object} a The first Mapbox GL Map
 * @param {Object} b The second Mapbox GL Map
 * @param {string|HTMLElement} container An HTML Element, or an element selector string for the compare container. It should be a wrapper around the two map Elements.
 * @param {Object} options
 * @param {string} [options.orientation=vertical] The orientation of the compare slider. `vertical` creates a vertical slider bar to compare one map on the left (map A) with another map on the right (map B). `horizontal` creates a horizontal slider bar to compare on mop on the top (map A) and another map on the bottom (map B).
 * @param {boolean} [options.mousemove=false] If `true` the compare slider will move with the cursor, otherwise the slider will need to be dragged to move.
 * @param {boolean} [options.overlay=Object]
 * @example
 * var compare = new mapboxgl.Compare(beforeMap, afterMap, '#wrapper', {
 *   orientation: 'vertical',
 *   mousemove: true
 * });
 * @see [Swipe between maps](https://www.mapbox.com/mapbox-gl-js/example/mapbox-gl-compare/)
 */
function Compare(a, b, container, options) {
  this.options = options ? options : {};
  this._mapA = a;
  this._mapB = b;
  this._horizontal = this.options.orientation === 'horizontal';
  this._onDown = this._onDown.bind(this);
  this._onMove = this._onMove.bind(this);
  this._onMouseUp = this._onMouseUp.bind(this);
  this._onTouchEnd = this._onTouchEnd.bind(this);

  this._ev = new EventEmitter();
  this._swiper = document.createElement('div');
  this._swiper.className = this._horizontal ? 'compare-swiper-horizontal' : 'compare-swiper-vertical';

  this._controlContainer = document.createElement('div');
  this._controlContainer.className = this._horizontal ? 'mapboxgl-compare mapboxgl-compare-horizontal' : 'mapboxgl-compare';
  this._controlContainer.className = this._controlContainer.className;
  this._controlContainer.appendChild(this._swiper);

  if (typeof container === 'string' && document.body.querySelectorAll) {
    // get container with a selector
    var appendTarget = document.body.querySelectorAll(container)[0];
    if (!appendTarget) {
      throw new Error('Cannot find element with specified container selector.')
    }
    appendTarget.appendChild(this._controlContainer)
  } else if (container instanceof Element && container.appendChild) {
    // get container directly
    container.appendChild(this._controlContainer)
  } else {
    throw new Error('Invalid container specified. Must be CSS selector or HTML element.')
  }

  this._bounds = b.getContainer().getBoundingClientRect();
  var swiperPosition = (this._horizontal ? this._bounds.height : this._bounds.width) / 2;
  this._setPosition(swiperPosition);

  this._clearSync = syncMove(a, b);
  this._onResize = function() {
    this._bounds = b.getContainer().getBoundingClientRect();
    if (this.currentPosition) this._setPosition(this.currentPosition);
  }.bind(this);

  b.on('resize', this._onResize);

  if (this.options && this.options.mousemove) {
    a.getContainer().addEventListener('mousemove', this._onMove);
    b.getContainer().addEventListener('mousemove', this._onMove);
  }

  this._swiper.addEventListener('mousedown', this._onDown);
  this._swiper.addEventListener('touchstart', this._onDown);

  if (this.options.overlay) {
    var overlay = document.createElement('div');
    overlay.id = '_overlay_';
    if (typeof container === 'string' && document.body.querySelectorAll) {
      // get container with a selector
      var appendTarget = document.body.querySelectorAll(container)[0];
      if (!appendTarget) {
        throw new Error('Cannot find element with specified container selector.')
      }
      appendTarget.appendChild(overlay)
    } else if (container instanceof Element && container.appendChild) {
      // get container directly
      container.appendChild(overlay)
    } else {
      throw new Error('Invalid container specified. Must be CSS selector or HTML element.')
    }
    this._overlay = new mapboxgl.Map({
      container: '_overlay_',
      style: {
        'version': 8,
        'sources': {
        },
        'layers': [],
        'center': options.overlay.center,
        'zoom': options.overlay.zoom
      }
    });
    this._clearSync = syncMove(this._overlay, a, b);
  }
}

Compare.prototype = {
  _setPointerEvents: function(v) {
    this._controlContainer.style.pointerEvents = v;
    this._swiper.style.pointerEvents = v;
  },

  _onDown: function(e) {
    if (e.touches) {
      document.addEventListener('touchmove', this._onMove);
      document.addEventListener('touchend', this._onTouchEnd);
    } else {
      document.addEventListener('mousemove', this._onMove);
      document.addEventListener('mouseup', this._onMouseUp);
    }
  },

  _setPosition: function(x) {
    x = Math.min(x, this._horizontal
      ? this._bounds.height
      : this._bounds.width);
    var pos = this._horizontal
      ? 'translate(0, ' + x + 'px)'
      : 'translate(' + x + 'px, 0)';
    this._controlContainer.style.transform = pos;
    this._controlContainer.style.WebkitTransform = pos;
    var clipA = this._horizontal
      ? 'rect(0, 999em, ' + x + 'px, 0)'
      : 'rect(0, ' + x + 'px, ' + this._bounds.height + 'px, 0)';
    var clipB = this._horizontal
      ? 'rect(' + x + 'px, 999em, ' + this._bounds.height + 'px,0)'
      : 'rect(0, 999em, ' + this._bounds.height + 'px,' + x + 'px)';
    
    this._mapA.getContainer().style.clip = clipA;
    this._mapB.getContainer().style.clip = clipB;
    this.currentPosition = x;
  },

  _onMove: function(e) {
    if (this.options && this.options.mousemove) {
      this._setPointerEvents(e.touches ? 'auto' : 'none');
    }
    console.log("onMove");

    this._horizontal
      ? this._setPosition(this._getY(e))
      : this._setPosition(this._getX(e));
  },

  _onMouseUp: function() {
    document.removeEventListener('mousemove', this._onMove);
    document.removeEventListener('mouseup', this._onMouseUp);
    this.fire('slideend', { currentPosition: this.currentPosition });
  },

  _onTouchEnd: function() {
    document.removeEventListener('touchmove', this._onMove);
    document.removeEventListener('touchend', this._onTouchEnd);
  },

  _getX: function(e) {
    e = e.touches ? e.touches[0] : e;
    var x = e.clientX - this._bounds.left;
    if (x < 0) x = 0;
    if (x > this._bounds.width) x = this._bounds.width;
    return x;
  },

  _getY: function(e) {
    e = e.touches ? e.touches[0] : e;
    var y = e.clientY - this._bounds.top;
    if (y < 0) y = 0;
    if (y > this._bounds.height) y = this._bounds.height;
    return y;
  },

  /**
   * Set the position of the slider.
   *
   * @param {number} x Slider position in pixels from left/top.
   */
  setSlider: function(x) {
    this._setPosition(x);
  },

  /**
   * Adds a listener for events of a specified type.
   *
   * @param {string} type The event type to listen for; one of `slideend`.
   * @param {Function} listener The function to be called when the event is fired.
   * @returns {Compare} `this`
   */
  on: function(type, fn) {
    this._ev.on(type, fn);
    return this;
  },

  /**
   * Fire an event of a specified type.
   *
   * @param {string} type The event type to fire; one of `slideend`.
   * @param {Object} data Data passed to the event listener.
   * @returns {Compare} `this`
   */
  fire: function(type, data) {
    this._ev.emit(type, data);
    return this;
  },

  /**
   * Removes an event listener previously added with `Compare#on`.
   *
   * @param {string} type The event type previously used to install the listener.
   * @param {Function} listener The function previously installed as a listener.
   * @returns {Compare} `this`
   */
  off: function(type, fn) {
    this._ev.removeListener(type, fn);
    return this;
  },

  remove: function() {
    this._clearSync();
    this._mapB.off('resize', this._onResize);
    var aContainer = this._mapA.getContainer();

    if (!!aContainer) {
      aContainer.style.clip = null;
      aContainer.removeEventListener('mousemove', this._onMove);
    }

    var bContainer = this._mapB.getContainer();

    if (!!bContainer) {
      bContainer.style.clip = null;
      bContainer.removeEventListener('mousemove', this._onMove);
    }

    this._swiper.removeEventListener('mousedown', this._onDown);
    this._swiper.removeEventListener('touchstart', this._onDown);
    this._controlContainer.remove();
  },

  overlay: function() {
    return this._overlay;
  }
};

if (window.mapboxgl) {
  mapboxgl.Compare = Compare;
} else if (typeof module !== 'undefined') {
  module.exports = Compare;
}

},{"@mapbox/mapbox-gl-sync-move":2,"events":3}],2:[function(require,module,exports){
function moveToMapPosition (master, clones) {
  var center = master.getCenter();
  var zoom = master.getZoom();
  var bearing = master.getBearing();
  var pitch = master.getPitch();

  clones.forEach(function (clone) {
    clone.jumpTo({
      center: center,
      zoom: zoom,
      bearing: bearing,
      pitch: pitch
    });
  });
}

// Sync movements of two maps.
//
// All interactions that result in movement end up firing
// a "move" event. The trick here, though, is to
// ensure that movements don't cycle from one map
// to the other and back again, because such a cycle
// - could cause an infinite loop
// - prematurely halts prolonged movements like
//   double-click zooming, box-zooming, and flying
function syncMaps () {
  var maps;
  var argLen = arguments.length;
  if (argLen === 1) {
    maps = arguments[0];
  } else {
    maps = [];
    for (var i = 0; i < argLen; i++) {
      maps.push(arguments[i]);
    }
  }

  // Create all the movement functions, because if they're created every time
  // they wouldn't be the same and couldn't be removed.
  var fns = [];
  maps.forEach(function (map, index) {
    fns[index] = sync.bind(null, map, maps.filter(function (o, i) { return i !== index; }));
  });

  function on () {
    maps.forEach(function (map, index) {
      map.on('move', fns[index]);
    });
  }

  function off () {
    maps.forEach(function (map, index) {
      map.off('move', fns[index]);
    });
  }

  // When one map moves, we turn off the movement listeners
  // on all the maps, move it, then turn the listeners on again
  function sync (master, clones) {
    off();
    moveToMapPosition(master, clones);
    on();
  }

  on();
  return function(){  off(); fns = []; };
}

module.exports = syncMaps;

},{}],3:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (!events)
    return [];

  var evlistener = events[type];
  if (!evlistener)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}]},{},[1]);
