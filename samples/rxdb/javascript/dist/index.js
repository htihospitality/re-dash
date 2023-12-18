/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/typeof.js
function _typeof(o) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, _typeof(o);
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/toPrimitive.js

function toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/toPropertyKey.js


function toPropertyKey(t) {
  var i = toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : String(i);
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/createClass.js

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, toPropertyKey(descriptor.key), descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}
;// CONCATENATED MODULE: ./node_modules/custom-idle-queue/dist/es/index.js
/**
 * Creates a new Idle-Queue
 * @constructor
 * @param {number} [parallels=1] amount of parrallel runs of the limited-ressource
 */
var IdleQueue = function IdleQueue() {
  var parallels = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
  this._parallels = parallels || 1;
  /**
   * _queueCounter
   * each lock() increased this number
   * each unlock() decreases this number
   * If _qC==0, the state is in idle
   * @type {Number}
   */

  this._qC = 0;
  /**
   * _idleCalls
   * contains all promises that where added via requestIdlePromise()
   * and not have been resolved
   * @type {Set<Promise>} _iC with oldest promise first
   */

  this._iC = new Set();
  /**
   * _lastHandleNumber
   * @type {Number}
   */

  this._lHN = 0;
  /**
   * _handlePromiseMap
   * Contains the handleNumber on the left
   * And the assigned promise on the right.
   * This is stored so you can use cancelIdleCallback(handleNumber)
   * to stop executing the callback.
   * @type {Map<Number><Promise>}
   */

  this._hPM = new Map();
  this._pHM = new Map(); // _promiseHandleMap
};
IdleQueue.prototype = {
  isIdle: function isIdle() {
    return this._qC < this._parallels;
  },

  /**
   * creates a lock in the queue
   * and returns an unlock-function to remove the lock from the queue
   * @return {function} unlock function than must be called afterwards
   */
  lock: function lock() {
    this._qC++;
  },
  unlock: function unlock() {
    this._qC--;

    _tryIdleCall(this);
  },

  /**
   * wraps a function with lock/unlock and runs it
   * @param  {function}  fun
   * @return {Promise<any>}
   */
  wrapCall: function wrapCall(fun) {
    var _this = this;

    this.lock();
    var maybePromise;

    try {
      maybePromise = fun();
    } catch (err) {
      this.unlock();
      throw err;
    }

    if (!maybePromise.then || typeof maybePromise.then !== 'function') {
      // no promise
      this.unlock();
      return maybePromise;
    } else {
      // promise
      return maybePromise.then(function (ret) {
        // sucessfull -> unlock before return
        _this.unlock();

        return ret;
      })["catch"](function (err) {
        // not sucessfull -> unlock before throwing
        _this.unlock();

        throw err;
      });
    }
  },

  /**
   * does the same as requestIdleCallback() but uses promises instead of the callback
   * @param {{timeout?: number}} options like timeout
   * @return {Promise<void>} promise that resolves when the database is in idle-mode
   */
  requestIdlePromise: function requestIdlePromise(options) {
    var _this2 = this;

    options = options || {};
    var resolve;
    var prom = new Promise(function (res) {
      return resolve = res;
    });

    var resolveFromOutside = function resolveFromOutside() {
      _removeIdlePromise(_this2, prom);

      resolve();
    };

    prom._manRes = resolveFromOutside;

    if (options.timeout) {
      // if timeout has passed, resolve promise even if not idle
      var timeoutObj = setTimeout(function () {
        prom._manRes();
      }, options.timeout);
      prom._timeoutObj = timeoutObj;
    }

    this._iC.add(prom);

    _tryIdleCall(this);

    return prom;
  },

  /**
   * remove the promise so it will never be resolved
   * @param  {Promise} promise from requestIdlePromise()
   * @return {void}
   */
  cancelIdlePromise: function cancelIdlePromise(promise) {
    _removeIdlePromise(this, promise);
  },

  /**
   * api equal to
   * @link https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback
   * @param  {Function} callback
   * @param  {options}   options  [description]
   * @return {number} handle which can be used with cancelIdleCallback()
   */
  requestIdleCallback: function requestIdleCallback(callback, options) {
    var handle = this._lHN++;
    var promise = this.requestIdlePromise(options);

    this._hPM.set(handle, promise);

    this._pHM.set(promise, handle);

    promise.then(function () {
      return callback();
    });
    return handle;
  },

  /**
   * API equal to
   * @link https://developer.mozilla.org/en-US/docs/Web/API/Window/cancelIdleCallback
   * @param  {number} handle returned from requestIdleCallback()
   * @return {void}
   */
  cancelIdleCallback: function cancelIdleCallback(handle) {
    var promise = this._hPM.get(handle);

    this.cancelIdlePromise(promise);
  },

  /**
   * clears and resets everything
   * @return {void}
   */
  clear: function clear() {
    var _this3 = this;

    // remove all non-cleared
    this._iC.forEach(function (promise) {
      return _removeIdlePromise(_this3, promise);
    });

    this._qC = 0;

    this._iC.clear();

    this._hPM = new Map();
    this._pHM = new Map();
  }
};
/**
 * processes the oldest call of the idleCalls-queue
 * @return {Promise<void>}
 */

function _resolveOneIdleCall(idleQueue) {
  if (idleQueue._iC.size === 0) return;

  var iterator = idleQueue._iC.values();

  var oldestPromise = iterator.next().value;

  oldestPromise._manRes(); // try to call the next tick


  setTimeout(function () {
    return _tryIdleCall(idleQueue);
  }, 0);
}
/**
 * removes the promise from the queue and maps and also its corresponding handle-number
 * @param  {Promise} promise from requestIdlePromise()
 * @return {void}
 */


function _removeIdlePromise(idleQueue, promise) {
  if (!promise) return; // remove timeout if exists

  if (promise._timeoutObj) clearTimeout(promise._timeoutObj); // remove handle-nr if exists

  if (idleQueue._pHM.has(promise)) {
    var handle = idleQueue._pHM.get(promise);

    idleQueue._hPM["delete"](handle);

    idleQueue._pHM["delete"](promise);
  } // remove from queue


  idleQueue._iC["delete"](promise);
}
/**
 * resolves the last entry of this._iC
 * but only if the queue is empty
 * @return {Promise}
 */


function _tryIdleCall(idleQueue) {
  // ensure this does not run in parallel
  if (idleQueue._tryIR || idleQueue._iC.size === 0) return;
  idleQueue._tryIR = true; // w8 one tick

  setTimeout(function () {
    // check if queue empty
    if (!idleQueue.isIdle()) {
      idleQueue._tryIR = false;
      return;
    }
    /**
     * wait 1 tick here
     * because many functions do IO->CPU->IO
     * which means the queue is empty for a short time
     * but the ressource is not idle
     */


    setTimeout(function () {
      // check if queue still empty
      if (!idleQueue.isIdle()) {
        idleQueue._tryIR = false;
        return;
      } // ressource is idle


      _resolveOneIdleCall(idleQueue);

      idleQueue._tryIR = false;
    }, 0);
  }, 0);
}
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/plugins/utils/utils-rxdb-version.js
/**
 * This file is replaced in the 'npm run build:version' script.
 */
var RXDB_VERSION = '15.0.0-beta.45';
//# sourceMappingURL=utils-rxdb-version.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/plugins/utils/utils-promise.js
/**
 * returns a promise that resolves on the next tick
 */
function nextTick() {
  return new Promise(res => setTimeout(res, 0));
}
function utils_promise_promiseWait(ms = 0) {
  return new Promise(res => setTimeout(res, ms));
}
function toPromise(maybePromise) {
  if (maybePromise && typeof maybePromise.then === 'function') {
    // is promise
    return maybePromise;
  } else {
    return Promise.resolve(maybePromise);
  }
}

/**
 * Reusing resolved promises has a better
 * performance than creating new ones each time.
 */
var utils_promise_PROMISE_RESOLVE_TRUE = Promise.resolve(true);
var PROMISE_RESOLVE_FALSE = Promise.resolve(false);
var PROMISE_RESOLVE_NULL = Promise.resolve(null);
var PROMISE_RESOLVE_VOID = Promise.resolve();
function requestIdlePromiseNoQueue(
/**
 * We always set a timeout!
 * RxDB might be used on the server side where the
 * server runs 24/4 on 99% CPU. So without a timeout
 * this would never resolve which could cause a memory leak.
 */
timeout = 10000) {
  /**
   * Do not use window.requestIdleCallback
   * because some javascript runtimes like react-native,
   * do not have a window object, but still have a global
   * requestIdleCallback function.
   * @link https://github.com/pubkey/rxdb/issues/4804
  */
  if (typeof requestIdleCallback === 'function') {
    return new Promise(res => {
      requestIdleCallback(() => res(), {
        timeout
      });
    });
  } else {
    return utils_promise_promiseWait(0);
  }
}

/**
 * If multiple operations wait for an requestIdlePromise
 * we do not want them to resolve all at the same time.
 * So we have to queue the calls.
 */
var idlePromiseQueue = PROMISE_RESOLVE_VOID;
function requestIdlePromise(timeout = undefined) {
  idlePromiseQueue = idlePromiseQueue.then(() => {
    return requestIdlePromiseNoQueue(timeout);
  });
  return idlePromiseQueue;
}

/**
 * run the callback if requestIdleCallback available
 * do nothing if not
 * @link https://developer.mozilla.org/de/docs/Web/API/Window/requestIdleCallback
 */
function requestIdleCallbackIfAvailable(fun) {
  /**
   * Do not use window.requestIdleCallback
   * because some javascript runtimes like react-native,
   * do not have a window object, but still have a global
   * requestIdleCallback function.
   * @link https://github.com/pubkey/rxdb/issues/4804
  */
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => {
      fun();
    });
  }
}

/**
 * like Promise.all() but runs in series instead of parallel
 * @link https://github.com/egoist/promise.series/blob/master/index.js
 * @param tasks array with functions that return a promise
 */
function promiseSeries(tasks, initial) {
  return tasks.reduce((current, next) => current.then(next), Promise.resolve(initial));
}
//# sourceMappingURL=utils-promise.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/plugins/utils/utils-document.js
/**
 * We use 1 as minimum so that the value is never falsy.
 * This const is used in several places because querying
 * with a value lower then the minimum could give false results.
 */
var utils_document_RX_META_LWT_MINIMUM = 1;
function getDefaultRxDocumentMeta() {
  return {
    /**
     * Set this to 1 to not waste performance
     * while calling new Date()..
     * The storage wrappers will anyway update
     * the lastWrite time while calling transformDocumentDataFromRxDBToRxStorage()
     */
    lwt: utils_document_RX_META_LWT_MINIMUM
  };
}

/**
 * Returns a revision that is not valid.
 * Use this to have correct typings
 * while the storage wrapper anyway will overwrite the revision.
 */
function utils_document_getDefaultRevision() {
  /**
   * Use a non-valid revision format,
   * to ensure that the RxStorage will throw
   * when the revision is not replaced downstream.
   */
  return '';
}
function stripMetaDataFromDocument(docData) {
  return Object.assign({}, docData, {
    _meta: undefined,
    _deleted: undefined,
    _rev: undefined
  });
}

/**
 * Faster way to check the equality of document lists
 * compared to doing a deep-equal.
 * Here we only check the ids and revisions.
 */
function areRxDocumentArraysEqual(primaryPath, ar1, ar2) {
  if (ar1.length !== ar2.length) {
    return false;
  }
  var i = 0;
  var len = ar1.length;
  while (i < len) {
    var row1 = ar1[i];
    var row2 = ar2[i];
    i++;
    if (row1._rev !== row2._rev || row1[primaryPath] !== row2[primaryPath]) {
      return false;
    }
  }
  return true;
}
function getSortDocumentsByLastWriteTimeComparator(primaryPath) {
  return (a, b) => {
    if (a._meta.lwt === b._meta.lwt) {
      if (b[primaryPath] < a[primaryPath]) {
        return 1;
      } else {
        return -1;
      }
    } else {
      return a._meta.lwt - b._meta.lwt;
    }
  };
}
function sortDocumentsByLastWriteTime(primaryPath, docs) {
  return docs.sort(getSortDocumentsByLastWriteTimeComparator(primaryPath));
}
//# sourceMappingURL=utils-document.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/plugins/utils/utils-object.js
function deepFreeze(o) {
  Object.freeze(o);
  Object.getOwnPropertyNames(o).forEach(function (prop) {
    if (Object.prototype.hasOwnProperty.call(o, prop) && o[prop] !== null && (typeof o[prop] === 'object' || typeof o[prop] === 'function') && !Object.isFrozen(o[prop])) {
      deepFreeze(o[prop]);
    }
  });
  return o;
}

/**
 * To get specific nested path values from objects,
 * RxDB normally uses the 'dot-prop' npm module.
 * But when performance is really relevant, this is not fast enough.
 * Instead we use a monad that can prepare some stuff up front
 * and we can reuse the generated function.
 */

function objectPathMonad(objectPath) {
  var split = objectPath.split('.');

  // reuse this variable for better performance.
  var splitLength = split.length;

  /**
   * Performance shortcut,
   * if no nested path is used,
   * directly return the field of the object.
   */
  if (splitLength === 1) {
    return obj => obj[objectPath];
  }
  return obj => {
    var currentVal = obj;
    for (var i = 0; i < splitLength; ++i) {
      var subPath = split[i];
      currentVal = currentVal[subPath];
      if (typeof currentVal === 'undefined') {
        return currentVal;
      }
    }
    return currentVal;
  };
}
function getFromObjectOrThrow(obj, key) {
  var val = obj[key];
  if (!val) {
    throw new Error('missing value from object ' + key);
  }
  return val;
}

/**
 * returns a flattened object
 * @link https://gist.github.com/penguinboy/762197
 */
function flattenObject(ob) {
  var toReturn = {};
  for (var i in ob) {
    if (!Object.prototype.hasOwnProperty.call(ob, i)) continue;
    if (typeof ob[i] === 'object') {
      var flatObject = flattenObject(ob[i]);
      for (var x in flatObject) {
        if (!Object.prototype.hasOwnProperty.call(flatObject, x)) continue;
        toReturn[i + '.' + x] = flatObject[x];
      }
    } else {
      toReturn[i] = ob[i];
    }
  }
  return toReturn;
}

/**
 * does a flat copy on the objects,
 * is about 3 times faster then using deepClone
 * @link https://jsperf.com/object-rest-spread-vs-clone/2
 */
function utils_object_flatClone(obj) {
  return Object.assign({}, obj);
}

/**
 * @link https://stackoverflow.com/a/11509718/3443137
 */
function firstPropertyNameOfObject(obj) {
  return Object.keys(obj)[0];
}
function firstPropertyValueOfObject(obj) {
  var key = Object.keys(obj)[0];
  return obj[key];
}

/**
 * deep-sort an object so its attributes are in lexical order.
 * Also sorts the arrays inside of the object if no-array-sort not set
 */
function sortObject(obj, noArraySort = false) {
  if (!obj) return obj; // do not sort null, false or undefined

  // array
  if (!noArraySort && Array.isArray(obj)) {
    return obj.sort((a, b) => {
      if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
      if (typeof a === 'object') return 1;else return -1;
    }).map(i => sortObject(i, noArraySort));
  }

  // object
  // array is also of type object
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    var out = {};
    Object.keys(obj).sort((a, b) => a.localeCompare(b)).forEach(key => {
      out[key] = sortObject(obj[key], noArraySort);
    });
    return out;
  }

  // everything else
  return obj;
}

/**
 * Deep clone a plain json object.
 * Does not work with recursive stuff
 * or non-plain-json.
 * IMPORTANT: Performance of this is very important,
 * do not change it without running performance tests!
 *
 * @link https://github.com/zxdong262/deep-copy/blob/master/src/index.ts
 */
function deepClone(src) {
  if (!src) {
    return src;
  }
  if (src === null || typeof src !== 'object') {
    return src;
  }
  if (Array.isArray(src)) {
    var ret = new Array(src.length);
    var i = ret.length;
    while (i--) {
      ret[i] = deepClone(src[i]);
    }
    return ret;
  }
  var dest = {};
  // eslint-disable-next-line guard-for-in
  for (var key in src) {
    dest[key] = deepClone(src[key]);
  }
  return dest;
}
var utils_object_clone = deepClone;

/**
 * overwrites the getter with the actual value
 * Mostly used for caching stuff on the first run
 */
function overwriteGetterForCaching(obj, getterName, value) {
  Object.defineProperty(obj, getterName, {
    get: function () {
      return value;
    }
  });
  return value;
}
//# sourceMappingURL=utils-object.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/plugins/utils/utils-other.js
function runXTimes(xTimes, fn) {
  new Array(xTimes).fill(0).forEach((_v, idx) => fn(idx));
}
function utils_other_ensureNotFalsy(obj) {
  if (!obj) {
    throw new Error('ensureNotFalsy() is falsy');
  }
  return obj;
}
function ensureInteger(obj) {
  if (!Number.isInteger(obj)) {
    throw new Error('ensureInteger() is falsy');
  }
  return obj;
}

/**
 * Using shareReplay() without settings will not unsubscribe
 * if there are no more subscribers.
 * So we use these defaults.
 * @link https://cartant.medium.com/rxjs-whats-changed-with-sharereplay-65c098843e95
 */
var RXJS_SHARE_REPLAY_DEFAULTS = {
  bufferSize: 1,
  refCount: true
};
//# sourceMappingURL=utils-other.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/plugins/utils/utils-string.js
var COUCH_NAME_CHARS = 'abcdefghijklmnopqrstuvwxyz';
/**
 * get a random string which can be used with couchdb
 * @link http://stackoverflow.com/a/1349426/3443137
 */
function randomCouchString(length = 10) {
  var text = '';
  for (var i = 0; i < length; i++) {
    text += COUCH_NAME_CHARS.charAt(Math.floor(Math.random() * COUCH_NAME_CHARS.length));
  }
  return text;
}

/**
 * A random string that is never inside of any storage
 */
var RANDOM_STRING = 'Fz7SZXPmYJujkzjY1rpXWvlWBqoGAfAX';

/**
 * uppercase first char
 */
function ucfirst(str) {
  str += '';
  var f = str.charAt(0).toUpperCase();
  return f + str.substr(1);
}

/**
 * removes trailing and ending dots from the string
 */
function trimDots(str) {
  // start
  while (str.charAt(0) === '.') {
    str = str.substr(1);
  }

  // end
  while (str.slice(-1) === '.') {
    str = str.slice(0, -1);
  }
  return str;
}

/**
 * @link https://stackoverflow.com/a/44950500/3443137
 */
function lastCharOfString(str) {
  return str.charAt(str.length - 1);
}

/**
 * returns true if the given name is likely a folder path
 */
function isFolderPath(name) {
  // do not check, if foldername is given
  if (name.includes('/') ||
  // unix
  name.includes('\\') // windows
  ) {
    return true;
  } else {
    return false;
  }
}

/**
 * @link https://gist.github.com/andreburgaud/6f73fd2d690b629346b8
 */
function arrayBufferToString(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}
function stringToArrayBuffer(str) {
  var buf = new ArrayBuffer(str.length * 2);
  var bufView = new Uint16Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}
//# sourceMappingURL=utils-string.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/plugins/utils/utils-error.js


/**
 * Returns an error that indicates that a plugin is missing
 * We do not throw a RxError because this should not be handled
 * programmatically but by using the correct import
 */
function pluginMissing(pluginKey) {
  var keyParts = pluginKey.split('-');
  var pluginName = 'RxDB';
  keyParts.forEach(part => {
    pluginName += ucfirst(part);
  });
  pluginName += 'Plugin';
  return new Error("You are using a function which must be overwritten by a plugin.\n        You should either prevent the usage of this function or add the plugin via:\n            import { " + pluginName + " } from 'rxdb/plugins/" + pluginKey + "';\n            addRxPlugin(" + pluginName + ");\n        ");
}
function errorToPlainJson(err) {
  var ret = {
    name: err.name,
    message: err.message,
    rxdb: err.rxdb,
    parameters: err.parameters,
    code: err.code,
    /**
     * stack must be last to make it easier to read the json in a console.
     * Also we ensure that each linebreak is spaced so that the chrome devtools
     * shows urls to the source code that can be clicked to inspect
     * the correct place in the code.
     */
    stack: !err.stack ? undefined : err.stack.replace(/\n/g, ' \n ')
  };
  return ret;
}
//# sourceMappingURL=utils-error.js.map
;// CONCATENATED MODULE: ./node_modules/ohash/dist/index.mjs
const defaults = Object.freeze({
  ignoreUnknown: false,
  respectType: false,
  respectFunctionNames: false,
  respectFunctionProperties: false,
  unorderedObjects: true,
  unorderedArrays: false,
  unorderedSets: false,
  excludeKeys: void 0,
  excludeValues: void 0,
  replacer: void 0
});
function objectHash(object, options) {
  if (options) {
    options = { ...defaults, ...options };
  } else {
    options = defaults;
  }
  const hasher = createHasher(options);
  hasher.dispatch(object);
  return hasher.toString();
}
const defaultPrototypesKeys = Object.freeze([
  "prototype",
  "__proto__",
  "constructor"
]);
function createHasher(options) {
  let buff = "";
  let context = /* @__PURE__ */ new Map();
  const write = (str) => {
    buff += str;
  };
  return {
    toString() {
      return buff;
    },
    getContext() {
      return context;
    },
    dispatch(value) {
      if (options.replacer) {
        value = options.replacer(value);
      }
      const type = value === null ? "null" : typeof value;
      return this[type](value);
    },
    object(object) {
      if (object && typeof object.toJSON === "function") {
        return this.object(object.toJSON());
      }
      const objString = Object.prototype.toString.call(object);
      let objType = "";
      const objectLength = objString.length;
      if (objectLength < 10) {
        objType = "unknown:[" + objString + "]";
      } else {
        objType = objString.slice(8, objectLength - 1);
      }
      objType = objType.toLowerCase();
      let objectNumber = null;
      if ((objectNumber = context.get(object)) === void 0) {
        context.set(object, context.size);
      } else {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        write("buffer:");
        return write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this[objType]) {
          this[objType](object);
        } else if (!options.ignoreUnknown) {
          this.unkown(object, objType);
        }
      } else {
        let keys = Object.keys(object);
        if (options.unorderedObjects) {
          keys = keys.sort();
        }
        let extraKeys = [];
        if (options.respectType !== false && !isNativeFunction(object)) {
          extraKeys = defaultPrototypesKeys;
        }
        if (options.excludeKeys) {
          keys = keys.filter((key) => {
            return !options.excludeKeys(key);
          });
          extraKeys = extraKeys.filter((key) => {
            return !options.excludeKeys(key);
          });
        }
        write("object:" + (keys.length + extraKeys.length) + ":");
        const dispatchForKey = (key) => {
          this.dispatch(key);
          write(":");
          if (!options.excludeValues) {
            this.dispatch(object[key]);
          }
          write(",");
        };
        for (const key of keys) {
          dispatchForKey(key);
        }
        for (const key of extraKeys) {
          dispatchForKey(key);
        }
      }
    },
    array(arr, unordered) {
      unordered = unordered === void 0 ? options.unorderedArrays !== false : unordered;
      write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        for (const entry of arr) {
          this.dispatch(entry);
        }
        return;
      }
      const contextAdditions = /* @__PURE__ */ new Map();
      const entries = arr.map((entry) => {
        const hasher = createHasher(options);
        hasher.dispatch(entry);
        for (const [key, value] of hasher.getContext()) {
          contextAdditions.set(key, value);
        }
        return hasher.toString();
      });
      context = contextAdditions;
      entries.sort();
      return this.array(entries, false);
    },
    date(date) {
      return write("date:" + date.toJSON());
    },
    symbol(sym) {
      return write("symbol:" + sym.toString());
    },
    unkown(value, type) {
      write(type);
      if (!value) {
        return;
      }
      write(":");
      if (value && typeof value.entries === "function") {
        return this.array(
          Array.from(value.entries()),
          true
          /* ordered */
        );
      }
    },
    error(err) {
      return write("error:" + err.toString());
    },
    boolean(bool) {
      return write("bool:" + bool);
    },
    string(string) {
      write("string:" + string.length + ":");
      write(string);
    },
    function(fn) {
      write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
      if (options.respectFunctionNames !== false) {
        this.dispatch("function-name:" + String(fn.name));
      }
      if (options.respectFunctionProperties) {
        this.object(fn);
      }
    },
    number(number) {
      return write("number:" + number);
    },
    xml(xml) {
      return write("xml:" + xml.toString());
    },
    null() {
      return write("Null");
    },
    undefined() {
      return write("Undefined");
    },
    regexp(regex) {
      return write("regex:" + regex.toString());
    },
    uint8array(arr) {
      write("uint8array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    uint8clampedarray(arr) {
      write("uint8clampedarray:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    int8array(arr) {
      write("int8array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    uint16array(arr) {
      write("uint16array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    int16array(arr) {
      write("int16array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    uint32array(arr) {
      write("uint32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    int32array(arr) {
      write("int32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    float32array(arr) {
      write("float32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    float64array(arr) {
      write("float64array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    arraybuffer(arr) {
      write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    },
    url(url) {
      return write("url:" + url.toString());
    },
    map(map) {
      write("map:");
      const arr = [...map];
      return this.array(arr, options.unorderedSets !== false);
    },
    set(set) {
      write("set:");
      const arr = [...set];
      return this.array(arr, options.unorderedSets !== false);
    },
    file(file) {
      write("file:");
      return this.dispatch([file.name, file.size, file.type, file.lastModfied]);
    },
    blob() {
      if (options.ignoreUnknown) {
        return write("[blob]");
      }
      throw new Error(
        'Hashing Blob objects is currently not supported\nUse "options.replacer" or "options.ignoreUnknown"\n'
      );
    },
    domwindow() {
      return write("domwindow");
    },
    bigint(number) {
      return write("bigint:" + number.toString());
    },
    /* Node.js standard native objects */
    process() {
      return write("process");
    },
    timer() {
      return write("timer");
    },
    pipe() {
      return write("pipe");
    },
    tcp() {
      return write("tcp");
    },
    udp() {
      return write("udp");
    },
    tty() {
      return write("tty");
    },
    statwatcher() {
      return write("statwatcher");
    },
    securecontext() {
      return write("securecontext");
    },
    connection() {
      return write("connection");
    },
    zlib() {
      return write("zlib");
    },
    context() {
      return write("context");
    },
    nodescript() {
      return write("nodescript");
    },
    httpparser() {
      return write("httpparser");
    },
    dataview() {
      return write("dataview");
    },
    signal() {
      return write("signal");
    },
    fsevent() {
      return write("fsevent");
    },
    tlswrap() {
      return write("tlswrap");
    }
  };
}
const nativeFunc = "[native code] }";
const nativeFuncLength = nativeFunc.length;
function isNativeFunction(f) {
  if (typeof f !== "function") {
    return false;
  }
  return Function.prototype.toString.call(f).slice(-nativeFuncLength) === nativeFunc;
}

class WordArray {
  constructor(words, sigBytes) {
    words = this.words = words || [];
    this.sigBytes = sigBytes === void 0 ? words.length * 4 : sigBytes;
  }
  toString(encoder) {
    return (encoder || Hex).stringify(this);
  }
  concat(wordArray) {
    this.clamp();
    if (this.sigBytes % 4) {
      for (let i = 0; i < wordArray.sigBytes; i++) {
        const thatByte = wordArray.words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
        this.words[this.sigBytes + i >>> 2] |= thatByte << 24 - (this.sigBytes + i) % 4 * 8;
      }
    } else {
      for (let j = 0; j < wordArray.sigBytes; j += 4) {
        this.words[this.sigBytes + j >>> 2] = wordArray.words[j >>> 2];
      }
    }
    this.sigBytes += wordArray.sigBytes;
    return this;
  }
  clamp() {
    this.words[this.sigBytes >>> 2] &= 4294967295 << 32 - this.sigBytes % 4 * 8;
    this.words.length = Math.ceil(this.sigBytes / 4);
  }
  clone() {
    return new WordArray([...this.words]);
  }
}
const Hex = {
  stringify(wordArray) {
    const hexChars = [];
    for (let i = 0; i < wordArray.sigBytes; i++) {
      const bite = wordArray.words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
      hexChars.push((bite >>> 4).toString(16), (bite & 15).toString(16));
    }
    return hexChars.join("");
  }
};
const Base64 = {
  stringify(wordArray) {
    const keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const base64Chars = [];
    for (let i = 0; i < wordArray.sigBytes; i += 3) {
      const byte1 = wordArray.words[i >>> 2] >>> 24 - i % 4 * 8 & 255;
      const byte2 = wordArray.words[i + 1 >>> 2] >>> 24 - (i + 1) % 4 * 8 & 255;
      const byte3 = wordArray.words[i + 2 >>> 2] >>> 24 - (i + 2) % 4 * 8 & 255;
      const triplet = byte1 << 16 | byte2 << 8 | byte3;
      for (let j = 0; j < 4 && i * 8 + j * 6 < wordArray.sigBytes * 8; j++) {
        base64Chars.push(keyStr.charAt(triplet >>> 6 * (3 - j) & 63));
      }
    }
    return base64Chars.join("");
  }
};
const Latin1 = {
  parse(latin1Str) {
    const latin1StrLength = latin1Str.length;
    const words = [];
    for (let i = 0; i < latin1StrLength; i++) {
      words[i >>> 2] |= (latin1Str.charCodeAt(i) & 255) << 24 - i % 4 * 8;
    }
    return new WordArray(words, latin1StrLength);
  }
};
const Utf8 = {
  parse(utf8Str) {
    return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
  }
};
class BufferedBlockAlgorithm {
  constructor() {
    this._data = new WordArray();
    this._nDataBytes = 0;
    this._minBufferSize = 0;
    this.blockSize = 512 / 32;
  }
  reset() {
    this._data = new WordArray();
    this._nDataBytes = 0;
  }
  _append(data) {
    if (typeof data === "string") {
      data = Utf8.parse(data);
    }
    this._data.concat(data);
    this._nDataBytes += data.sigBytes;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _doProcessBlock(_dataWords, _offset) {
  }
  _process(doFlush) {
    let processedWords;
    let nBlocksReady = this._data.sigBytes / (this.blockSize * 4);
    if (doFlush) {
      nBlocksReady = Math.ceil(nBlocksReady);
    } else {
      nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
    }
    const nWordsReady = nBlocksReady * this.blockSize;
    const nBytesReady = Math.min(nWordsReady * 4, this._data.sigBytes);
    if (nWordsReady) {
      for (let offset = 0; offset < nWordsReady; offset += this.blockSize) {
        this._doProcessBlock(this._data.words, offset);
      }
      processedWords = this._data.words.splice(0, nWordsReady);
      this._data.sigBytes -= nBytesReady;
    }
    return new WordArray(processedWords, nBytesReady);
  }
}
class Hasher extends BufferedBlockAlgorithm {
  update(messageUpdate) {
    this._append(messageUpdate);
    this._process();
    return this;
  }
  finalize(messageUpdate) {
    if (messageUpdate) {
      this._append(messageUpdate);
    }
  }
}

const H = [
  1779033703,
  -1150833019,
  1013904242,
  -1521486534,
  1359893119,
  -1694144372,
  528734635,
  1541459225
];
const K = [
  1116352408,
  1899447441,
  -1245643825,
  -373957723,
  961987163,
  1508970993,
  -1841331548,
  -1424204075,
  -670586216,
  310598401,
  607225278,
  1426881987,
  1925078388,
  -2132889090,
  -1680079193,
  -1046744716,
  -459576895,
  -272742522,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  -1740746414,
  -1473132947,
  -1341970488,
  -1084653625,
  -958395405,
  -710438585,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  -2117940946,
  -1838011259,
  -1564481375,
  -1474664885,
  -1035236496,
  -949202525,
  -778901479,
  -694614492,
  -200395387,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  -2067236844,
  -1933114872,
  -1866530822,
  -1538233109,
  -1090935817,
  -965641998
];
const W = [];
class SHA256 extends Hasher {
  constructor() {
    super(...arguments);
    this._hash = new WordArray([...H]);
  }
  reset() {
    super.reset();
    this._hash = new WordArray([...H]);
  }
  _doProcessBlock(M, offset) {
    const H2 = this._hash.words;
    let a = H2[0];
    let b = H2[1];
    let c = H2[2];
    let d = H2[3];
    let e = H2[4];
    let f = H2[5];
    let g = H2[6];
    let h = H2[7];
    for (let i = 0; i < 64; i++) {
      if (i < 16) {
        W[i] = M[offset + i] | 0;
      } else {
        const gamma0x = W[i - 15];
        const gamma0 = (gamma0x << 25 | gamma0x >>> 7) ^ (gamma0x << 14 | gamma0x >>> 18) ^ gamma0x >>> 3;
        const gamma1x = W[i - 2];
        const gamma1 = (gamma1x << 15 | gamma1x >>> 17) ^ (gamma1x << 13 | gamma1x >>> 19) ^ gamma1x >>> 10;
        W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
      }
      const ch = e & f ^ ~e & g;
      const maj = a & b ^ a & c ^ b & c;
      const sigma0 = (a << 30 | a >>> 2) ^ (a << 19 | a >>> 13) ^ (a << 10 | a >>> 22);
      const sigma1 = (e << 26 | e >>> 6) ^ (e << 21 | e >>> 11) ^ (e << 7 | e >>> 25);
      const t1 = h + sigma1 + ch + K[i] + W[i];
      const t2 = sigma0 + maj;
      h = g;
      g = f;
      f = e;
      e = d + t1 | 0;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 | 0;
    }
    H2[0] = H2[0] + a | 0;
    H2[1] = H2[1] + b | 0;
    H2[2] = H2[2] + c | 0;
    H2[3] = H2[3] + d | 0;
    H2[4] = H2[4] + e | 0;
    H2[5] = H2[5] + f | 0;
    H2[6] = H2[6] + g | 0;
    H2[7] = H2[7] + h | 0;
  }
  finalize(messageUpdate) {
    super.finalize(messageUpdate);
    const nBitsTotal = this._nDataBytes * 8;
    const nBitsLeft = this._data.sigBytes * 8;
    this._data.words[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
    this._data.words[(nBitsLeft + 64 >>> 9 << 4) + 14] = Math.floor(
      nBitsTotal / 4294967296
    );
    this._data.words[(nBitsLeft + 64 >>> 9 << 4) + 15] = nBitsTotal;
    this._data.sigBytes = this._data.words.length * 4;
    this._process();
    return this._hash;
  }
}
function sha256(message) {
  return new SHA256().finalize(message).toString();
}
function sha256base64(message) {
  return new SHA256().finalize(message).toString(Base64);
}

function hash(object, options = {}) {
  const hashed = typeof object === "string" ? object : objectHash(object, options);
  return sha256base64(hashed).slice(0, 10);
}

function murmurHash(key, seed = 0) {
  if (typeof key === "string") {
    key = createBuffer(key);
  }
  let i = 0;
  let h1 = seed;
  let k1;
  let h1b;
  const remainder = key.length & 3;
  const bytes = key.length - remainder;
  const c1 = 3432918353;
  const c2 = 461845907;
  while (i < bytes) {
    k1 = key[i] & 255 | (key[++i] & 255) << 8 | (key[++i] & 255) << 16 | (key[++i] & 255) << 24;
    ++i;
    k1 = (k1 & 65535) * c1 + (((k1 >>> 16) * c1 & 65535) << 16) & 4294967295;
    k1 = k1 << 15 | k1 >>> 17;
    k1 = (k1 & 65535) * c2 + (((k1 >>> 16) * c2 & 65535) << 16) & 4294967295;
    h1 ^= k1;
    h1 = h1 << 13 | h1 >>> 19;
    h1b = (h1 & 65535) * 5 + (((h1 >>> 16) * 5 & 65535) << 16) & 4294967295;
    h1 = (h1b & 65535) + 27492 + (((h1b >>> 16) + 58964 & 65535) << 16);
  }
  k1 = 0;
  switch (remainder) {
    case 3: {
      k1 ^= (key[i + 2] & 255) << 16;
      break;
    }
    case 2: {
      k1 ^= (key[i + 1] & 255) << 8;
      break;
    }
    case 1: {
      k1 ^= key[i] & 255;
      k1 = (k1 & 65535) * c1 + (((k1 >>> 16) * c1 & 65535) << 16) & 4294967295;
      k1 = k1 << 15 | k1 >>> 17;
      k1 = (k1 & 65535) * c2 + (((k1 >>> 16) * c2 & 65535) << 16) & 4294967295;
      h1 ^= k1;
    }
  }
  h1 ^= key.length;
  h1 ^= h1 >>> 16;
  h1 = (h1 & 65535) * 2246822507 + (((h1 >>> 16) * 2246822507 & 65535) << 16) & 4294967295;
  h1 ^= h1 >>> 13;
  h1 = (h1 & 65535) * 3266489909 + (((h1 >>> 16) * 3266489909 & 65535) << 16) & 4294967295;
  h1 ^= h1 >>> 16;
  return h1 >>> 0;
}
function createBuffer(val) {
  return new TextEncoder().encode(val);
}

function dist_isEqual(object1, object2, hashOptions = {}) {
  if (object1 === object2) {
    return true;
  }
  if (objectHash(object1, hashOptions) === objectHash(object2, hashOptions)) {
    return true;
  }
  return false;
}

function diff(obj1, obj2, opts = {}) {
  const h1 = _toHashedObject(obj1, opts);
  const h2 = _toHashedObject(obj2, opts);
  return _diff(h1, h2, opts);
}
function _diff(h1, h2, opts = {}) {
  const diffs = [];
  const allProps = /* @__PURE__ */ new Set([
    ...Object.keys(h1.props || {}),
    ...Object.keys(h2.props || {})
  ]);
  if (h1.props && h2.props) {
    for (const prop of allProps) {
      const p1 = h1.props[prop];
      const p2 = h2.props[prop];
      if (p1 && p2) {
        diffs.push(..._diff(h1.props?.[prop], h2.props?.[prop], opts));
      } else if (p1 || p2) {
        diffs.push(
          new DiffEntry((p2 || p1).key, p1 ? "removed" : "added", p2, p1)
        );
      }
    }
  }
  if (allProps.size === 0 && h1.hash !== h2.hash) {
    diffs.push(new DiffEntry((h2 || h1).key, "changed", h2, h1));
  }
  return diffs;
}
function _toHashedObject(obj, opts, key = "") {
  if (obj && typeof obj !== "object") {
    return new DiffHashedObject(key, obj, objectHash(obj, opts));
  }
  const props = {};
  const hashes = [];
  for (const _key in obj) {
    props[_key] = _toHashedObject(
      obj[_key],
      opts,
      key ? `${key}.${_key}` : _key
    );
    hashes.push(props[_key].hash);
  }
  return new DiffHashedObject(key, obj, `{${hashes.join(":")}}`, props);
}
class DiffEntry {
  // eslint-disable-next-line no-useless-constructor
  constructor(key, type, newValue, oldValue) {
    this.key = key;
    this.type = type;
    this.newValue = newValue;
    this.oldValue = oldValue;
  }
  toString() {
    return this.toJSON();
  }
  toJSON() {
    switch (this.type) {
      case "added": {
        return `Added   \`${this.key}\``;
      }
      case "removed": {
        return `Removed \`${this.key}\``;
      }
      case "changed": {
        return `Changed \`${this.key}\` from \`${this.oldValue?.toString() || "-"}\` to \`${this.newValue.toString()}\``;
      }
    }
  }
}
class DiffHashedObject {
  // eslint-disable-next-line no-useless-constructor
  constructor(key, value, hash, props) {
    this.key = key;
    this.value = value;
    this.hash = hash;
    this.props = props;
  }
  toString() {
    if (this.props) {
      return `{${Object.keys(this.props).join(",")}}`;
    } else {
      return JSON.stringify(this.value);
    }
  }
  toJSON() {
    const k = this.key || ".";
    if (this.props) {
      return `${k}({${Object.keys(this.props).join(",")}})`;
    }
    return `${k}(${this.value})`;
  }
}



;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/plugins/utils/utils-hash.js

/**
 * TODO in the future we should no longer provide a
 * fallback to crypto.subtle.digest.
 * Instead users without crypto.subtle.digest support, should have to provide their own
 * hash function.
 */
function jsSha256(input) {
  return Promise.resolve(sha256(input));
}
async function nativeSha256(input) {
  var data = new TextEncoder().encode(input);
  var hashBuffer = await crypto.subtle.digest('SHA-256', data);
  /**
   * @link https://jameshfisher.com/2017/10/30/web-cryptography-api-hello-world/
   */
  var hash = Array.prototype.map.call(new Uint8Array(hashBuffer), x => ('00' + x.toString(16)).slice(-2)).join('');
  return hash;
}
var canUseCryptoSubtle = typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined' && typeof crypto.subtle.digest === 'function';

/**
 * Default hash method used to hash
 * strings and do equal comparisons.
 *
 * IMPORTANT: Changing the default hashing method
 * requires a BREAKING change!
 */

var defaultHashSha256 = canUseCryptoSubtle ? nativeSha256 : jsSha256;
//# sourceMappingURL=utils-hash.js.map
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/setPrototypeOf.js
function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };
  return _setPrototypeOf(o, p);
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/inheritsLoose.js

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  _setPrototypeOf(subClass, superClass);
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/getPrototypeOf.js
function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/isNativeFunction.js
function _isNativeFunction(fn) {
  try {
    return Function.toString.call(fn).indexOf("[native code]") !== -1;
  } catch (e) {
    return typeof fn === "function";
  }
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/isNativeReflectConstruct.js
function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;
  try {
    Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/construct.js


function _construct(Parent, args, Class) {
  if (_isNativeReflectConstruct()) {
    _construct = Reflect.construct.bind();
  } else {
    _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);
      var Constructor = Function.bind.apply(Parent, a);
      var instance = new Constructor();
      if (Class) _setPrototypeOf(instance, Class.prototype);
      return instance;
    };
  }
  return _construct.apply(null, arguments);
}
;// CONCATENATED MODULE: ./node_modules/@babel/runtime/helpers/esm/wrapNativeSuper.js




function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? new Map() : undefined;
  _wrapNativeSuper = function _wrapNativeSuper(Class) {
    if (Class === null || !_isNativeFunction(Class)) return Class;
    if (typeof Class !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }
    if (typeof _cache !== "undefined") {
      if (_cache.has(Class)) return _cache.get(Class);
      _cache.set(Class, Wrapper);
    }
    function Wrapper() {
      return _construct(Class, arguments, _getPrototypeOf(this).constructor);
    }
    Wrapper.prototype = Object.create(Class.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    return _setPrototypeOf(Wrapper, Class);
  };
  return _wrapNativeSuper(Class);
}
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/overwritable.js
/**
 * functions that can or should be overwritten by plugins
 * IMPORTANT: Do not import any big stuff from RxDB here!
 * An 'overwritable' can be used inside WebWorkers for RxStorage only,
 * and we do not want to have the full RxDB lib bundled in them.
 */

var overwritable = {
  /**
   * if this method is overwritten with one
   * that returns true, we do additional checks
   * which help the developer but have bad performance
   */
  isDevMode() {
    return false;
  },
  /**
   * Deep freezes and object when in dev-mode.
   * Deep-Freezing has the same performance as deep-cloning, so we only do that in dev-mode.
   * Also, we can ensure the readonly state via typescript
   * @link https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
   */
  deepFreezeWhenDevMode(obj) {
    return obj;
  },
  /**
   * overwritten to map error-codes to text-messages
   */
  tunnelErrorMessage(message) {
    return "RxDB Error-Code " + message + ".\n        Error messages are not included in RxDB core to reduce build size.\n        - To find out what this error means, either use the dev-mode-plugin https://rxdb.info/dev-mode.html\n        - or search for the error code here: https://github.com/pubkey/rxdb/search?q=" + message + "\n        ";
  }
};
//# sourceMappingURL=overwritable.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/rx-error.js



/**
 * here we use custom errors with the additional field 'parameters'
 */


/**
 * transform an object of parameters to a presentable string
 */
function parametersToString(parameters) {
  var ret = '';
  if (Object.keys(parameters).length === 0) return ret;
  ret += 'Given parameters: {\n';
  ret += Object.keys(parameters).map(k => {
    var paramStr = '[object Object]';
    try {
      if (k === 'errors') {
        paramStr = parameters[k].map(err => JSON.stringify(err, Object.getOwnPropertyNames(err)));
      } else {
        paramStr = JSON.stringify(parameters[k], function (_k, v) {
          return v === undefined ? null : v;
        }, 2);
      }
    } catch (e) {}
    return k + ':' + paramStr;
  }).join('\n');
  ret += '}';
  return ret;
}
function messageForError(message, code, parameters) {
  return 'RxError (' + code + '):' + '\n' + message + '\n' + parametersToString(parameters);
}
var RxError = /*#__PURE__*/function (_Error) {
  _inheritsLoose(RxError, _Error);
  // always true, use this to detect if its an rxdb-error

  function RxError(code, message, parameters = {}) {
    var _this;
    var mes = messageForError(message, code, parameters);
    _this = _Error.call(this, mes) || this;
    _this.code = code;
    _this.message = mes;
    _this.parameters = parameters;
    _this.rxdb = true; // tag them as internal
    return _this;
  }
  var _proto = RxError.prototype;
  _proto.toString = function toString() {
    return this.message;
  };
  _createClass(RxError, [{
    key: "name",
    get: function () {
      return 'RxError (' + this.code + ')';
    }
  }, {
    key: "typeError",
    get: function () {
      return false;
    }
  }]);
  return RxError;
}( /*#__PURE__*/_wrapNativeSuper(Error));
var RxTypeError = /*#__PURE__*/function (_TypeError) {
  _inheritsLoose(RxTypeError, _TypeError);
  // always true, use this to detect if its an rxdb-error

  function RxTypeError(code, message, parameters = {}) {
    var _this2;
    var mes = messageForError(message, code, parameters);
    _this2 = _TypeError.call(this, mes) || this;
    _this2.code = code;
    _this2.message = mes;
    _this2.parameters = parameters;
    _this2.rxdb = true; // tag them as internal
    return _this2;
  }
  var _proto2 = RxTypeError.prototype;
  _proto2.toString = function toString() {
    return this.message;
  };
  _createClass(RxTypeError, [{
    key: "name",
    get: function () {
      return 'RxTypeError (' + this.code + ')';
    }
  }, {
    key: "typeError",
    get: function () {
      return true;
    }
  }]);
  return RxTypeError;
}( /*#__PURE__*/_wrapNativeSuper(TypeError));
function rx_error_newRxError(code, parameters) {
  return new RxError(code, overwritable.tunnelErrorMessage(code), parameters);
}
function newRxTypeError(code, parameters) {
  return new RxTypeError(code, overwritable.tunnelErrorMessage(code), parameters);
}

/**
 * Returns the error if it is a 409 conflict,
 * return false if it is another error.
 */
function rx_error_isBulkWriteConflictError(err) {
  if (err && err.status === 409) {
    return err;
  } else {
    return false;
  }
}
var STORAGE_WRITE_ERROR_CODE_TO_MESSAGE = {
  409: 'document write conflict',
  422: 'schema validation error',
  510: 'attachment data missing'
};
function rxStorageWriteErrorToRxError(err) {
  return rx_error_newRxError('COL20', {
    name: STORAGE_WRITE_ERROR_CODE_TO_MESSAGE[err.status],
    document: err.documentId,
    writeError: err
  });
}
//# sourceMappingURL=rx-error.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/plugins/utils/utils-object-deep-equal.js
/**
 * Copied from the fast-deep-equal package
 * because it does not support es modules and causes optimization bailouts.
 * TODO use the npm package again when this is merged:
 * @link https://github.com/epoberezkin/fast-deep-equal/pull/105
 */
function deepEqual(a, b) {
  if (a === b) return true;
  if (a && b && typeof a == 'object' && typeof b == 'object') {
    if (a.constructor !== b.constructor) return false;
    var length;
    var i;
    if (Array.isArray(a)) {
      length = a.length;
      if (length !== b.length) return false;
      for (i = length; i-- !== 0;) if (!deepEqual(a[i], b[i])) return false;
      return true;
    }
    if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
    if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
    if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
    var keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;
    for (i = length; i-- !== 0;) if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
    for (i = length; i-- !== 0;) {
      var key = keys[i];
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  // true if both NaN, false otherwise
  return a !== a && b !== b;
}
//# sourceMappingURL=utils-object-deep-equal.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/plugins/utils/utils-array.js
function utils_array_lastOfArray(ar) {
  return ar[ar.length - 1];
}

/**
 * shuffle the given array
 */
function shuffleArray(arr) {
  return arr.slice(0).sort(() => Math.random() - 0.5);
}
function toArray(input) {
  return Array.isArray(input) ? input.slice(0) : [input];
}

/**
 * Split array with items into smaller arrays with items
 * @link https://stackoverflow.com/a/7273794/3443137
 */
function batchArray(array, batchSize) {
  array = array.slice(0);
  var ret = [];
  while (array.length) {
    var batch = array.splice(0, batchSize);
    ret.push(batch);
  }
  return ret;
}

/**
 * @link https://stackoverflow.com/a/15996017
 */
function removeOneFromArrayIfMatches(ar, condition) {
  ar = ar.slice();
  var i = ar.length;
  var done = false;
  while (i-- && !done) {
    if (condition(ar[i])) {
      done = true;
      ar.splice(i, 1);
    }
  }
  return ar;
}

/**
 * returns true if the supplied argument is either an Array<T> or a Readonly<Array<T>>
 */
function isMaybeReadonlyArray(x) {
  // While this looks strange, it's a workaround for an issue in TypeScript:
  // https://github.com/microsoft/TypeScript/issues/17002
  //
  // The problem is that `Array.isArray` as a type guard returns `false` for a readonly array,
  // but at runtime the object is an array and the runtime call to `Array.isArray` would return `true`.
  // The type predicate here allows for both `Array<T>` and `Readonly<Array<T>>` to pass a type check while
  // still performing runtime type inspection.
  return Array.isArray(x);
}
function isOneItemOfArrayInOtherArray(ar1, ar2) {
  for (var i = 0; i < ar1.length; i++) {
    var el = ar1[i];
    var has = ar2.includes(el);
    if (has) {
      return true;
    }
  }
  return false;
}

/**
 * Use this in array.filter() to remove all empty slots
 * and have the correct typings afterwards.
 * @link https://stackoverflow.com/a/46700791/3443137
 */
function arrayFilterNotEmpty(value) {
  if (value === null || value === undefined) {
    return false;
  }
  return true;
}
function countUntilNotMatching(ar, matchingFn) {
  var count = 0;
  var idx = -1;
  for (var _item of ar) {
    idx = idx + 1;
    var matching = matchingFn(_item, idx);
    if (matching) {
      count = count + 1;
    } else {
      break;
    }
  }
  return count;
}
async function asyncFilter(array, predicate) {
  var filters = await Promise.all(array.map(predicate));
  return array.filter((...[, index]) => filters[index]);
}

/**
 * @link https://stackoverflow.com/a/3762735
 */
function sumNumberArray(array) {
  var count = 0;
  for (var i = array.length; i--;) {
    count += array[i];
  }
  return count;
}
function maxOfNumbers(arr) {
  return Math.max(...arr);
}

/**
 * Appends the given documents to the given array.
 * This will mutate the first given array.
 * Mostly used as faster alternative to Array.concat()
 * because .concat() is so slow.
 * @link https://www.measurethat.net/Benchmarks/Show/4223/0/array-concat-vs-spread-operator-vs-push#latest_results_block
 */
function utils_array_appendToArray(ar, add) {
  var amount = add.length;
  for (var i = 0; i < amount; ++i) {
    var element = add[i];
    ar.push(element);
  }
}

/**
 * @link https://gist.github.com/telekosmos/3b62a31a5c43f40849bb
 */
function uniqueArray(arrArg) {
  return arrArg.filter(function (elem, pos, arr) {
    return arr.indexOf(elem) === pos;
  });
}
//# sourceMappingURL=utils-array.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/hooks.js
/**
 * hook-functions that can be extended by the plugin
 */
var HOOKS = {
  /**
   * Runs before a plugin is added.
   * Use this to block the usage of non-compatible plugins.
   */
  preAddRxPlugin: [],
  /**
   * functions that run before the database is created
   */
  preCreateRxDatabase: [],
  /**
   * runs after the database is created and prepared
   * but before the instance is returned to the user
   * @async
   */
  createRxDatabase: [],
  preCreateRxCollection: [],
  createRxCollection: [],
  /**
  * runs at the end of the destroy-process of a collection
  * @async
  */
  postDestroyRxCollection: [],
  /**
   * Runs after a collection is removed.
   * @async
   */
  postRemoveRxCollection: [],
  /**
    * functions that get the json-schema as input
    * to do additionally checks/manipulation
    */
  preCreateRxSchema: [],
  /**
   * functions that run after the RxSchema is created
   * gets RxSchema as attribute
   */
  createRxSchema: [],
  preCreateRxQuery: [],
  /**
   * Runs before a query is send to the
   * prepareQuery function of the storage engine.
   */
  prePrepareQuery: [],
  createRxDocument: [],
  /**
   * runs after a RxDocument is created,
   * cannot be async
   */
  postCreateRxDocument: [],
  /**
   * Runs before a RxStorageInstance is created
   * gets the params of createStorageInstance()
   * as attribute so you can manipulate them.
   * Notice that you have to clone stuff before mutating the inputs.
   */
  preCreateRxStorageInstance: [],
  /**
   * runs on the document-data before the document is migrated
   * {
   *   doc: Object, // original doc-data
   *   migrated: // migrated doc-data after run through migration-strategies
   * }
   */
  preMigrateDocument: [],
  /**
   * runs after the migration of a document has been done
   */
  postMigrateDocument: [],
  /**
   * runs at the beginning of the destroy-process of a database
   */
  preDestroyRxDatabase: [],
  /**
   * runs after a database has been removed
   * @async
   */
  postRemoveRxDatabase: [],
  /**
   * runs before the replication writes the rows to master
   * but before the rows have been modified
   * @async
   */
  preReplicationMasterWrite: [],
  /**
   * runs after the replication has been sent to the server
   * but before the new documents have been handled
   * @async
   */
  preReplicationMasterWriteDocumentsHandle: []
};
function runPluginHooks(hookKey, obj) {
  if (HOOKS[hookKey]) {
    HOOKS[hookKey].forEach(fun => fun(obj));
  }
}

/**
 * TODO
 * we should not run the hooks in parallel
 * this makes stuff unpredictable.
 */
function runAsyncPluginHooks(hookKey, obj) {
  return Promise.all(HOOKS[hookKey].map(fun => fun(obj)));
}

/**
 * used in tests to remove hooks
 */
function _clearHook(type, fun) {
  HOOKS[type] = HOOKS[type].filter(h => h !== fun);
}
//# sourceMappingURL=hooks.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/plugins/utils/utils-regex.js
var REGEX_ALL_DOTS = /\./g;
var REGEX_ALL_PIPES = /\|/g;
//# sourceMappingURL=utils-regex.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/plugins/utils/utils-object-dot-prop.js
/**
 * Copied from
 * @link https://github.com/sindresorhus/dot-prop/blob/main/index.js
 * because it is currently an esm only module.
 * TODO use the npm package again when RxDB is also fully esm.
 */

var utils_object_dot_prop_isObject = value => {
  var type = typeof value;
  return value !== null && (type === 'object' || type === 'function');
};
var disallowedKeys = new Set(['__proto__', 'prototype', 'constructor']);
var digits = new Set('0123456789');
function getPathSegments(path) {
  var parts = [];
  var currentSegment = '';
  var currentPart = 'start';
  var isIgnoring = false;
  for (var character of path) {
    switch (character) {
      case '\\':
        {
          if (currentPart === 'index') {
            throw new Error('Invalid character in an index');
          }
          if (currentPart === 'indexEnd') {
            throw new Error('Invalid character after an index');
          }
          if (isIgnoring) {
            currentSegment += character;
          }
          currentPart = 'property';
          isIgnoring = !isIgnoring;
          break;
        }
      case '.':
        {
          if (currentPart === 'index') {
            throw new Error('Invalid character in an index');
          }
          if (currentPart === 'indexEnd') {
            currentPart = 'property';
            break;
          }
          if (isIgnoring) {
            isIgnoring = false;
            currentSegment += character;
            break;
          }
          if (disallowedKeys.has(currentSegment)) {
            return [];
          }
          parts.push(currentSegment);
          currentSegment = '';
          currentPart = 'property';
          break;
        }
      case '[':
        {
          if (currentPart === 'index') {
            throw new Error('Invalid character in an index');
          }
          if (currentPart === 'indexEnd') {
            currentPart = 'index';
            break;
          }
          if (isIgnoring) {
            isIgnoring = false;
            currentSegment += character;
            break;
          }
          if (currentPart === 'property') {
            if (disallowedKeys.has(currentSegment)) {
              return [];
            }
            parts.push(currentSegment);
            currentSegment = '';
          }
          currentPart = 'index';
          break;
        }
      case ']':
        {
          if (currentPart === 'index') {
            parts.push(Number.parseInt(currentSegment, 10));
            currentSegment = '';
            currentPart = 'indexEnd';
            break;
          }
          if (currentPart === 'indexEnd') {
            throw new Error('Invalid character after an index');
          }

          // Falls through
        }
      default:
        {
          if (currentPart === 'index' && !digits.has(character)) {
            throw new Error('Invalid character in an index');
          }
          if (currentPart === 'indexEnd') {
            throw new Error('Invalid character after an index');
          }
          if (currentPart === 'start') {
            currentPart = 'property';
          }
          if (isIgnoring) {
            isIgnoring = false;
            currentSegment += '\\';
          }
          currentSegment += character;
        }
    }
  }
  if (isIgnoring) {
    currentSegment += '\\';
  }
  switch (currentPart) {
    case 'property':
      {
        if (disallowedKeys.has(currentSegment)) {
          return [];
        }
        parts.push(currentSegment);
        break;
      }
    case 'index':
      {
        throw new Error('Index was not closed');
      }
    case 'start':
      {
        parts.push('');
        break;
      }
    // No default
  }
  return parts;
}
function isStringIndex(object, key) {
  if (typeof key !== 'number' && Array.isArray(object)) {
    var index = Number.parseInt(key, 10);
    return Number.isInteger(index) && object[index] === object[key];
  }
  return false;
}
function assertNotStringIndex(object, key) {
  if (isStringIndex(object, key)) {
    throw new Error('Cannot use string index');
  }
}

/**
 * TODO we need some performance tests and improvements here.
 */
function getProperty(object, path, value) {
  if (Array.isArray(path)) {
    path = path.join('.');
  }

  /**
   * Performance shortcut.
   * In most cases we just have a simple property name
   * so we can directly return it.
   */
  if (!path.includes('.') && !path.includes('[')) {
    return object[path];
  }
  if (!utils_object_dot_prop_isObject(object) || typeof path !== 'string') {
    return value === undefined ? object : value;
  }
  var pathArray = getPathSegments(path);
  if (pathArray.length === 0) {
    return value;
  }
  for (var index = 0; index < pathArray.length; index++) {
    var key = pathArray[index];
    if (isStringIndex(object, key)) {
      object = index === pathArray.length - 1 ? undefined : null;
    } else {
      object = object[key];
    }
    if (object === undefined || object === null) {
      // `object` is either `undefined` or `null` so we want to stop the loop, and
      // if this is not the last bit of the path, and
      // if it didn't return `undefined`
      // it would return `null` if `object` is `null`
      // but we want `get({foo: null}, 'foo.bar')` to equal `undefined`, or the supplied value, not `null`
      if (index !== pathArray.length - 1) {
        return value;
      }
      break;
    }
  }
  return object === undefined ? value : object;
}
function setProperty(object, path, value) {
  if (Array.isArray(path)) {
    path = path.join('.');
  }
  if (!utils_object_dot_prop_isObject(object) || typeof path !== 'string') {
    return object;
  }
  var root = object;
  var pathArray = getPathSegments(path);
  for (var index = 0; index < pathArray.length; index++) {
    var key = pathArray[index];
    assertNotStringIndex(object, key);
    if (index === pathArray.length - 1) {
      object[key] = value;
    } else if (!utils_object_dot_prop_isObject(object[key])) {
      object[key] = typeof pathArray[index + 1] === 'number' ? [] : {};
    }
    object = object[key];
  }
  return root;
}
function deleteProperty(object, path) {
  if (!utils_object_dot_prop_isObject(object) || typeof path !== 'string') {
    return false;
  }
  var pathArray = getPathSegments(path);
  for (var index = 0; index < pathArray.length; index++) {
    var key = pathArray[index];
    assertNotStringIndex(object, key);
    if (index === pathArray.length - 1) {
      delete object[key];
      return true;
    }
    object = object[key];
    if (!utils_object_dot_prop_isObject(object)) {
      return false;
    }
  }
}
function hasProperty(object, path) {
  if (!utils_object_dot_prop_isObject(object) || typeof path !== 'string') {
    return false;
  }
  var pathArray = getPathSegments(path);
  if (pathArray.length === 0) {
    return false;
  }
  for (var key of pathArray) {
    if (!utils_object_dot_prop_isObject(object) || !(key in object) || isStringIndex(object, key)) {
      return false;
    }
    object = object[key];
  }
  return true;
}

// TODO: Backslashes with no effect should not be escaped
function escapePath(path) {
  if (typeof path !== 'string') {
    throw new TypeError('Expected a string');
  }
  return path.replace(/[\\.[]/g, '\\$&');
}

// The keys returned by Object.entries() for arrays are strings
function entries(value) {
  if (Array.isArray(value)) {
    return value.map((v, index) => [index, v]);
  }
  return Object.entries(value);
}
function stringifyPath(pathSegments) {
  var result = '';

  // eslint-disable-next-line prefer-const
  for (var [index, segment] of entries(pathSegments)) {
    if (typeof segment === 'number') {
      result += "[" + segment + "]";
    } else {
      segment = escapePath(segment);
      result += index === 0 ? segment : "." + segment;
    }
  }
  return result;
}
function* deepKeysIterator(object, currentPath = []) {
  if (!utils_object_dot_prop_isObject(object)) {
    if (currentPath.length > 0) {
      yield stringifyPath(currentPath);
    }
    return;
  }
  for (var [key, value] of entries(object)) {
    yield* deepKeysIterator(value, [...currentPath, key]);
  }
}
function deepKeys(object) {
  return [...deepKeysIterator(object)];
}
//# sourceMappingURL=utils-object-dot-prop.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/rx-schema-helper.js


/**
 * Helper function to create a valid RxJsonSchema
 * with a given version.
 */
function getPseudoSchemaForVersion(version, primaryKey) {
  var pseudoSchema = fillWithDefaultSettings({
    version,
    type: 'object',
    primaryKey: primaryKey,
    properties: {
      [primaryKey]: {
        type: 'string',
        maxLength: 100
      }
    },
    indexes: [[primaryKey]],
    required: [primaryKey]
  });
  return pseudoSchema;
}

/**
 * Returns the sub-schema for a given path
 */
function getSchemaByObjectPath(rxJsonSchema, path) {
  var usePath = path;
  usePath = usePath.replace(REGEX_ALL_DOTS, '.properties.');
  usePath = 'properties.' + usePath;
  usePath = trimDots(usePath);
  var ret = getProperty(rxJsonSchema, usePath);
  return ret;
}
function fillPrimaryKey(primaryPath, jsonSchema, documentData) {
  // optimization shortcut.
  if (typeof jsonSchema.primaryKey === 'string') {
    return documentData;
  }
  var newPrimary = getComposedPrimaryKeyOfDocumentData(jsonSchema, documentData);
  var existingPrimary = documentData[primaryPath];
  if (existingPrimary && existingPrimary !== newPrimary) {
    throw rx_error_newRxError('DOC19', {
      args: {
        documentData,
        existingPrimary,
        newPrimary
      },
      schema: jsonSchema
    });
  }
  documentData[primaryPath] = newPrimary;
  return documentData;
}
function rx_schema_helper_getPrimaryFieldOfPrimaryKey(primaryKey) {
  if (typeof primaryKey === 'string') {
    return primaryKey;
  } else {
    return primaryKey.key;
  }
}
function getLengthOfPrimaryKey(schema) {
  var primaryPath = rx_schema_helper_getPrimaryFieldOfPrimaryKey(schema.primaryKey);
  var schemaPart = getSchemaByObjectPath(schema, primaryPath);
  return ensureNotFalsy(schemaPart.maxLength);
}

/**
 * Returns the composed primaryKey of a document by its data.
 */
function getComposedPrimaryKeyOfDocumentData(jsonSchema, documentData) {
  if (typeof jsonSchema.primaryKey === 'string') {
    return documentData[jsonSchema.primaryKey];
  }
  var compositePrimary = jsonSchema.primaryKey;
  return compositePrimary.fields.map(field => {
    var value = getProperty(documentData, field);
    if (typeof value === 'undefined') {
      throw rx_error_newRxError('DOC18', {
        args: {
          field,
          documentData
        }
      });
    }
    return value;
  }).join(compositePrimary.separator);
}

/**
 * Normalize the RxJsonSchema.
 * We need this to ensure everything is set up properly
 * and we have the same hash on schemas that represent the same value but
 * have different json.
 *
 * - Orders the schemas attributes by alphabetical order
 * - Adds the primaryKey to all indexes that do not contain the primaryKey
 * - We need this for deterministic sort order on all queries, which is required for event-reduce to work.
 *
 * @return RxJsonSchema - ordered and filled
 */
function normalizeRxJsonSchema(jsonSchema) {
  var normalizedSchema = sortObject(jsonSchema, true);
  return normalizedSchema;
}

/**
 * If the schema does not specify any index,
 * we add this index so we at least can run RxQuery()
 * and only select non-deleted fields.
 */
function getDefaultIndex(primaryPath) {
  return ['_deleted', primaryPath];
}

/**
 * fills the schema-json with default-settings
 * @return cloned schemaObj
 */
function fillWithDefaultSettings(schemaObj) {
  schemaObj = utils_object_flatClone(schemaObj);
  var primaryPath = rx_schema_helper_getPrimaryFieldOfPrimaryKey(schemaObj.primaryKey);
  schemaObj.properties = utils_object_flatClone(schemaObj.properties);

  // additionalProperties is always false
  schemaObj.additionalProperties = false;

  // fill with key-compression-state ()
  if (!Object.prototype.hasOwnProperty.call(schemaObj, 'keyCompression')) {
    schemaObj.keyCompression = false;
  }

  // indexes must be array
  schemaObj.indexes = schemaObj.indexes ? schemaObj.indexes.slice(0) : [];

  // required must be array
  schemaObj.required = schemaObj.required ? schemaObj.required.slice(0) : [];

  // encrypted must be array
  schemaObj.encrypted = schemaObj.encrypted ? schemaObj.encrypted.slice(0) : [];

  // add _rev
  schemaObj.properties._rev = {
    type: 'string',
    minLength: 1
  };

  // add attachments
  schemaObj.properties._attachments = {
    type: 'object'
  };

  // add deleted flag
  schemaObj.properties._deleted = {
    type: 'boolean'
  };

  // add meta property
  schemaObj.properties._meta = RX_META_SCHEMA;

  /**
   * meta fields are all required
   */
  schemaObj.required = schemaObj.required ? schemaObj.required.slice(0) : [];
  schemaObj.required.push('_deleted');
  schemaObj.required.push('_rev');
  schemaObj.required.push('_meta');
  schemaObj.required.push('_attachments');

  // final fields are always required
  var finalFields = getFinalFields(schemaObj);
  utils_array_appendToArray(schemaObj.required, finalFields);
  schemaObj.required = schemaObj.required.filter(field => !field.includes('.')).filter((elem, pos, arr) => arr.indexOf(elem) === pos); // unique;

  // version is 0 by default
  schemaObj.version = schemaObj.version || 0;
  var useIndexes = schemaObj.indexes.map(index => {
    var arIndex = isMaybeReadonlyArray(index) ? index.slice(0) : [index];
    /**
     * Append primary key to indexes that do not contain the primaryKey.
     * All indexes must have the primaryKey to ensure a deterministic sort order.
     */
    if (!arIndex.includes(primaryPath)) {
      arIndex.push(primaryPath);
    }

    // add _deleted flag to all indexes so we can query only non-deleted fields
    // in RxDB itself
    if (arIndex[0] !== '_deleted') {
      arIndex.unshift('_deleted');
    }
    return arIndex;
  });
  if (useIndexes.length === 0) {
    useIndexes.push(getDefaultIndex(primaryPath));
  }

  // we need this index for the getChangedDocumentsSince() method
  useIndexes.push(['_meta.lwt', primaryPath]);

  // make indexes unique
  var hasIndex = new Set();
  useIndexes.filter(index => {
    var indexStr = index.join(',');
    if (hasIndex.has(indexStr)) {
      return false;
    } else {
      hasIndex.add(indexStr);
      return true;
    }
  });
  schemaObj.indexes = useIndexes;
  return schemaObj;
}
var RX_META_SCHEMA = {
  type: 'object',
  properties: {
    /**
     * The last-write time.
     * Unix time in milliseconds.
     */
    lwt: {
      type: 'number',
      /**
       * We use 1 as minimum so that the value is never falsy.
       */
      minimum: utils_document_RX_META_LWT_MINIMUM,
      maximum: 1000000000000000,
      multipleOf: 0.01
    }
  },
  /**
   * Additional properties are allowed
   * and can be used by plugins to set various flags.
   */
  additionalProperties: true,
  required: ['lwt']
};

/**
 * returns the final-fields of the schema
 * @return field-names of the final-fields
 */
function getFinalFields(jsonSchema) {
  var ret = Object.keys(jsonSchema.properties).filter(key => jsonSchema.properties[key].final);

  // primary is also final
  var primaryPath = rx_schema_helper_getPrimaryFieldOfPrimaryKey(jsonSchema.primaryKey);
  ret.push(primaryPath);

  // fields of composite primary are final
  if (typeof jsonSchema.primaryKey !== 'string') {
    jsonSchema.primaryKey.fields.forEach(field => ret.push(field));
  }
  return ret;
}

/**
 * fills all unset fields with default-values if set
 * @hotPath
 */
function fillObjectWithDefaults(rxSchema, obj) {
  var defaultKeys = Object.keys(rxSchema.defaultValues);
  for (var i = 0; i < defaultKeys.length; ++i) {
    var key = defaultKeys[i];
    if (!Object.prototype.hasOwnProperty.call(obj, key) || typeof obj[key] === 'undefined') {
      obj[key] = rxSchema.defaultValues[key];
    }
  }
  return obj;
}
var DEFAULT_CHECKPOINT_SCHEMA = {
  type: 'object',
  properties: {
    id: {
      type: 'string'
    },
    lwt: {
      type: 'number'
    }
  },
  required: ['id', 'lwt'],
  additionalProperties: false
};
//# sourceMappingURL=rx-schema-helper.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/rx-schema.js






var RxSchema = /*#__PURE__*/function () {
  function RxSchema(jsonSchema, hashFunction) {
    this.jsonSchema = jsonSchema;
    this.hashFunction = hashFunction;
    this.indexes = getIndexes(this.jsonSchema);

    // primary is always required
    this.primaryPath = rx_schema_helper_getPrimaryFieldOfPrimaryKey(this.jsonSchema.primaryKey);
    this.finalFields = getFinalFields(this.jsonSchema);
  }
  var _proto = RxSchema.prototype;
  /**
   * checks if a given change on a document is allowed
   * Ensures that:
   * - final fields are not modified
   * @throws {Error} if not valid
   */
  _proto.validateChange = function validateChange(dataBefore, dataAfter) {
    this.finalFields.forEach(fieldName => {
      if (!deepEqual(dataBefore[fieldName], dataAfter[fieldName])) {
        throw rx_error_newRxError('DOC9', {
          dataBefore,
          dataAfter,
          fieldName,
          schema: this.jsonSchema
        });
      }
    });
  }

  /**
   * creates the schema-based document-prototype,
   * see RxCollection.getDocumentPrototype()
   */;
  _proto.getDocumentPrototype = function getDocumentPrototype() {
    var proto = {};

    /**
     * On the top level, we know all keys
     * and therefore do not have to create a new Proxy object
     * for each document. Instead we define the getter in the prototype once.
     */
    var pathProperties = getSchemaByObjectPath(this.jsonSchema, '');
    Object.keys(pathProperties).forEach(key => {
      var fullPath = key;

      // getter - value
      proto.__defineGetter__(key, function () {
        if (!this.get || typeof this.get !== 'function') {
          /**
           * When an object gets added to the state of a vuejs-component,
           * it happens that this getter is called with another scope.
           * To prevent errors, we have to return undefined in this case
           */
          return undefined;
        }
        var ret = this.get(fullPath);
        return ret;
      });
      // getter - observable$
      Object.defineProperty(proto, key + '$', {
        get: function () {
          return this.get$(fullPath);
        },
        enumerable: false,
        configurable: false
      });
      // getter - populate_
      Object.defineProperty(proto, key + '_', {
        get: function () {
          return this.populate(fullPath);
        },
        enumerable: false,
        configurable: false
      });
    });
    overwriteGetterForCaching(this, 'getDocumentPrototype', () => proto);
    return proto;
  };
  _proto.getPrimaryOfDocumentData = function getPrimaryOfDocumentData(documentData) {
    return getComposedPrimaryKeyOfDocumentData(this.jsonSchema, documentData);
  };
  _createClass(RxSchema, [{
    key: "version",
    get: function () {
      return this.jsonSchema.version;
    }
  }, {
    key: "defaultValues",
    get: function () {
      var values = {};
      Object.entries(this.jsonSchema.properties).filter(([, v]) => Object.prototype.hasOwnProperty.call(v, 'default')).forEach(([k, v]) => values[k] = v.default);
      return overwriteGetterForCaching(this, 'defaultValues', values);
    }

    /**
     * @overrides itself on the first call
     *
     * TODO this should be a pure function that
     * caches the hash in a WeakMap.
     */
  }, {
    key: "hash",
    get: function () {
      return overwriteGetterForCaching(this, 'hash', this.hashFunction(JSON.stringify(this.jsonSchema)));
    }
  }]);
  return RxSchema;
}();
function getIndexes(jsonSchema) {
  return (jsonSchema.indexes || []).map(index => isMaybeReadonlyArray(index) ? index : [index]);
}

/**
 * array with previous version-numbers
 */
function getPreviousVersions(schema) {
  var version = schema.version ? schema.version : 0;
  var c = 0;
  return new Array(version).fill(0).map(() => c++);
}
function createRxSchema(jsonSchema, hashFunction, runPreCreateHooks = true) {
  if (runPreCreateHooks) {
    runPluginHooks('preCreateRxSchema', jsonSchema);
  }
  var useJsonSchema = fillWithDefaultSettings(jsonSchema);
  useJsonSchema = normalizeRxJsonSchema(useJsonSchema);
  overwritable.deepFreezeWhenDevMode(useJsonSchema);
  var schema = new RxSchema(useJsonSchema, hashFunction);
  runPluginHooks('createRxSchema', schema);
  return schema;
}
function isRxSchema(obj) {
  return obj instanceof RxSchema;
}

/**
 * Used as helper function the generate the document type out of the schema via typescript.
 * @link https://github.com/pubkey/rxdb/discussions/3467
 */
function toTypedRxJsonSchema(schema) {
  return schema;
}
//# sourceMappingURL=rx-schema.js.map
;// CONCATENATED MODULE: ./node_modules/tslib/tslib.es6.mjs
/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol */

var extendStatics = function(d, b) {
  extendStatics = Object.setPrototypeOf ||
      ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
      function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
  return extendStatics(d, b);
};

function __extends(d, b) {
  if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
  extendStatics(d, b);
  function __() { this.constructor = d; }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
  __assign = Object.assign || function __assign(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
      }
      return t;
  }
  return __assign.apply(this, arguments);
}

function __rest(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
      t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
          if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
              t[p[i]] = s[p[i]];
      }
  return t;
}

function __decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
  return function (target, key) { decorator(target, key, paramIndex); }
}

function __esDecorate(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
      var context = {};
      for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
      for (var p in contextIn.access) context.access[p] = contextIn.access[p];
      context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
      var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
      if (kind === "accessor") {
          if (result === void 0) continue;
          if (result === null || typeof result !== "object") throw new TypeError("Object expected");
          if (_ = accept(result.get)) descriptor.get = _;
          if (_ = accept(result.set)) descriptor.set = _;
          if (_ = accept(result.init)) initializers.unshift(_);
      }
      else if (_ = accept(result)) {
          if (kind === "field") initializers.unshift(_);
          else descriptor[key] = _;
      }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};

function __runInitializers(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
      value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
};

function __propKey(x) {
  return typeof x === "symbol" ? x : "".concat(x);
};

function __setFunctionName(f, name, prefix) {
  if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
  return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};

function __metadata(metadataKey, metadataValue) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
  return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
      function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
      function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}

function __generator(thisArg, body) {
  var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
  function verb(n) { return function (v) { return step([n, v]); }; }
  function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while (g && (g = 0, op[0] && (_ = 0)), _) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
              case 0: case 1: t = op; break;
              case 4: _.label++; return { value: op[1], done: false };
              case 5: _.label++; y = op[1]; op = [0]; continue;
              case 7: op = _.ops.pop(); _.trys.pop(); continue;
              default:
                  if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                  if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                  if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                  if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                  if (t[2]) _.ops.pop();
                  _.trys.pop(); continue;
          }
          op = body.call(thisArg, _);
      } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
      if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
  }
}

var __createBinding = Object.create ? (function(o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
  }
  Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});

function __exportStar(m, o) {
  for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
}

function __values(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
      next: function () {
          if (o && i >= o.length) o = void 0;
          return { value: o && o[i++], done: !o };
      }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
      while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  }
  catch (error) { e = { error: error }; }
  finally {
      try {
          if (r && !r.done && (m = i["return"])) m.call(i);
      }
      finally { if (e) throw e.error; }
  }
  return ar;
}

/** @deprecated */
function __spread() {
  for (var ar = [], i = 0; i < arguments.length; i++)
      ar = ar.concat(__read(arguments[i]));
  return ar;
}

/** @deprecated */
function __spreadArrays() {
  for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
  for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
          r[k] = a[j];
  return r;
}

function __spreadArray(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
      if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
      }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
}

function __await(v) {
  return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var g = generator.apply(thisArg, _arguments || []), i, q = [];
  return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
  function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
  function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
  function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
  function fulfill(value) { resume("next", value); }
  function reject(value) { resume("throw", value); }
  function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
  var i, p;
  return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
  function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var m = o[Symbol.asyncIterator], i;
  return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
  function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
  function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
  if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
  return cooked;
};

var __setModuleDefault = Object.create ? (function(o, v) {
  Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
  o["default"] = v;
};

function __importStar(mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
  __setModuleDefault(result, mod);
  return result;
}

function __importDefault(mod) {
  return (mod && mod.__esModule) ? mod : { default: mod };
}

function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

function __classPrivateFieldIn(state, receiver) {
  if (receiver === null || (typeof receiver !== "object" && typeof receiver !== "function")) throw new TypeError("Cannot use 'in' operator on non-object");
  return typeof state === "function" ? receiver === state : state.has(receiver);
}

function __addDisposableResource(env, value, async) {
  if (value !== null && value !== void 0) {
    if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
    var dispose;
    if (async) {
        if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
        dispose = value[Symbol.asyncDispose];
    }
    if (dispose === void 0) {
        if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
        dispose = value[Symbol.dispose];
    }
    if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
    env.stack.push({ value: value, dispose: dispose, async: async });
  }
  else if (async) {
    env.stack.push({ async: true });
  }
  return value;
}

var _SuppressedError = typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function __disposeResources(env) {
  function fail(e) {
    env.error = env.hasError ? new _SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
    env.hasError = true;
  }
  function next() {
    while (env.stack.length) {
      var rec = env.stack.pop();
      try {
        var result = rec.dispose && rec.dispose.call(rec.value);
        if (rec.async) return Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
      }
      catch (e) {
          fail(e);
      }
    }
    if (env.hasError) throw env.error;
  }
  return next();
}

/* harmony default export */ const tslib_es6 = ({
  __extends,
  __assign,
  __rest,
  __decorate,
  __param,
  __metadata,
  __awaiter,
  __generator,
  __createBinding,
  __exportStar,
  __values,
  __read,
  __spread,
  __spreadArrays,
  __spreadArray,
  __await,
  __asyncGenerator,
  __asyncDelegator,
  __asyncValues,
  __makeTemplateObject,
  __importStar,
  __importDefault,
  __classPrivateFieldGet,
  __classPrivateFieldSet,
  __classPrivateFieldIn,
  __addDisposableResource,
  __disposeResources,
});

;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/isFunction.js
function isFunction_isFunction(value) {
    return typeof value === 'function';
}
//# sourceMappingURL=isFunction.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/createErrorClass.js
function createErrorClass(createImpl) {
    var _super = function (instance) {
        Error.call(instance);
        instance.stack = new Error().stack;
    };
    var ctorFunc = createImpl(_super);
    ctorFunc.prototype = Object.create(Error.prototype);
    ctorFunc.prototype.constructor = ctorFunc;
    return ctorFunc;
}
//# sourceMappingURL=createErrorClass.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/UnsubscriptionError.js

var UnsubscriptionError = createErrorClass(function (_super) {
    return function UnsubscriptionErrorImpl(errors) {
        _super(this);
        this.message = errors
            ? errors.length + " errors occurred during unsubscription:\n" + errors.map(function (err, i) { return i + 1 + ") " + err.toString(); }).join('\n  ')
            : '';
        this.name = 'UnsubscriptionError';
        this.errors = errors;
    };
});
//# sourceMappingURL=UnsubscriptionError.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/arrRemove.js
function arrRemove(arr, item) {
    if (arr) {
        var index = arr.indexOf(item);
        0 <= index && arr.splice(index, 1);
    }
}
//# sourceMappingURL=arrRemove.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/Subscription.js




var Subscription = (function () {
    function Subscription(initialTeardown) {
        this.initialTeardown = initialTeardown;
        this.closed = false;
        this._parentage = null;
        this._finalizers = null;
    }
    Subscription.prototype.unsubscribe = function () {
        var e_1, _a, e_2, _b;
        var errors;
        if (!this.closed) {
            this.closed = true;
            var _parentage = this._parentage;
            if (_parentage) {
                this._parentage = null;
                if (Array.isArray(_parentage)) {
                    try {
                        for (var _parentage_1 = __values(_parentage), _parentage_1_1 = _parentage_1.next(); !_parentage_1_1.done; _parentage_1_1 = _parentage_1.next()) {
                            var parent_1 = _parentage_1_1.value;
                            parent_1.remove(this);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_parentage_1_1 && !_parentage_1_1.done && (_a = _parentage_1.return)) _a.call(_parentage_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                }
                else {
                    _parentage.remove(this);
                }
            }
            var initialFinalizer = this.initialTeardown;
            if (isFunction_isFunction(initialFinalizer)) {
                try {
                    initialFinalizer();
                }
                catch (e) {
                    errors = e instanceof UnsubscriptionError ? e.errors : [e];
                }
            }
            var _finalizers = this._finalizers;
            if (_finalizers) {
                this._finalizers = null;
                try {
                    for (var _finalizers_1 = __values(_finalizers), _finalizers_1_1 = _finalizers_1.next(); !_finalizers_1_1.done; _finalizers_1_1 = _finalizers_1.next()) {
                        var finalizer = _finalizers_1_1.value;
                        try {
                            execFinalizer(finalizer);
                        }
                        catch (err) {
                            errors = errors !== null && errors !== void 0 ? errors : [];
                            if (err instanceof UnsubscriptionError) {
                                errors = __spreadArray(__spreadArray([], __read(errors)), __read(err.errors));
                            }
                            else {
                                errors.push(err);
                            }
                        }
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_finalizers_1_1 && !_finalizers_1_1.done && (_b = _finalizers_1.return)) _b.call(_finalizers_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
            if (errors) {
                throw new UnsubscriptionError(errors);
            }
        }
    };
    Subscription.prototype.add = function (teardown) {
        var _a;
        if (teardown && teardown !== this) {
            if (this.closed) {
                execFinalizer(teardown);
            }
            else {
                if (teardown instanceof Subscription) {
                    if (teardown.closed || teardown._hasParent(this)) {
                        return;
                    }
                    teardown._addParent(this);
                }
                (this._finalizers = (_a = this._finalizers) !== null && _a !== void 0 ? _a : []).push(teardown);
            }
        }
    };
    Subscription.prototype._hasParent = function (parent) {
        var _parentage = this._parentage;
        return _parentage === parent || (Array.isArray(_parentage) && _parentage.includes(parent));
    };
    Subscription.prototype._addParent = function (parent) {
        var _parentage = this._parentage;
        this._parentage = Array.isArray(_parentage) ? (_parentage.push(parent), _parentage) : _parentage ? [_parentage, parent] : parent;
    };
    Subscription.prototype._removeParent = function (parent) {
        var _parentage = this._parentage;
        if (_parentage === parent) {
            this._parentage = null;
        }
        else if (Array.isArray(_parentage)) {
            arrRemove(_parentage, parent);
        }
    };
    Subscription.prototype.remove = function (teardown) {
        var _finalizers = this._finalizers;
        _finalizers && arrRemove(_finalizers, teardown);
        if (teardown instanceof Subscription) {
            teardown._removeParent(this);
        }
    };
    Subscription.EMPTY = (function () {
        var empty = new Subscription();
        empty.closed = true;
        return empty;
    })();
    return Subscription;
}());

var EMPTY_SUBSCRIPTION = Subscription.EMPTY;
function isSubscription(value) {
    return (value instanceof Subscription ||
        (value && 'closed' in value && isFunction_isFunction(value.remove) && isFunction_isFunction(value.add) && isFunction_isFunction(value.unsubscribe)));
}
function execFinalizer(finalizer) {
    if (isFunction_isFunction(finalizer)) {
        finalizer();
    }
    else {
        finalizer.unsubscribe();
    }
}
//# sourceMappingURL=Subscription.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/config.js
var config = {
    onUnhandledError: null,
    onStoppedNotification: null,
    Promise: undefined,
    useDeprecatedSynchronousErrorHandling: false,
    useDeprecatedNextContext: false,
};
//# sourceMappingURL=config.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/scheduler/timeoutProvider.js

var timeoutProvider = {
    setTimeout: function (handler, timeout) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        var delegate = timeoutProvider.delegate;
        if (delegate === null || delegate === void 0 ? void 0 : delegate.setTimeout) {
            return delegate.setTimeout.apply(delegate, __spreadArray([handler, timeout], __read(args)));
        }
        return setTimeout.apply(void 0, __spreadArray([handler, timeout], __read(args)));
    },
    clearTimeout: function (handle) {
        var delegate = timeoutProvider.delegate;
        return ((delegate === null || delegate === void 0 ? void 0 : delegate.clearTimeout) || clearTimeout)(handle);
    },
    delegate: undefined,
};
//# sourceMappingURL=timeoutProvider.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/reportUnhandledError.js


function reportUnhandledError(err) {
    timeoutProvider.setTimeout(function () {
        var onUnhandledError = config.onUnhandledError;
        if (onUnhandledError) {
            onUnhandledError(err);
        }
        else {
            throw err;
        }
    });
}
//# sourceMappingURL=reportUnhandledError.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/noop.js
function noop() { }
//# sourceMappingURL=noop.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/NotificationFactories.js
var COMPLETE_NOTIFICATION = (function () { return createNotification('C', undefined, undefined); })();
function errorNotification(error) {
    return createNotification('E', undefined, error);
}
function nextNotification(value) {
    return createNotification('N', value, undefined);
}
function createNotification(kind, value, error) {
    return {
        kind: kind,
        value: value,
        error: error,
    };
}
//# sourceMappingURL=NotificationFactories.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/errorContext.js

var context = null;
function errorContext(cb) {
    if (config.useDeprecatedSynchronousErrorHandling) {
        var isRoot = !context;
        if (isRoot) {
            context = { errorThrown: false, error: null };
        }
        cb();
        if (isRoot) {
            var _a = context, errorThrown = _a.errorThrown, error = _a.error;
            context = null;
            if (errorThrown) {
                throw error;
            }
        }
    }
    else {
        cb();
    }
}
function captureError(err) {
    if (config.useDeprecatedSynchronousErrorHandling && context) {
        context.errorThrown = true;
        context.error = err;
    }
}
//# sourceMappingURL=errorContext.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/Subscriber.js









var Subscriber = (function (_super) {
    __extends(Subscriber, _super);
    function Subscriber(destination) {
        var _this = _super.call(this) || this;
        _this.isStopped = false;
        if (destination) {
            _this.destination = destination;
            if (isSubscription(destination)) {
                destination.add(_this);
            }
        }
        else {
            _this.destination = EMPTY_OBSERVER;
        }
        return _this;
    }
    Subscriber.create = function (next, error, complete) {
        return new SafeSubscriber(next, error, complete);
    };
    Subscriber.prototype.next = function (value) {
        if (this.isStopped) {
            handleStoppedNotification(nextNotification(value), this);
        }
        else {
            this._next(value);
        }
    };
    Subscriber.prototype.error = function (err) {
        if (this.isStopped) {
            handleStoppedNotification(errorNotification(err), this);
        }
        else {
            this.isStopped = true;
            this._error(err);
        }
    };
    Subscriber.prototype.complete = function () {
        if (this.isStopped) {
            handleStoppedNotification(COMPLETE_NOTIFICATION, this);
        }
        else {
            this.isStopped = true;
            this._complete();
        }
    };
    Subscriber.prototype.unsubscribe = function () {
        if (!this.closed) {
            this.isStopped = true;
            _super.prototype.unsubscribe.call(this);
            this.destination = null;
        }
    };
    Subscriber.prototype._next = function (value) {
        this.destination.next(value);
    };
    Subscriber.prototype._error = function (err) {
        try {
            this.destination.error(err);
        }
        finally {
            this.unsubscribe();
        }
    };
    Subscriber.prototype._complete = function () {
        try {
            this.destination.complete();
        }
        finally {
            this.unsubscribe();
        }
    };
    return Subscriber;
}(Subscription));

var _bind = Function.prototype.bind;
function bind(fn, thisArg) {
    return _bind.call(fn, thisArg);
}
var ConsumerObserver = (function () {
    function ConsumerObserver(partialObserver) {
        this.partialObserver = partialObserver;
    }
    ConsumerObserver.prototype.next = function (value) {
        var partialObserver = this.partialObserver;
        if (partialObserver.next) {
            try {
                partialObserver.next(value);
            }
            catch (error) {
                handleUnhandledError(error);
            }
        }
    };
    ConsumerObserver.prototype.error = function (err) {
        var partialObserver = this.partialObserver;
        if (partialObserver.error) {
            try {
                partialObserver.error(err);
            }
            catch (error) {
                handleUnhandledError(error);
            }
        }
        else {
            handleUnhandledError(err);
        }
    };
    ConsumerObserver.prototype.complete = function () {
        var partialObserver = this.partialObserver;
        if (partialObserver.complete) {
            try {
                partialObserver.complete();
            }
            catch (error) {
                handleUnhandledError(error);
            }
        }
    };
    return ConsumerObserver;
}());
var SafeSubscriber = (function (_super) {
    __extends(SafeSubscriber, _super);
    function SafeSubscriber(observerOrNext, error, complete) {
        var _this = _super.call(this) || this;
        var partialObserver;
        if (isFunction_isFunction(observerOrNext) || !observerOrNext) {
            partialObserver = {
                next: (observerOrNext !== null && observerOrNext !== void 0 ? observerOrNext : undefined),
                error: error !== null && error !== void 0 ? error : undefined,
                complete: complete !== null && complete !== void 0 ? complete : undefined,
            };
        }
        else {
            var context_1;
            if (_this && config.useDeprecatedNextContext) {
                context_1 = Object.create(observerOrNext);
                context_1.unsubscribe = function () { return _this.unsubscribe(); };
                partialObserver = {
                    next: observerOrNext.next && bind(observerOrNext.next, context_1),
                    error: observerOrNext.error && bind(observerOrNext.error, context_1),
                    complete: observerOrNext.complete && bind(observerOrNext.complete, context_1),
                };
            }
            else {
                partialObserver = observerOrNext;
            }
        }
        _this.destination = new ConsumerObserver(partialObserver);
        return _this;
    }
    return SafeSubscriber;
}(Subscriber));

function handleUnhandledError(error) {
    if (config.useDeprecatedSynchronousErrorHandling) {
        captureError(error);
    }
    else {
        reportUnhandledError(error);
    }
}
function defaultErrorHandler(err) {
    throw err;
}
function handleStoppedNotification(notification, subscriber) {
    var onStoppedNotification = config.onStoppedNotification;
    onStoppedNotification && timeoutProvider.setTimeout(function () { return onStoppedNotification(notification, subscriber); });
}
var EMPTY_OBSERVER = {
    closed: true,
    next: noop,
    error: defaultErrorHandler,
    complete: noop,
};
//# sourceMappingURL=Subscriber.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/symbol/observable.js
var observable = (function () { return (typeof Symbol === 'function' && Symbol.observable) || '@@observable'; })();
//# sourceMappingURL=observable.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/identity.js
function identity(x) {
    return x;
}
//# sourceMappingURL=identity.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/pipe.js

function pipe() {
    var fns = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        fns[_i] = arguments[_i];
    }
    return pipeFromArray(fns);
}
function pipeFromArray(fns) {
    if (fns.length === 0) {
        return identity;
    }
    if (fns.length === 1) {
        return fns[0];
    }
    return function piped(input) {
        return fns.reduce(function (prev, fn) { return fn(prev); }, input);
    };
}
//# sourceMappingURL=pipe.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/Observable.js







var Observable_Observable = (function () {
    function Observable(subscribe) {
        if (subscribe) {
            this._subscribe = subscribe;
        }
    }
    Observable.prototype.lift = function (operator) {
        var observable = new Observable();
        observable.source = this;
        observable.operator = operator;
        return observable;
    };
    Observable.prototype.subscribe = function (observerOrNext, error, complete) {
        var _this = this;
        var subscriber = isSubscriber(observerOrNext) ? observerOrNext : new SafeSubscriber(observerOrNext, error, complete);
        errorContext(function () {
            var _a = _this, operator = _a.operator, source = _a.source;
            subscriber.add(operator
                ?
                    operator.call(subscriber, source)
                : source
                    ?
                        _this._subscribe(subscriber)
                    :
                        _this._trySubscribe(subscriber));
        });
        return subscriber;
    };
    Observable.prototype._trySubscribe = function (sink) {
        try {
            return this._subscribe(sink);
        }
        catch (err) {
            sink.error(err);
        }
    };
    Observable.prototype.forEach = function (next, promiseCtor) {
        var _this = this;
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor(function (resolve, reject) {
            var subscriber = new SafeSubscriber({
                next: function (value) {
                    try {
                        next(value);
                    }
                    catch (err) {
                        reject(err);
                        subscriber.unsubscribe();
                    }
                },
                error: reject,
                complete: resolve,
            });
            _this.subscribe(subscriber);
        });
    };
    Observable.prototype._subscribe = function (subscriber) {
        var _a;
        return (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber);
    };
    Observable.prototype[observable] = function () {
        return this;
    };
    Observable.prototype.pipe = function () {
        var operations = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            operations[_i] = arguments[_i];
        }
        return pipeFromArray(operations)(this);
    };
    Observable.prototype.toPromise = function (promiseCtor) {
        var _this = this;
        promiseCtor = getPromiseCtor(promiseCtor);
        return new promiseCtor(function (resolve, reject) {
            var value;
            _this.subscribe(function (x) { return (value = x); }, function (err) { return reject(err); }, function () { return resolve(value); });
        });
    };
    Observable.create = function (subscribe) {
        return new Observable(subscribe);
    };
    return Observable;
}());

function getPromiseCtor(promiseCtor) {
    var _a;
    return (_a = promiseCtor !== null && promiseCtor !== void 0 ? promiseCtor : config.Promise) !== null && _a !== void 0 ? _a : Promise;
}
function isObserver(value) {
    return value && isFunction_isFunction(value.next) && isFunction_isFunction(value.error) && isFunction_isFunction(value.complete);
}
function isSubscriber(value) {
    return (value && value instanceof Subscriber) || (isObserver(value) && isSubscription(value));
}
//# sourceMappingURL=Observable.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/ObjectUnsubscribedError.js

var ObjectUnsubscribedError = createErrorClass(function (_super) {
    return function ObjectUnsubscribedErrorImpl() {
        _super(this);
        this.name = 'ObjectUnsubscribedError';
        this.message = 'object unsubscribed';
    };
});
//# sourceMappingURL=ObjectUnsubscribedError.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/Subject.js






var Subject = (function (_super) {
    __extends(Subject, _super);
    function Subject() {
        var _this = _super.call(this) || this;
        _this.closed = false;
        _this.currentObservers = null;
        _this.observers = [];
        _this.isStopped = false;
        _this.hasError = false;
        _this.thrownError = null;
        return _this;
    }
    Subject.prototype.lift = function (operator) {
        var subject = new AnonymousSubject(this, this);
        subject.operator = operator;
        return subject;
    };
    Subject.prototype._throwIfClosed = function () {
        if (this.closed) {
            throw new ObjectUnsubscribedError();
        }
    };
    Subject.prototype.next = function (value) {
        var _this = this;
        errorContext(function () {
            var e_1, _a;
            _this._throwIfClosed();
            if (!_this.isStopped) {
                if (!_this.currentObservers) {
                    _this.currentObservers = Array.from(_this.observers);
                }
                try {
                    for (var _b = __values(_this.currentObservers), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var observer = _c.value;
                        observer.next(value);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
        });
    };
    Subject.prototype.error = function (err) {
        var _this = this;
        errorContext(function () {
            _this._throwIfClosed();
            if (!_this.isStopped) {
                _this.hasError = _this.isStopped = true;
                _this.thrownError = err;
                var observers = _this.observers;
                while (observers.length) {
                    observers.shift().error(err);
                }
            }
        });
    };
    Subject.prototype.complete = function () {
        var _this = this;
        errorContext(function () {
            _this._throwIfClosed();
            if (!_this.isStopped) {
                _this.isStopped = true;
                var observers = _this.observers;
                while (observers.length) {
                    observers.shift().complete();
                }
            }
        });
    };
    Subject.prototype.unsubscribe = function () {
        this.isStopped = this.closed = true;
        this.observers = this.currentObservers = null;
    };
    Object.defineProperty(Subject.prototype, "observed", {
        get: function () {
            var _a;
            return ((_a = this.observers) === null || _a === void 0 ? void 0 : _a.length) > 0;
        },
        enumerable: false,
        configurable: true
    });
    Subject.prototype._trySubscribe = function (subscriber) {
        this._throwIfClosed();
        return _super.prototype._trySubscribe.call(this, subscriber);
    };
    Subject.prototype._subscribe = function (subscriber) {
        this._throwIfClosed();
        this._checkFinalizedStatuses(subscriber);
        return this._innerSubscribe(subscriber);
    };
    Subject.prototype._innerSubscribe = function (subscriber) {
        var _this = this;
        var _a = this, hasError = _a.hasError, isStopped = _a.isStopped, observers = _a.observers;
        if (hasError || isStopped) {
            return EMPTY_SUBSCRIPTION;
        }
        this.currentObservers = null;
        observers.push(subscriber);
        return new Subscription(function () {
            _this.currentObservers = null;
            arrRemove(observers, subscriber);
        });
    };
    Subject.prototype._checkFinalizedStatuses = function (subscriber) {
        var _a = this, hasError = _a.hasError, thrownError = _a.thrownError, isStopped = _a.isStopped;
        if (hasError) {
            subscriber.error(thrownError);
        }
        else if (isStopped) {
            subscriber.complete();
        }
    };
    Subject.prototype.asObservable = function () {
        var observable = new Observable_Observable();
        observable.source = this;
        return observable;
    };
    Subject.create = function (destination, source) {
        return new AnonymousSubject(destination, source);
    };
    return Subject;
}(Observable_Observable));

var AnonymousSubject = (function (_super) {
    __extends(AnonymousSubject, _super);
    function AnonymousSubject(destination, source) {
        var _this = _super.call(this) || this;
        _this.destination = destination;
        _this.source = source;
        return _this;
    }
    AnonymousSubject.prototype.next = function (value) {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.next) === null || _b === void 0 ? void 0 : _b.call(_a, value);
    };
    AnonymousSubject.prototype.error = function (err) {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.error) === null || _b === void 0 ? void 0 : _b.call(_a, err);
    };
    AnonymousSubject.prototype.complete = function () {
        var _a, _b;
        (_b = (_a = this.destination) === null || _a === void 0 ? void 0 : _a.complete) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    AnonymousSubject.prototype._subscribe = function (subscriber) {
        var _a, _b;
        return (_b = (_a = this.source) === null || _a === void 0 ? void 0 : _a.subscribe(subscriber)) !== null && _b !== void 0 ? _b : EMPTY_SUBSCRIPTION;
    };
    return AnonymousSubject;
}(Subject));

//# sourceMappingURL=Subject.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/lift.js

function hasLift(source) {
    return isFunction_isFunction(source === null || source === void 0 ? void 0 : source.lift);
}
function operate(init) {
    return function (source) {
        if (hasLift(source)) {
            return source.lift(function (liftedSource) {
                try {
                    return init(liftedSource, this);
                }
                catch (err) {
                    this.error(err);
                }
            });
        }
        throw new TypeError('Unable to lift unknown Observable type');
    };
}
//# sourceMappingURL=lift.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/operators/OperatorSubscriber.js


function createOperatorSubscriber(destination, onNext, onComplete, onError, onFinalize) {
    return new OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize);
}
var OperatorSubscriber = (function (_super) {
    __extends(OperatorSubscriber, _super);
    function OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize, shouldUnsubscribe) {
        var _this = _super.call(this, destination) || this;
        _this.onFinalize = onFinalize;
        _this.shouldUnsubscribe = shouldUnsubscribe;
        _this._next = onNext
            ? function (value) {
                try {
                    onNext(value);
                }
                catch (err) {
                    destination.error(err);
                }
            }
            : _super.prototype._next;
        _this._error = onError
            ? function (err) {
                try {
                    onError(err);
                }
                catch (err) {
                    destination.error(err);
                }
                finally {
                    this.unsubscribe();
                }
            }
            : _super.prototype._error;
        _this._complete = onComplete
            ? function () {
                try {
                    onComplete();
                }
                catch (err) {
                    destination.error(err);
                }
                finally {
                    this.unsubscribe();
                }
            }
            : _super.prototype._complete;
        return _this;
    }
    OperatorSubscriber.prototype.unsubscribe = function () {
        var _a;
        if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
            var closed_1 = this.closed;
            _super.prototype.unsubscribe.call(this);
            !closed_1 && ((_a = this.onFinalize) === null || _a === void 0 ? void 0 : _a.call(this));
        }
    };
    return OperatorSubscriber;
}(Subscriber));

//# sourceMappingURL=OperatorSubscriber.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/operators/map.js


function map_map(project, thisArg) {
    return operate(function (source, subscriber) {
        var index = 0;
        source.subscribe(createOperatorSubscriber(subscriber, function (value) {
            subscriber.next(project.call(thisArg, value, index++));
        }));
    });
}
//# sourceMappingURL=map.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/isArrayLike.js
var isArrayLike = (function (x) { return x && typeof x.length === 'number' && typeof x !== 'function'; });
//# sourceMappingURL=isArrayLike.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/isPromise.js

function isPromise(value) {
    return isFunction_isFunction(value === null || value === void 0 ? void 0 : value.then);
}
//# sourceMappingURL=isPromise.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/isInteropObservable.js


function isInteropObservable(input) {
    return isFunction_isFunction(input[observable]);
}
//# sourceMappingURL=isInteropObservable.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/isAsyncIterable.js

function isAsyncIterable(obj) {
    return Symbol.asyncIterator && isFunction_isFunction(obj === null || obj === void 0 ? void 0 : obj[Symbol.asyncIterator]);
}
//# sourceMappingURL=isAsyncIterable.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/throwUnobservableError.js
function createInvalidObservableTypeError(input) {
    return new TypeError("You provided " + (input !== null && typeof input === 'object' ? 'an invalid object' : "'" + input + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
}
//# sourceMappingURL=throwUnobservableError.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/symbol/iterator.js
function getSymbolIterator() {
    if (typeof Symbol !== 'function' || !Symbol.iterator) {
        return '@@iterator';
    }
    return Symbol.iterator;
}
var iterator_iterator = getSymbolIterator();
//# sourceMappingURL=iterator.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/isIterable.js


function isIterable(input) {
    return isFunction_isFunction(input === null || input === void 0 ? void 0 : input[iterator_iterator]);
}
//# sourceMappingURL=isIterable.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/isReadableStreamLike.js


function readableStreamLikeToAsyncGenerator(readableStream) {
    return __asyncGenerator(this, arguments, function readableStreamLikeToAsyncGenerator_1() {
        var reader, _a, value, done;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    reader = readableStream.getReader();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, , 9, 10]);
                    _b.label = 2;
                case 2:
                    if (false) {}
                    return [4, __await(reader.read())];
                case 3:
                    _a = _b.sent(), value = _a.value, done = _a.done;
                    if (!done) return [3, 5];
                    return [4, __await(void 0)];
                case 4: return [2, _b.sent()];
                case 5: return [4, __await(value)];
                case 6: return [4, _b.sent()];
                case 7:
                    _b.sent();
                    return [3, 2];
                case 8: return [3, 10];
                case 9:
                    reader.releaseLock();
                    return [7];
                case 10: return [2];
            }
        });
    });
}
function isReadableStreamLike(obj) {
    return isFunction_isFunction(obj === null || obj === void 0 ? void 0 : obj.getReader);
}
//# sourceMappingURL=isReadableStreamLike.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/observable/innerFrom.js












function innerFrom(input) {
    if (input instanceof Observable_Observable) {
        return input;
    }
    if (input != null) {
        if (isInteropObservable(input)) {
            return fromInteropObservable(input);
        }
        if (isArrayLike(input)) {
            return fromArrayLike(input);
        }
        if (isPromise(input)) {
            return fromPromise(input);
        }
        if (isAsyncIterable(input)) {
            return fromAsyncIterable(input);
        }
        if (isIterable(input)) {
            return fromIterable(input);
        }
        if (isReadableStreamLike(input)) {
            return fromReadableStreamLike(input);
        }
    }
    throw createInvalidObservableTypeError(input);
}
function fromInteropObservable(obj) {
    return new Observable_Observable(function (subscriber) {
        var obs = obj[observable]();
        if (isFunction_isFunction(obs.subscribe)) {
            return obs.subscribe(subscriber);
        }
        throw new TypeError('Provided object does not correctly implement Symbol.observable');
    });
}
function fromArrayLike(array) {
    return new Observable_Observable(function (subscriber) {
        for (var i = 0; i < array.length && !subscriber.closed; i++) {
            subscriber.next(array[i]);
        }
        subscriber.complete();
    });
}
function fromPromise(promise) {
    return new Observable_Observable(function (subscriber) {
        promise
            .then(function (value) {
            if (!subscriber.closed) {
                subscriber.next(value);
                subscriber.complete();
            }
        }, function (err) { return subscriber.error(err); })
            .then(null, reportUnhandledError);
    });
}
function fromIterable(iterable) {
    return new Observable_Observable(function (subscriber) {
        var e_1, _a;
        try {
            for (var iterable_1 = __values(iterable), iterable_1_1 = iterable_1.next(); !iterable_1_1.done; iterable_1_1 = iterable_1.next()) {
                var value = iterable_1_1.value;
                subscriber.next(value);
                if (subscriber.closed) {
                    return;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (iterable_1_1 && !iterable_1_1.done && (_a = iterable_1.return)) _a.call(iterable_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        subscriber.complete();
    });
}
function fromAsyncIterable(asyncIterable) {
    return new Observable_Observable(function (subscriber) {
        innerFrom_process(asyncIterable, subscriber).catch(function (err) { return subscriber.error(err); });
    });
}
function fromReadableStreamLike(readableStream) {
    return fromAsyncIterable(readableStreamLikeToAsyncGenerator(readableStream));
}
function innerFrom_process(asyncIterable, subscriber) {
    var asyncIterable_1, asyncIterable_1_1;
    var e_2, _a;
    return __awaiter(this, void 0, void 0, function () {
        var value, e_2_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, 6, 11]);
                    asyncIterable_1 = __asyncValues(asyncIterable);
                    _b.label = 1;
                case 1: return [4, asyncIterable_1.next()];
                case 2:
                    if (!(asyncIterable_1_1 = _b.sent(), !asyncIterable_1_1.done)) return [3, 4];
                    value = asyncIterable_1_1.value;
                    subscriber.next(value);
                    if (subscriber.closed) {
                        return [2];
                    }
                    _b.label = 3;
                case 3: return [3, 1];
                case 4: return [3, 11];
                case 5:
                    e_2_1 = _b.sent();
                    e_2 = { error: e_2_1 };
                    return [3, 11];
                case 6:
                    _b.trys.push([6, , 9, 10]);
                    if (!(asyncIterable_1_1 && !asyncIterable_1_1.done && (_a = asyncIterable_1.return))) return [3, 8];
                    return [4, _a.call(asyncIterable_1)];
                case 7:
                    _b.sent();
                    _b.label = 8;
                case 8: return [3, 10];
                case 9:
                    if (e_2) throw e_2.error;
                    return [7];
                case 10: return [7];
                case 11:
                    subscriber.complete();
                    return [2];
            }
        });
    });
}
//# sourceMappingURL=innerFrom.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/executeSchedule.js
function executeSchedule(parentSubscription, scheduler, work, delay, repeat) {
    if (delay === void 0) { delay = 0; }
    if (repeat === void 0) { repeat = false; }
    var scheduleSubscription = scheduler.schedule(function () {
        work();
        if (repeat) {
            parentSubscription.add(this.schedule(null, delay));
        }
        else {
            this.unsubscribe();
        }
    }, delay);
    parentSubscription.add(scheduleSubscription);
    if (!repeat) {
        return scheduleSubscription;
    }
}
//# sourceMappingURL=executeSchedule.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/operators/mergeInternals.js



function mergeInternals(source, subscriber, project, concurrent, onBeforeNext, expand, innerSubScheduler, additionalFinalizer) {
    var buffer = [];
    var active = 0;
    var index = 0;
    var isComplete = false;
    var checkComplete = function () {
        if (isComplete && !buffer.length && !active) {
            subscriber.complete();
        }
    };
    var outerNext = function (value) { return (active < concurrent ? doInnerSub(value) : buffer.push(value)); };
    var doInnerSub = function (value) {
        expand && subscriber.next(value);
        active++;
        var innerComplete = false;
        innerFrom(project(value, index++)).subscribe(createOperatorSubscriber(subscriber, function (innerValue) {
            onBeforeNext === null || onBeforeNext === void 0 ? void 0 : onBeforeNext(innerValue);
            if (expand) {
                outerNext(innerValue);
            }
            else {
                subscriber.next(innerValue);
            }
        }, function () {
            innerComplete = true;
        }, undefined, function () {
            if (innerComplete) {
                try {
                    active--;
                    var _loop_1 = function () {
                        var bufferedValue = buffer.shift();
                        if (innerSubScheduler) {
                            executeSchedule(subscriber, innerSubScheduler, function () { return doInnerSub(bufferedValue); });
                        }
                        else {
                            doInnerSub(bufferedValue);
                        }
                    };
                    while (buffer.length && active < concurrent) {
                        _loop_1();
                    }
                    checkComplete();
                }
                catch (err) {
                    subscriber.error(err);
                }
            }
        }));
    };
    source.subscribe(createOperatorSubscriber(subscriber, outerNext, function () {
        isComplete = true;
        checkComplete();
    }));
    return function () {
        additionalFinalizer === null || additionalFinalizer === void 0 ? void 0 : additionalFinalizer();
    };
}
//# sourceMappingURL=mergeInternals.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/operators/mergeMap.js





function mergeMap(project, resultSelector, concurrent) {
    if (concurrent === void 0) { concurrent = Infinity; }
    if (isFunction_isFunction(resultSelector)) {
        return mergeMap(function (a, i) { return map_map(function (b, ii) { return resultSelector(a, b, i, ii); })(innerFrom(project(a, i))); }, concurrent);
    }
    else if (typeof resultSelector === 'number') {
        concurrent = resultSelector;
    }
    return operate(function (source, subscriber) { return mergeInternals(source, subscriber, project, concurrent); });
}
//# sourceMappingURL=mergeMap.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/operators/filter.js


function filter_filter(predicate, thisArg) {
    return operate(function (source, subscriber) {
        var index = 0;
        source.subscribe(createOperatorSubscriber(subscriber, function (value) { return predicate.call(thisArg, value, index++) && subscriber.next(value); }));
    });
}
//# sourceMappingURL=filter.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/plugins/utils/utils-map.js
function getFromMapOrThrow(map, key) {
  var val = map.get(key);
  if (typeof val === 'undefined') {
    throw new Error('missing value from map ' + key);
  }
  return val;
}
function getFromMapOrCreate(map, index, creator, ifWasThere) {
  var value = map.get(index);
  if (typeof value === 'undefined') {
    value = creator();
    map.set(index, value);
  } else if (ifWasThere) {
    ifWasThere(value);
  }
  return value;
}
//# sourceMappingURL=utils-map.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/plugins/utils/utils-time.js
/**
 * Returns the current unix time in milliseconds (with two decimals!)
 * Because the accuracy of getTime() in javascript is bad,
 * and we cannot rely on performance.now() on all platforms,
 * this method implements a way to never return the same value twice.
 * This ensures that when now() is called often, we do not loose the information
 * about which call came first and which came after.
 *
 * We had to move from having no decimals, to having two decimal
 * because it turned out that some storages are such fast that
 * calling this method too often would return 'the future'.
 */
var _lastNow = 0;
/**
 * Returns the current time in milliseconds,
 * also ensures to not return the same value twice.
 */
function utils_time_now() {
  var ret = Date.now();
  ret = ret + 0.01;
  if (ret <= _lastNow) {
    ret = _lastNow + 0.01;
  }

  /**
   * Strip the returned number to max two decimals.
   * In theory we would not need this but
   * in practice JavaScript has no such good number precision
   * so rounding errors could add another decimal place.
   */
  var twoDecimals = parseFloat(ret.toFixed(2));
  _lastNow = twoDecimals;
  return twoDecimals;
}
//# sourceMappingURL=utils-time.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/plugins/utils/utils-revision.js
function parseRevision(revision) {
  var split = revision.split('-');
  if (split.length !== 2) {
    throw new Error('malformatted revision: ' + revision);
  }
  return {
    height: parseInt(split[0], 10),
    hash: split[1]
  };
}

/**
 * @hotPath
 */
function getHeightOfRevision(revision) {
  var ret = parseInt(revision.split('-')[0], 10);
  return ret;
}

/**
 * Creates the next write revision for a given document.
 */
function utils_revision_createRevision(databaseInstanceToken, previousDocData) {
  var previousRevision = previousDocData ? previousDocData._rev : null;
  var previousRevisionHeight = previousRevision ? parseRevision(previousRevision).height : 0;
  var newRevisionHeight = previousRevisionHeight + 1;
  return newRevisionHeight + '-' + databaseInstanceToken;
}
//# sourceMappingURL=utils-revision.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/BehaviorSubject.js


var BehaviorSubject = (function (_super) {
    __extends(BehaviorSubject, _super);
    function BehaviorSubject(_value) {
        var _this = _super.call(this) || this;
        _this._value = _value;
        return _this;
    }
    Object.defineProperty(BehaviorSubject.prototype, "value", {
        get: function () {
            return this.getValue();
        },
        enumerable: false,
        configurable: true
    });
    BehaviorSubject.prototype._subscribe = function (subscriber) {
        var subscription = _super.prototype._subscribe.call(this, subscriber);
        !subscription.closed && subscriber.next(this._value);
        return subscription;
    };
    BehaviorSubject.prototype.getValue = function () {
        var _a = this, hasError = _a.hasError, thrownError = _a.thrownError, _value = _a._value;
        if (hasError) {
            throw thrownError;
        }
        this._throwIfClosed();
        return _value;
    };
    BehaviorSubject.prototype.next = function (value) {
        _super.prototype.next.call(this, (this._value = value));
    };
    return BehaviorSubject;
}(Subject));

//# sourceMappingURL=BehaviorSubject.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/EmptyError.js

var EmptyError = createErrorClass(function (_super) { return function EmptyErrorImpl() {
    _super(this);
    this.name = 'EmptyError';
    this.message = 'no elements in sequence';
}; });
//# sourceMappingURL=EmptyError.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/firstValueFrom.js


function firstValueFrom(source, config) {
    var hasConfig = typeof config === 'object';
    return new Promise(function (resolve, reject) {
        var subscriber = new SafeSubscriber({
            next: function (value) {
                resolve(value);
                subscriber.unsubscribe();
            },
            error: reject,
            complete: function () {
                if (hasConfig) {
                    resolve(config.defaultValue);
                }
                else {
                    reject(new EmptyError());
                }
            },
        });
        source.subscribe(subscriber);
    });
}
//# sourceMappingURL=firstValueFrom.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/operators/mergeAll.js


function mergeAll(concurrent) {
    if (concurrent === void 0) { concurrent = Infinity; }
    return mergeMap(identity, concurrent);
}
//# sourceMappingURL=mergeAll.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/observable/empty.js

var EMPTY = new Observable_Observable(function (subscriber) { return subscriber.complete(); });
function empty(scheduler) {
    return scheduler ? emptyScheduled(scheduler) : EMPTY;
}
function emptyScheduled(scheduler) {
    return new Observable(function (subscriber) { return scheduler.schedule(function () { return subscriber.complete(); }); });
}
//# sourceMappingURL=empty.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/isScheduler.js

function isScheduler(value) {
    return value && isFunction_isFunction(value.schedule);
}
//# sourceMappingURL=isScheduler.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/util/args.js


function last(arr) {
    return arr[arr.length - 1];
}
function popResultSelector(args) {
    return isFunction(last(args)) ? args.pop() : undefined;
}
function popScheduler(args) {
    return isScheduler(last(args)) ? args.pop() : undefined;
}
function popNumber(args, defaultValue) {
    return typeof last(args) === 'number' ? args.pop() : defaultValue;
}
//# sourceMappingURL=args.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/operators/observeOn.js



function observeOn(scheduler, delay) {
    if (delay === void 0) { delay = 0; }
    return operate(function (source, subscriber) {
        source.subscribe(createOperatorSubscriber(subscriber, function (value) { return executeSchedule(subscriber, scheduler, function () { return subscriber.next(value); }, delay); }, function () { return executeSchedule(subscriber, scheduler, function () { return subscriber.complete(); }, delay); }, function (err) { return executeSchedule(subscriber, scheduler, function () { return subscriber.error(err); }, delay); }));
    });
}
//# sourceMappingURL=observeOn.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/operators/subscribeOn.js

function subscribeOn(scheduler, delay) {
    if (delay === void 0) { delay = 0; }
    return operate(function (source, subscriber) {
        subscriber.add(scheduler.schedule(function () { return source.subscribe(subscriber); }, delay));
    });
}
//# sourceMappingURL=subscribeOn.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/scheduled/scheduleObservable.js



function scheduleObservable(input, scheduler) {
    return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler));
}
//# sourceMappingURL=scheduleObservable.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/scheduled/schedulePromise.js



function schedulePromise(input, scheduler) {
    return innerFrom(input).pipe(subscribeOn(scheduler), observeOn(scheduler));
}
//# sourceMappingURL=schedulePromise.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/scheduled/scheduleArray.js

function scheduleArray(input, scheduler) {
    return new Observable_Observable(function (subscriber) {
        var i = 0;
        return scheduler.schedule(function () {
            if (i === input.length) {
                subscriber.complete();
            }
            else {
                subscriber.next(input[i++]);
                if (!subscriber.closed) {
                    this.schedule();
                }
            }
        });
    });
}
//# sourceMappingURL=scheduleArray.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/scheduled/scheduleIterable.js




function scheduleIterable(input, scheduler) {
    return new Observable_Observable(function (subscriber) {
        var iterator;
        executeSchedule(subscriber, scheduler, function () {
            iterator = input[iterator_iterator]();
            executeSchedule(subscriber, scheduler, function () {
                var _a;
                var value;
                var done;
                try {
                    (_a = iterator.next(), value = _a.value, done = _a.done);
                }
                catch (err) {
                    subscriber.error(err);
                    return;
                }
                if (done) {
                    subscriber.complete();
                }
                else {
                    subscriber.next(value);
                }
            }, 0, true);
        });
        return function () { return isFunction_isFunction(iterator === null || iterator === void 0 ? void 0 : iterator.return) && iterator.return(); };
    });
}
//# sourceMappingURL=scheduleIterable.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/scheduled/scheduleAsyncIterable.js


function scheduleAsyncIterable(input, scheduler) {
    if (!input) {
        throw new Error('Iterable cannot be null');
    }
    return new Observable_Observable(function (subscriber) {
        executeSchedule(subscriber, scheduler, function () {
            var iterator = input[Symbol.asyncIterator]();
            executeSchedule(subscriber, scheduler, function () {
                iterator.next().then(function (result) {
                    if (result.done) {
                        subscriber.complete();
                    }
                    else {
                        subscriber.next(result.value);
                    }
                });
            }, 0, true);
        });
    });
}
//# sourceMappingURL=scheduleAsyncIterable.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/scheduled/scheduleReadableStreamLike.js


function scheduleReadableStreamLike(input, scheduler) {
    return scheduleAsyncIterable(readableStreamLikeToAsyncGenerator(input), scheduler);
}
//# sourceMappingURL=scheduleReadableStreamLike.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/scheduled/scheduled.js













function scheduled(input, scheduler) {
    if (input != null) {
        if (isInteropObservable(input)) {
            return scheduleObservable(input, scheduler);
        }
        if (isArrayLike(input)) {
            return scheduleArray(input, scheduler);
        }
        if (isPromise(input)) {
            return schedulePromise(input, scheduler);
        }
        if (isAsyncIterable(input)) {
            return scheduleAsyncIterable(input, scheduler);
        }
        if (isIterable(input)) {
            return scheduleIterable(input, scheduler);
        }
        if (isReadableStreamLike(input)) {
            return scheduleReadableStreamLike(input, scheduler);
        }
    }
    throw createInvalidObservableTypeError(input);
}
//# sourceMappingURL=scheduled.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/observable/from.js


function from(input, scheduler) {
    return scheduler ? scheduled(input, scheduler) : innerFrom(input);
}
//# sourceMappingURL=from.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/observable/merge.js





function merge() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var scheduler = popScheduler(args);
    var concurrent = popNumber(args, Infinity);
    var sources = args;
    return !sources.length
        ?
            EMPTY
        : sources.length === 1
            ?
                innerFrom(sources[0])
            :
                mergeAll(concurrent)(from(sources, scheduler));
}
//# sourceMappingURL=merge.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/operators/concatAll.js

function concatAll() {
    return mergeAll(1);
}
//# sourceMappingURL=concatAll.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/observable/concat.js



function concat() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return concatAll()(from(args, popScheduler(args)));
}
//# sourceMappingURL=concat.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/operators/startWith.js



function startWith_startWith() {
    var values = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        values[_i] = arguments[_i];
    }
    var scheduler = popScheduler(values);
    return operate(function (source, subscriber) {
        (scheduler ? concat(values, source, scheduler) : concat(values, source)).subscribe(subscriber);
    });
}
//# sourceMappingURL=startWith.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/scheduler/dateTimestampProvider.js
var dateTimestampProvider = {
    now: function () {
        return (dateTimestampProvider.delegate || Date).now();
    },
    delegate: undefined,
};
//# sourceMappingURL=dateTimestampProvider.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/ReplaySubject.js



var ReplaySubject = (function (_super) {
    __extends(ReplaySubject, _super);
    function ReplaySubject(_bufferSize, _windowTime, _timestampProvider) {
        if (_bufferSize === void 0) { _bufferSize = Infinity; }
        if (_windowTime === void 0) { _windowTime = Infinity; }
        if (_timestampProvider === void 0) { _timestampProvider = dateTimestampProvider; }
        var _this = _super.call(this) || this;
        _this._bufferSize = _bufferSize;
        _this._windowTime = _windowTime;
        _this._timestampProvider = _timestampProvider;
        _this._buffer = [];
        _this._infiniteTimeWindow = true;
        _this._infiniteTimeWindow = _windowTime === Infinity;
        _this._bufferSize = Math.max(1, _bufferSize);
        _this._windowTime = Math.max(1, _windowTime);
        return _this;
    }
    ReplaySubject.prototype.next = function (value) {
        var _a = this, isStopped = _a.isStopped, _buffer = _a._buffer, _infiniteTimeWindow = _a._infiniteTimeWindow, _timestampProvider = _a._timestampProvider, _windowTime = _a._windowTime;
        if (!isStopped) {
            _buffer.push(value);
            !_infiniteTimeWindow && _buffer.push(_timestampProvider.now() + _windowTime);
        }
        this._trimBuffer();
        _super.prototype.next.call(this, value);
    };
    ReplaySubject.prototype._subscribe = function (subscriber) {
        this._throwIfClosed();
        this._trimBuffer();
        var subscription = this._innerSubscribe(subscriber);
        var _a = this, _infiniteTimeWindow = _a._infiniteTimeWindow, _buffer = _a._buffer;
        var copy = _buffer.slice();
        for (var i = 0; i < copy.length && !subscriber.closed; i += _infiniteTimeWindow ? 1 : 2) {
            subscriber.next(copy[i]);
        }
        this._checkFinalizedStatuses(subscriber);
        return subscription;
    };
    ReplaySubject.prototype._trimBuffer = function () {
        var _a = this, _bufferSize = _a._bufferSize, _timestampProvider = _a._timestampProvider, _buffer = _a._buffer, _infiniteTimeWindow = _a._infiniteTimeWindow;
        var adjustedBufferSize = (_infiniteTimeWindow ? 1 : 2) * _bufferSize;
        _bufferSize < Infinity && adjustedBufferSize < _buffer.length && _buffer.splice(0, _buffer.length - adjustedBufferSize);
        if (!_infiniteTimeWindow) {
            var now = _timestampProvider.now();
            var last = 0;
            for (var i = 1; i < _buffer.length && _buffer[i] <= now; i += 2) {
                last = i;
            }
            last && _buffer.splice(0, last + 1);
        }
    };
    return ReplaySubject;
}(Subject));

//# sourceMappingURL=ReplaySubject.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/operators/share.js





function share(options) {
    if (options === void 0) { options = {}; }
    var _a = options.connector, connector = _a === void 0 ? function () { return new Subject(); } : _a, _b = options.resetOnError, resetOnError = _b === void 0 ? true : _b, _c = options.resetOnComplete, resetOnComplete = _c === void 0 ? true : _c, _d = options.resetOnRefCountZero, resetOnRefCountZero = _d === void 0 ? true : _d;
    return function (wrapperSource) {
        var connection;
        var resetConnection;
        var subject;
        var refCount = 0;
        var hasCompleted = false;
        var hasErrored = false;
        var cancelReset = function () {
            resetConnection === null || resetConnection === void 0 ? void 0 : resetConnection.unsubscribe();
            resetConnection = undefined;
        };
        var reset = function () {
            cancelReset();
            connection = subject = undefined;
            hasCompleted = hasErrored = false;
        };
        var resetAndUnsubscribe = function () {
            var conn = connection;
            reset();
            conn === null || conn === void 0 ? void 0 : conn.unsubscribe();
        };
        return operate(function (source, subscriber) {
            refCount++;
            if (!hasErrored && !hasCompleted) {
                cancelReset();
            }
            var dest = (subject = subject !== null && subject !== void 0 ? subject : connector());
            subscriber.add(function () {
                refCount--;
                if (refCount === 0 && !hasErrored && !hasCompleted) {
                    resetConnection = handleReset(resetAndUnsubscribe, resetOnRefCountZero);
                }
            });
            dest.subscribe(subscriber);
            if (!connection &&
                refCount > 0) {
                connection = new SafeSubscriber({
                    next: function (value) { return dest.next(value); },
                    error: function (err) {
                        hasErrored = true;
                        cancelReset();
                        resetConnection = handleReset(reset, resetOnError, err);
                        dest.error(err);
                    },
                    complete: function () {
                        hasCompleted = true;
                        cancelReset();
                        resetConnection = handleReset(reset, resetOnComplete);
                        dest.complete();
                    },
                });
                innerFrom(source).subscribe(connection);
            }
        })(wrapperSource);
    };
}
function handleReset(reset, on) {
    var args = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
    }
    if (on === true) {
        reset();
        return;
    }
    if (on === false) {
        return;
    }
    var onSubscriber = new SafeSubscriber({
        next: function () {
            onSubscriber.unsubscribe();
            reset();
        },
    });
    return innerFrom(on.apply(void 0, __spreadArray([], __read(args)))).subscribe(onSubscriber);
}
//# sourceMappingURL=share.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/operators/shareReplay.js


function shareReplay(configOrBufferSize, windowTime, scheduler) {
    var _a, _b, _c;
    var bufferSize;
    var refCount = false;
    if (configOrBufferSize && typeof configOrBufferSize === 'object') {
        (_a = configOrBufferSize.bufferSize, bufferSize = _a === void 0 ? Infinity : _a, _b = configOrBufferSize.windowTime, windowTime = _b === void 0 ? Infinity : _b, _c = configOrBufferSize.refCount, refCount = _c === void 0 ? false : _c, scheduler = configOrBufferSize.scheduler);
    }
    else {
        bufferSize = (configOrBufferSize !== null && configOrBufferSize !== void 0 ? configOrBufferSize : Infinity);
    }
    return share({
        connector: function () { return new ReplaySubject(bufferSize, windowTime, scheduler); },
        resetOnError: true,
        resetOnComplete: false,
        resetOnRefCountZero: refCount,
    });
}
//# sourceMappingURL=shareReplay.js.map
;// CONCATENATED MODULE: ./node_modules/rxjs/dist/esm5/internal/operators/distinctUntilChanged.js



function distinctUntilChanged(comparator, keySelector) {
    if (keySelector === void 0) { keySelector = identity; }
    comparator = comparator !== null && comparator !== void 0 ? comparator : defaultCompare;
    return operate(function (source, subscriber) {
        var previousKey;
        var first = true;
        source.subscribe(createOperatorSubscriber(subscriber, function (value) {
            var currentKey = keySelector(value);
            if (first || !comparator(previousKey, currentKey)) {
                first = false;
                previousKey = currentKey;
                subscriber.next(value);
            }
        }));
    });
}
function defaultCompare(a, b) {
    return a === b;
}
//# sourceMappingURL=distinctUntilChanged.js.map
;// CONCATENATED MODULE: ./node_modules/array-push-at-sort-position/dist/esm/index.js
/**
 * copied and adapted from npm 'binary-search-insert'
 * @link https://www.npmjs.com/package/binary-search-insert
 */
function pushAtSortPosition(array, item, compareFunction, low) {
  var length = array.length;
  var high = length - 1;
  var mid = 0;

  /**
   * Optimization shortcut.
   */
  if (length === 0) {
    array.push(item);
    return 0;
  }

  /**
   * So we do not have to get the ret[mid] doc again
   * at the last we store it here.
   */
  var lastMidDoc;
  while (low <= high) {
    // https://github.com/darkskyapp/binary-search
    // http://googleresearch.blogspot.com/2006/06/extra-extra-read-all-about-it-nearly.html
    mid = low + (high - low >> 1);
    lastMidDoc = array[mid];
    if (compareFunction(lastMidDoc, item) <= 0.0) {
      // searching too low
      low = mid + 1;
    } else {
      // searching too high
      high = mid - 1;
    }
  }
  if (compareFunction(lastMidDoc, item) <= 0.0) {
    mid++;
  }

  /**
   * Insert at correct position
   */
  array.splice(mid, 0, item);
  return mid;
}
;// CONCATENATED MODULE: ./node_modules/event-reduce-js/dist/esm/src/actions/action-functions.js

const doNothing = (_input) => { };
const insertFirst = (input) => {
    input.previousResults.unshift(input.changeEvent.doc);
    if (input.keyDocumentMap) {
        input.keyDocumentMap.set(input.changeEvent.id, input.changeEvent.doc);
    }
};
const insertLast = (input) => {
    input.previousResults.push(input.changeEvent.doc);
    if (input.keyDocumentMap) {
        input.keyDocumentMap.set(input.changeEvent.id, input.changeEvent.doc);
    }
};
const removeFirstItem = (input) => {
    const first = input.previousResults.shift();
    if (input.keyDocumentMap && first) {
        input.keyDocumentMap.delete(first[input.queryParams.primaryKey]);
    }
};
const removeLastItem = (input) => {
    const last = input.previousResults.pop();
    if (input.keyDocumentMap && last) {
        input.keyDocumentMap.delete(last[input.queryParams.primaryKey]);
    }
};
const removeFirstInsertLast = (input) => {
    removeFirstItem(input);
    insertLast(input);
};
const removeLastInsertFirst = (input) => {
    removeLastItem(input);
    insertFirst(input);
};
const removeFirstInsertFirst = (input) => {
    removeFirstItem(input);
    insertFirst(input);
};
const removeLastInsertLast = (input) => {
    removeLastItem(input);
    insertLast(input);
};
const removeExisting = (input) => {
    if (input.keyDocumentMap) {
        input.keyDocumentMap.delete(input.changeEvent.id);
    }
    // find index of document
    const primary = input.queryParams.primaryKey;
    const results = input.previousResults;
    for (let i = 0; i < results.length; i++) {
        const item = results[i];
        // remove
        if (item[primary] === input.changeEvent.id) {
            results.splice(i, 1);
            break;
        }
    }
};
const replaceExisting = (input) => {
    // find index of document
    const doc = input.changeEvent.doc;
    const primary = input.queryParams.primaryKey;
    const results = input.previousResults;
    for (let i = 0; i < results.length; i++) {
        const item = results[i];
        // replace
        if (item[primary] === input.changeEvent.id) {
            results[i] = doc;
            if (input.keyDocumentMap) {
                input.keyDocumentMap.set(input.changeEvent.id, doc);
            }
            break;
        }
    }
};
/**
 * this function always returns wrong results
 * it must be later optimised out
 * otherwise there is something broken
 */
const alwaysWrong = (input) => {
    const wrongHuman = {
        _id: 'wrongHuman' + new Date().getTime()
    };
    input.previousResults.length = 0; // clear array
    input.previousResults.push(wrongHuman);
    if (input.keyDocumentMap) {
        input.keyDocumentMap.clear();
        input.keyDocumentMap.set(wrongHuman._id, wrongHuman);
    }
};
const insertAtSortPosition = (input) => {
    const docId = input.changeEvent.id;
    const doc = input.changeEvent.doc;
    if (input.keyDocumentMap) {
        if (input.keyDocumentMap.has(docId)) {
            /**
             * If document is already in results,
             * we cannot add it again because it would throw on non-deterministic ordering.
             */
            return;
        }
        input.keyDocumentMap.set(docId, doc);
    }
    else {
        const isDocInResults = input.previousResults.find((d) => d[input.queryParams.primaryKey] === docId);
        /**
         * If document is already in results,
         * we cannot add it again because it would throw on non-deterministic ordering.
         */
        if (isDocInResults) {
            return;
        }
    }
    pushAtSortPosition(input.previousResults, doc, input.queryParams.sortComparator, 0);
};
const removeExistingAndInsertAtSortPosition = (input) => {
    removeExisting(input);
    insertAtSortPosition(input);
};
const runFullQueryAgain = (_input) => {
    throw new Error('Action runFullQueryAgain must be implemented by yourself');
};
const unknownAction = (_input) => {
    throw new Error('Action unknownAction should never be called');
};
//# sourceMappingURL=action-functions.js.map
;// CONCATENATED MODULE: ./node_modules/event-reduce-js/dist/esm/src/actions/index.js


/**
 * all actions ordered by performance-cost
 * cheapest first
 * TODO run tests on which is really the fastest
 */
const orderedActionList = [
    'doNothing',
    'insertFirst',
    'insertLast',
    'removeFirstItem',
    'removeLastItem',
    'removeFirstInsertLast',
    'removeLastInsertFirst',
    'removeFirstInsertFirst',
    'removeLastInsertLast',
    'removeExisting',
    'replaceExisting',
    'alwaysWrong',
    'insertAtSortPosition',
    'removeExistingAndInsertAtSortPosition',
    'runFullQueryAgain',
    'unknownAction'
];
const actions_actionFunctions = {
    doNothing: doNothing,
    insertFirst: insertFirst,
    insertLast: insertLast,
    removeFirstItem: removeFirstItem,
    removeLastItem: removeLastItem,
    removeFirstInsertLast: removeFirstInsertLast,
    removeLastInsertFirst: removeLastInsertFirst,
    removeFirstInsertFirst: removeFirstInsertFirst,
    removeLastInsertLast: removeLastInsertLast,
    removeExisting: removeExisting,
    replaceExisting: replaceExisting,
    alwaysWrong: alwaysWrong,
    insertAtSortPosition: insertAtSortPosition,
    removeExistingAndInsertAtSortPosition: removeExistingAndInsertAtSortPosition,
    runFullQueryAgain: runFullQueryAgain,
    unknownAction: unknownAction
};
//# sourceMappingURL=index.js.map
;// CONCATENATED MODULE: ./node_modules/binary-decision-diagram/dist/esm/src/util.js
function booleanStringToBoolean(str) {
    if (str === '1') {
        return true;
    }
    else {
        return false;
    }
}
function booleanToBooleanString(b) {
    if (b) {
        return '1';
    }
    else {
        return '0';
    }
}
function oppositeBoolean(input) {
    if (input === '1') {
        return '0';
    }
    else {
        return '1';
    }
}
function lastChar(str) {
    return str.slice(-1);
}
/**
 * @link https://stackoverflow.com/a/1349426
 */
function makeid(length = 6) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
const nodeIdPrefix = makeid(4);
let lastIdGen = 0;
function nextNodeId() {
    const ret = 'node_' + nodeIdPrefix + '_' + lastIdGen;
    lastIdGen++;
    return ret;
}
/**
 * @link https://stackoverflow.com/a/16155417
 */
function decimalToPaddedBinary(decimal, padding) {
    const binary = (decimal >>> 0).toString(2);
    const padded = binary.padStart(padding, '0');
    return padded;
}
function oppositeBinary(i) {
    if (i === '1') {
        return '0';
    }
    else if (i === '0') {
        return '1';
    }
    else {
        throw new Error('non-binary given');
    }
}
function binaryToDecimal(binary) {
    return parseInt(binary, 2);
}
function minBinaryWithLength(length) {
    return new Array(length).fill(0).map(() => '0').join('');
}
function maxBinaryWithLength(length) {
    return new Array(length).fill(0).map(() => '1').join('');
}
function getNextStateSet(stateSet) {
    const decimal = binaryToDecimal(stateSet);
    const increase = decimal + 1;
    const binary = decimalToPaddedBinary(increase, stateSet.length);
    return binary;
}
function firstKeyOfMap(map) {
    const iterator1 = map.keys();
    return iterator1.next().value;
}
/**
 * Shuffles array in place. ES6 version
 * @link https://stackoverflow.com/a/6274381
 */
function util_shuffleArray(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function util_lastOfArray(ar) {
    return ar[ar.length - 1];
}
/**
 * @link https://stackoverflow.com/a/6259536
 */
function splitStringToChunks(str, chunkSize) {
    const chunks = [];
    for (let i = 0, charsLength = str.length; i < charsLength; i += chunkSize) {
        chunks.push(str.substring(i, i + chunkSize));
    }
    return chunks;
}
//# sourceMappingURL=util.js.map
;// CONCATENATED MODULE: ./node_modules/binary-decision-diagram/dist/esm/src/minimal-string/string-format.js
/*
let t = 0;
while (t < 10000) {
    const char = String.fromCharCode(t);
    console.log(t + ' : ' + char);
    t++;
}
*/
/*

To have a really small string representation, we have to hack some stuff
which makes is complicated but effective.

Rules for the string:
- The string starts with a number like '23' that defines how many leaf-nodes we have
- leaf nodes consist of two chars like 'ab'
    - the first char is the id
    - the second the value is a number you can get via String.charCodeAt()
- Internal nodes have four chars like 'abcd'
    - the first char is the id
    - the second char is the id of the 0-branch
    - the third char is the id of the 1-branch
    - the last char is the id of the boolean-function (= level)
- The last 3 chars of the string is the root node like 'abc'
    - it looks like the internal-node but without the id (first char)

*/
// we use this because 39 is the quotes which causes problems
const CHAR_CODE_OFFSET = 40; // String.fromCharCode(33) === ')'
function getCharOfLevel(level) {
    const charCode = CHAR_CODE_OFFSET + level;
    return String.fromCharCode(charCode);
}
function getNumberOfChar(char) {
    const charCode = char.charCodeAt(0);
    return charCode - CHAR_CODE_OFFSET;
}
function getCharOfValue(value) {
    const charCode = CHAR_CODE_OFFSET + value;
    return String.fromCharCode(charCode);
}
const FIRST_CHAR_CODE_FOR_ID = 97; // String.fromCharCode(97) === 'a'
function getNextCharId(lastCode) {
    // jump these codes because they look strange
    if (lastCode >= 128 && lastCode <= 160) {
        lastCode = 161;
    }
    const char = String.fromCharCode(lastCode);
    return {
        char,
        nextCode: lastCode + 1
    };
}
//# sourceMappingURL=string-format.js.map
;// CONCATENATED MODULE: ./node_modules/binary-decision-diagram/dist/esm/src/minimal-string/minimal-string-to-simple-bdd.js


function minimalStringToSimpleBdd(str) {
    const nodesById = new Map();
    // parse leaf nodes
    const leafNodeAmount = parseInt(str.charAt(0) + str.charAt(1), 10);
    const lastLeafNodeChar = (2 + leafNodeAmount * 2);
    const leafNodeChars = str.substring(2, lastLeafNodeChar);
    const leafNodeChunks = splitStringToChunks(leafNodeChars, 2);
    for (let i = 0; i < leafNodeChunks.length; i++) {
        const chunk = leafNodeChunks[i];
        const id = chunk.charAt(0);
        const value = getNumberOfChar(chunk.charAt(1));
        nodesById.set(id, value);
    }
    // parse internal nodes
    const internalNodeChars = str.substring(lastLeafNodeChar, str.length - 3);
    const internalNodeChunks = splitStringToChunks(internalNodeChars, 4);
    for (let i = 0; i < internalNodeChunks.length; i++) {
        const chunk = internalNodeChunks[i];
        const id = chunk.charAt(0);
        const idOf0Branch = chunk.charAt(1);
        const idOf1Branch = chunk.charAt(2);
        const level = getNumberOfChar(chunk.charAt(3));
        if (!nodesById.has(idOf0Branch)) {
            throw new Error('missing node with id ' + idOf0Branch);
        }
        if (!nodesById.has(idOf1Branch)) {
            throw new Error('missing node with id ' + idOf1Branch);
        }
        const node0 = nodesById.get(idOf0Branch);
        const node1 = nodesById.get(idOf1Branch);
        const node = {
            l: level, // level is first for prettier json output
            0: node0,
            1: node1
        };
        nodesById.set(id, node);
    }
    // parse root node
    const last3 = str.slice(-3);
    const idOf0 = last3.charAt(0);
    const idOf1 = last3.charAt(1);
    const levelOfRoot = getNumberOfChar(last3.charAt(2));
    const nodeOf0 = nodesById.get(idOf0);
    const nodeOf1 = nodesById.get(idOf1);
    const rootNode = {
        l: levelOfRoot,
        0: nodeOf0,
        1: nodeOf1,
    };
    return rootNode;
}
//# sourceMappingURL=minimal-string-to-simple-bdd.js.map
;// CONCATENATED MODULE: ./node_modules/binary-decision-diagram/dist/esm/src/minimal-string/resolve-with-simple-bdd.js

function resolveWithSimpleBdd(simpleBdd, fns, input) {
    let currentNode = simpleBdd;
    let currentLevel = simpleBdd.l;
    while (true) {
        const booleanResult = fns[currentLevel](input);
        const branchKey = booleanToBooleanString(booleanResult);
        currentNode = currentNode[branchKey];
        if (typeof currentNode === 'number' || typeof currentNode === 'string') {
            return currentNode;
        }
        else {
            currentLevel = currentNode.l;
        }
    }
}
//# sourceMappingURL=resolve-with-simple-bdd.js.map
;// CONCATENATED MODULE: ./node_modules/event-reduce-js/dist/esm/src/util.js
function src_util_lastOfArray(ar) {
    return ar[ar.length - 1];
}
/**
 * @link https://stackoverflow.com/a/5915122
 */
function randomOfArray(items) {
    return items[Math.floor(Math.random() * items.length)];
}
function src_util_shuffleArray(arr) {
    return arr.slice().sort(() => (Math.random() - 0.5));
}
/**
 * normalizes sort-field
 * in: '-age'
 * out: 'age'
 */
function normalizeSortField(field) {
    if (field.startsWith('-')) {
        return field.substr(1);
    }
    else {
        return field;
    }
}
function getSortFieldsOfQuery(query) {
    if (!query.sort) {
        // if no sort-order is set, use the primary key
        return ['_id'];
    }
    return query.sort.map(maybeArray => {
        if (Array.isArray(maybeArray)) {
            return maybeArray[0].map((field) => normalizeSortField(field));
        }
        else {
            return normalizeSortField(maybeArray);
        }
    });
}
/**
 *  @link https://stackoverflow.com/a/1431113
 */
function replaceCharAt(str, index, replacement) {
    return str.substr(0, index) + replacement + str.substr(index + replacement.length);
}
function mapToObject(map) {
    const ret = {};
    map.forEach((value, key) => {
        ret[key] = value;
    });
    return ret;
}
function objectToMap(object) {
    const ret = new Map();
    Object.entries(object).forEach(([k, v]) => {
        ret.set(k, v);
    });
    return ret;
}
function cloneMap(map) {
    const ret = new Map();
    map.forEach((value, key) => {
        ret[key] = value;
    });
    return ret;
}
/**
 * does a flat copy on the objects,
 * is about 3 times faster then using deepClone
 * @link https://jsperf.com/object-rest-spread-vs-clone/2
 */
function util_flatClone(obj) {
    return Object.assign({}, obj);
}
function util_ensureNotFalsy(obj) {
    if (!obj) {
        throw new Error('ensureNotFalsy() is falsy');
    }
    return obj;
}
function mergeSets(sets) {
    let ret = new Set();
    sets.forEach(set => {
        ret = new Set([...ret, ...set]);
    });
    return ret;
}
/**
 * @link https://stackoverflow.com/a/12830454/3443137
 */
function roundToTwoDecimals(num) {
    return parseFloat(num.toFixed(2));
}
function util_isObject(value) {
    const type = typeof value;
    return value !== null && (type === 'object' || type === 'function');
}
function util_getProperty(object, path, value) {
    if (Array.isArray(path)) {
        path = path.join('.');
    }
    if (!util_isObject(object) || typeof path !== 'string') {
        return value === undefined ? object : value;
    }
    const pathArray = path.split('.');
    if (pathArray.length === 0) {
        return value;
    }
    for (let index = 0; index < pathArray.length; index++) {
        const key = pathArray[index];
        if (util_isStringIndex(object, key)) {
            object = index === pathArray.length - 1 ? undefined : null;
        }
        else {
            object = object[key];
        }
        if (object === undefined || object === null) {
            // `object` is either `undefined` or `null` so we want to stop the loop, and
            // if this is not the last bit of the path, and
            // if it didn't return `undefined`
            // it would return `null` if `object` is `null`
            // but we want `get({foo: null}, 'foo.bar')` to equal `undefined`, or the supplied value, not `null`
            if (index !== pathArray.length - 1) {
                return value;
            }
            break;
        }
    }
    return object === undefined ? value : object;
}
function util_isStringIndex(object, key) {
    if (typeof key !== 'number' && Array.isArray(object)) {
        const index = Number.parseInt(key, 10);
        return Number.isInteger(index) && object[index] === object[key];
    }
    return false;
}
//# sourceMappingURL=util.js.map
;// CONCATENATED MODULE: ./node_modules/event-reduce-js/dist/esm/src/states/state-resolver.js

const hasLimit = (input) => {
    return !!input.queryParams.limit;
};
const isFindOne = (input) => {
    return input.queryParams.limit === 1;
};
const hasSkip = (input) => {
    if (input.queryParams.skip && input.queryParams.skip > 0) {
        return true;
    }
    else {
        return false;
    }
};
const isDelete = (input) => {
    return input.changeEvent.operation === 'DELETE';
};
const isInsert = (input) => {
    return input.changeEvent.operation === 'INSERT';
};
const isUpdate = (input) => {
    return input.changeEvent.operation === 'UPDATE';
};
const wasLimitReached = (input) => {
    return hasLimit(input) && input.previousResults.length >= input.queryParams.limit;
};
const sortParamsChanged = (input) => {
    const sortFields = input.queryParams.sortFields;
    const prev = input.changeEvent.previous;
    const doc = input.changeEvent.doc;
    if (!doc) {
        return false;
    }
    if (!prev) {
        return true;
    }
    for (let i = 0; i < sortFields.length; i++) {
        const field = sortFields[i];
        const beforeData = util_getProperty(prev, field);
        const afterData = util_getProperty(doc, field);
        if (beforeData !== afterData) {
            return true;
        }
    }
    return false;
};
const wasInResult = (input) => {
    const id = input.changeEvent.id;
    if (input.keyDocumentMap) {
        const has = input.keyDocumentMap.has(id);
        return has;
    }
    else {
        const primary = input.queryParams.primaryKey;
        const results = input.previousResults;
        for (let i = 0; i < results.length; i++) {
            const item = results[i];
            if (item[primary] === id) {
                return true;
            }
        }
        return false;
    }
};
const wasFirst = (input) => {
    const first = input.previousResults[0];
    if (first && first[input.queryParams.primaryKey] === input.changeEvent.id) {
        return true;
    }
    else {
        return false;
    }
};
const wasLast = (input) => {
    const last = src_util_lastOfArray(input.previousResults);
    if (last && last[input.queryParams.primaryKey] === input.changeEvent.id) {
        return true;
    }
    else {
        return false;
    }
};
const wasSortedBeforeFirst = (input) => {
    const prev = input.changeEvent.previous;
    if (!prev) {
        return false;
    }
    const first = input.previousResults[0];
    if (!first) {
        return false;
    }
    /**
     * If the changed document is the same as the first,
     * we cannot sort-compare them, because it might end in a non-deterministic
     * sort order. Because both document could be equal.
     * So instead we have to return true.
     */
    if (first[input.queryParams.primaryKey] === input.changeEvent.id) {
        return true;
    }
    const comp = input.queryParams.sortComparator(prev, first);
    return comp < 0;
};
const wasSortedAfterLast = (input) => {
    const prev = input.changeEvent.previous;
    if (!prev) {
        return false;
    }
    const last = src_util_lastOfArray(input.previousResults);
    if (!last) {
        return false;
    }
    if (last[input.queryParams.primaryKey] === input.changeEvent.id) {
        return true;
    }
    const comp = input.queryParams.sortComparator(prev, last);
    return comp > 0;
};
const isSortedBeforeFirst = (input) => {
    const doc = input.changeEvent.doc;
    if (!doc) {
        return false;
    }
    const first = input.previousResults[0];
    if (!first) {
        return false;
    }
    if (first[input.queryParams.primaryKey] === input.changeEvent.id) {
        return true;
    }
    const comp = input.queryParams.sortComparator(doc, first);
    return comp < 0;
};
const isSortedAfterLast = (input) => {
    const doc = input.changeEvent.doc;
    if (!doc) {
        return false;
    }
    const last = src_util_lastOfArray(input.previousResults);
    if (!last) {
        return false;
    }
    if (last[input.queryParams.primaryKey] === input.changeEvent.id) {
        return true;
    }
    const comp = input.queryParams.sortComparator(doc, last);
    return comp > 0;
};
const wasMatching = (input) => {
    const prev = input.changeEvent.previous;
    if (!prev) {
        return false;
    }
    return input.queryParams.queryMatcher(prev);
};
const doesMatchNow = (input) => {
    const doc = input.changeEvent.doc;
    if (!doc) {
        return false;
    }
    const ret = input.queryParams.queryMatcher(doc);
    return ret;
};
const wasResultsEmpty = (input) => {
    return input.previousResults.length === 0;
};
//# sourceMappingURL=state-resolver.js.map
;// CONCATENATED MODULE: ./node_modules/event-reduce-js/dist/esm/src/states/index.js


/**
 * all states ordered by performance-cost
 * cheapest first
 * TODO run tests on which is really the fastest
 */
const orderedStateList = (/* unused pure expression or super */ null && ([
    'isInsert',
    'isUpdate',
    'isDelete',
    'hasLimit',
    'isFindOne',
    'hasSkip',
    'wasResultsEmpty',
    'wasLimitReached',
    'wasFirst',
    'wasLast',
    'sortParamsChanged',
    'wasInResult',
    'wasSortedBeforeFirst',
    'wasSortedAfterLast',
    'isSortedBeforeFirst',
    'isSortedAfterLast',
    'wasMatching',
    'doesMatchNow'
]));
const stateResolveFunctions = {
    isInsert: isInsert,
    isUpdate: isUpdate,
    isDelete: isDelete,
    hasLimit: hasLimit,
    isFindOne: isFindOne,
    hasSkip: hasSkip,
    wasResultsEmpty: wasResultsEmpty,
    wasLimitReached: wasLimitReached,
    wasFirst: wasFirst,
    wasLast: wasLast,
    sortParamsChanged: sortParamsChanged,
    wasInResult: wasInResult,
    wasSortedBeforeFirst: wasSortedBeforeFirst,
    wasSortedAfterLast: wasSortedAfterLast,
    isSortedBeforeFirst: isSortedBeforeFirst,
    isSortedAfterLast: isSortedAfterLast,
    wasMatching: wasMatching,
    doesMatchNow: doesMatchNow
};
const stateResolveFunctionByIndex = {
    0: isInsert,
    1: isUpdate,
    2: isDelete,
    3: hasLimit,
    4: isFindOne,
    5: hasSkip,
    6: wasResultsEmpty,
    7: wasLimitReached,
    8: wasFirst,
    9: wasLast,
    10: sortParamsChanged,
    11: wasInResult,
    12: wasSortedBeforeFirst,
    13: wasSortedAfterLast,
    14: isSortedBeforeFirst,
    15: isSortedAfterLast,
    16: wasMatching,
    17: doesMatchNow
};
function resolveState(stateName, input) {
    const fn = stateResolveFunctions[stateName];
    if (!fn) {
        throw new Error('resolveState() has no function for ' + stateName);
    }
    return fn(input);
}
function states_getStateSet(input) {
    let set = '';
    for (let i = 0; i < orderedStateList.length; i++) {
        const name = orderedStateList[i];
        const value = resolveState(name, input);
        const add = value ? '1' : '0';
        set += add;
    }
    return set;
}
function logStateSet(stateSet) {
    orderedStateList.forEach((state, index) => {
        console.log('state: ' + state + ' : ' + stateSet[index]);
    });
}
//# sourceMappingURL=index.js.map
;// CONCATENATED MODULE: ./node_modules/event-reduce-js/dist/esm/src/bdd/bdd.generated.js


const minimalBddString = '14a1b,c+d2e5f0g/h.i4j*k-l)m(n6oeh6pnm6qen6ril6snh6tin6ubo9vce9wmh9xns9yne9zmi9{cm9|ad9}cp9~aq9ae9¡bf9¢bq9£cg9¤ck9¥cn9¦nd9§np9¨nq9©nf9ªng9«nm9¬nk9­mr9®ms9¯mt9°mj9±mk9²ml9³mn9´mc8µ³{8¶¯}8·°¤8¸³§8¹mn8º³«8»³m8¼m´4½z²4¾³w4¿zµ4À¯¶4Á°·4Â³º4Ã³¸4Äm¹4Åv¤7Æyn7ÇÀÁ7È~7É¥¤7ÊÃÄ7Ë¨n7Ìº¹7Í­°7Î®m7Ï¯°7Ð±m7Ñ³m7Ò¼m5ÓÄm5Ô¹m5Õ½°5Ö¾m5×¿°5ØÇÏ5ÙÂm5ÚÊÑ5Û±m5Üºm5ÝÌÑ5ÞÕÍ2ß|2à¡u2á£Å2âÖÎ2ã¦Æ2ä©x2åªÆ2æ×Ø2ç|È2è¡¢2é£É2ê¤¥2ëÙÚ2ì¦Ë2í©n2îªn2ïÛÐ2ðÜÝ2ñ¬n2òÒÓ/óan/ôbn/õcn/öÞâ/÷ßã/øàä/ùáå/úæë/ûçì/üèí/ýéî/þÍÎ/ÿÏÑ/ĀòÔ,ācn,Ăöï,ă¤ñ,Ąúð,ąêñ,ĆþÐ,ćÿÑ,Ĉac0ĉbc0Ċóõ0ċôā0Čßá0čà¤0Ďçé0ďèê0Đ÷ù0đøă0Ēûý0ēüą0ĔmÒ-ĕmĀ-ĖÞæ-ėČĎ-Ęčď-ęĂĄ-ĚĐĒ-ěđē-Ĝ²»-ĝÍÏ-ĞĆć-ğ²³-ĠĔĈ3ġĕĊ3ĢĖė3ģęĚ3ĤĢĝ(ĥĜğ(ĦģĞ(ħĠġ+Ĩĉċ+ĩĤĦ+ĪĘě+īħĨ1ĬĩĪ1ĭĬī*Įĥm*ĭĮ.';
let simpleBdd;
function getSimpleBdd() {
    if (!simpleBdd) {
        simpleBdd = minimalStringToSimpleBdd(minimalBddString);
    }
    return simpleBdd;
}
const resolveInput = (input) => {
    return resolveWithSimpleBdd(getSimpleBdd(), stateResolveFunctionByIndex, input);
};
//# sourceMappingURL=bdd.generated.js.map
;// CONCATENATED MODULE: ./node_modules/event-reduce-js/dist/esm/src/index.js






function calculateActionFromMap(stateSetToActionMap, input) {
    const stateSet = getStateSet(input);
    const actionName = stateSetToActionMap.get(stateSet);
    if (!actionName) {
        return {
            action: 'runFullQueryAgain',
            stateSet
        };
    }
    else {
        return {
            action: actionName,
            stateSet
        };
    }
}
function calculateActionName(input) {
    const resolvedActionId = resolveInput(input);
    return orderedActionList[resolvedActionId];
}
function calculateActionFunction(input) {
    const actionName = calculateActionName(input);
    return actionFunctions[actionName];
}
/**
 * for performance reasons,
 * @mutates the input
 * @returns the new results
 */
function runAction(action, queryParams, changeEvent, previousResults, keyDocumentMap) {
    const fn = actions_actionFunctions[action];
    fn({
        queryParams,
        changeEvent,
        previousResults,
        keyDocumentMap
    });
    return previousResults;
}
//# sourceMappingURL=index.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/rx-change-event.js
/**
 * RxChangeEvents a emitted when something in the database changes
 * they can be grabbed by the observables of database, collection and document
 */



function getDocumentDataOfRxChangeEvent(rxChangeEvent) {
  if (rxChangeEvent.documentData) {
    return rxChangeEvent.documentData;
  } else {
    return rxChangeEvent.previousDocumentData;
  }
}

/**
 * Might return null which means an
 * already deleted document got modified but still is deleted.
 * These kind of events are not relevant for the event-reduce algorithm
 * and must be filtered out.
 */
function rxChangeEventToEventReduceChangeEvent(rxChangeEvent) {
  switch (rxChangeEvent.operation) {
    case 'INSERT':
      return {
        operation: rxChangeEvent.operation,
        id: rxChangeEvent.documentId,
        doc: rxChangeEvent.documentData,
        previous: null
      };
    case 'UPDATE':
      return {
        operation: rxChangeEvent.operation,
        id: rxChangeEvent.documentId,
        doc: overwritable.deepFreezeWhenDevMode(rxChangeEvent.documentData),
        previous: rxChangeEvent.previousDocumentData ? rxChangeEvent.previousDocumentData : 'UNKNOWN'
      };
    case 'DELETE':
      return {
        operation: rxChangeEvent.operation,
        id: rxChangeEvent.documentId,
        doc: null,
        previous: rxChangeEvent.previousDocumentData
      };
  }
}

/**
 * Flattens the given events into a single array of events.
 * Used mostly in tests.
 */
function flattenEvents(input) {
  var output = [];
  if (Array.isArray(input)) {
    input.forEach(inputItem => {
      var add = flattenEvents(inputItem);
      appendToArray(output, add);
    });
  } else {
    if (input.id && input.events) {
      // is bulk
      input.events.forEach(ev => output.push(ev));
    } else {
      output.push(input);
    }
  }
  var usedIds = new Set();
  var nonDuplicate = [];
  function getEventId(ev) {
    return [ev.documentId, ev.documentData ? ev.documentData._rev : '', ev.previousDocumentData ? ev.previousDocumentData._rev : ''].join('|');
  }
  output.forEach(ev => {
    var eventId = getEventId(ev);
    if (!usedIds.has(eventId)) {
      usedIds.add(eventId);
      nonDuplicate.push(ev);
    }
  });
  return nonDuplicate;
}
//# sourceMappingURL=rx-change-event.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/query-planner.js



var INDEX_MAX = String.fromCharCode(65535);

/**
 * Do not use -Infinity here because it would be
 * transformed to null on JSON.stringify() which can break things
 * when the query plan is send to the storage as json.
 * @link https://stackoverflow.com/a/16644751
 * Notice that for IndexedDB IDBKeyRange we have
 * to transform the value back to -Infinity
 * before we can use it in IDBKeyRange.bound.
 */
var INDEX_MIN = Number.MIN_SAFE_INTEGER;

/**
 * Returns the query plan which contains
 * information about how to run the query
 * and which indexes to use.
 *
 * This is used in some storage like Memory, dexie.js and IndexedDB.
 */
function getQueryPlan(schema, query) {
  var selector = query.selector;
  var indexes = schema.indexes ? schema.indexes.slice(0) : [];
  if (query.index) {
    indexes = [query.index];
  }

  /**
   * Most storages do not support descending indexes
   * so having a 'desc' in the sorting, means we always have to re-sort the results.
   */
  var hasDescSorting = !!query.sort.find(sortField => Object.values(sortField)[0] === 'desc');

  /**
   * Some fields can be part of the selector while not being relevant for sorting
   * because their selector operators specify that in all cases all matching docs
   * would have the same value.
   * For example the boolean field _deleted.
   * TODO similar thing could be done for enums.
   */
  var sortIrrelevevantFields = new Set();
  Object.keys(selector).forEach(fieldName => {
    var schemaPart = getSchemaByObjectPath(schema, fieldName);
    if (schemaPart && schemaPart.type === 'boolean' && Object.prototype.hasOwnProperty.call(selector[fieldName], '$eq')) {
      sortIrrelevevantFields.add(fieldName);
    }
  });
  var optimalSortIndex = query.sort.map(sortField => Object.keys(sortField)[0]);
  var optimalSortIndexCompareString = optimalSortIndex.filter(f => !sortIrrelevevantFields.has(f)).join(',');
  var currentBestQuality = -1;
  var currentBestQueryPlan;
  indexes.forEach(index => {
    var inclusiveEnd = true;
    var inclusiveStart = true;
    var opts = index.map(indexField => {
      var matcher = selector[indexField];
      var operators = matcher ? Object.keys(matcher) : [];
      var matcherOpts = {};
      if (!matcher || !operators.length) {
        var startKey = inclusiveStart ? INDEX_MIN : INDEX_MAX;
        matcherOpts = {
          startKey,
          endKey: inclusiveEnd ? INDEX_MAX : INDEX_MIN,
          inclusiveStart: true,
          inclusiveEnd: true
        };
      } else {
        operators.forEach(operator => {
          if (LOGICAL_OPERATORS.has(operator)) {
            var operatorValue = matcher[operator];
            var partialOpts = getMatcherQueryOpts(operator, operatorValue);
            matcherOpts = Object.assign(matcherOpts, partialOpts);
          }
        });
      }

      // fill missing attributes
      if (typeof matcherOpts.startKey === 'undefined') {
        matcherOpts.startKey = INDEX_MIN;
      }
      if (typeof matcherOpts.endKey === 'undefined') {
        matcherOpts.endKey = INDEX_MAX;
      }
      if (typeof matcherOpts.inclusiveStart === 'undefined') {
        matcherOpts.inclusiveStart = true;
      }
      if (typeof matcherOpts.inclusiveEnd === 'undefined') {
        matcherOpts.inclusiveEnd = true;
      }
      if (inclusiveStart && !matcherOpts.inclusiveStart) {
        inclusiveStart = false;
      }
      if (inclusiveEnd && !matcherOpts.inclusiveEnd) {
        inclusiveEnd = false;
      }
      return matcherOpts;
    });
    var queryPlan = {
      index,
      startKeys: opts.map(opt => opt.startKey),
      endKeys: opts.map(opt => opt.endKey),
      inclusiveEnd,
      inclusiveStart,
      sortSatisfiedByIndex: !hasDescSorting && optimalSortIndexCompareString === index.filter(f => !sortIrrelevevantFields.has(f)).join(','),
      selectorSatisfiedByIndex: isSelectorSatisfiedByIndex(index, query.selector)
    };
    var quality = rateQueryPlan(schema, query, queryPlan);
    if (quality >= currentBestQuality || query.index) {
      currentBestQuality = quality;
      currentBestQueryPlan = queryPlan;
    }
  });

  /**
   * In all cases and index must be found
   */
  if (!currentBestQueryPlan) {
    throw rx_error_newRxError('SNH', {
      query
    });
  }
  return currentBestQueryPlan;
}
var LOGICAL_OPERATORS = new Set(['$eq', '$gt', '$gte', '$lt', '$lte']);
var LOWER_BOUND_LOGICAL_OPERATORS = new Set(['$eq', '$gt', '$gte']);
var UPPER_BOUND_LOGICAL_OPERATORS = new Set(['$eq', '$lt', '$lte']);
function isSelectorSatisfiedByIndex(index, selector) {
  var selectorEntries = Object.entries(selector);
  var hasNonMatchingOperator = selectorEntries.find(([fieldName, operation]) => {
    if (!index.includes(fieldName)) {
      return true;
    }
    var hasNonLogicOperator = Object.entries(operation).find(([op, _value]) => !LOGICAL_OPERATORS.has(op));
    return hasNonLogicOperator;
  });
  if (hasNonMatchingOperator) {
    return false;
  }
  var prevLowerBoundaryField;
  var hasMoreThenOneLowerBoundaryField = index.find(fieldName => {
    var operation = selector[fieldName];
    if (!operation) {
      return false;
    }
    var hasLowerLogicOp = Object.keys(operation).find(key => LOWER_BOUND_LOGICAL_OPERATORS.has(key));
    if (prevLowerBoundaryField && hasLowerLogicOp) {
      return true;
    } else if (hasLowerLogicOp !== '$eq') {
      prevLowerBoundaryField = hasLowerLogicOp;
    }
    return false;
  });
  if (hasMoreThenOneLowerBoundaryField) {
    return false;
  }
  var prevUpperBoundaryField;
  var hasMoreThenOneUpperBoundaryField = index.find(fieldName => {
    var operation = selector[fieldName];
    if (!operation) {
      return false;
    }
    var hasUpperLogicOp = Object.keys(operation).find(key => UPPER_BOUND_LOGICAL_OPERATORS.has(key));
    if (prevUpperBoundaryField && hasUpperLogicOp) {
      return true;
    } else if (hasUpperLogicOp !== '$eq') {
      prevUpperBoundaryField = hasUpperLogicOp;
    }
    return false;
  });
  if (hasMoreThenOneUpperBoundaryField) {
    return false;
  }
  var selectorFields = new Set(Object.keys(selector));
  for (var fieldName of index) {
    if (selectorFields.size === 0) {
      break;
    }
    if (selectorFields.has(fieldName)) {
      selectorFields.delete(fieldName);
    } else {
      return false;
    }
  }
  return true;
}
function getMatcherQueryOpts(operator, operatorValue) {
  switch (operator) {
    case '$eq':
      return {
        startKey: operatorValue,
        endKey: operatorValue
      };
    case '$lte':
      return {
        endKey: operatorValue
      };
    case '$gte':
      return {
        startKey: operatorValue
      };
    case '$lt':
      return {
        endKey: operatorValue,
        inclusiveEnd: false
      };
    case '$gt':
      return {
        startKey: operatorValue,
        inclusiveStart: false
      };
    default:
      throw new Error('SNH');
  }
}

/**
 * Returns a number that determines the quality of the query plan.
 * Higher number means better query plan.
 */
function rateQueryPlan(schema, query, queryPlan) {
  var quality = 0;
  var addQuality = value => {
    if (value > 0) {
      quality = quality + value;
    }
  };
  var pointsPerMatchingKey = 10;
  var nonMinKeyCount = countUntilNotMatching(queryPlan.startKeys, keyValue => keyValue !== INDEX_MIN && keyValue !== INDEX_MAX);
  addQuality(nonMinKeyCount * pointsPerMatchingKey);
  var nonMaxKeyCount = countUntilNotMatching(queryPlan.startKeys, keyValue => keyValue !== INDEX_MAX && keyValue !== INDEX_MIN);
  addQuality(nonMaxKeyCount * pointsPerMatchingKey);
  var equalKeyCount = countUntilNotMatching(queryPlan.startKeys, (keyValue, idx) => {
    if (keyValue === queryPlan.endKeys[idx]) {
      return true;
    } else {
      return false;
    }
  });
  addQuality(equalKeyCount * pointsPerMatchingKey * 1.5);
  var pointsIfNoReSortMustBeDone = queryPlan.sortSatisfiedByIndex ? 5 : 0;
  addQuality(pointsIfNoReSortMustBeDone);
  return quality;
}
//# sourceMappingURL=query-planner.js.map
;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/util.js
/**
 * Utility constants and functions
 */
const util_MAX_INT = 2147483647;
const util_MIN_INT = -2147483648;
const util_MAX_LONG = Number.MAX_SAFE_INTEGER;
const util_MIN_LONG = Number.MIN_SAFE_INTEGER;
// special value to identify missing items. treated differently from undefined
const MISSING = Symbol("missing");
const CYCLE_FOUND_ERROR = Object.freeze(new Error("mingo: cycle detected while processing object/array"));
const ARRAY_PROTO = Object.getPrototypeOf([]);
const OBJECT_PROTO = Object.getPrototypeOf({});
const OBJECT_TAG = "[object Object]";
const OBJECT_TYPE_RE = /^\[object ([a-zA-Z0-9]+)\]$/;
class Null {
}
class Undefined {
}
const getConstructor = (v) => {
    if (v === null)
        return Null;
    if (v === undefined)
        return Undefined;
    return v.constructor;
};
/**
 * Uses the simple hash method as described in Effective Java.
 * @see https://stackoverflow.com/a/113600/1370481
 * @param value The value to hash
 * @returns {number}
 */
const DEFAULT_HASH_FUNCTION = (value) => {
    const s = stringify(value);
    let hash = 0;
    let i = s.length;
    while (i)
        hash = ((hash << 5) - hash) ^ s.charCodeAt(--i);
    return hash >>> 0;
};
// no array, object, or function types
const JS_SIMPLE_TYPES = new Set([
    "null",
    "undefined",
    "boolean",
    "number",
    "string",
    "date",
    "regexp"
]);
const IMMUTABLE_TYPES_SET = new Set([Undefined, Null, Boolean, String, Number]);
/** Convert simple value to string representation. */
const util_toString = (v) => v.toString(); // eslint-disable-line @typescript-eslint/no-base-to-string
/** Convert a typed array to string representation. */
const typedArrayToString = (v) => `${getConstructor(v).name}[${v.toString()}]`; // eslint-disable-line @typescript-eslint/no-base-to-string
/** Map of constructors to string converter functions */
const STRING_CONVERTERS = new Map([
    [Number, util_toString],
    [Boolean, util_toString],
    [RegExp, util_toString],
    [Function, util_toString],
    [Symbol, util_toString],
    [BigInt, (n) => "0x" + n.toString(16)],
    [Date, (d) => d.toISOString()],
    [String, JSON.stringify],
    [Null, (_) => "null"],
    [Undefined, (_) => "undefined"],
    [Int8Array, typedArrayToString],
    [Uint8Array, typedArrayToString],
    [Uint8ClampedArray, typedArrayToString],
    [Int16Array, typedArrayToString],
    [Uint16Array, typedArrayToString],
    [Int32Array, typedArrayToString],
    [Uint32Array, typedArrayToString],
    [Float32Array, typedArrayToString],
    [Float64Array, typedArrayToString],
    [BigInt64Array, typedArrayToString],
    [BigUint64Array, typedArrayToString]
]);
/** MongoDB sort comparison order. https://www.mongodb.com/docs/manual/reference/bson-type-comparison-order */
const SORT_ORDER_BY_TYPE = {
    null: 0,
    undefined: 0,
    number: 1,
    string: 2,
    object: 3,
    array: 4,
    boolean: 5,
    date: 6,
    regexp: 7,
    function: 8
};
/**
 * Compare function which adheres to MongoDB comparison order.
 *
 * @param a The first value
 * @param b The second value
 * @returns {Number}
 */
const util_compare = (a, b) => {
    if (a === MISSING)
        a = undefined;
    if (b === MISSING)
        b = undefined;
    const [u, v] = [a, b].map(n => SORT_ORDER_BY_TYPE[util_getType(n).toLowerCase()]);
    if (u !== v)
        return u - v;
    // number | string | date
    if (u === 1 || u === 2 || u === 6) {
        if (a < b)
            return -1;
        if (a > b)
            return 1;
        return 0;
    }
    // check for equivalence equality
    if (util_isEqual(a, b))
        return 0;
    if (a < b)
        return -1;
    if (a > b)
        return 1;
    // if we get here we are comparing a type that does not make sense.
    return 0;
};
function util_assert(condition, message) {
    if (!condition)
        throw new Error(message);
}
const isTypedArray = (v) => {
    const proto = Object.getPrototypeOf(getConstructor(v));
    return proto && proto.name === "TypedArray";
};
/**
 * Deep clone an object. Value types and immutable objects are returned as is.
 */
const util_cloneDeep = (obj) => {
    if (IMMUTABLE_TYPES_SET.has(getConstructor(obj)))
        return obj;
    const cycle = new Set();
    const clone = (val) => {
        if (cycle.has(val))
            throw CYCLE_FOUND_ERROR;
        const ctor = getConstructor(val);
        if (IMMUTABLE_TYPES_SET.has(ctor))
            return val;
        try {
            // arrays
            if (util_isArray(val)) {
                cycle.add(val);
                return val.map(clone);
            }
            // object literals
            if (esm_util_isObject(val)) {
                cycle.add(val);
                const res = {};
                for (const k in val)
                    res[k] = clone(val[k]);
                return res;
            }
        }
        finally {
            cycle.delete(val);
        }
        // dates, regex, typed arrays
        if (ctor === Date || ctor === RegExp || isTypedArray(val)) {
            return new ctor(val);
        }
        return val;
    };
    return clone(obj);
};
/**
 * Returns the name of type as specified in the tag returned by a call to Object.prototype.toString
 * @param v A value
 */
const util_getType = (v) => OBJECT_TYPE_RE.exec(Object.prototype.toString.call(v))[1];
const util_isBoolean = (v) => typeof v === "boolean";
const util_isString = (v) => typeof v === "string";
const isSymbol = (v) => typeof v === "symbol";
const util_isNumber = (v) => !isNaN(v) && typeof v === "number";
const isBigInt = (v) => !isNaN(v) && typeof v === "bigint";
const util_isNotNaN = (v) => !(isNaN(v) && typeof v === "number");
const util_isArray = Array.isArray;
const esm_util_isObject = (v) => {
    if (!v)
        return false;
    const proto = Object.getPrototypeOf(v);
    return ((proto === OBJECT_PROTO || proto === null) &&
        OBJECT_TAG === Object.prototype.toString.call(v));
};
//  objects, arrays, functions, date, custom object
const isObjectLike = (v) => v === Object(v);
const util_isDate = (v) => v instanceof Date;
const isRegExp = (v) => v instanceof RegExp;
const util_isFunction = (v) => typeof v === "function";
const util_isNil = (v) => v === null || v === undefined;
const util_inArray = (arr, item) => arr.includes(item);
const util_notInArray = (arr, item) => !util_inArray(arr, item);
const util_truthy = (arg, strict = true) => !!arg || (strict && arg === "");
const util_isEmpty = (x) => util_isNil(x) ||
    (util_isString(x) && !x) ||
    (x instanceof Array && x.length === 0) ||
    (esm_util_isObject(x) && Object.keys(x).length === 0);
const isMissing = (v) => v === MISSING;
/** ensure a value is an array or wrapped within one. */
const util_ensureArray = (x) => x instanceof Array ? x : [x];
const util_has = (obj, prop) => !!obj && Object.prototype.hasOwnProperty.call(obj, prop);
const mergeable = (left, right) => (esm_util_isObject(left) && esm_util_isObject(right)) || (util_isArray(left) && util_isArray(right));
/**
 * Deep merge objects or arrays.
 * When the inputs have unmergeable types, the  right hand value is returned.
 * If inputs are arrays and options.flatten is set, elements in the same position are merged together. Remaining elements are appended to the target object.
 * If options.flatten is false, the right hand value is just appended to the left-hand value.
 * @param target {Object|Array} the target to merge into
 * @param obj {Object|Array} the source object
 */
function util_merge(target, obj, options) {
    // default options
    options = options || { flatten: false };
    // take care of missing inputs
    if (isMissing(target) || util_isNil(target))
        return obj;
    if (isMissing(obj) || util_isNil(obj))
        return target;
    // fail only on initial input.
    if (!mergeable(target, obj)) {
        if (options.skipValidation)
            return obj || target;
        throw Error("mismatched types. must both be array or object");
    }
    // skip validation after initial input.
    options.skipValidation = true;
    if (util_isArray(target)) {
        const result = target;
        const input = obj;
        if (options.flatten) {
            let i = 0;
            let j = 0;
            while (i < result.length && j < input.length) {
                result[i] = util_merge(result[i++], input[j++], options);
            }
            while (j < input.length) {
                result.push(obj[j++]);
            }
        }
        else {
            util_into(result, input);
        }
    }
    else {
        for (const k in obj) {
            target[k] = util_merge(target[k], obj[k], options);
        }
    }
    return target;
}
function buildHashIndex(arr, hashFunction = DEFAULT_HASH_FUNCTION) {
    const map = new Map();
    arr.forEach((o, i) => {
        const h = util_hashCode(o, hashFunction);
        if (map.has(h)) {
            if (!map.get(h).some(j => util_isEqual(arr[j], o))) {
                map.get(h).push(i);
            }
        }
        else {
            map.set(h, [i]);
        }
    });
    return map;
}
/**
 * Returns the intersection of multiple arrays.
 *
 * @param  {Array} input An array of arrays from which to find intersection.
 * @param  {Function} hashFunction Custom function to hash values, default the hashCode method
 * @return {Array} Array of intersecting values.
 */
function util_intersection(input, hashFunction = DEFAULT_HASH_FUNCTION) {
    // if any array is empty, there is no intersection
    if (input.some(arr => arr.length == 0))
        return [];
    if (input.length === 1)
        return Array.from(input);
    // sort input arrays by to get smallest array
    // const sorted = sortBy(input, (a: RawArray) => a.length) as RawArray[];
    const sortedIndex = util_sortBy(input.map((a, i) => [i, a.length]), (a) => a[1]);
    // get the smallest
    const smallest = input[sortedIndex[0][0]];
    // get hash index of smallest array
    const map = buildHashIndex(smallest, hashFunction);
    // hashIndex for remaining arrays.
    const rmap = new Map();
    // final intersection results and index of first occurrence.
    const results = new Array();
    map.forEach((v, k) => {
        const lhs = v.map(j => smallest[j]);
        const res = lhs.map(_ => 0);
        // used to track first occurence of value in order of the original input array.
        const stable = lhs.map(_ => [sortedIndex[0][0], 0]);
        let found = false;
        for (let i = 1; i < input.length; i++) {
            const [currIndex, _] = sortedIndex[i];
            const arr = input[currIndex];
            if (!rmap.has(i))
                rmap.set(i, buildHashIndex(arr));
            // we found a match. let's confirm.
            if (rmap.get(i).has(k)) {
                const rhs = rmap
                    .get(i)
                    .get(k)
                    .map(j => arr[j]);
                // confirm the intersection with an equivalence check.
                found = lhs
                    .map((s, n) => rhs.some((t, m) => {
                    // we expect only one to match here since these are just collisions.
                    const p = res[n];
                    if (util_isEqual(s, t)) {
                        res[n]++;
                        // track position of value ordering for stability.
                        if (currIndex < stable[n][0]) {
                            stable[n] = [currIndex, rmap.get(i).get(k)[m]];
                        }
                    }
                    return p < res[n];
                }))
                    .some(Boolean);
            }
            // found nothing, so exclude value. this was just a hash collision.
            if (!found)
                return;
        }
        // extract value into result if we found an intersection.
        // we find an intersection if the frequency counter matches the count of the remaining arrays.
        if (found) {
            util_into(results, res
                .map((n, i) => {
                return n === input.length - 1 ? [lhs[i], stable[i]] : MISSING;
            })
                .filter(n => n !== MISSING));
        }
    });
    return results
        .sort((a, b) => {
        const [_i, [u, m]] = a;
        const [_j, [v, n]] = b;
        const r = util_compare(u, v);
        if (r !== 0)
            return r;
        return util_compare(m, n);
    })
        .map(v => v[0]);
}
/**
 * Flatten the array
 *
 * @param {Array} xs The array to flatten
 * @param {Number} depth The number of nested lists to iterate
 */
function flatten(xs, depth = 0) {
    const arr = new Array();
    function flatten2(ys, n) {
        for (let i = 0, len = ys.length; i < len; i++) {
            if (util_isArray(ys[i]) && (n > 0 || n < 0)) {
                flatten2(ys[i], Math.max(-1, n - 1));
            }
            else {
                arr.push(ys[i]);
            }
        }
    }
    flatten2(xs, depth);
    return arr;
}
/** Returns all members of the value in an object literal. */
const getMembersOf = (value) => {
    let [proto, names] = [
        Object.getPrototypeOf(value),
        Object.getOwnPropertyNames(value)
    ];
    // save effective prototype
    let activeProto = proto;
    // traverse the prototype hierarchy until we get property names or hit the bottom prototype.
    while (!names.length && proto !== OBJECT_PROTO && proto !== ARRAY_PROTO) {
        activeProto = proto;
        names = Object.getOwnPropertyNames(proto);
        proto = Object.getPrototypeOf(proto);
    }
    const o = {};
    names.forEach(k => (o[k] = value[k]));
    return [o, activeProto];
};
/**
 * Determine whether two values are the same or strictly equivalent.
 * Checking whether values are the same only applies to built in objects.
 * For user-defined objects this checks for only referential equality so
 * two different instances with the same values are not equal.
 *
 * @param  {*}  a The first value
 * @param  {*}  b The second value
 * @return {Boolean}   Result of comparison
 */
function util_isEqual(a, b) {
    const args = [[a, b]];
    while (args.length > 0) {
        [a, b] = args.pop();
        // strictly equal must be equal. matches referentially equal values.
        if (a === b)
            continue;
        // unequal types and functions (unless referentially equivalent) cannot be equal.
        const ctor = getConstructor(a);
        if (ctor !== getConstructor(b) || util_isFunction(a))
            return false;
        // string convertable types
        if (STRING_CONVERTERS.has(ctor)) {
            const str = STRING_CONVERTERS.get(ctor);
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            if (str(a) !== str(b))
                return false;
            // values are equal, so move next
            continue;
        }
        // handle array and object types
        if (ctor === Array || ctor === Object) {
            const ka = Object.keys(a);
            const kb = Object.keys(b);
            if (ka.length !== kb.length)
                return false;
            if (new Set(ka.concat(kb)).size != ka.length)
                return false;
            for (const k of ka)
                args.push([a[k], b[k]]);
            // move next
            continue;
        }
        // user-defined type detected.
        // we don't try to compare user-defined types (even though we could...shhhh).
        return false;
    }
    // nothing left to compare
    return !args.length;
}
/**
 * Return a new unique version of the collection
 * @param  {Array} input The input collection
 * @return {Array}
 */
function util_unique(input, hashFunction = DEFAULT_HASH_FUNCTION) {
    const result = input.map(_ => MISSING);
    buildHashIndex(input, hashFunction).forEach((v, _) => {
        v.forEach(i => (result[i] = input[i]));
    });
    return result.filter(v => v !== MISSING);
}
/**
 * Encode value to string using a simple non-colliding stable scheme.
 * Handles user-defined types by processing keys on first non-empty prototype.
 * If a user-defined type provides a "toJSON" function, it is used.
 *
 * @param value The value to convert to a string representation.
 * @returns {String}
 */
function stringify(value) {
    const cycle = new Set();
    // stringify with cycle check
    const str = (v) => {
        const ctor = getConstructor(v);
        // string convertable types
        if (STRING_CONVERTERS.has(ctor)) {
            return STRING_CONVERTERS.get(ctor)(v);
        }
        const tag = ctor === Object ? "" : ctor.name;
        // handle JSONable objects.
        if (util_isFunction(v["toJSON"])) {
            return `${tag}(${JSON.stringify(v)})`;
        }
        // handle cycles
        if (cycle.has(v))
            throw CYCLE_FOUND_ERROR;
        cycle.add(v);
        try {
            // handle array
            if (ctor === Array) {
                return "[" + v.map(str).join(",") + "]";
            }
            // handle user-defined object
            if (ctor !== Object) {
                // handle user-defined types or object literals.
                const [members, _] = getMembersOf(v);
                // custom type derived from array.
                if (util_isArray(v)) {
                    // include other members as part of array elements.
                    return `${tag}${str([...v, members])}`;
                }
                // get members as literal
                v = members;
            }
            const objKeys = Object.keys(v);
            objKeys.sort();
            return (`${tag}{` +
                objKeys.map(k => `${k}:${str(v[k])}`).join(",") +
                "}");
        }
        finally {
            cycle.delete(v);
        }
    };
    // convert to string
    return str(value);
}
/**
 * Generate hash code
 * This selected function is the result of benchmarking various hash functions.
 * This version performs well and can hash 10^6 documents in ~3s with on average 100 collisions.
 *
 * @param value
 * @returns {number|null}
 */
function util_hashCode(value, hashFunction) {
    hashFunction = hashFunction || DEFAULT_HASH_FUNCTION;
    if (util_isNil(value))
        return null;
    return hashFunction(value).toString();
}
/**
 * Returns a (stably) sorted copy of list, ranked in ascending order by the results of running each value through iteratee
 *
 * This implementation treats null/undefined sort keys as less than every other type
 *
 * @param {Array}   collection
 * @param {Function} keyFn The sort key function used to resolve sort keys
 * @param {Function} comparator The comparator function to use for comparing keys. Defaults to standard comparison via `compare(...)`
 * @return {Array} Returns a new sorted array by the given key and comparator function
 */
function util_sortBy(collection, keyFn, comparator = util_compare) {
    if (util_isEmpty(collection))
        return collection;
    const sorted = new Array();
    const result = new Array();
    for (let i = 0; i < collection.length; i++) {
        const obj = collection[i];
        const key = keyFn(obj, i);
        if (util_isNil(key)) {
            result.push(obj);
        }
        else {
            sorted.push([key, obj]);
        }
    }
    // use native array sorting but enforce stableness
    sorted.sort((a, b) => comparator(a[0], b[0]));
    return util_into(result, sorted.map((o) => o[1]));
}
/**
 * Groups the collection into sets by the returned key
 *
 * @param collection
 * @param keyFn {Function} to compute the group key of an item in the collection
 * @returns {GroupByOutput}
 */
function util_groupBy(collection, keyFn, hashFunction = DEFAULT_HASH_FUNCTION) {
    if (collection.length < 1)
        return new Map();
    // map of hash to collided values
    const lookup = new Map();
    // map of raw key values to objects.
    const result = new Map();
    for (let i = 0; i < collection.length; i++) {
        const obj = collection[i];
        const key = keyFn(obj, i);
        const hash = util_hashCode(key, hashFunction);
        if (hash === null) {
            if (result.has(null)) {
                result.get(null).push(obj);
            }
            else {
                result.set(null, [obj]);
            }
        }
        else {
            // find if we can match a hash for which the value is equivalent.
            // this is used to deal with collisions.
            const existingKey = lookup.has(hash)
                ? lookup.get(hash).find(k => util_isEqual(k, key))
                : null;
            // collision detected or first time seeing key
            if (util_isNil(existingKey)) {
                // collision detected or first entry so we create a new group.
                result.set(key, [obj]);
                // upload the lookup with the collided key
                if (lookup.has(hash)) {
                    lookup.get(hash).push(key);
                }
                else {
                    lookup.set(hash, [key]);
                }
            }
            else {
                // key exists
                result.get(existingKey).push(obj);
            }
        }
    }
    return result;
}
// max elements to push.
// See argument limit https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply
const MAX_ARRAY_PUSH = 50000;
/**
 * Merge elements into the dest
 *
 * @param {*} target The target object
 * @param {*} rest The array of elements to merge into dest
 */
function util_into(target, ...rest) {
    if (target instanceof Array) {
        return rest.reduce(((acc, arr) => {
            // push arrary in batches to handle large inputs
            let i = Math.ceil(arr.length / MAX_ARRAY_PUSH);
            let begin = 0;
            while (i-- > 0) {
                Array.prototype.push.apply(acc, arr.slice(begin, begin + MAX_ARRAY_PUSH));
                begin += MAX_ARRAY_PUSH;
            }
            return acc;
        }), target);
    }
    else {
        // merge objects. same behaviour as Object.assign
        return rest.filter(isObjectLike).reduce((acc, item) => {
            Object.assign(acc, item);
            return acc;
        }, target);
    }
}
/**
 * This is a generic memoization function
 *
 * This implementation uses a cache independent of the function being memoized
 * to allow old values to be garbage collected when the memoized function goes out of scope.
 *
 * @param {*} fn The function object to memoize
 */
function util_memoize(fn, hashFunction = DEFAULT_HASH_FUNCTION) {
    return ((memo) => {
        return (...args) => {
            const key = util_hashCode(args, hashFunction) || "";
            if (!util_has(memo, key)) {
                memo[key] = fn.apply(this, args);
            }
            return memo[key];
        };
    })({
    /* storage */
    });
}
// mingo internal
/**
 * Retrieve the value of a given key on an object
 * @param obj
 * @param key
 * @returns {*}
 * @private
 */
function getValue(obj, key) {
    return isObjectLike(obj) ? obj[key] : undefined;
}
/**
 * Unwrap a single element array to specified depth
 * @param {Array} arr
 * @param {Number} depth
 */
function unwrap(arr, depth) {
    if (depth < 1)
        return arr;
    while (depth-- && arr.length === 1)
        arr = arr[0];
    return arr;
}
/**
 * Resolve the value of the field (dot separated) on the given object
 * @param obj {Object} the object context
 * @param selector {String} dot separated path to field
 * @returns {*}
 */
function util_resolve(obj, selector, options) {
    let depth = 0;
    function resolve2(o, path) {
        let value = o;
        for (let i = 0; i < path.length; i++) {
            const field = path[i];
            const isText = /^\d+$/.exec(field) === null;
            // using instanceof to aid typescript compiler
            if (isText && value instanceof Array) {
                // On the first iteration, we check if we received a stop flag.
                // If so, we stop to prevent iterating over a nested array value
                // on consecutive object keys in the selector.
                if (i === 0 && depth > 0)
                    break;
                depth += 1;
                // only look at the rest of the path
                const subpath = path.slice(i);
                value = value.reduce((acc, item) => {
                    const v = resolve2(item, subpath);
                    if (v !== undefined)
                        acc.push(v);
                    return acc;
                }, []);
                break;
            }
            else {
                value = getValue(value, field);
            }
            if (value === undefined)
                break;
        }
        return value;
    }
    const result = JS_SIMPLE_TYPES.has(util_getType(obj).toLowerCase())
        ? obj
        : resolve2(obj, selector.split("."));
    return result instanceof Array && (options === null || options === void 0 ? void 0 : options.unwrapArray)
        ? unwrap(result, depth)
        : result;
}
/**
 * Returns the full object to the resolved value given by the selector.
 * This function excludes empty values as they aren't practically useful.
 *
 * @param obj {Object} the object context
 * @param selector {String} dot separated path to field
 */
function util_resolveGraph(obj, selector, options) {
    const names = selector.split(".");
    const key = names[0];
    // get the next part of the selector
    const next = names.slice(1).join(".");
    const isIndex = /^\d+$/.exec(key) !== null;
    const hasNext = names.length > 1;
    let result;
    let value;
    if (obj instanceof Array) {
        if (isIndex) {
            result = getValue(obj, Number(key));
            if (hasNext) {
                result = util_resolveGraph(result, next, options);
            }
            result = [result];
        }
        else {
            result = [];
            for (const item of obj) {
                value = util_resolveGraph(item, selector, options);
                if (options === null || options === void 0 ? void 0 : options.preserveMissing) {
                    if (value === undefined) {
                        value = MISSING;
                    }
                    result.push(value);
                }
                else if (value !== undefined) {
                    result.push(value);
                }
            }
        }
    }
    else {
        value = getValue(obj, key);
        if (hasNext) {
            value = util_resolveGraph(value, next, options);
        }
        if (value === undefined)
            return undefined;
        result = (options === null || options === void 0 ? void 0 : options.preserveKeys) ? Object.assign({}, obj) : {};
        result[key] = value;
    }
    return result;
}
/**
 * Filter out all MISSING values from the object in-place
 *
 * @param obj The object to filter
 */
function filterMissing(obj) {
    if (obj instanceof Array) {
        for (let i = obj.length - 1; i >= 0; i--) {
            if (obj[i] === MISSING) {
                obj.splice(i, 1);
            }
            else {
                filterMissing(obj[i]);
            }
        }
    }
    else if (esm_util_isObject(obj)) {
        for (const k in obj) {
            if (util_has(obj, k)) {
                filterMissing(obj[k]);
            }
        }
    }
}
const NUMBER_RE = /^\d+$/;
/**
 * Walk the object graph and execute the given transform function
 *
 * @param  {Object|Array} obj   The object to traverse.
 * @param  {String} selector    The selector to navigate.
 * @param  {Callback} fn Callback to execute for value at the end the traversal.
 * @param  {WalkOptions} options The opetions to use for the function.
 * @return {*}
 */
function walk(obj, selector, fn, options) {
    const names = selector.split(".");
    const key = names[0];
    const next = names.slice(1).join(".");
    if (names.length === 1) {
        if (esm_util_isObject(obj) || (util_isArray(obj) && NUMBER_RE.test(key))) {
            fn(obj, key);
        }
    }
    else {
        // force the rest of the graph while traversing
        if ((options === null || options === void 0 ? void 0 : options.buildGraph) && util_isNil(obj[key])) {
            obj[key] = {};
        }
        // get the next item
        const item = obj[key];
        // nothing more to do
        if (!item)
            return;
        // we peek to see if next key is an array index.
        const isNextArrayIndex = !!(names.length > 1 && NUMBER_RE.test(names[1]));
        // if we have an array value but the next key is not an index and the 'descendArray' option is set,
        // we walk each item in the array separately. This allows for handling traversing keys for objects
        // nested within an array.
        //
        // Eg: Given { array: [ {k:1}, {k:2}, {k:3} ] }
        //  - individual objecs can be traversed with "array.k"
        //  - a specific object can be traversed with "array.1"
        if (item instanceof Array && (options === null || options === void 0 ? void 0 : options.descendArray) && !isNextArrayIndex) {
            item.forEach(((e) => walk(e, next, fn, options)));
        }
        else {
            walk(item, next, fn, options);
        }
    }
}
/**
 * Set the value of the given object field
 *
 * @param obj {Object|Array} the object context
 * @param selector {String} path to field
 * @param value {*} the value to set. if it is function, it is invoked with the old value and must return the new value.
 */
function util_setValue(obj, selector, value) {
    walk(obj, selector, ((item, key) => {
        item[key] = util_isFunction(value) ? value(item[key]) : value;
    }), { buildGraph: true });
}
/**
 * Removes an element from the container.
 * If the selector resolves to an array and the leaf is a non-numeric key,
 * the remove operation will be performed on objects of the array.
 *
 * @param obj {ArrayOrObject} object or array
 * @param selector {String} dot separated path to element to remove
 */
function util_removeValue(obj, selector, options) {
    walk(obj, selector, ((item, key) => {
        if (item instanceof Array) {
            if (/^\d+$/.test(key)) {
                item.splice(parseInt(key), 1);
            }
            else if (options && options.descendArray) {
                for (const elem of item) {
                    if (esm_util_isObject(elem)) {
                        delete elem[key];
                    }
                }
            }
        }
        else if (esm_util_isObject(item)) {
            delete item[key];
        }
    }), options);
}
const OPERATOR_NAME_PATTERN = /^\$[a-zA-Z0-9_]+$/;
/**
 * Check whether the given name passes for an operator. We assume AnyVal field name starting with '$' is an operator.
 * This is cheap and safe to do since keys beginning with '$' should be reserved for internal use.
 * @param {String} name
 */
function util_isOperator(name) {
    return OPERATOR_NAME_PATTERN.test(name);
}
/**
 * Simplify expression for easy evaluation with query operators map
 * @param expr
 * @returns {*}
 */
function normalize(expr) {
    // normalized primitives
    if (JS_SIMPLE_TYPES.has(util_getType(expr).toLowerCase())) {
        return isRegExp(expr) ? { $regex: expr } : { $eq: expr };
    }
    // normalize object expression. using ObjectLike handles custom types
    if (isObjectLike(expr)) {
        const exprObj = expr;
        // no valid query operator found, so we do simple comparison
        if (!Object.keys(exprObj).some(util_isOperator)) {
            return { $eq: expr };
        }
        // ensure valid regex
        if (util_has(expr, "$regex")) {
            const newExpr = Object.assign({}, expr);
            newExpr["$regex"] = new RegExp(expr["$regex"], expr["$options"]);
            delete newExpr["$options"];
            return newExpr;
        }
    }
    return expr;
}
/**
 * Find the insert index for the given key in a sorted array.
 *
 * @param {*} sorted The sorted array to search
 * @param {*} item The search key
 */
function util_findInsertIndex(sorted, item) {
    // uses binary search
    let lo = 0;
    let hi = sorted.length - 1;
    while (lo <= hi) {
        const mid = Math.round(lo + (hi - lo) / 2);
        if (util_compare(item, sorted[mid]) < 0) {
            hi = mid - 1;
        }
        else if (util_compare(item, sorted[mid]) > 0) {
            lo = mid + 1;
        }
        else {
            return mid;
        }
    }
    return lo;
}

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/core.js

/**
 * This controls how input and output documents are processed to meet different application needs.
 * Each mode has different trade offs for; immutability, reference sharing, and performance.
 */
var core_ProcessingMode;
(function (ProcessingMode) {
    /**
     * Clone inputs prior to processing, and the outputs if some objects graphs may be shared.
     * Use this option to keep input collection immutable and to get distinct output objects.
     *
     * Note: This option is expensive and reduces performance.
     */
    ProcessingMode["CLONE_ALL"] = "CLONE_ALL";
    /**
     * Clones inputs prior to processing.
     * This option will return output objects with shared graphs in their path if specific operators are used.
     * Use this option to keep the input collection immutable.
     *
     */
    ProcessingMode["CLONE_INPUT"] = "CLONE_INPUT";
    /**
     * Clones the output to return distinct objects with no shared paths.
     * This option modifies the input collection and during processing.
     */
    ProcessingMode["CLONE_OUTPUT"] = "CLONE_OUTPUT";
    /**
     * Turn off cloning and modifies the input collection as needed.
     * This option will also return output objects with shared paths in their graph when specific operators are used.
     * This option provides the greatest speedup for the biggest tradeoff.
     * When using the aggregation pipeline, you can use the "$out" operator to collect immutable intermediate results.
     *
     * @default
     */
    ProcessingMode["CLONE_OFF"] = "CLONE_OFF";
})(core_ProcessingMode || (core_ProcessingMode = {}));
/** Custom type to facilitate type checking for global options */
class core_ComputeOptions {
    constructor(_opts, 
    /** Reference to the root object when processing subgraphs of the object. */
    _root, _local, 
    /** The current time in milliseconds. Remains the same throughout all stages of the aggregation pipeline. */
    timestamp = Date.now()) {
        this._opts = _opts;
        this._root = _root;
        this._local = _local;
        this.timestamp = timestamp;
        this.update(_root, _local);
    }
    /**
     * Initialize new ComputeOptions.
     *
     * @param options
     * @param root
     * @param local
     * @returns {ComputeOptions}
     */
    static init(options, root, local) {
        return options instanceof core_ComputeOptions
            ? new core_ComputeOptions(options._opts, util_isNil(options.root) ? root : options.root, Object.assign({}, options.local, local))
            : new core_ComputeOptions(options, root, local);
    }
    /** Updates the internal mutable state. */
    update(root, local) {
        var _a;
        // NOTE: this is done for efficiency to avoid creating too many intermediate options objects.
        this._root = root;
        this._local = local
            ? Object.assign({}, local, {
                variables: Object.assign({}, (_a = this._local) === null || _a === void 0 ? void 0 : _a.variables, local === null || local === void 0 ? void 0 : local.variables)
            })
            : local;
        return this;
    }
    getOptions() {
        return Object.freeze(Object.assign(Object.assign({}, this._opts), { context: Context.from(this._opts.context) }));
    }
    get root() {
        return this._root;
    }
    get local() {
        return this._local;
    }
    get idKey() {
        return this._opts.idKey;
    }
    get collation() {
        var _a;
        return (_a = this._opts) === null || _a === void 0 ? void 0 : _a.collation;
    }
    get processingMode() {
        var _a;
        return ((_a = this._opts) === null || _a === void 0 ? void 0 : _a.processingMode) || core_ProcessingMode.CLONE_OFF;
    }
    get useStrictMode() {
        var _a;
        return (_a = this._opts) === null || _a === void 0 ? void 0 : _a.useStrictMode;
    }
    get scriptEnabled() {
        var _a;
        return (_a = this._opts) === null || _a === void 0 ? void 0 : _a.scriptEnabled;
    }
    get useGlobalContext() {
        var _a;
        return (_a = this._opts) === null || _a === void 0 ? void 0 : _a.useGlobalContext;
    }
    get hashFunction() {
        var _a;
        return (_a = this._opts) === null || _a === void 0 ? void 0 : _a.hashFunction;
    }
    get collectionResolver() {
        var _a;
        return (_a = this._opts) === null || _a === void 0 ? void 0 : _a.collectionResolver;
    }
    get jsonSchemaValidator() {
        var _a;
        return (_a = this._opts) === null || _a === void 0 ? void 0 : _a.jsonSchemaValidator;
    }
    get variables() {
        var _a;
        return (_a = this._opts) === null || _a === void 0 ? void 0 : _a.variables;
    }
    get context() {
        var _a;
        return (_a = this._opts) === null || _a === void 0 ? void 0 : _a.context;
    }
}
/**
 * Creates an Option from another where required keys are initialized.
 * @param options Options
 */
function core_initOptions(options) {
    return options instanceof core_ComputeOptions
        ? options.getOptions()
        : Object.freeze(Object.assign(Object.assign({ idKey: "_id", scriptEnabled: true, useStrictMode: true, useGlobalContext: true, processingMode: core_ProcessingMode.CLONE_OFF }, options), { context: (options === null || options === void 0 ? void 0 : options.context)
                ? Context.from(options === null || options === void 0 ? void 0 : options.context)
                : Context.init({}) }));
}
/**
 * The different groups of operators
 */
var core_OperatorType;
(function (OperatorType) {
    OperatorType["ACCUMULATOR"] = "accumulator";
    OperatorType["EXPRESSION"] = "expression";
    OperatorType["PIPELINE"] = "pipeline";
    OperatorType["PROJECTION"] = "projection";
    OperatorType["QUERY"] = "query";
    OperatorType["WINDOW"] = "window";
})(core_OperatorType || (core_OperatorType = {}));
class Context {
    constructor(ops) {
        this.operators = {
            [core_OperatorType.ACCUMULATOR]: {},
            [core_OperatorType.EXPRESSION]: {},
            [core_OperatorType.PIPELINE]: {},
            [core_OperatorType.PROJECTION]: {},
            [core_OperatorType.QUERY]: {},
            [core_OperatorType.WINDOW]: {}
        };
        for (const [type, operators] of Object.entries(ops)) {
            this.addOperators(type, operators);
        }
    }
    static init(ops = {}) {
        return new Context(ops);
    }
    static from(ctx) {
        return new Context(ctx.operators);
    }
    addOperators(type, ops) {
        for (const [name, fn] of Object.entries(ops)) {
            if (!this.getOperator(type, name)) {
                this.operators[type][name] = fn;
            }
        }
        return this;
    }
    // register
    addAccumulatorOps(ops) {
        return this.addOperators(core_OperatorType.ACCUMULATOR, ops);
    }
    addExpressionOps(ops) {
        return this.addOperators(core_OperatorType.EXPRESSION, ops);
    }
    addQueryOps(ops) {
        return this.addOperators(core_OperatorType.QUERY, ops);
    }
    addPipelineOps(ops) {
        return this.addOperators(core_OperatorType.PIPELINE, ops);
    }
    addProjectionOps(ops) {
        return this.addOperators(core_OperatorType.PROJECTION, ops);
    }
    addWindowOps(ops) {
        return this.addOperators(core_OperatorType.WINDOW, ops);
    }
    // getters
    getOperator(type, name) {
        return type in this.operators ? this.operators[type][name] || null : null;
    }
}
// global context
const GLOBAL_CONTEXT = Context.init();
/**
 * Register fully specified operators for the given operator class.
 *
 * @param type The operator type
 * @param operators Map of the operators
 */
function useOperators(type, operators) {
    for (const [name, fn] of Object.entries(operators)) {
        util_assert(util_isFunction(fn) && util_isOperator(name), `'${name}' is not a valid operator`);
        const currentFn = core_getOperator(type, name, null);
        util_assert(!currentFn || fn === currentFn, `${name} already exists for '${type}' operators. Cannot change operator function once registered.`);
    }
    // toss the operator salad :)
    switch (type) {
        case core_OperatorType.ACCUMULATOR:
            GLOBAL_CONTEXT.addAccumulatorOps(operators);
            break;
        case core_OperatorType.EXPRESSION:
            GLOBAL_CONTEXT.addExpressionOps(operators);
            break;
        case core_OperatorType.PIPELINE:
            GLOBAL_CONTEXT.addPipelineOps(operators);
            break;
        case core_OperatorType.PROJECTION:
            GLOBAL_CONTEXT.addProjectionOps(operators);
            break;
        case core_OperatorType.QUERY:
            GLOBAL_CONTEXT.addQueryOps(operators);
            break;
        case core_OperatorType.WINDOW:
            GLOBAL_CONTEXT.addWindowOps(operators);
            break;
    }
}
/**
 * Overrides the current global context with this new one.
 *
 * @param context The new context to override the global one with.
 */
// export const setGlobalContext = (context: Context): void => {
//   GLOBAL_CONTEXT = context;
// };
/**
 * Returns the operator function or undefined if it is not found
 * @param type Type of operator
 * @param operator Name of the operator
 */
function core_getOperator(type, operator, options) {
    const { context: ctx, useGlobalContext: fallback } = options || {};
    const fn = ctx ? ctx.getOperator(type, operator) : null;
    return !fn && fallback ? GLOBAL_CONTEXT.getOperator(type, operator) : fn;
}
/* eslint-disable unused-imports/no-unused-vars-ts */
/**
 * Implementation of system variables
 * @type {Object}
 */
const systemVariables = {
    $$ROOT(_obj, _expr, options) {
        return options.root;
    },
    $$CURRENT(obj, _expr, _options) {
        return obj;
    },
    $$REMOVE(_obj, _expr, _options) {
        return undefined;
    },
    $$NOW(_obj, _expr, options) {
        return new Date(options.timestamp);
    }
};
/**
 * Implementation of $redact variables
 *
 * Each function accepts 3 arguments (obj, expr, options)
 *
 * @type {Object}
 */
const redactVariables = {
    $$KEEP(obj, _expr, _options) {
        return obj;
    },
    $$PRUNE(_obj, _expr, _options) {
        return undefined;
    },
    $$DESCEND(obj, expr, options) {
        // traverse nested documents iff there is a $cond
        if (!util_has(expr, "$cond"))
            return obj;
        let result;
        for (const [key, current] of Object.entries(obj)) {
            if (isObjectLike(current)) {
                if (current instanceof Array) {
                    const array = [];
                    for (let elem of current) {
                        if (esm_util_isObject(elem)) {
                            elem = core_redact(elem, expr, options.update(elem));
                        }
                        if (!util_isNil(elem)) {
                            array.push(elem);
                        }
                    }
                    result = array;
                }
                else {
                    result = core_redact(current, expr, options.update(current));
                }
                if (util_isNil(result)) {
                    delete obj[key]; // pruned result
                }
                else {
                    obj[key] = result;
                }
            }
        }
        return obj;
    }
};
/* eslint-enable unused-imports/no-unused-vars-ts */
/**
 * Computes the value of the expression on the object for the given operator
 *
 * @param obj the current object from the collection
 * @param expr the expression for the given field
 * @param operator the operator to resolve the field with
 * @param options {Object} extra options
 * @returns {*}
 */
function core_computeValue(obj, expr, operator, options) {
    var _a;
    // ensure valid options exist on first invocation
    const copts = core_ComputeOptions.init(options, obj);
    operator = operator || "";
    if (util_isOperator(operator)) {
        // if the field of the object is a valid operator
        const callExpression = core_getOperator(core_OperatorType.EXPRESSION, operator, options);
        if (callExpression)
            return callExpression(obj, expr, copts);
        // we also handle $group accumulator operators
        const callAccumulator = core_getOperator(core_OperatorType.ACCUMULATOR, operator, options);
        if (callAccumulator) {
            // if object is not an array, first try to compute using the expression
            if (!(obj instanceof Array)) {
                obj = core_computeValue(obj, expr, null, copts);
                expr = null;
            }
            // validate that we have an array
            util_assert(obj instanceof Array, `'${operator}' target must be an array.`);
            // for accumulators, we use the global options since the root is specific to each element within array.
            return callAccumulator(obj, expr, 
            // reset the root object for accumulators.
            copts.update(null, copts.local));
        }
        // operator was not found
        throw new Error(`operator '${operator}' is not registered`);
    }
    // if expr is a string and begins with "$$", then we have a variable.
    //  this can be one of; redact variable, system variable, user-defined variable.
    //  we check and process them in that order.
    //
    // if expr begins only a single "$", then it is a path to a field on the object.
    if (util_isString(expr) && expr.length > 0 && expr[0] === "$") {
        // we return redact variables as literals
        if (util_has(redactVariables, expr)) {
            return expr;
        }
        // default to root for resolving path.
        let context = copts.root;
        // handle selectors with explicit prefix
        const arr = expr.split(".");
        if (util_has(systemVariables, arr[0])) {
            // set 'root' only the first time it is required to be used for all subsequent calls
            // if it already available on the options, it will be used
            context = systemVariables[arr[0]](obj, null, copts);
            expr = expr.slice(arr[0].length + 1); //  +1 for '.'
        }
        else if (arr[0].slice(0, 2) === "$$") {
            // handle user-defined variables
            context = Object.assign({}, copts.variables, // global vars
            // current item is added before local variables because the binding may be changed.
            { this: obj }, (_a = copts.local) === null || _a === void 0 ? void 0 : _a.variables // local vars
            );
            const prefix = arr[0].slice(2);
            util_assert(util_has(context, prefix), `Use of undefined variable: ${prefix}`);
            expr = expr.slice(2);
        }
        else {
            // 'expr' is a path to a field on the object.
            expr = expr.slice(1);
        }
        if (expr === "")
            return context;
        return util_resolve(context, expr);
    }
    // check and return value if already in a resolved state
    if (util_isArray(expr)) {
        return expr.map((item) => core_computeValue(obj, item, null, copts));
    }
    else if (esm_util_isObject(expr)) {
        const result = {};
        for (const [key, val] of Object.entries(expr)) {
            result[key] = core_computeValue(obj, val, key, copts);
            // must run ONLY one aggregate operator per expression
            // if so, return result of the computed value
            if ([core_OperatorType.EXPRESSION, core_OperatorType.ACCUMULATOR].some(t => !!core_getOperator(t, key, options))) {
                // there should be only one operator
                util_assert(Object.keys(expr).length === 1, "Invalid aggregation expression '" + JSON.stringify(expr) + "'");
                return result[key];
            }
        }
        return result;
    }
    return expr;
}
/**
 * Redact an object
 * @param  {Object} obj The object to redact
 * @param  {*} expr The redact expression
 * @param  {*} options  Options for value
 * @return {*} returns the result of the redacted object
 */
function core_redact(obj, expr, options) {
    const result = core_computeValue(obj, expr, null, options);
    return util_has(redactVariables, result)
        ? redactVariables[result](obj, expr, options)
        : result;
}

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/lazy.js
/**
 * Returns an iterator
 * @param {*} source An iterable source (Array, Function, Generator, or Iterator)
 */
function lazy_Lazy(source) {
    return source instanceof lazy_Iterator ? source : new lazy_Iterator(source);
}
function lazy_compose(...iterators) {
    let index = 0;
    return lazy_Lazy(() => {
        while (index < iterators.length) {
            const o = iterators[index].next();
            if (!o.done)
                return o;
            index++;
        }
        return { done: true };
    });
}
/**
 * Checks whether the given object is compatible with a generator i.e Object{next:Function}
 * @param {*} o An object
 */
function isGenerator(o) {
    return (!!o && typeof o === "object" && (o === null || o === void 0 ? void 0 : o.next) instanceof Function);
}
function dropItem(array, i) {
    const rest = array.slice(i + 1);
    array.splice(i);
    Array.prototype.push.apply(array, rest);
}
// stop iteration error
const DONE = new Error();
// Lazy function actions
var Action;
(function (Action) {
    Action[Action["MAP"] = 0] = "MAP";
    Action[Action["FILTER"] = 1] = "FILTER";
    Action[Action["TAKE"] = 2] = "TAKE";
    Action[Action["DROP"] = 3] = "DROP";
})(Action || (Action = {}));
function createCallback(nextFn, iteratees, buffer) {
    let done = false;
    let index = -1;
    let bufferIndex = 0; // index for the buffer
    return function (storeResult) {
        // special hack to collect all values into buffer
        try {
            outer: while (!done) {
                let o = nextFn();
                index++;
                let i = -1;
                const size = iteratees.length;
                let innerDone = false;
                while (++i < size) {
                    const r = iteratees[i];
                    switch (r.action) {
                        case Action.MAP:
                            o = r.func(o, index);
                            break;
                        case Action.FILTER:
                            if (!r.func(o, index))
                                continue outer;
                            break;
                        case Action.TAKE:
                            --r.count;
                            if (!r.count)
                                innerDone = true;
                            break;
                        case Action.DROP:
                            --r.count;
                            if (!r.count)
                                dropItem(iteratees, i);
                            continue outer;
                        default:
                            break outer;
                    }
                }
                done = innerDone;
                if (storeResult) {
                    buffer[bufferIndex++] = o;
                }
                else {
                    return { value: o, done: false };
                }
            }
        }
        catch (e) {
            if (e !== DONE)
                throw e;
        }
        done = true;
        return { done };
    };
}
/**
 * A lazy collection iterator yields a single value at a time upon request.
 */
class lazy_Iterator {
    /**
     * @param {*} source An iterable object or function.
     *    Array - return one element per cycle
     *    Object{next:Function} - call next() for the next value (this also handles generator functions)
     *    Function - call to return the next value
     * @param {Function} fn An optional transformation function
     */
    constructor(source) {
        this.iteratees = [];
        this.yieldedValues = [];
        this.isDone = false;
        let nextVal;
        if (source instanceof Function) {
            // make iterable
            source = { next: source };
        }
        if (isGenerator(source)) {
            const src = source;
            nextVal = () => {
                const o = src.next();
                if (o.done)
                    throw DONE;
                return o.value;
            };
        }
        else if (source instanceof Array) {
            const data = source;
            const size = data.length;
            let index = 0;
            nextVal = () => {
                if (index < size)
                    return data[index++];
                throw DONE;
            };
        }
        else if (!(source instanceof Function)) {
            throw new Error(`Lazy must be initialized with an array, generator, or function.`);
        }
        // create next function
        this.getNext = createCallback(nextVal, this.iteratees, this.yieldedValues);
    }
    /**
     * Add an iteratee to this lazy sequence
     */
    push(action, value) {
        if (typeof value === "function") {
            this.iteratees.push({ action, func: value });
        }
        else if (typeof value === "number") {
            this.iteratees.push({ action, count: value });
        }
        return this;
    }
    next() {
        return this.getNext();
    }
    // Iteratees methods
    /**
     * Transform each item in the sequence to a new value
     * @param {Function} f
     */
    map(f) {
        return this.push(Action.MAP, f);
    }
    /**
     * Select only items matching the given predicate
     * @param {Function} pred
     */
    filter(predicate) {
        return this.push(Action.FILTER, predicate);
    }
    /**
     * Take given numbe for values from sequence
     * @param {Number} n A number greater than 0
     */
    take(n) {
        return n > 0 ? this.push(Action.TAKE, n) : this;
    }
    /**
     * Drop a number of values from the sequence
     * @param {Number} n Number of items to drop greater than 0
     */
    drop(n) {
        return n > 0 ? this.push(Action.DROP, n) : this;
    }
    // Transformations
    /**
     * Returns a new lazy object with results of the transformation
     * The entire sequence is realized.
     *
     * @param {Callback<Source, RawArray>} fn Tranform function of type (Array) => (Any)
     */
    transform(fn) {
        const self = this;
        let iter;
        return lazy_Lazy(() => {
            if (!iter) {
                iter = lazy_Lazy(fn(self.value()));
            }
            return iter.next();
        });
    }
    // Terminal methods
    /**
     * Returns the fully realized values of the iterators.
     * The return value will be an array unless `lazy.first()` was used.
     * The realized values are cached for subsequent calls.
     */
    value() {
        if (!this.isDone) {
            this.isDone = this.getNext(true).done;
        }
        return this.yieldedValues;
    }
    /**
     * Execute the funcion for each value. Will stop when an execution returns false.
     * @param {Function} f
     * @returns {Boolean} false iff `f` return false for AnyVal execution, otherwise true
     */
    each(f) {
        for (;;) {
            const o = this.next();
            if (o.done)
                break;
            if (f(o.value) === false)
                return false;
        }
        return true;
    }
    /**
     * Returns the reduction of sequence according the reducing function
     *
     * @param {*} f a reducing function
     * @param {*} initialValue
     */
    reduce(f, initialValue) {
        let o = this.next();
        if (initialValue === undefined && !o.done) {
            initialValue = o.value;
            o = this.next();
        }
        while (!o.done) {
            initialValue = f(initialValue, o.value);
            o = this.next();
        }
        return initialValue;
    }
    /**
     * Returns the number of matched items in the sequence
     */
    size() {
        return this.reduce(((acc, _) => ++acc), 0);
    }
    [Symbol.iterator]() {
        /* eslint-disable @typescript-eslint/no-unsafe-return */
        return this;
    }
}

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/aggregator.js



/**
 * Provides functionality for the mongoDB aggregation pipeline
 *
 * @param pipeline an Array of pipeline operators
 * @param options An optional Options to pass the aggregator
 * @constructor
 */
class aggregator_Aggregator {
    constructor(pipeline, options) {
        this.pipeline = pipeline;
        this.options = core_initOptions(options);
    }
    /**
     * Returns an `Lazy` iterator for processing results of pipeline
     *
     * @param {*} collection An array or iterator object
     * @returns {Iterator} an iterator object
     */
    stream(collection) {
        let iterator = lazy_Lazy(collection);
        const mode = this.options.processingMode;
        if (mode == core_ProcessingMode.CLONE_ALL ||
            mode == core_ProcessingMode.CLONE_INPUT) {
            iterator.map(util_cloneDeep);
        }
        const pipelineOperators = new Array();
        if (!util_isEmpty(this.pipeline)) {
            // run aggregation pipeline
            for (const operator of this.pipeline) {
                const operatorKeys = Object.keys(operator);
                const opName = operatorKeys[0];
                const call = core_getOperator(core_OperatorType.PIPELINE, opName, this.options);
                util_assert(operatorKeys.length === 1 && !!call, `invalid pipeline operator ${opName}`);
                pipelineOperators.push(opName);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                iterator = call(iterator, operator[opName], this.options);
            }
        }
        // operators that may share object graphs of inputs.
        // we only need to clone the output for these since the objects will already be distinct for other operators.
        if (mode == core_ProcessingMode.CLONE_OUTPUT ||
            (mode == core_ProcessingMode.CLONE_ALL &&
                !!util_intersection([["$group", "$unwind"], pipelineOperators]).length)) {
            iterator.map(util_cloneDeep);
        }
        return iterator;
    }
    /**
     * Return the results of the aggregation as an array.
     *
     * @param {*} collection
     * @param {*} query
     */
    run(collection) {
        return this.stream(collection).value();
    }
}

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/cursor.js



/**
 * Cursor to iterate and perform filtering on matched objects.
 * This object must not be used directly. A cursor may be obtaine from calling `find()` on an instance of `Query`.
 *
 * @param collection The input source of the collection
 * @param predicate A predicate function to test documents
 * @param projection A projection criteria
 * @param options Options
 * @constructor
 */
class Cursor {
    constructor(source, predicate, projection, options) {
        this.source = source;
        this.predicate = predicate;
        this.projection = projection;
        this.options = options;
        this.operators = [];
        this.result = null;
        this.buffer = [];
    }
    /** Returns the iterator from running the query */
    fetch() {
        if (this.result)
            return this.result;
        // add projection operator
        if (esm_util_isObject(this.projection)) {
            this.operators.push({ $project: this.projection });
        }
        // filter collection
        this.result = lazy_Lazy(this.source).filter(this.predicate);
        if (this.operators.length > 0) {
            this.result = new aggregator_Aggregator(this.operators, this.options).stream(this.result);
        }
        return this.result;
    }
    /** Returns an iterator with the buffered data included */
    fetchAll() {
        const buffered = lazy_Lazy([...this.buffer]);
        this.buffer = [];
        return lazy_compose(buffered, this.fetch());
    }
    /**
     * Return remaining objects in the cursor as an array. This method exhausts the cursor
     * @returns {Array}
     */
    all() {
        return this.fetchAll().value();
    }
    /**
     * Returns the number of objects return in the cursor. This method exhausts the cursor
     * @returns {Number}
     */
    count() {
        return this.all().length;
    }
    /**
     * Returns a cursor that begins returning results only after passing or skipping a number of documents.
     * @param {Number} n the number of results to skip.
     * @return {Cursor} Returns the cursor, so you can chain this call.
     */
    skip(n) {
        this.operators.push({ $skip: n });
        return this;
    }
    /**
     * Constrains the size of a cursor's result set.
     * @param {Number} n the number of results to limit to.
     * @return {Cursor} Returns the cursor, so you can chain this call.
     */
    limit(n) {
        this.operators.push({ $limit: n });
        return this;
    }
    /**
     * Returns results ordered according to a sort specification.
     * @param {Object} modifier an object of key and values specifying the sort order. 1 for ascending and -1 for descending
     * @return {Cursor} Returns the cursor, so you can chain this call.
     */
    sort(modifier) {
        this.operators.push({ $sort: modifier });
        return this;
    }
    /**
     * Specifies the collation for the cursor returned by the `mingo.Query.find`
     * @param {*} spec
     */
    collation(spec) {
        this.options = Object.assign(Object.assign({}, this.options), { collation: spec });
        return this;
    }
    /**
     * Returns the next document in a cursor.
     * @returns {Object | Boolean}
     */
    next() {
        // yield value obtains in hasNext()
        if (this.buffer.length > 0) {
            return this.buffer.pop();
        }
        const o = this.fetch().next();
        if (o.done)
            return;
        return o.value;
    }
    /**
     * Returns true if the cursor has documents and can be iterated.
     * @returns {boolean}
     */
    hasNext() {
        // there is a value in the buffer
        if (this.buffer.length > 0)
            return true;
        const o = this.fetch().next();
        if (o.done)
            return false;
        this.buffer.push(o.value);
        return true;
    }
    /**
     * Applies a function to each document in a cursor and collects the return values in an array.
     * @param fn
     * @returns {Array}
     */
    map(fn) {
        return this.all().map(fn);
    }
    /**
     * Applies a JavaScript function for every document in a cursor.
     * @param fn
     */
    forEach(fn) {
        this.all().forEach(fn);
    }
    [Symbol.iterator]() {
        return this.fetchAll();
    }
}

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/query.js



/**
 * An object used to filter input documents
 *
 * @param {Object} condition The condition for constructing predicates
 * @param {Options} options Options for use by operators
 * @constructor
 */
class query_Query {
    constructor(condition, options) {
        this.condition = condition;
        this.options = core_initOptions(options);
        this.compiled = [];
        this.compile();
    }
    compile() {
        util_assert(esm_util_isObject(this.condition), `query criteria must be an object: ${JSON.stringify(this.condition)}`);
        const whereOperator = {};
        for (const [field, expr] of Object.entries(this.condition)) {
            if ("$where" === field) {
                Object.assign(whereOperator, { field: field, expr: expr });
            }
            else if (util_inArray(["$and", "$or", "$nor", "$expr", "$jsonSchema"], field)) {
                this.processOperator(field, field, expr);
            }
            else {
                // normalize expression
                util_assert(!util_isOperator(field), `unknown top level operator: ${field}`);
                for (const [operator, val] of Object.entries(normalize(expr))) {
                    this.processOperator(field, operator, val);
                }
            }
            if (whereOperator.field) {
                this.processOperator(whereOperator.field, whereOperator.field, whereOperator.expr);
            }
        }
    }
    processOperator(field, operator, value) {
        const call = core_getOperator(core_OperatorType.QUERY, operator, this.options);
        if (!call) {
            throw new Error(`unknown operator ${operator}`);
        }
        const fn = call(field, value, this.options);
        this.compiled.push(fn);
    }
    /**
     * Checks if the object passes the query criteria. Returns true if so, false otherwise.
     *
     * @param obj The object to test
     * @returns {boolean} True or false
     */
    test(obj) {
        for (let i = 0, len = this.compiled.length; i < len; i++) {
            if (!this.compiled[i](obj)) {
                return false;
            }
        }
        return true;
    }
    /**
     * Returns a cursor to select matching documents from the input source.
     *
     * @param source A source providing a sequence of documents
     * @param projection An optional projection criteria
     * @returns {Cursor} A Cursor for iterating over the results
     */
    find(collection, projection) {
        return new Cursor(collection, ((x) => this.test(x)), projection || {}, this.options);
    }
    /**
     * Remove matched documents from the collection returning the remainder
     *
     * @param collection An array of documents
     * @returns {Array} A new array with matching elements removed
     */
    remove(collection) {
        return collection.reduce((acc, obj) => {
            if (!this.test(obj))
                acc.push(obj);
            return acc;
        }, []);
    }
}

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/addFields.js


/**
 * Adds new fields to documents.
 * Outputs documents that contain all existing fields from the input documents and newly added fields.
 *
 * @param {Iterator} collection
 * @param {Object} expr
 * @param {Options} options
 */
const addFields_$addFields = (collection, expr, options) => {
    const newFields = Object.keys(expr);
    if (newFields.length === 0)
        return collection;
    return collection.map(((obj) => {
        const newObj = Object.assign({}, obj);
        for (const field of newFields) {
            const newValue = computeValue(obj, expr[field], null, options);
            if (newValue !== undefined) {
                setValue(newObj, field, newValue);
            }
            else {
                removeValue(newObj, field);
            }
        }
        return newObj;
    }));
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/bucket.js



/**
 * Categorizes incoming documents into groups, called buckets, based on a specified expression and bucket boundaries.
 * https://docs.mongodb.com/manual/reference/operator/aggregation/bucket/
 *
 * @param {*} collection
 * @param {*} expr
 * @param {Options} opt Pipeline options
 */
const $bucket = (collection, expr, options) => {
    const boundaries = [...expr.boundaries];
    const defaultKey = expr.default;
    const lower = boundaries[0]; // inclusive
    const upper = boundaries[boundaries.length - 1]; // exclusive
    const outputExpr = expr.output || { count: { $sum: 1 } };
    assert(expr.boundaries.length > 2, "$bucket 'boundaries' expression must have at least 3 elements");
    const boundType = getType(lower);
    for (let i = 0, len = boundaries.length - 1; i < len; i++) {
        assert(boundType === getType(boundaries[i + 1]), "$bucket 'boundaries' must all be of the same type");
        assert(compare(boundaries[i], boundaries[i + 1]) < 0, "$bucket 'boundaries' must be sorted in ascending order");
    }
    !isNil(defaultKey) &&
        getType(expr.default) === getType(lower) &&
        assert(compare(expr.default, upper) >= 0 || compare(expr.default, lower) < 0, "$bucket 'default' expression must be out of boundaries range");
    const grouped = {};
    for (const k of boundaries) {
        grouped[k] = [];
    }
    // add default key if provided
    if (!isNil(defaultKey))
        grouped[defaultKey] = [];
    let iterator;
    return Lazy(() => {
        if (!iterator) {
            collection.each(((obj) => {
                const key = computeValue(obj, expr.groupBy, null, options);
                if (isNil(key) || compare(key, lower) < 0 || compare(key, upper) >= 0) {
                    assert(!isNil(defaultKey), "$bucket require a default for out of range values");
                    grouped[defaultKey].push(obj);
                }
                else {
                    assert(compare(key, lower) >= 0 && compare(key, upper) < 0, "$bucket 'groupBy' expression must resolve to a value in range of boundaries");
                    const index = findInsertIndex(boundaries, key);
                    const boundKey = boundaries[Math.max(0, index - 1)];
                    grouped[boundKey].push(obj);
                }
            }));
            // upper bound is exclusive so we remove it
            boundaries.pop();
            if (!isNil(defaultKey))
                boundaries.push(defaultKey);
            iterator = Lazy(boundaries).map(((key) => {
                const acc = computeValue(grouped[key], outputExpr, null, options);
                return into(acc, { _id: key });
            }));
        }
        return iterator.next();
    });
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/bucketAuto.js


const ID_KEY = "_id";
/**
 * Categorizes incoming documents into a specific number of groups, called buckets,
 * based on a specified expression. Bucket boundaries are automatically determined
 * in an attempt to evenly distribute the documents into the specified number of buckets.
 * https://docs.mongodb.com/manual/reference/operator/aggregation/bucketAuto/
 *
 * @param {*} collection
 * @param {*} expr
 * @param {*} options
 */
const $bucketAuto = (collection, expr, options) => {
    const outputExpr = expr.output || { count: { $sum: 1 } };
    const groupByExpr = expr.groupBy;
    const bucketCount = expr.buckets;
    assert(bucketCount > 0, `The $bucketAuto 'buckets' field must be greater than 0, but found: ${bucketCount}`);
    return collection.transform((coll) => {
        const approxBucketSize = Math.max(1, Math.round(coll.length / bucketCount));
        const computeValueOptimized = memoize(computeValue, options === null || options === void 0 ? void 0 : options.hashFunction);
        const grouped = new Map();
        const remaining = [];
        const sorted = sortBy(coll, o => {
            const key = computeValueOptimized(o, groupByExpr, null, options);
            if (isNil(key)) {
                remaining.push(o);
            }
            else {
                if (!grouped.has(key))
                    grouped.set(key, []);
                grouped.get(key).push(o);
            }
            return key;
        });
        const result = [];
        let index = 0; // counter for sorted collection
        for (let i = 0, len = sorted.length; i < bucketCount && index < len; i++) {
            const boundaries = {};
            const bucketItems = [];
            for (let j = 0; j < approxBucketSize && index < len; j++) {
                let key = computeValueOptimized(sorted[index], groupByExpr, null, options);
                if (isNil(key))
                    key = null;
                // populate current bucket with all values for current key
                into(bucketItems, isNil(key) ? remaining : grouped.get(key));
                // increase sort index by number of items added
                index += isNil(key) ? remaining.length : grouped.get(key).length;
                // set the min key boundary if not already present
                if (!has(boundaries, "min"))
                    boundaries.min = key;
                if (result.length > 0) {
                    const lastBucket = result[result.length - 1];
                    lastBucket[ID_KEY].max = boundaries.min;
                }
            }
            // if is last bucket add remaining items
            if (i == bucketCount - 1) {
                into(bucketItems, sorted.slice(index));
            }
            const values = computeValue(bucketItems, outputExpr, null, options);
            result.push(into(values, {
                _id: boundaries
            }));
        }
        if (result.length > 0) {
            result[result.length - 1][ID_KEY].max =
                computeValueOptimized(sorted[sorted.length - 1], groupByExpr, null, options);
        }
        return result;
    });
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/count.js


/**
 * Returns a document that contains a count of the number of documents input to the stage.
 *
 * @param {Array} collection
 * @param {String} expr
 * @param {Options} options
 * @return {Object}
 */
const $count = (collection, expr, _) => {
    assert(isString(expr) &&
        expr.trim() !== "" &&
        expr.indexOf(".") === -1 &&
        expr.trim()[0] !== "$", "Invalid expression value for $count");
    return Lazy([
        {
            [expr]: collection.size()
        }
    ]);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/facet.js


/**
 * Processes multiple aggregation pipelines within a single stage on the same set of input documents.
 * Enables the creation of multi-faceted aggregations capable of characterizing data across multiple dimensions, or facets, in a single stage.
 */
const $facet = (collection, expr, options) => {
    return collection.transform(((array) => {
        const o = {};
        for (const [k, pipeline] of Object.entries(expr)) {
            o[k] = new Aggregator(pipeline, Object.assign(Object.assign({}, options), { processingMode: ProcessingMode.CLONE_INPUT })).run(array);
        }
        return [o];
    }));
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/conditional/ifNull.js
/**
 * Conditional Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#conditional-expression-operators
 */


/**
 * Evaluates an expression and returns the first non-null value.
 *
 * @param obj
 * @param expr
 * @returns {*}
 */
const ifNull_$ifNull = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    return args.find(arg => !isNil(arg));
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/accumulator.js
// Custom Aggregation Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#custom-aggregation-expression-operators


/**
 * Defines a custom accumulator function.
 *
 * @param {Array} collection The input array
 * @param {*} expr The expression for the operator
 * @param {Options} options Options
 */
const $accumulator = (collection, expr, options) => {
    var _a;
    assert(!!options && options.scriptEnabled, "$accumulator operator requires 'scriptEnabled' option to be true");
    if (collection.length == 0)
        return expr.initArgs;
    const copts = ComputeOptions.init(options);
    const initArgs = computeValue({}, expr.initArgs || [], null, copts.update(((_a = copts === null || copts === void 0 ? void 0 : copts.local) === null || _a === void 0 ? void 0 : _a.groupId) || {}));
    let state = expr.init.call(null, ...initArgs);
    for (const doc of collection) {
        // get arguments for document
        const args = computeValue(doc, expr.accumulateArgs, null, copts.update(doc));
        // update the state with each documents value
        // eslint-disable-next-line
        state = expr.accumulate.call(null, ...[state, ...args]);
    }
    return (expr.finalize ? expr.finalize.call(null, state) : state);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/push.js


/**
 * Returns an array of all values for the selected field among for each document in that group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {Array|*}
 */
const push_$push = (collection, expr, options) => {
    if (isNil(expr))
        return collection;
    const copts = ComputeOptions.init(options);
    return collection.map(obj => computeValue(obj, expr, null, copts.update(obj)));
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/addToSet.js


/**
 * Returns an array of all the unique values for the selected field among for each document in that group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
const $addToSet = (collection, expr, options) => {
    return unique($push(collection, expr, options), options === null || options === void 0 ? void 0 : options.hashFunction);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/avg.js


/**
 * Returns an average of all the values in a group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {Number}
 */
const $avg = (collection, expr, options) => {
    const data = $push(collection, expr, options).filter(isNumber);
    const sum = data.reduce((acc, n) => acc + n, 0);
    return sum / (data.length || 1);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/bottomN.js
// https://www.mongodb.com/docs/manual/reference/operator/aggregation/bottomN/#mongodb-group-grp.-bottomN



/**
 * Returns an aggregation of the bottom n elements within a group, according to the specified sort order.
 * If the group contains fewer than n elements, $bottomN returns all elements in the group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
const bottomN_$bottomN = (collection, expr, options) => {
    const copts = ComputeOptions.init(options);
    const { n, sortBy } = computeValue(copts.local.groupId, expr, null, copts);
    const result = new Aggregator([{ $sort: sortBy }], copts).run(collection);
    const m = result.length;
    const p = n;
    return $push(m <= p ? result : result.slice(m - p), expr.output, copts);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/bottom.js

/**
 * Returns the bottom element within a group according to the specified sort order.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
const $bottom = (collection, expr, options) => $bottomN(collection, Object.assign(Object.assign({}, expr), { n: 1 }), options);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/covariancePop.js


/**
 * Returns the population covariance of two numeric expressions.
 * @param  {Array} collection
 * @param  {Object} expr
 * @return {Number|null}
 */
const $covariancePop = (collection, expr, options) => covariance($push(collection, expr, options), false);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/covarianceSamp.js


/**
 * Returns the sample covariance of two numeric expressions.
 * @param  {Array} collection
 * @param  {Object} expr
 * @return {Number|null}
 */
const $covarianceSamp = (collection, expr, options) => covariance($push(collection, expr, options), true);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/first.js

/**
 * Returns the first value in a group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @returns {*}
 */
const $first = (collection, expr, options) => {
    return collection.length > 0
        ? computeValue(collection[0], expr, null, options)
        : undefined;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/firstN.js
// https://www.mongodb.com/docs/manual/reference/operator/aggregation/firstN/


/**
 * Returns an aggregation of the first n elements within a group. The elements returned are meaningful only if in a specified sort order.
 * If the group contains fewer than n elements, $firstN returns all elements in the group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
const $firstN = (collection, expr, options) => {
    var _a;
    const copts = ComputeOptions.init(options);
    const m = collection.length;
    const n = computeValue((_a = copts === null || copts === void 0 ? void 0 : copts.local) === null || _a === void 0 ? void 0 : _a.groupId, expr.n, null, copts);
    return $push(m <= n ? collection : collection.slice(0, n), expr.input, options);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/last.js

/**
 * Returns the last value in the collection.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
const $last = (collection, expr, options) => {
    return collection.length > 0
        ? computeValue(collection[collection.length - 1], expr, null, options)
        : undefined;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/lastN.js
// https://www.mongodb.com/docs/manual/reference/operator/aggregation/lastN/


/**
 * Returns an aggregation of the last n elements within a group. The elements returned are meaningful only if in a specified sort order.
 * If the group contains fewer than n elements, $lastN returns all elements in the group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
const $lastN = (collection, expr, options) => {
    var _a;
    const copts = ComputeOptions.init(options);
    const m = collection.length;
    const n = computeValue((_a = copts === null || copts === void 0 ? void 0 : copts.local) === null || _a === void 0 ? void 0 : _a.groupId, expr.n, null, copts);
    return $push(m <= n ? collection : collection.slice(m - n), expr.input, options);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/max.js


/**
 * Returns the highest value in a group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
const $max = (collection, expr, options) => {
    const nums = $push(collection, expr, options).filter(isNotNaN);
    const n = nums.reduce((acc, n) => (compare(n, acc) >= 0 ? n : acc), -Infinity);
    return n === -Infinity ? undefined : n;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/maxN.js
// https://www.mongodb.com/docs/manual/reference/operator/aggregation/maxN



/**
 * Returns an aggregation of the maxmimum value n elements within a group.
 * If the group contains fewer than n elements, $maxN returns all elements in the group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
const $maxN = (collection, expr, options) => {
    var _a;
    const copts = ComputeOptions.init(options);
    const m = collection.length;
    const n = computeValue((_a = copts === null || copts === void 0 ? void 0 : copts.local) === null || _a === void 0 ? void 0 : _a.groupId, expr.n, null, copts);
    const arr = $push(collection, expr.input, options).filter(o => !isNil(o));
    arr.sort((a, b) => -1 * compare(a, b));
    return m <= n ? arr : arr.slice(0, n);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/percentile.js


/**
 * Returns an array of scalar values that correspond to specified percentile values. Uses "approximate" method by default.
 *
 * If 'expr.method' is "approximate", we return the closest value to the computed percentile from the dataset.
 * If 'expr.method' is "exact", we return the computed percentile value as is which may not be found in the dataset.
 *
 * @param collection The collection of objects.
 * @param expr The operator expression.
 * @param options Options to use for processing.
 * @returns {Object|*}
 */
const percentile_$percentile = (collection, expr, options) => {
    // MongoDB uses the t-digest algorithm to estimate percentiles.
    // Since this library expects all data in memory we use the linear interpolation method.
    const X = $push(collection, expr.input, options).filter(isNumber).sort();
    const centiles = $push(expr.p, "$$CURRENT", options).filter(isNumber);
    const method = expr.method || "approximate";
    return centiles.map(p => {
        assert(p > 0 && p <= 1, `percentile value must be between 0 (exclusive) and 1 (inclusive): invalid '${p}'.`);
        // compute rank for the percentile
        const r = p * (X.length - 1) + 1;
        // get the integer part
        const ri = Math.floor(r);
        // return zero for NaN values when X[ri-1] is undefined.
        const result = r === ri ? X[r - 1] : X[ri - 1] + (r % 1) * (X[ri] - X[ri - 1] || 0);
        switch (method) {
            case "exact":
                return result;
            case "approximate": {
                // returns nearest value (inclusive) that is closest to the given centile.
                const i = findInsertIndex(X, result);
                // we need to adjust the selected value based on whether it falls within the percentile range.
                // e.g. for X = [10, 20], p <= 0.5 should equal 10 AND p > 0.5 should equal 20.
                return i / X.length >= p ? X[Math.max(i - 1, 0)] : X[i];
            }
        }
    });
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/median.js

/**
 * Returns the median of the dataset. The 'expr.method' defaults to "approximate" to return a median value from the dataset.
 *
 * If 'expr.method' is "approximate", we return the smallest of the middle values when dataset is even.
 * If 'expr.method' is "exact", we return the average of the middle values when dataset is even.
 * For an odd dataset, the middle value is always returned regardless of 'expr.method'.
 *
 * @param collection The collection of objects.
 * @param expr The operator expression.
 * @param options Options to use for processing.
 * @returns {Number}
 */
const $median = (collection, expr, options) => $percentile(collection, Object.assign(Object.assign({}, expr), { p: [0.5] }), options).pop();

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/object/mergeObjects.js
// Object Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#object-expression-operators


/**
 * Combines multiple documents into a single document.
 *
 * @param {*} obj The target object for this expression
 * @param {*} expr The right-hand side of the operator
 * @param {Options} options Options to use for operation
 */
const mergeObjects_$mergeObjects = (obj, expr, options) => {
    const docs = computeValue(obj, expr, null, options);
    return docs instanceof Array
        ? docs.reduce((memo, o) => into(memo, o), {})
        : {};
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/mergeObjects.js

/**
 * Combines multiple documents into a single document.
 *
 * @param {Array} collection The input array
 * @param {Object} _ The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {Array|*}
 */
const accumulator_mergeObjects_$mergeObjects = (collection, _, options) => __mergeObjects({ docs: collection }, "$docs", options);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/min.js


/**
 * Returns the lowest value in a group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} The options to use for this operator
 * @returns {*}
 */
const $min = (collection, expr, options) => {
    const nums = $push(collection, expr, options).filter(isNotNaN);
    const n = nums.reduce((acc, n) => (compare(n, acc) <= 0 ? n : acc), Infinity);
    return n === Infinity ? undefined : n;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/minN.js
// https://www.mongodb.com/docs/manual/reference/operator/aggregation/minN



/**
 * Returns an aggregation of the minimum value n elements within a group.
 * If the group contains fewer than n elements, $minN returns all elements in the group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
const $minN = (collection, expr, options) => {
    var _a;
    const copts = ComputeOptions.init(options);
    const m = collection.length;
    const n = computeValue((_a = copts === null || copts === void 0 ? void 0 : copts.local) === null || _a === void 0 ? void 0 : _a.groupId, expr.n, null, copts);
    const arr = $push(collection, expr.input, options).filter(o => !isNil(o));
    arr.sort(compare);
    return m <= n ? arr : arr.slice(0, n);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/stdDevPop.js



/**
 * Returns the population standard deviation of the input values.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @return {Number}
 */
const $stdDevPop = (collection, expr, options) => stddev($push(collection, expr, options).filter(isNumber), false);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/stdDevSamp.js



/**
 * Returns the sample standard deviation of the input values.
 * @param  {Array} collection
 * @param  {Object} expr
 * @return {Number|null}
 */
const $stdDevSamp = (collection, expr, options) => stddev($push(collection, expr, options).filter(isNumber), true);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/sum.js


/**
 * Returns the sum of all the values in a group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @returns {Number}
 */
const $sum = (collection, expr, options) => {
    if (!isArray(collection))
        return 0;
    // take a short cut if expr is number literal
    if (isNumber(expr))
        return collection.length * expr;
    const nums = $push(collection, expr, options).filter(isNumber);
    return nums.reduce((acc, n) => acc + n, 0);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/topN.js
// https://www.mongodb.com/docs/manual/reference/operator/aggregation/topN/#mongodb-group-grp.-topN



/**
 * Returns an aggregation of the top n elements within a group, according to the specified sort order.
 * If the group contains fewer than n elements, $topN returns all elements in the group.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
const topN_$topN = (collection, expr, options) => {
    const copts = ComputeOptions.init(options);
    const { n, sortBy } = computeValue(copts.local.groupId, expr, null, copts);
    const result = new Aggregator([{ $sort: sortBy }, { $limit: n }], copts).run(collection);
    return $push(result, expr.output, copts);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/top.js

/**
 * Returns the top element within a group according to the specified sort order.
 *
 * @param {Array} collection The input array
 * @param {Object} expr The right-hand side expression value of the operator
 * @param {Options} options The options to use for this operation
 * @returns {*}
 */
const $top = (collection, expr, options) => $topN(collection, Object.assign(Object.assign({}, expr), { n: 1 }), options);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/accumulator/index.js
/**
 * Group stage Accumulator Operators. https://docs.mongodb.com/manual/reference/operator/aggregation-
 */


























;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/_internal.js


const COMMON_YEAR_DAYS_OFFSET = [
    0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334
];
const LEAP_YEAR_DAYS_OFFSET = [
    0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335
];
// https://en.wikipedia.org/wiki/ISO_week_date
const p = (y) => (y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400)) % 7;
const weeks = (y) => 52 + Number(p(y) == 4 || p(y - 1) == 3);
const _internal_isLeapYear = (year) => (year & 3) == 0 && (year % 100 != 0 || year % 400 == 0);
const _internal_getDayOfYear = (d) => (_internal_isLeapYear(d.getUTCFullYear())
    ? LEAP_YEAR_DAYS_OFFSET
    : COMMON_YEAR_DAYS_OFFSET)[d.getUTCMonth()] + d.getUTCDate();
function _internal_isoWeek(d) {
    // algorithm based on https://en.wikipedia.org/wiki/ISO_week_date
    const w = Math.floor((10 + _internal_getDayOfYear(d) - (d.getUTCDay() || 7)) / 7);
    if (w < 1)
        return weeks(d.getUTCFullYear() - 1);
    if (w > weeks(d.getUTCFullYear()))
        return 1;
    return w;
}
function _internal_isoWeekYear(d) {
    return (d.getUTCFullYear() -
        Number(d.getUTCMonth() == 0 && d.getUTCDate() == 1 && d.getUTCDay() < 1));
}
const _internal_MINUTES_PER_HOUR = 60;
const MILLIS_PER_DAY = 1000 * 60 * 60 * 24;
const _internal_DURATION_IN_MILLIS = {
    week: MILLIS_PER_DAY * 7,
    day: MILLIS_PER_DAY,
    hour: 1000 * 60 * 60,
    minute: 1000 * 60,
    second: 1000,
    millisecond: 1
};
// default format if unspecified
const _internal_DATE_FORMAT = "%Y-%m-%dT%H:%M:%S.%LZ";
// Inclusive interval of date parts
const _internal_DATE_PART_INTERVAL = (/* unused pure expression or super */ null && ([
    ["year", 0, 9999],
    ["month", 1, 12],
    ["day", 1, 31],
    ["hour", 0, 23],
    ["minute", 0, 59],
    ["second", 0, 59],
    ["millisecond", 0, 999]
]));
// used for formatting dates in $dateToString operator
const _internal_DATE_SYM_TABLE = {
    "%Y": { name: "year", padding: 4, re: /([0-9]{4})/ },
    "%G": { name: "year", padding: 4, re: /([0-9]{4})/ },
    "%m": { name: "month", padding: 2, re: /(0[1-9]|1[012])/ },
    "%d": { name: "day", padding: 2, re: /(0[1-9]|[12][0-9]|3[01])/ },
    "%H": { name: "hour", padding: 2, re: /([01][0-9]|2[0-3])/ },
    "%M": { name: "minute", padding: 2, re: /([0-5][0-9])/ },
    "%S": { name: "second", padding: 2, re: /([0-5][0-9]|60)/ },
    "%L": { name: "millisecond", padding: 3, re: /([0-9]{3})/ },
    "%u": { name: "weekday", padding: 1, re: /([1-7])/ },
    "%U": { name: "week", padding: 2, re: /([1-4][0-9]?|5[0-3]?)/ },
    "%V": { name: "isoWeek", padding: 2, re: /([1-4][0-9]?|5[0-3]?)/ },
    "%z": {
        name: "timezone",
        padding: 2,
        re: /(([+-][01][0-9]|2[0-3]):?([0-5][0-9])?)/
    },
    "%Z": { name: "minuteOffset", padding: 3, re: /([+-][0-9]{3})/ }
    // "%%": "%",
};
/**
 * Parse and return the timezone string as a number
 * @param tzstr Timezone string matching '+/-hh[:][mm]'
 */
function _internal_parseTimezone(tzstr) {
    if (util_isNil(tzstr))
        return 0;
    const m = _internal_DATE_SYM_TABLE["%z"].re.exec(tzstr);
    if (!m)
        throw Error(`invalid or location-based timezone '${tzstr}' not supported`);
    const hr = parseInt(m[2]) || 0;
    const min = parseInt(m[3]) || 0;
    return (Math.abs(hr * _internal_MINUTES_PER_HOUR) + min) * (hr < 0 ? -1 : 1);
}
/**
 * Formats the timezone for output
 * @param tz A timezone object
 */
function _internal_formatTimezone(minuteOffset) {
    return ((minuteOffset < 0 ? "-" : "+") +
        _internal_padDigits(Math.abs(Math.floor(minuteOffset / _internal_MINUTES_PER_HOUR)), 2) +
        _internal_padDigits(Math.abs(minuteOffset) % _internal_MINUTES_PER_HOUR, 2));
}
/**
 * Adjust the date by the given timezone
 * @param d Date object
 * @param minuteOffset number
 */
function _internal_adjustDate(d, minuteOffset) {
    d.setUTCMinutes(d.getUTCMinutes() + minuteOffset);
}
/**
 * Computes a date expression
 * @param obj The target object
 * @param expr Any value that resolves to a valid date expression. Valid expressions include a number, Date, or Object{date: number|Date, timezone?: string}
 */
function _internal_computeDate(obj, expr, options) {
    const d = core_computeValue(obj, expr, null, options);
    if (util_isDate(d))
        return new Date(d);
    // timestamp is in seconds
    if (util_isNumber(d))
        return new Date(d * 1000);
    if (d.date) {
        const date = util_isDate(d.date) ? new Date(d.date) : new Date(d.date * 1000);
        if (d.timezone) {
            _internal_adjustDate(date, _internal_parseTimezone(d.timezone));
        }
        return date;
    }
    throw Error(`cannot convert ${expr === null || expr === void 0 ? void 0 : expr.toString()} to date`);
}
function _internal_padDigits(n, digits) {
    return (new Array(Math.max(digits - String(n).length + 1, 0)).join("0") +
        n.toString());
}
function _internal_regexQuote(s) {
    "^.-*?$".split("").forEach((c) => {
        s = s.replace(c, `\\${c}`);
    });
    return s;
}
function _internal_regexStrip(s) {
    return s.replace(/^\//, "").replace(/\/$/, "");
}

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/window/_internal.js




// millis map to diffirent time units
const MILLIS_PER_UNIT = {
    week: MILLIS_PER_DAY * 7,
    day: MILLIS_PER_DAY,
    hour: MILLIS_PER_DAY / 24,
    minute: 60000,
    second: 1000,
    millisecond: 1
};
// internal cache to store precomputed series once to avoid O(N^2) calls to over the collection
const memo = new WeakMap();
/**
 * Caches all computed values in a window sequence for reuse.
 * This is only useful for operations with unbounded documents.
 */
function _internal_withMemo(collection, expr, cacheFn, fn) {
    // no caching done for bounded inputs
    if (!isUnbounded(expr.parentExpr.output[expr.field].window)) {
        return fn(cacheFn());
    }
    // first time using collection
    if (!memo.has(collection)) {
        memo.set(collection, { [expr.field]: cacheFn() });
    }
    const data = memo.get(collection);
    // subsequent computations over the same collection.
    if (data[expr.field] === undefined) {
        data[expr.field] = cacheFn();
    }
    let failed = false;
    try {
        return fn(data[expr.field]);
    }
    catch (e) {
        failed = true;
    }
    finally {
        // cleanup on failure or last element in collection.
        if (failed || expr.documentNumber === collection.length) {
            delete data[expr.field];
            if (Object.keys(data).length === 0)
                memo.delete(collection);
        }
    }
}
/** Returns the position of a document in the $setWindowFields stage partition. */
function rank(_, collection, expr, options, dense) {
    return _internal_withMemo(collection, expr, () => {
        const sortKey = "$" + Object.keys(expr.parentExpr.sortBy)[0];
        const values = $push(collection, sortKey, options);
        const groups = groupBy(values, ((_, n) => values[n]), options.hashFunction);
        return { values, groups };
    }, input => {
        const { values, groups: partitions } = input;
        // same number of paritions as length means all sort keys are unique
        if (partitions.size == collection.length) {
            return expr.documentNumber;
        }
        const current = values[expr.documentNumber - 1];
        let i = 0;
        let offset = 0;
        // partition keys are already dense so just return the value on match
        for (const key of partitions.keys()) {
            if (isEqual(current, key)) {
                return dense ? i + 1 : offset + 1;
            }
            i++;
            offset += partitions.get(key).length;
        }
        // should be unreachable
        throw new Error("rank: invalid return value. please submit a bug report.");
    });
}

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/window/linearFill.js



/**
 * Given two points (x1, y1) and (x2, y2) and a value 'x' that lies between those two points,
 * solve for 'y' with: y = y1 + (x - x1) * ((y2 - y1)/(x2 - x1)).
 * @see https://en.wikipedia.org/wiki/Linear_interpolation
 */
const interpolate = (x1, y1, x2, y2, x) => y1 + (x - x1) * ((y2 - y1) / (x2 - x1));
/**
 * Fills null and missing fields in a window using linear interpolation based on surrounding field values.
 */
function linearFill_$linearFill(_, collection, expr, options) {
    return withMemo(collection, expr, (() => {
        const sortKey = "$" + Object.keys(expr.parentExpr.sortBy)[0];
        const points = $push(collection, [sortKey, expr.inputExpr], options).filter((([x, _]) => isNumber(+x)));
        if (points.length !== collection.length)
            return null;
        let lindex = -1;
        let rindex = 0;
        while (rindex < points.length) {
            // use sliding window over missing values and fill as we go.
            // determine nearest left value index
            while (lindex + 1 < points.length && isNumber(points[lindex + 1][1])) {
                lindex++;
                rindex = lindex;
            }
            // determine nearest right value index.
            while (rindex + 1 < points.length && !isNumber(points[rindex + 1][1])) {
                rindex++;
            }
            // we reached the end of our array. nothing more to do.
            if (rindex + 1 >= points.length)
                break;
            // otherwise, we found a number so move rindex pointer to it.
            rindex++;
            // now fill everything between lindex and rindex by their proportions to the difference.
            while (lindex + 1 < rindex) {
                points[lindex + 1][1] = interpolate(points[lindex][0], points[lindex][1], points[rindex][0], points[rindex][1], points[lindex + 1][0]);
                lindex++;
            }
            // move lindex to right
            lindex = rindex;
        }
        return points.map(([_, y]) => y);
    }), (values) => values[expr.documentNumber - 1]);
}

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/window/locf.js



/**
 * Last observation carried forward. Sets values for null and missing fields in a window to the last non-null value for the field.
 */
function locf_$locf(_, collection, expr, options) {
    return withMemo(collection, expr, () => {
        const values = $push(collection, expr.inputExpr, options);
        for (let i = 1; i < values.length; i++) {
            if (isNil(values[i]))
                values[i] = values[i - 1];
        }
        return values;
    }, (series) => series[expr.documentNumber - 1]);
}

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/custom/function.js
// Custom Aggregation Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#custom-aggregation-expression-operators


/**
 * Defines a custom function.
 *
 * @param {*} obj The target object for this expression
 * @param {*} expr The expression for the operator
 * @param {Options} options Options
 */
const function_$function = (obj, expr, options) => {
    assert(options.scriptEnabled, "$function operator requires 'scriptEnabled' option to be true");
    const fn = computeValue(obj, expr, null, options);
    return fn.body.apply(null, fn.args);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/dateAdd.js
// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators


/**
 * Increments a Date object by a specified number of time units.
 * @param obj
 * @param expr
 */
const dateAdd_$dateAdd = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    const d = computeDate(obj, expr.startDate, options);
    switch (args.unit) {
        case "year":
            d.setUTCFullYear(d.getUTCFullYear() + args.amount);
            break;
        case "quarter":
            addMonth(d, 3 * args.amount);
            break;
        case "month":
            addMonth(d, args.amount);
            break;
        default:
            d.setTime(d.getTime() + DURATION_IN_MILLIS[args.unit] * args.amount);
    }
    if (args.timezone) {
        const tz = parseTimezone(args.timezone);
        adjustDate(d, tz);
    }
    return d;
};
function addMonth(d, amount) {
    // months start from 0 to 11.
    const m = d.getUTCMonth() + amount;
    const yearOffset = Math.floor(m / 12);
    if (m < 0) {
        const month = (m % 12) + 12;
        d.setUTCFullYear(d.getUTCFullYear() + yearOffset, month, d.getUTCDate());
    }
    else {
        d.setUTCFullYear(d.getUTCFullYear() + yearOffset, m % 12, d.getUTCDate());
    }
}

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/group.js


// lookup key for grouping
const group_ID_KEY = "_id";
/**
 * Groups documents together for the purpose of calculating aggregate values based on a collection of documents.
 *
 * @param collection
 * @param expr
 * @param options
 * @returns {Array}
 */
const group_$group = (collection, expr, options) => {
    assert(has(expr, group_ID_KEY), "a group specification must include an _id");
    const idExpr = expr[group_ID_KEY];
    const copts = ComputeOptions.init(options);
    return collection.transform(((coll) => {
        const partitions = groupBy(coll, obj => computeValue(obj, idExpr, null, options), options.hashFunction);
        // remove the group key
        expr = Object.assign({}, expr);
        delete expr[group_ID_KEY];
        let i = -1;
        const partitionKeys = Array.from(partitions.keys());
        const size = partitions.size;
        return () => {
            if (++i === size)
                return { done: true };
            const groupId = partitionKeys[i];
            const obj = {};
            // exclude undefined key value
            if (groupId !== undefined) {
                obj[group_ID_KEY] = groupId;
            }
            // compute remaining keys in expression
            for (const [key, val] of Object.entries(expr)) {
                obj[key] = computeValue(partitions.get(groupId), val, key, copts.update(null, { groupId }));
            }
            return { value: obj, done: false };
        };
    }));
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/sort.js

/**
 * Takes all input documents and returns them in a stream of sorted documents.
 *
 * @param collection
 * @param sortKeys
 * @param  {Object} options
 * @returns {*}
 */
const sort_$sort = (collection, sortKeys, options) => {
    if (util_isEmpty(sortKeys) || !esm_util_isObject(sortKeys))
        return collection;
    let cmp = util_compare;
    // check for collation spec on the options
    const collationSpec = options.collation;
    // use collation comparator if provided
    if (esm_util_isObject(collationSpec) && util_isString(collationSpec.locale)) {
        cmp = collationComparator(collationSpec);
    }
    return collection.transform((coll) => {
        const modifiers = Object.keys(sortKeys);
        for (const key of modifiers.reverse()) {
            const groups = util_groupBy(coll, (obj) => util_resolve(obj, key), options.hashFunction);
            const sortedKeys = Array.from(groups.keys()).sort(cmp);
            if (sortKeys[key] === -1)
                sortedKeys.reverse();
            // reuse collection so the data is available for the next iteration of the sort modifiers.
            coll = [];
            sortedKeys.reduce((acc, key) => util_into(acc, groups.get(key)), coll);
        }
        return coll;
    });
};
// MongoDB collation strength to JS localeCompare sensitivity mapping.
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/localeCompare
const COLLATION_STRENGTH = {
    // Only strings that differ in base letters compare as unequal. Examples: a ≠ b, a = á, a = A.
    1: "base",
    //  Only strings that differ in base letters or accents and other diacritic marks compare as unequal.
    // Examples: a ≠ b, a ≠ á, a = A.
    2: "accent",
    // Strings that differ in base letters, accents and other diacritic marks, or case compare as unequal.
    // Other differences may also be taken into consideration. Examples: a ≠ b, a ≠ á, a ≠ A
    3: "variant"
    // case - Only strings that differ in base letters or case compare as unequal. Examples: a ≠ b, a = á, a ≠ A.
};
/**
 * Creates a comparator function for the given collation spec. See https://docs.mongodb.com/manual/reference/collation/
 *
 * @param spec {Object} The MongoDB collation spec.
 * {
 *   locale: string,
 *   caseLevel: boolean,
 *   caseFirst: string,
 *   strength: int,
 *   numericOrdering: boolean,
 *   alternate: string,
 *   maxVariable: never, // unsupported
 *   backwards: never // unsupported
 * }
 */
function collationComparator(spec) {
    const localeOpt = {
        sensitivity: COLLATION_STRENGTH[spec.strength || 3],
        caseFirst: spec.caseFirst === "off" ? "false" : spec.caseFirst || "false",
        numeric: spec.numericOrdering || false,
        ignorePunctuation: spec.alternate === "shifted"
    };
    // when caseLevel is true for strength  1:base and 2:accent, bump sensitivity to the nearest that supports case comparison
    if ((spec.caseLevel || false) === true) {
        if (localeOpt.sensitivity === "base")
            localeOpt.sensitivity = "case";
        if (localeOpt.sensitivity === "accent")
            localeOpt.sensitivity = "variant";
    }
    const collator = new Intl.Collator(spec.locale, localeOpt);
    return (a, b) => {
        // non strings
        if (!util_isString(a) || !util_isString(b))
            return util_compare(a, b);
        // only for strings
        const i = collator.compare(a, b);
        if (i < 0)
            return -1;
        if (i > 0)
            return 1;
        return 0;
    };
}

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/setWindowFields.js
// $setWindowFields -  https://docs.mongodb.com/manual/reference/operator/aggregation/setWindowFields/









// Operators that require 'sortBy' option.
const SORT_REQUIRED_OPS = new Set([
    "$denseRank",
    "$documentNumber",
    "$first",
    "$last",
    "$linearFill",
    "$rank",
    "$shift"
]);
// Operators that require unbounded 'window' option.
const WINDOW_UNBOUNDED_OPS = new Set([
    "$denseRank",
    "$expMovingAvg",
    "$linearFill",
    "$locf",
    "$rank",
    "$shift"
]);
/**
 * Randomly selects the specified number of documents from its input. The given iterator must have finite values
 *
 * @param  {Iterator} collection
 * @param  {Object} expr
 * @param  {Options} options
 * @return {*}
 */
const setWindowFields_$setWindowFields = (collection, expr, options) => {
    options = initOptions(options);
    options.context.addExpressionOps({ $function });
    // validate inputs early since this can be an expensive operation.
    for (const outputExpr of Object.values(expr.output)) {
        const keys = Object.keys(outputExpr);
        const op = keys.find(isOperator);
        assert(!!getOperator(OperatorType.WINDOW, op, options) ||
            !!getOperator(OperatorType.ACCUMULATOR, op, options), `'${op}' is not a valid window operator`);
        assert(keys.length > 0 &&
            keys.length <= 2 &&
            (keys.length == 1 || keys.includes("window")), "'output' option should have a single window operator.");
        if (outputExpr === null || outputExpr === void 0 ? void 0 : outputExpr.window) {
            const { documents, range } = outputExpr.window;
            assert((!!documents && !range) ||
                (!documents && !!range) ||
                (!documents && !range), "'window' option supports only one of 'documents' or 'range'.");
        }
    }
    // we sort first if required
    if (expr.sortBy) {
        collection = $sort(collection, expr.sortBy, options);
    }
    // then partition collection
    collection = $group(collection, {
        _id: expr.partitionBy,
        items: { $push: "$$CURRENT" }
    }, options);
    // transform values
    return collection.transform(((partitions) => {
        // let iteratorIndex = 0;
        const iterators = [];
        const outputConfig = [];
        for (const [field, outputExpr] of Object.entries(expr.output)) {
            const op = Object.keys(outputExpr).find(isOperator);
            const config = {
                operatorName: op,
                func: {
                    left: getOperator(OperatorType.ACCUMULATOR, op, options),
                    right: getOperator(OperatorType.WINDOW, op, options)
                },
                args: outputExpr[op],
                field: field,
                window: outputExpr.window
            };
            // sortBy option required for specific operators or bounded window.
            assert(!!expr.sortBy || !(SORT_REQUIRED_OPS.has(op) || !config.window), `${SORT_REQUIRED_OPS.has(op) ? `'${op}'` : "bounded window operation"} requires a sortBy.`);
            // window must be unbounded for specific operators.
            assert(!config.window || !WINDOW_UNBOUNDED_OPS.has(op), `${op} does not accept a 'window' field.`);
            outputConfig.push(config);
        }
        // each parition maintains its own closure to process the documents in the window.
        partitions.forEach(((group) => {
            // get the items to process
            const items = group.items;
            // create an iterator per group.
            // we need the index of each document so we track it using a special field.
            let iterator = Lazy(items);
            // results map
            const windowResultMap = {};
            for (const config of outputConfig) {
                const { func, args, field, window } = config;
                const makeResultFunc = (getItemsFn) => {
                    // closure for object index within the partition
                    let index = -1;
                    return (obj) => {
                        ++index;
                        // process accumulator function
                        if (func.left) {
                            return func.left(getItemsFn(obj, index), args, options);
                        }
                        else if (func.right) {
                            // OR process 'window' function
                            return func.right(obj, getItemsFn(obj, index), {
                                parentExpr: expr,
                                inputExpr: args,
                                documentNumber: index + 1,
                                field
                            }, 
                            // must use raw options only since it operates over a collection.
                            options);
                        }
                    };
                };
                if (window) {
                    const { documents, range, unit } = window;
                    // TODO: fix the meaning of numeric values in range.
                    //  See definition: https://www.mongodb.com/docs/manual/reference/operator/aggregation/setWindowFields/#std-label-setWindowFields-range
                    //  - A number to add to the value of the sortBy field for the current document.
                    //  - A document is in the window if the sortBy field value is inclusively within the lower and upper boundaries.
                    // TODO: Need to reconcile the two above statments from the doc to implement 'range' option correctly.
                    const boundary = documents || range;
                    if (!isUnbounded(window)) {
                        const [begin, end] = boundary;
                        const toBeginIndex = (currentIndex) => {
                            if (begin == "current")
                                return currentIndex;
                            if (begin == "unbounded")
                                return 0;
                            return Math.max(begin + currentIndex, 0);
                        };
                        const toEndIndex = (currentIndex) => {
                            if (end == "current")
                                return currentIndex + 1;
                            if (end == "unbounded")
                                return items.length;
                            return end + currentIndex + 1;
                        };
                        const getItems = (current, index) => {
                            // handle string boundaries or documents
                            if (!!documents || boundary.every(isString)) {
                                return items.slice(toBeginIndex(index), toEndIndex(index));
                            }
                            // handle range with numeric boundary values
                            const sortKey = Object.keys(expr.sortBy)[0];
                            let lower;
                            let upper;
                            if (unit) {
                                // we are dealing with datetimes
                                const getTime = (amount) => {
                                    return $dateAdd(current, {
                                        startDate: new Date(current[sortKey]),
                                        unit,
                                        amount
                                    }, options).getTime();
                                };
                                lower = isNumber(begin) ? getTime(begin) : -Infinity;
                                upper = isNumber(end) ? getTime(end) : Infinity;
                            }
                            else {
                                const currentValue = current[sortKey];
                                lower = isNumber(begin) ? currentValue + begin : -Infinity;
                                upper = isNumber(end) ? currentValue + end : Infinity;
                            }
                            let array = items;
                            if (begin == "current")
                                array = items.slice(index);
                            if (end == "current")
                                array = items.slice(0, index + 1);
                            // look within the boundary and filter down
                            return array.filter((o) => {
                                const n = +o[sortKey];
                                return n >= lower && n <= upper;
                            });
                        };
                        windowResultMap[field] = makeResultFunc(getItems);
                    }
                }
                // default action is to utilize the entire set of items
                if (!windowResultMap[field]) {
                    windowResultMap[field] = makeResultFunc(_ => items);
                }
                // invoke add fields to get the desired behaviour using a custom function.
                iterator = $addFields(iterator, {
                    [field]: {
                        $function: {
                            body: (obj) => windowResultMap[field](obj),
                            args: ["$$CURRENT"]
                        }
                    }
                }, options);
            }
            // add to iterator list
            iterators.push(iterator);
        }));
        return compose(...iterators);
    }));
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/fill.js







const FILL_METHODS = {
    locf: "$locf",
    linear: "$linearFill"
};
/**
 * Populates null and missing field values within documents.
 *
 * @param {Iterator} collection
 * @param {Object} expr
 * @param {Options} options
 */
const $fill = (collection, expr, options) => {
    var _a, _b;
    assert(!expr.sortBy || isObject(expr.sortBy), "sortBy must be an object.");
    assert(!!expr.sortBy || Object.values(expr.output).every(m => has(m, "value")), "sortBy required if any output field specifies a 'method'.");
    assert(!(expr.partitionBy && expr.partitionByFields), "specify either partitionBy or partitionByFields.");
    assert(!expr.partitionByFields ||
        ((_a = expr === null || expr === void 0 ? void 0 : expr.partitionByFields) === null || _a === void 0 ? void 0 : _a.every(s => s[0] !== "$")), "fields in partitionByFields cannot begin with '$'.");
    options = initOptions(options);
    options.context.addExpressionOps({ $ifNull });
    options.context.addWindowOps({ $locf, $linearFill });
    const partitionExpr = expr.partitionBy || ((_b = expr === null || expr === void 0 ? void 0 : expr.partitionByFields) === null || _b === void 0 ? void 0 : _b.map(s => `$${s}`));
    // collect and remove all output fields using 'value' instead of 'method'.
    // if there are any fields remaining, process collection using $setWindowFields.
    // if the collected output fields is non-empty, use $addFields to add them to their respective partitions.
    const valueExpr = {};
    const methodExpr = {};
    for (const [k, m] of Object.entries(expr.output)) {
        if (has(m, "value")) {
            // translate to expression for $addFields
            valueExpr[k] = { $ifNull: [`$$CURRENT.${k}`, m["value"]] };
        }
        else {
            // translate to output expression for $setWindowFields.
            const fillOp = FILL_METHODS[m["method"]];
            assert(!!fillOp, `invalid fill method '${m["method"]}'.`);
            methodExpr[k] = { [fillOp]: "$" + k };
        }
    }
    // perform filling with $setWindowFields
    if (Object.keys(methodExpr).length > 0) {
        collection = $setWindowFields(collection, {
            sortBy: expr.sortBy || {},
            partitionBy: partitionExpr,
            output: methodExpr
        }, options);
    }
    // fill with values
    if (Object.keys(valueExpr).length > 0) {
        collection = $addFields(collection, valueExpr, options);
    }
    return collection;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/lookup.js

/**
 * Performs a left outer join to another collection in the same database to filter in documents from the “joined” collection for processing.
 *
 * @param collection
 * @param expr
 * @param opt
 */
const $lookup = (collection, expr, options) => {
    const joinColl = isString(expr.from)
        ? options === null || options === void 0 ? void 0 : options.collectionResolver(expr.from)
        : expr.from;
    assert(joinColl instanceof Array, `'from' field must resolve to an array`);
    const hash = {};
    for (const obj of joinColl) {
        const k = hashCode(resolve(obj, expr.foreignField), options === null || options === void 0 ? void 0 : options.hashFunction);
        hash[k] = hash[k] || [];
        hash[k].push(obj);
    }
    return collection.map((obj) => {
        const k = hashCode(resolve(obj, expr.localField), options === null || options === void 0 ? void 0 : options.hashFunction);
        const newObj = into({}, obj);
        newObj[expr.as] = hash[k] || [];
        return newObj;
    });
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/match.js

/**
 * Filters the document stream, and only allows matching documents to pass into the next pipeline stage.
 * $match uses standard MongoDB queries.
 *
 * @param collection
 * @param expr
 * @param options
 * @returns {Array|*}
 */
const $match = (collection, expr, options) => {
    const q = new Query(expr, options);
    return collection.filter((o) => q.test(o));
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/arithmetic/abs.js
// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators


/**
 * Returns the absolute value of a number.
 *
 * @param obj
 * @param expr
 * @return {Number|null|NaN}
 */
const $abs = (obj, expr, options) => {
    const n = computeValue(obj, expr, null, options);
    return isNil(n) ? null : Math.abs(n);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/arithmetic/add.js
// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators


/**
 * Computes the sum of an array of numbers.
 *
 * @param obj
 * @param expr
 * @returns {Object}
 */
const $add = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    let foundDate = false;
    const result = args.reduce((acc, val) => {
        if (isDate(val)) {
            assert(!foundDate, "'$add' can only have one date value");
            foundDate = true;
            val = val.getTime();
        }
        // assume val is a number
        acc += val;
        return acc;
    }, 0);
    return foundDate ? new Date(result) : result;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/arithmetic/ceil.js
// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators


/**
 * Returns the smallest integer greater than or equal to the specified number.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
const $ceil = (obj, expr, options) => {
    const n = computeValue(obj, expr, null, options);
    if (isNil(n))
        return null;
    assert(isNumber(n) || isNaN(n), "$ceil expression must resolve to a number.");
    return Math.ceil(n);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/arithmetic/divide.js
// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

/**
 * Takes two numbers and divides the first number by the second.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
const $divide = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    return args[0] / args[1];
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/arithmetic/exp.js
// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators


/**
 * Raises Euler’s number (i.e. e ) to the specified exponent and returns the result.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
const $exp = (obj, expr, options) => {
    const n = computeValue(obj, expr, null, options);
    if (isNil(n))
        return null;
    assert(isNumber(n) || isNaN(n), "$exp expression must resolve to a number.");
    return Math.exp(n);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/arithmetic/floor.js
// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators


/**
 * Returns the largest integer less than or equal to the specified number.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
const $floor = (obj, expr, options) => {
    const n = computeValue(obj, expr, null, options);
    if (isNil(n))
        return null;
    assert(isNumber(n) || isNaN(n), "$floor expression must resolve to a number.");
    return Math.floor(n);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/arithmetic/ln.js
// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators


/**
 * Calculates the natural logarithm ln (i.e loge) of a number and returns the result as a double.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
const $ln = (obj, expr, options) => {
    const n = computeValue(obj, expr, null, options);
    if (isNil(n))
        return null;
    assert(isNumber(n) || isNaN(n), "$ln expression must resolve to a number.");
    return Math.log(n);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/arithmetic/log.js
// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators


/**
 * Calculates the log of a number in the specified base and returns the result as a double.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
const $log = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    const msg = "$log expression must resolve to array(2) of numbers";
    assert(isArray(args) && args.length === 2, msg);
    if (args.some(isNil))
        return null;
    assert(args.some(isNaN) || args.every(isNumber), msg);
    return Math.log10(args[0]) / Math.log10(args[1]);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/arithmetic/log10.js
// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators


/**
 * Calculates the log base 10 of a number and returns the result as a double.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
const $log10 = (obj, expr, options) => {
    const n = computeValue(obj, expr, null, options);
    if (isNil(n))
        return null;
    assert(isNumber(n) || isNaN(n), "$log10 expression must resolve to a number.");
    return Math.log10(n);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/arithmetic/mod.js
// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

/**
 * Takes two numbers and calculates the modulo of the first number divided by the second.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
const $mod = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    return args[0] % args[1];
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/arithmetic/multiply.js
// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

/**
 * Computes the product of an array of numbers.
 *
 * @param obj
 * @param expr
 * @returns {Object}
 */
const $multiply = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    return args.reduce((acc, num) => acc * num, 1);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/arithmetic/pow.js
// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators


/**
 * Raises a number to the specified exponent and returns the result.
 *
 * @param obj
 * @param expr
 * @returns {Object}
 */
const $pow = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    assert(isArray(args) && args.length === 2 && args.every(isNumber), "$pow expression must resolve to array(2) of numbers");
    assert(!(args[0] === 0 && args[1] < 0), "$pow cannot raise 0 to a negative exponent");
    return Math.pow(args[0], args[1]);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/arithmetic/round.js
// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators



/**
 * Rounds a number to to a whole integer or to a specified decimal place.
 * @param {*} obj
 * @param {*} expr
 */
const $round = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    const num = args[0];
    const place = args[1];
    if (isNil(num) || isNaN(num) || Math.abs(num) === Infinity)
        return num;
    assert(isNumber(num), "$round expression must resolve to a number.");
    return truncate(num, place, true);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/arithmetic/sqrt.js
// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators


/**
 * Calculates the square root of a positive number and returns the result as a double.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
const $sqrt = (obj, expr, options) => {
    const n = computeValue(obj, expr, null, options);
    if (isNil(n))
        return null;
    assert((isNumber(n) && n > 0) || isNaN(n), "$sqrt expression must resolve to non-negative number.");
    return Math.sqrt(n);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/arithmetic/subtract.js
// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators

/**
 * Takes an array that contains two numbers or two dates and subtracts the second value from the first.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
const $subtract = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    return args[0] - args[1];
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/arithmetic/trunc.js
// Arithmetic Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#arithmetic-expression-operators



/**
 * Truncates a number to a whole integer or to a specified decimal place.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
const $trunc = (obj, expr, options) => {
    const arr = computeValue(obj, expr, null, options);
    const num = arr[0];
    const places = arr[1];
    if (isNil(num) || isNaN(num) || Math.abs(num) === Infinity)
        return num;
    assert(isNumber(num), "$trunc expression must resolve to a number.");
    assert(isNil(places) || (isNumber(places) && places > -20 && places < 100), "$trunc expression has invalid place");
    return truncate(num, places, false);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/arithmetic/index.js

















;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/arrayElemAt.js
// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators


/**
 * Returns the element at the specified array index.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
const $arrayElemAt = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    assert(args instanceof Array && args.length === 2, "$arrayElemAt expression must resolve to array(2)");
    if (args.some(isNil))
        return null;
    const index = args[1];
    const arr = args[0];
    if (index < 0 && Math.abs(index) <= arr.length) {
        return arr[(index + arr.length) % arr.length];
    }
    else if (index >= 0 && index < arr.length) {
        return arr[index];
    }
    return undefined;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/arrayToObject.js
// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators


/**
 * Converts an array of key value pairs to a document.
 */
const $arrayToObject = (obj, expr, options) => {
    const arr = computeValue(obj, expr, null, options);
    assert(isArray(arr), "$arrayToObject expression must resolve to an array");
    return arr.reduce((newObj, val) => {
        // flatten
        while (isArray(val) && val.length === 1)
            val = val[0];
        if (val instanceof Array && val.length == 2) {
            newObj[val[0]] = val[1];
        }
        else {
            const valObj = val;
            assert(isObject(valObj) && has(valObj, "k") && has(valObj, "v"), "$arrayToObject expression is invalid.");
            newObj[valObj.k] = valObj.v;
        }
        return newObj;
    }, {});
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/concatArrays.js
// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators


/**
 * Concatenates arrays to return the concatenated array.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
const $concatArrays = (obj, expr, options) => {
    const arr = computeValue(obj, expr, null, options);
    assert(isArray(arr), "$concatArrays must resolve to an array");
    if (arr.some(isNil))
        return null;
    return arr.reduce((acc, item) => into(acc, item), []);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/filter.js
// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators


/**
 * Selects a subset of the array to return an array with only the elements that match the filter condition.
 *
 * @param  {Object} obj The current document
 * @param  {*} expr The filter spec
 * @return {*}
 */
const $filter = (obj, expr, options) => {
    const input = computeValue(obj, expr.input, null, options);
    assert(isArray(input), "$filter 'input' expression must resolve to an array");
    const copts = ComputeOptions.init(options, obj);
    const k = expr.as || "this";
    const local = {
        variables: { [k]: null }
    };
    return input.filter((o) => {
        local.variables[k] = o;
        const b = computeValue(obj, expr.cond, null, copts.update(copts.root, local));
        // allow empty strings only in strict MongoDB mode (default).
        return truthy(b, options.useStrictMode);
    });
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/first.js
// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators



/**
 * Returns the first element in an array.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
const first_$first = (obj, expr, options) => {
    const copts = ComputeOptions.init(options);
    if (obj instanceof Array)
        return __first(obj, expr, copts.update());
    const arr = computeValue(obj, expr, null, options);
    if (isNil(arr))
        return null;
    assert(isArray(arr), "Must resolve to an array/null or missing");
    return __first(arr, "$$this", options);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/firstN.js
// https://www.mongodb.com/docs/manual/reference/operator/aggregation/firstN-array-element/#mongodb-expression-exp.-firstN



/**
 * Returns a specified number of elements from the beginning of an array.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
const firstN_$firstN = (obj, expr, options) => {
    // first try the accumulator if input is an array.
    if (obj instanceof Array)
        return __firstN(obj, expr, options);
    const { input, n } = computeValue(obj, expr, null, options);
    if (isNil(input))
        return null;
    assert(isArray(input), "Must resolve to an array/null or missing");
    return __firstN(input, { n, input: "$$this" }, options);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/in.js
// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators


/**
 * Returns a boolean indicating whether a specified value is in an array.
 *
 * @param {Object} obj
 * @param {Array} expr
 */
const $in = (obj, expr, options) => {
    const [item, arr] = computeValue(obj, expr, null, options);
    assert(isArray(arr), "$in second argument must be an array");
    return arr.some(isEqual.bind(null, item));
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/indexOfArray.js
// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators


/**
 * Searches an array for an occurrence of a specified value and returns the array index of the first occurrence.
 * If the substring is not found, returns -1.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
const $indexOfArray = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    if (isNil(args))
        return null;
    let arr = args[0];
    const searchValue = args[1];
    if (isNil(arr))
        return null;
    assert(isArray(arr), "$indexOfArray expression must resolve to an array.");
    const start = args[2] || 0;
    let end = args[3];
    if (isNil(end))
        end = arr.length;
    if (start > end)
        return -1;
    assert(start >= 0 && end >= 0, "$indexOfArray expression is invalid");
    if (start > 0 || end < arr.length) {
        arr = arr.slice(start, end);
    }
    // Array.prototype.findIndex not supported in IE9 hence this workaround
    let index = -1;
    arr.some((v, i) => {
        const b = isEqual(v, searchValue);
        if (b)
            index = i;
        return b;
    });
    return index + start;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/isArray.js
// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

/**
 * Determines if the operand is an array. Returns a boolean.
 *
 * @param  {Object}  obj
 * @param  {*}  expr
 * @return {Boolean}
 */
const $isArray = (obj, expr, options) => {
    return computeValue(obj, expr[0], null, options) instanceof Array;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/last.js
// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators



/**
 * Returns the last element in an array.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
const last_$last = (obj, expr, options) => {
    const copts = ComputeOptions.init(options);
    if (obj instanceof Array)
        return __last(obj, expr, copts.update());
    const arr = computeValue(obj, expr, null, options);
    if (isNil(arr))
        return null;
    assert(isArray(arr), "Must resolve to an array/null or missing");
    return __last(arr, "$$this", options);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/lastN.js
// https://www.mongodb.com/docs/manual/reference/operator/aggregation/lastN-array-element/#mongodb-expression-exp.-lastN



/**
 * Returns a specified number of elements from the end of an array.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
const lastN_$lastN = (obj, expr, options) => {
    // first try the accumulator if input is an array.
    if (obj instanceof Array)
        return __lastN(obj, expr, options);
    const { input, n } = computeValue(obj, expr, null, options);
    if (isNil(input))
        return null;
    assert(isArray(input), "Must resolve to an array/null or missing");
    return __lastN(input, { n, input: "$$this" }, options);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/map.js
// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators


/**
 * Applies a sub-expression to each element of an array and returns the array of resulting values in order.
 *
 * @param obj
 * @param expr
 * @returns {Array|*}
 */
const $map = (obj, expr, options) => {
    const input = computeValue(obj, expr.input, null, options);
    assert(isArray(input), `$map 'input' expression must resolve to an array`);
    const copts = ComputeOptions.init(options);
    const k = expr.as || "this";
    return input.map((o) => {
        return computeValue(obj, expr.in, null, copts.update(copts.root, {
            variables: { [k]: o }
        }));
    });
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/maxN.js
// https://www.mongodb.com/docs/manual/reference/operator/aggregation/maxN-array-element/



/**
 * Returns the n largest values in an array.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
const maxN_$maxN = (obj, expr, options) => {
    // first try the accumulator if input is an array.
    if (obj instanceof Array)
        return __maxN(obj, expr, options);
    const { input, n } = computeValue(obj, expr, null, options);
    if (isNil(input))
        return null;
    assert(isArray(input), "Must resolve to an array/null or missing");
    return __maxN(input, { n, input: "$$this" }, options);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/minN.js
// https://www.mongodb.com/docs/manual/reference/operator/aggregation/minN-array-element/



/**
 * Returns the n smallest values in an array.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
const minN_$minN = (obj, expr, options) => {
    // first try the accumulator if input is an array.
    if (obj instanceof Array)
        return __minN(obj, expr, options);
    const { input, n } = computeValue(obj, expr, null, options);
    if (isNil(input))
        return null;
    assert(isArray(input), "Must resolve to an array/null or missing");
    return __minN(input, { n, input: "$$this" }, options);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/_predicates.js
/**
 * Predicates used for Query and Expression operators.
 */



/**
 * Returns a query operator created from the predicate
 *
 * @param predicate Predicate function
 */
function createQueryOperator(predicate) {
    const f = (selector, value, options) => {
        const opts = { unwrapArray: true };
        const depth = Math.max(1, selector.split(".").length - 1);
        return (obj) => {
            // value of field must be fully resolved.
            const lhs = util_resolve(obj, selector, opts);
            return predicate(lhs, value, Object.assign(Object.assign({}, options), { depth }));
        };
    };
    f.op = "query";
    return f; // as QueryOperator;
}
/**
 * Returns an expression operator created from the predicate
 *
 * @param predicate Predicate function
 */
function createExpressionOperator(predicate) {
    return (obj, expr, options) => {
        const args = core_computeValue(obj, expr, null, options);
        return predicate(...args);
    };
}
/**
 * Checks that two values are equal.
 *
 * @param a         The lhs operand as resolved from the object by the given selector
 * @param b         The rhs operand provided by the user
 * @returns {*}
 */
function $eq(a, b, options) {
    // start with simple equality check
    if (util_isEqual(a, b))
        return true;
    // https://docs.mongodb.com/manual/tutorial/query-for-null-fields/
    if (util_isNil(a) && util_isNil(b))
        return true;
    // check
    if (a instanceof Array) {
        const eq = util_isEqual.bind(null, b);
        return a.some(eq) || flatten(a, options === null || options === void 0 ? void 0 : options.depth).some(eq);
    }
    return false;
}
/**
 * Matches all values that are not equal to the value specified in the query.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
function $ne(a, b, options) {
    return !$eq(a, b, options);
}
/**
 * Matches any of the values that exist in an array specified in the query.
 *
 * @param a
 * @param b
 * @returns {*}
 */
function _predicates_$in(a, b, options) {
    // queries for null should be able to find undefined fields
    if (util_isNil(a))
        return b.some(v => v === null);
    return util_intersection([util_ensureArray(a), b], options === null || options === void 0 ? void 0 : options.hashFunction).length > 0;
}
/**
 * Matches values that do not exist in an array specified to the query.
 *
 * @param a
 * @param b
 * @returns {*|boolean}
 */
function $nin(a, b, options) {
    return !_predicates_$in(a, b, options);
}
/**
 * Matches values that are less than the value specified in the query.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
function $lt(a, b, options) {
    return _predicates_compare(a, b, (x, y) => util_compare(x, y) < 0);
}
/**
 * Matches values that are less than or equal to the value specified in the query.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
function $lte(a, b, options) {
    return _predicates_compare(a, b, (x, y) => util_compare(x, y) <= 0);
}
/**
 * Matches values that are greater than the value specified in the query.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
function $gt(a, b, options) {
    return _predicates_compare(a, b, (x, y) => util_compare(x, y) > 0);
}
/**
 * Matches values that are greater than or equal to the value specified in the query.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
function $gte(a, b, options) {
    return _predicates_compare(a, b, (x, y) => util_compare(x, y) >= 0);
}
/**
 * Performs a modulo operation on the value of a field and selects documents with a specified result.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
function _predicates_$mod(a, b, options) {
    return util_ensureArray(a).some(((x) => b.length === 2 && x % b[0] === b[1]));
}
/**
 * Selects documents where values match a specified regular expression.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
function $regex(a, b, options) {
    const lhs = util_ensureArray(a);
    const match = (x) => util_isString(x) && util_truthy(b.exec(x), options === null || options === void 0 ? void 0 : options.useStrictMode);
    return lhs.some(match) || flatten(lhs, 1).some(match);
}
/**
 * Matches documents that have the specified field.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
function $exists(a, b, options) {
    return (((b === false || b === 0) && a === undefined) ||
        ((b === true || b === 1) && a !== undefined));
}
/**
 * Matches arrays that contain all elements specified in the query.
 *
 * @param values
 * @param queries
 * @returns boolean
 */
function $all(values, queries, options) {
    if (!util_isArray(values) ||
        !util_isArray(queries) ||
        !values.length ||
        !queries.length) {
        return false;
    }
    let matched = true;
    for (const query of queries) {
        // no need to check all the queries.
        if (!matched)
            break;
        if (esm_util_isObject(query) && util_inArray(Object.keys(query), "$elemMatch")) {
            matched = $elemMatch(values, query["$elemMatch"], options);
        }
        else if (query instanceof RegExp) {
            matched = values.some(s => typeof s === "string" && query.test(s));
        }
        else {
            matched = values.some(v => util_isEqual(query, v));
        }
    }
    return matched;
}
/**
 * Selects documents if the array field is a specified size.
 *
 * @param a
 * @param b
 * @returns {*|boolean}
 */
function $size(a, b, options) {
    return Array.isArray(a) && a.length === b;
}
function isNonBooleanOperator(name) {
    return util_isOperator(name) && ["$and", "$or", "$nor"].indexOf(name) === -1;
}
/**
 * Selects documents if element in the array field matches all the specified $elemMatch condition.
 *
 * @param a {Array} element to match against
 * @param b {Object} subquery
 */
function $elemMatch(a, b, options) {
    // should return false for non-matching input
    if (util_isArray(a) && !util_isEmpty(a)) {
        let format = (x) => x;
        let criteria = b;
        // If we find a boolean operator in the subquery, we fake a field to point to it. This is an
        // attempt to ensure that it is a valid criteria. We cannot make this substitution for operators
        // like $and/$or/$nor; as otherwise, this faking will break our query.
        if (Object.keys(b).every(isNonBooleanOperator)) {
            criteria = { temp: b };
            format = x => ({ temp: x });
        }
        const query = new query_Query(criteria, options);
        for (let i = 0, len = a.length; i < len; i++) {
            if (query.test(format(a[i]))) {
                return true;
            }
        }
    }
    return false;
}
// helper functions
const isNull = (a) => a === null;
const isInt = (a) => util_isNumber(a) &&
    a >= util_MIN_INT &&
    a <= util_MAX_INT &&
    a.toString().indexOf(".") === -1;
const isLong = (a) => util_isNumber(a) &&
    a >= util_MIN_LONG &&
    a <= util_MAX_LONG &&
    a.toString().indexOf(".") === -1;
/** Mapping of type to predicate */
const compareFuncs = {
    array: util_isArray,
    bool: util_isBoolean,
    boolean: util_isBoolean,
    date: util_isDate,
    decimal: util_isNumber,
    double: util_isNumber,
    int: isInt,
    long: isLong,
    number: util_isNumber,
    null: isNull,
    object: esm_util_isObject,
    regex: isRegExp,
    regexp: isRegExp,
    string: util_isString,
    // added for completeness
    undefined: util_isNil,
    function: (_) => {
        throw new Error("unsupported type key `function`.");
    },
    // Mongo identifiers
    1: util_isNumber,
    2: util_isString,
    3: esm_util_isObject,
    4: util_isArray,
    6: util_isNil,
    8: util_isBoolean,
    9: util_isDate,
    10: isNull,
    11: isRegExp,
    16: isInt,
    18: isLong,
    19: util_isNumber //decimal
};
/**
 * Selects documents if a field is of the specified type.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
function compareType(a, b, _) {
    const f = compareFuncs[b];
    return f ? f(a) : false;
}
/**
 * Selects documents if a field is of the specified type.
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
function $type(a, b, options) {
    return Array.isArray(b)
        ? b.findIndex(t => compareType(a, t, options)) >= 0
        : compareType(a, b, options);
}
function _predicates_compare(a, b, f) {
    return util_ensureArray(a).some(x => util_getType(x) === util_getType(b) && f(x, b));
}

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/nin.js
// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

/**
 * Returns a boolean indicating whether a specified value is not an array.
 * Note: This expression operator is missing from the documentation
 *
 * @param {Object} obj
 * @param {Array} expr
 */
const nin_$nin = createExpressionOperator($nin);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/range.js
// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators

/**
 * Returns an array whose elements are a generated sequence of numbers.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
const $range = (obj, expr, options) => {
    const arr = computeValue(obj, expr, null, options);
    const start = arr[0];
    const end = arr[1];
    const step = arr[2] || 1;
    const result = new Array();
    let counter = start;
    while ((counter < end && step > 0) || (counter > end && step < 0)) {
        result.push(counter);
        counter += step;
    }
    return result;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/reduce.js
// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators


/**
 * Applies an expression to each element in an array and combines them into a single value.
 *
 * @param {Object} obj
 * @param {*} expr
 */
const $reduce = (obj, expr, options) => {
    const copts = ComputeOptions.init(options);
    const input = computeValue(obj, expr.input, null, copts);
    const initialValue = computeValue(obj, expr.initialValue, null, copts);
    const inExpr = expr["in"];
    if (isNil(input))
        return null;
    assert(isArray(input), "$reduce 'input' expression must resolve to an array");
    return input.reduce((acc, n) => {
        return computeValue(n, inExpr, null, copts.update(copts.root, {
            variables: { value: acc }
        }));
    }, initialValue);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/reverseArray.js
// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators


/**
 * Returns an array with the elements in reverse order.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
const $reverseArray = (obj, expr, options) => {
    const arr = computeValue(obj, expr, null, options);
    if (isNil(arr))
        return null;
    assert(isArray(arr), "$reverseArray expression must resolve to an array");
    const result = arr.slice(0);
    result.reverse();
    return result;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/size.js
// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators


/**
 * Counts and returns the total the number of items in an array.
 *
 * @param obj
 * @param expr
 */
const size_$size = (obj, expr, options) => {
    const value = computeValue(obj, expr, null, options);
    return isArray(value) ? value.length : undefined;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/slice.js
// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators


/**
 * Returns a subset of an array.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
const $slice = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    const arr = args[0];
    let skip = args[1];
    let limit = args[2];
    // MongoDB $slice works a bit differently from Array.slice
    // Uses single argument for 'limit' and array argument [skip, limit]
    if (isNil(limit)) {
        if (skip < 0) {
            skip = Math.max(0, arr.length + skip);
            limit = arr.length - skip + 1;
        }
        else {
            limit = skip;
            skip = 0;
        }
    }
    else {
        if (skip < 0) {
            skip = Math.max(0, arr.length + skip);
        }
        assert(limit > 0, `Invalid argument for $slice operator. Limit must be a positive number`);
        limit += skip;
    }
    return arr.slice(skip, limit);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/sortArray.js
// https://www.mongodb.com/docs/manual/reference/operator/aggregation/sortArray/#mongodb-expression-exp.-sortArray



/**
 * Sorts an array based on its elements. The sort order is user specified.
 *
 * @param obj The target object
 * @param expr The expression argument
 * @param options Options
 * @returns
 */
const $sortArray = (obj, expr, options) => {
    const { input, sortBy } = computeValue(obj, expr, null, options);
    if (isNil(input))
        return null;
    assert(isArray(input), "$sortArray expression must resolve to an array");
    if (isObject(sortBy)) {
        return new Aggregator([{ $sort: sortBy }]).run(input);
    }
    const result = [...input];
    result.sort(compare);
    if (sortBy === -1)
        result.reverse();
    return result;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/zip.js
// Array Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#array-expression-operators


/**
 * Merge two lists together.
 *
 * Transposes an array of input arrays so that the first element of the output array would be an array containing,
 * the first element of the first input array, the first element of the second input array, etc.
 *
 * @param  {Obj} obj
 * @param  {*} expr
 * @return {*}
 */
const $zip = (obj, expr, options) => {
    const inputs = computeValue(obj, expr.inputs, null, options);
    const useLongestLength = expr.useLongestLength || false;
    assert(isArray(inputs), "'inputs' expression must resolve to an array");
    assert(isBoolean(useLongestLength), "'useLongestLength' must be a boolean");
    if (isArray(expr.defaults)) {
        assert(useLongestLength, "'useLongestLength' must be set to true to use 'defaults'");
    }
    let zipCount = 0;
    for (let i = 0, len = inputs.length; i < len; i++) {
        const arr = inputs[i];
        if (isNil(arr))
            return null;
        assert(isArray(arr), "'inputs' expression values must resolve to an array or null");
        zipCount = useLongestLength
            ? Math.max(zipCount, arr.length)
            : Math.min(zipCount || arr.length, arr.length);
    }
    const result = [];
    const defaults = expr.defaults || [];
    for (let i = 0; i < zipCount; i++) {
        const temp = inputs.map((val, index) => {
            return isNil(val[i]) ? defaults[index] || null : val[i];
        });
        result.push(temp);
    }
    return result;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/array/index.js























;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/bitwise/_internal.js


const bitwise = (op, compute) => (obj, expr, options) => {
    util_assert(util_isArray(expr), `${op}: expression must be an array.`);
    const nums = core_computeValue(obj, expr, null, options);
    if (nums.some(util_isNil))
        return null;
    util_assert(nums.every(util_isNumber), `${op}: expression must evalue to array of numbers.`);
    return compute(nums);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/bitwise/bitAnd.js
// Bitwise Operators: https://www.mongodb.com/docs/manual/reference/operator/aggregation/bitAnd/#mongodb-expression-exp

/**
 * Returns the result of a bitwise and operation on an array of int or long values.
 *
 * @param obj RawObject from collection
 * @param expr Right hand side expression of operator
 * @returns {Number}
 */
const $bitAnd = bitwise("$bitAnd", nums => nums.reduce((a, b) => a & b, -1));

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/bitwise/bitNot.js
// Bitwise Operators: https://www.mongodb.com/docs/manual/reference/operator/aggregation/bitNot/#mongodb-expression-exp


/**
 * Returns the result of a bitwise not operation on a single argument or an array that contains a single int or long value.
 *
 * @param obj RawObject from collection
 * @param expr Right hand side expression of operator
 * @returns {Number}
 */
const $bitNot = (obj, expr, options) => {
    const n = computeValue(obj, expr, null, options);
    if (isNil(n))
        return null;
    if (isNumber(n))
        return ~n;
    throw new Error("$bitNot: expression must evaluate to a number.");
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/bitwise/bitOr.js
// Bitwise Operators: https://www.mongodb.com/docs/manual/reference/operator/aggregation/bitOr/#mongodb-expression-exp

/**
 * Returns the result of a bitwise or operation on an array of int or long values.
 *
 * @param obj RawObject from collection
 * @param expr Right hand side expression of operator
 * @returns {Number}
 */
const $bitOr = bitwise("$bitOr", nums => nums.reduce((a, b) => a | b, 0));

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/bitwise/bitXor.js
// Bitwise Operators: https://www.mongodb.com/docs/manual/reference/operator/aggregation/bitNot/#mongodb-expression-exp

/**
 * Returns the result of a bitwise xor (exclusive or) operation on an array of int and long values.
 *
 * @param obj RawObject from collection
 * @param expr Right hand side expression of operator
 * @returns {Number}
 */
const $bitXor = bitwise("$bitXor", nums => nums.reduce((a, b) => a ^ b, 0));

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/bitwise/index.js





;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/boolean/and.js
// Boolean Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#boolean-expression-operators


/**
 * Returns true only when all its expressions evaluate to true. Accepts any number of argument expressions.
 *
 * @param obj
 * @param expr
 * @returns {boolean}
 */
const $and = (obj, expr, options) => {
    const value = computeValue(obj, expr, null, options);
    return (truthy(value, options.useStrictMode) &&
        value.every(v => truthy(v, options.useStrictMode)));
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/boolean/not.js
// Boolean Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#boolean-expression-operators


/**
 * Returns the boolean value that is the opposite of its argument expression. Accepts a single argument expression.
 *
 * @param obj RawObject from collection
 * @param expr Right hand side expression of operator
 * @returns {boolean}
 */
const $not = (obj, expr, options) => {
    const booleanExpr = ensureArray(expr);
    // array values are truthy so an emty array is false
    if (booleanExpr.length == 0)
        return false;
    // use provided value non-array value
    if (booleanExpr.length == 1)
        return !computeValue(obj, booleanExpr[0], null, options);
    // expects a single argument
    throw "Expression $not takes exactly 1 argument";
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/boolean/or.js
// Boolean Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#boolean-expression-operators


/**
 * Returns true when any of its expressions evaluates to true. Accepts any number of argument expressions.
 *
 * @param obj
 * @param expr
 * @returns {boolean}
 */
const $or = (obj, expr, options) => {
    const value = computeValue(obj, expr, null, options);
    const strict = options.useStrictMode;
    return truthy(value, strict) && value.some(v => truthy(v, strict));
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/boolean/index.js




;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/comparison/cmp.js
// Comparison Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#comparison-expression-operators

/**
 * Compares two values and returns the result of the comparison as an integer.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
const $cmp = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    if (args[0] > args[1])
        return 1;
    if (args[0] < args[1])
        return -1;
    return 0;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/comparison/eq.js
// Comparison Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#comparison-expression-operators

/**
 * Matches values that are equal to a specified value.
 */
const eq_$eq = createExpressionOperator($eq);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/comparison/gt.js
// Comparison Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#comparison-expression-operators

/**
 * Matches values that are greater than a specified value.
 */
const gt_$gt = createExpressionOperator($gt);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/comparison/gte.js
// Comparison Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#comparison-expression-operators

/**
 * 	Matches values that are greater than or equal to a specified value.
 */
const gte_$gte = createExpressionOperator($gte);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/comparison/lt.js
// Comparison Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#comparison-expression-operators

/**
 * Matches values that are less than the value specified in the query.
 */
const lt_$lt = createExpressionOperator($lt);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/comparison/lte.js
// Comparison Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#comparison-expression-operators

/**
 * Matches values that are less than or equal to the value specified in the query.
 */
const lte_$lte = createExpressionOperator($lte);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/comparison/ne.js
// Comparison Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#comparison-expression-operators

/**
 * Matches all values that are not equal to the value specified in the query.
 */
const ne_$ne = createExpressionOperator($ne);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/comparison/index.js








;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/conditional/cond.js
/**
 * Conditional Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#conditional-expression-operators
 */


/**
 * A ternary operator that evaluates one expression,
 * and depending on the result returns the value of one following expressions.
 *
 * @param obj
 * @param expr
 */
const $cond = (obj, expr, options) => {
    let ifExpr;
    let thenExpr;
    let elseExpr;
    const errorMsg = "$cond: invalid arguments";
    if (expr instanceof Array) {
        assert(expr.length === 3, errorMsg);
        ifExpr = expr[0];
        thenExpr = expr[1];
        elseExpr = expr[2];
    }
    else {
        assert(isObject(expr), errorMsg);
        ifExpr = expr.if;
        thenExpr = expr.then;
        elseExpr = expr.else;
    }
    const condition = truthy(computeValue(obj, ifExpr, null, options), options.useStrictMode);
    return computeValue(obj, condition ? thenExpr : elseExpr, null, options);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/conditional/switch.js
/**
 * Conditional Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#conditional-expression-operators
 */


/**
 * An operator that evaluates a series of case expressions. When it finds an expression which
 * evaluates to true, it returns the resulting expression for that case. If none of the cases
 * evaluate to true, it returns the default expression.
 *
 * @param obj
 * @param expr
 */
const $switch = (obj, expr, options) => {
    let thenExpr = null;
    // Array.prototype.find not supported in IE, hence the '.some()' proxy
    expr.branches.some((b) => {
        const condition = truthy(computeValue(obj, b.case, null, options), options.useStrictMode);
        if (condition)
            thenExpr = b.then;
        return condition;
    });
    return computeValue(obj, thenExpr !== null ? thenExpr : expr.default, null, options);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/conditional/index.js




;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/custom/index.js


;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/dateDiff.js
// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators


/**
 * Returns the difference between two dates.
 * @param obj
 * @param expr
 * @param options Options
 */
const $dateDiff = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    const d1 = computeDate(obj, expr.startDate, options);
    const d2 = computeDate(obj, expr.endDate, options);
    let diff;
    switch (args.unit) {
        case "year":
        case "quarter":
        case "month":
            diff = diffYQM(d1, d2, args.unit);
            break;
        default:
            diff = (d2.getTime() - d1.getTime()) / DURATION_IN_MILLIS[args.unit];
    }
    return diff;
};
const unitMonths = {
    year: 12,
    quarter: 3,
    month: 1
};
function diffYQM(d1, d2, unit) {
    let months = (d2.getUTCFullYear() - d1.getUTCFullYear()) * 12;
    months -= d1.getUTCMonth();
    months += d2.getUTCMonth();
    return Math.trunc(months / unitMonths[unit]);
}

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/dateFromParts.js
// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators


const DAYS_IN_MONTH = (/* unused pure expression or super */ null && ([31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]));
const getDaysInMonth = (date) => {
    return date.month == 2 && isLeapYear(date.year)
        ? 29
        : DAYS_IN_MONTH[date.month - 1];
};
/**
 * Constructs and returns a Date object given the date’s constituent properties.
 *
 * @param obj The document
 * @param expr The date expression
 * @param options Options
 */
const $dateFromParts = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    const minuteOffset = parseTimezone(args.timezone);
    // assign default and adjust value ranges of the different parts
    for (let i = DATE_PART_INTERVAL.length - 1, remainder = 0; i >= 0; i--) {
        const datePartInterval = DATE_PART_INTERVAL[i];
        const k = datePartInterval[0];
        const min = datePartInterval[1];
        const max = datePartInterval[2];
        // add remainder from previous part. units should already be correct
        let part = (args[k] || 0) + remainder;
        // reset remainder now that it's been used.
        remainder = 0;
        // 1. compute the remainder for the next part
        // 2. adjust the current part to a valid range
        // 3. assign back to 'args'
        const limit = max + 1;
        // invert timezone to adjust the hours to UTC
        if (k == "hour")
            part += Math.floor(minuteOffset / MINUTES_PER_HOUR) * -1;
        if (k == "minute")
            part += (minuteOffset % MINUTES_PER_HOUR) * -1;
        // smaller than lower bound
        if (part < min) {
            const delta = min - part;
            remainder = -1 * Math.ceil(delta / limit);
            part = limit - (delta % limit);
        }
        else if (part > max) {
            // offset with the 'min' value to adjust non-zero date parts correctly
            part += min;
            remainder = Math.trunc(part / limit);
            part %= limit;
        }
        // reassign
        args[k] = part;
    }
    // adjust end of month to correctly handle overflows
    args.day = Math.min(args.day, getDaysInMonth(args));
    return new Date(Date.UTC(args.year, args.month - 1, args.day, args.hour, args.minute, args.second, args.millisecond));
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/dateFromString.js
// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators



const buildMap = (letters, sign) => {
    const h = {};
    letters.split("").forEach((v, i) => (h[v] = sign * (i + 1)));
    return h;
};
const TZ_LETTER_OFFSETS = Object.assign(Object.assign(Object.assign({}, buildMap("ABCDEFGHIKLM", 1)), buildMap("NOPQRSTUVWXY", -1)), { Z: 0 });
/**
 * Converts a date/time string to a date object.
 * @param obj
 * @param expr
 */
const $dateFromString = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    args.format = args.format || DATE_FORMAT;
    args.onNull = args.onNull || null;
    let dateString = args.dateString;
    if (isNil(dateString))
        return args.onNull;
    // collect all separators of the format string
    const separators = args.format.split(/%[YGmdHMSLuVzZ]/);
    separators.reverse();
    const matches = args.format.match(/(%%|%Y|%G|%m|%d|%H|%M|%S|%L|%u|%V|%z|%Z)/g);
    const dateParts = {};
    // holds the valid regex of parts that matches input date string
    let expectedPattern = "";
    for (let i = 0, len = matches.length; i < len; i++) {
        const formatSpecifier = matches[i];
        const props = DATE_SYM_TABLE[formatSpecifier];
        if (isObject(props)) {
            // get pattern and alias from table
            const m = props.re.exec(dateString);
            // get the next separtor
            const delimiter = separators.pop() || "";
            if (m !== null) {
                // store and cut out matched part
                dateParts[props.name] = /^\d+$/.exec(m[0]) ? parseInt(m[0]) : m[0];
                dateString =
                    dateString.substr(0, m.index) +
                        dateString.substr(m.index + m[0].length);
                // construct expected pattern
                expectedPattern +=
                    regexQuote(delimiter) + regexStrip(props.re.toString());
            }
            else {
                dateParts[props.name] = null;
            }
        }
    }
    // 1. validate all required date parts exists
    // 2. validate original dateString against expected pattern.
    if (isNil(dateParts.year) ||
        isNil(dateParts.month) ||
        isNil(dateParts.day) ||
        !new RegExp("^" + expectedPattern + "[A-Z]?$").exec(args.dateString)) {
        return args.onError;
    }
    const m = args.dateString.match(/([A-Z])$/);
    assert(
    // only one of in-date timeone or timezone argument but not both.
    !(m && args.timezone), `$dateFromString: you cannot pass in a date/time string with time zone information ('${m && m[0]}') together with a timezone argument`);
    const minuteOffset = m
        ? TZ_LETTER_OFFSETS[m[0]] * MINUTES_PER_HOUR
        : parseTimezone(args.timezone);
    // create the date. month is 0-based in Date
    const d = new Date(Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, 0, 0, 0));
    if (!isNil(dateParts.hour))
        d.setUTCHours(dateParts.hour);
    if (!isNil(dateParts.minute))
        d.setUTCMinutes(dateParts.minute);
    if (!isNil(dateParts.second))
        d.setUTCSeconds(dateParts.second);
    if (!isNil(dateParts.millisecond))
        d.setUTCMilliseconds(dateParts.millisecond);
    // adjust to the correct represention for UTC
    adjustDate(d, -minuteOffset);
    return d;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/dateSubtract.js
// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators


/**
 * Decrements a Date object by a specified number of time units.
 * @param obj
 * @param expr
 */
const $dateSubtract = (obj, expr, options) => {
    const amount = computeValue(obj, expr === null || expr === void 0 ? void 0 : expr.amount, null, options);
    return $dateAdd(obj, Object.assign(Object.assign({}, expr), { amount: -1 * amount }), options);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/dateToParts.js
// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators


/**
 * Returns a document that contains the constituent parts of a given Date value as individual properties.
 * The properties returned are year, month, day, hour, minute, second and millisecond.
 *
 * @param obj
 * @param expr
 * @param options
 */
const $dateToParts = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    const d = new Date(args.date);
    const tz = parseTimezone(args.timezone);
    adjustDate(d, tz);
    const timePart = {
        hour: d.getUTCHours(),
        minute: d.getUTCMinutes(),
        second: d.getUTCSeconds(),
        millisecond: d.getUTCMilliseconds()
    };
    if (args.iso8601 == true) {
        return Object.assign(timePart, {
            isoWeekYear: isoWeekYear(d),
            isoWeek: isoWeek(d),
            isoDayOfWeek: d.getUTCDay() || 7
        });
    }
    return Object.assign(timePart, {
        year: d.getUTCFullYear(),
        month: d.getUTCMonth() + 1,
        day: d.getUTCDate()
    });
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/dayOfMonth.js
// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

/**
 * Returns the day of the month for a date as a number between 1 and 31.
 * @param obj
 * @param expr
 */
const $dayOfMonth = (obj, expr, options) => {
    return _internal_computeDate(obj, expr, options).getUTCDate();
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/hour.js
// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

/**
 * Returns the hour for a date as a number between 0 and 23.
 * @param obj
 * @param expr
 */
const $hour = (obj, expr, options) => {
    return _internal_computeDate(obj, expr, options).getUTCHours();
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/isoDayOfWeek.js
// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

/**
 * Returns the weekday number in ISO 8601 format, ranging from 1 (Monday) to 7 (Sunday).
 * @param obj
 * @param expr
 */
const $isoDayOfWeek = (obj, expr, options) => {
    return _internal_computeDate(obj, expr, options).getUTCDay() || 7;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/isoWeek.js
// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

/**
 * Returns the week number in ISO 8601 format, ranging from 1 to 53.
 * Week numbers start at 1 with the week (Monday through Sunday) that contains the year's first Thursday.
 * @param obj
 * @param expr
 */
const $isoWeek = (obj, expr, options) => {
    return _internal_isoWeek(_internal_computeDate(obj, expr, options));
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/millisecond.js
// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

/**
 * Returns the milliseconds of a date as a number between 0 and 999.
 * @param obj
 * @param expr
 */
const $millisecond = (obj, expr, options) => {
    return _internal_computeDate(obj, expr, options).getUTCMilliseconds();
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/minute.js
// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

/**
 * Returns the minute for a date as a number between 0 and 59.
 * @param obj
 * @param expr
 */
const $minute = (obj, expr, options) => {
    return _internal_computeDate(obj, expr, options).getUTCMinutes();
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/month.js
// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

/**
 * Returns the month for a date as a number between 1 (January) and 12 (December).
 * @param obj
 * @param expr
 */
const $month = (obj, expr, options) => {
    return _internal_computeDate(obj, expr, options).getUTCMonth() + 1;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/second.js
// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

/**
 * Returns the seconds for a date as a number between 0 and 60 (leap seconds).
 * @param obj
 * @param expr
 */
const $second = (obj, expr, options) => {
    return _internal_computeDate(obj, expr, options).getUTCSeconds();
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/week.js
// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

/**
 * Returns the week of the year for a date as a number between 0 and 53.
 * Weeks begin on Sundays, and week 1 begins with the first Sunday of the year. Days preceding the first Sunday of the year are in week 0
 * @param obj
 * @param expr
 */
const $week = (obj, expr, options) => {
    const d = _internal_computeDate(obj, expr, options);
    const result = _internal_isoWeek(d);
    // check for starting of year and adjust accordingly
    if (d.getUTCDay() > 0 && d.getUTCDate() == 1 && d.getUTCMonth() == 0)
        return 0;
    // adjust for week start on Sunday
    if (d.getUTCDay() == 0)
        return result + 1;
    // else
    return result;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/year.js
// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

/**
 * Returns the year for a date as a number (e.g. 2014).
 * @param obj
 * @param expr
 */
const $year = (obj, expr, options) => {
    return _internal_computeDate(obj, expr, options).getUTCFullYear();
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/dateToString.js
// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators













// date functions for format specifiers
const DATE_FUNCTIONS = {
    "%Y": $year,
    "%G": $year,
    "%m": $month,
    "%d": $dayOfMonth,
    "%H": $hour,
    "%M": $minute,
    "%S": $second,
    "%L": $millisecond,
    "%u": $isoDayOfWeek,
    "%U": $week,
    "%V": $isoWeek
};
/**
 * Returns the date as a formatted string.
 *
 * %d	Day of Month (2 digits, zero padded)	01-31
 * %G	Year in ISO 8601 format	0000-9999
 * %H	Hour (2 digits, zero padded, 24-hour clock)	00-23
 * %L	Millisecond (3 digits, zero padded)	000-999
 * %m	Month (2 digits, zero padded)	01-12
 * %M	Minute (2 digits, zero padded)	00-59
 * %S	Second (2 digits, zero padded)	00-60
 * %u	Day of week number in ISO 8601 format (1-Monday, 7-Sunday)	1-7
 * %V	Week of Year in ISO 8601 format	1-53
 * %Y	Year (4 digits, zero padded)	0000-9999
 * %z	The timezone offset from UTC.	+/-[hh][mm]
 * %Z	The minutes offset from UTC as a number. For example, if the timezone offset (+/-[hhmm]) was +0445, the minutes offset is +285.	+/-mmm
 * %%	Percent Character as a Literal	%
 *
 * @param obj current object
 * @param expr operator expression
 */
const dateToString_$dateToString = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    if (isNil(args.onNull))
        args.onNull = null;
    if (isNil(args.date))
        return args.onNull;
    const date = computeDate(obj, args.date, options);
    let format = args.format || DATE_FORMAT;
    const minuteOffset = parseTimezone(args.timezone);
    const matches = format.match(/(%%|%Y|%G|%m|%d|%H|%M|%S|%L|%u|%U|%V|%z|%Z)/g);
    // adjust the date to reflect timezone
    adjustDate(date, minuteOffset);
    for (let i = 0, len = matches.length; i < len; i++) {
        const formatSpecifier = matches[i];
        const props = DATE_SYM_TABLE[formatSpecifier];
        const operatorFn = DATE_FUNCTIONS[formatSpecifier];
        let value;
        if (isObject(props)) {
            // reuse date
            if (props.name === "timezone") {
                value = formatTimezone(minuteOffset);
            }
            else if (props.name === "minuteOffset") {
                value = minuteOffset.toString();
            }
            else {
                assert(!!operatorFn, `unsupported date format specifier '${formatSpecifier}'`);
                value = padDigits(operatorFn(obj, date, options), props.padding);
            }
        }
        // replace the match with resolved value
        format = format.replace(formatSpecifier, value);
    }
    return format;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/dayOfWeek.js
// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

/**
 * Returns the day of the week for a date as a number between 1 (Sunday) and 7 (Saturday).
 * @param obj
 * @param expr
 */
const $dayOfWeek = (obj, expr, options) => {
    return computeDate(obj, expr, options).getUTCDay() + 1;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/dayOfYear.js
// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

/**
 * Returns the day of the year for a date as a number between 1 and 366 (leap year).
 * @param obj
 * @param expr
 */
const $dayOfYear = (obj, expr, options) => {
    return getDayOfYear(computeDate(obj, expr, options));
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/isoWeekYear.js
// Date Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#date-expression-operators

/**
 * Returns the year number in ISO 8601 format. The year starts with the Monday of week 1 and ends with the Sunday of the last week.
 * @param obj
 * @param expr
 */
const $isoWeekYear = (obj, expr, options) => {
    const d = computeDate(obj, expr, options);
    return (d.getUTCFullYear() -
        Number(d.getUTCMonth() == 0 && d.getUTCDate() == 1 && d.getUTCDay() < 1));
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/date/index.js





















;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/median.js


/**
 * Returns an approximation of the median, the 50th percentile, as a scalar value.
 *
 * @param obj The current object
 * @param expr The operator expression
 * @param options Options to use for processing
 * @returns {number}
 */
const median_$median = (obj, expr, options) => {
    const input = computeValue(obj, expr.input, null, options);
    return __median(input, { input: "$$CURRENT" }, options);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/misc/getField.js
// Miscellaneous Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/rand/#mongodb-expression-exp.-rand


/**
 * Adds, updates, or removes a specified field in a document.
 *
 * @param {*} obj The target object for this expression
 * @param {*} expr The right-hand side of the operator
 * @param {Options} options Options to use for operation
 */
const $getField = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    const [field, input] = isObject(args)
        ? [args.field, args.input || obj]
        : [args, obj];
    if (isNil(input))
        return null;
    assert(isObject(input), "$getField expression 'input' must evaluate to an object");
    assert(isString(field), "$getField expression 'field' must evaluate to a string");
    return input[field];
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/misc/sampleRate.js
// Miscellaneous Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#miscellaneous-operators

/**
 * Randomly select documents at a given rate.
 *
 * @param {*} obj The target object for this expression
 * @param {*} expr The right-hand side of the operator
 * @param {Options} options Options to use for operation
 */
const $sampleRate = (obj, expr, options) => Math.random() <= computeValue(obj, expr, null, options);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/misc/index.js




;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/object/objectToArray.js
// Object Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#object-expression-operators


/**
 * Converts a document to an array of documents representing key-value pairs.
 *
 * @param {*} obj The target object for this expression
 * @param {*} expr The right-hand side of the operator
 * @param {Options} options Options to use for operation
 */
const $objectToArray = (obj, expr, options) => {
    const val = computeValue(obj, expr, null, options);
    assert(isObject(val), "$objectToArray expression must resolve to an object");
    const entries = Object.entries(val);
    const result = new Array(entries.length);
    let i = 0;
    for (const [k, v] of entries) {
        result[i++] = { k, v };
    }
    return result;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/object/setField.js
// Object Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#object-expression-operators


/**
 * Adds, updates, or removes a specified field in a document.
 *
 * @param {*} obj The target object for this expression
 * @param {*} expr The right-hand side of the operator
 * @param {Options} options Options to use for operation
 */
const setField_$setField = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    if (isNil(args.input))
        return null;
    assert(isObject(args.input), "$setField expression 'input' must evaluate to an object");
    assert(isString(args.field), "$setField expression 'field' must evaluate to a string");
    if (expr.value == "$$REMOVE") {
        delete obj[args.field];
    }
    else {
        obj[args.field] = args.value;
    }
    return obj;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/object/unsetField.js
// Object Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#object-expression-operators

/**
 * Adds, updates, or removes a specified field in a document.
 *
 * @param {*} obj The target object for this expression
 * @param {*} expr The right-hand side of the operator
 * @param {Options} options Options to use for operation
 */
const $unsetField = (obj, expr, options) => {
    return $setField(obj, Object.assign(Object.assign({}, expr), { value: "$$REMOVE" }), options);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/object/index.js





;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/percentile.js


/**
 * Returns an array of scalar values that correspond to specified percentile values.
 *
 * @param obj The current object
 * @param expr The operator expression
 * @param options Options to use for processing
 * @returns {Array<number>}
 */
const expression_percentile_$percentile = (obj, expr, options) => {
    const input = computeValue(obj, expr.input, null, options);
    return __percentile(input, Object.assign(Object.assign({}, expr), { input: "$$CURRENT" }), options);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/set/allElementsTrue.js
/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */


/**
 * Returns true if all elements of a set evaluate to true, and false otherwise.
 * @param obj
 * @param expr
 */
const $allElementsTrue = (obj, expr, options) => {
    // mongodb nests the array expression in another
    const args = computeValue(obj, expr, null, options)[0];
    return args.every(v => truthy(v, options.useStrictMode));
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/set/anyElementTrue.js
/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */


/**
 * Returns true if any elements of a set evaluate to true, and false otherwise.
 * @param obj
 * @param expr
 */
const $anyElementTrue = (obj, expr, options) => {
    // mongodb nests the array expression in another
    const args = computeValue(obj, expr, null, options)[0];
    return args.some(v => truthy(v, options.useStrictMode));
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/set/setDifference.js
/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */


/**
 * Returns elements of a set that do not appear in a second set.
 * @param obj
 * @param expr
 */
const $setDifference = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    return args[0].filter(notInArray.bind(null, args[1]));
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/set/setEquals.js
/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */


/**
 * Returns true if two sets have the same elements.
 * @param obj
 * @param expr
 */
const $setEquals = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    const xs = unique(args[0], options === null || options === void 0 ? void 0 : options.hashFunction);
    const ys = unique(args[1], options === null || options === void 0 ? void 0 : options.hashFunction);
    return (xs.length === ys.length &&
        xs.length === intersection([xs, ys], options === null || options === void 0 ? void 0 : options.hashFunction).length);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/set/setIntersection.js
/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */


/**
 * Returns the common elements of the input sets.
 * @param obj
 * @param expr
 */
const $setIntersection = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    assert(isArray(args) && args.every(isArray), "$setIntersection: expresssion must resolve to array of arrays");
    return intersection(args, options === null || options === void 0 ? void 0 : options.hashFunction);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/set/setIsSubset.js
/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */


/**
 * Returns true if all elements of a set appear in a second set.
 * @param obj
 * @param expr
 */
const $setIsSubset = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    return intersection(args, options === null || options === void 0 ? void 0 : options.hashFunction).length === args[0].length;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/set/setUnion.js
/**
 * Set Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#set-expression-operators
 */


/**
 * Returns a set that holds all elements of the input sets.
 * @param obj
 * @param expr
 */
const $setUnion = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    assert(isArray(args) && args.length == 2 && args.every(isArray), "$setUnion: arguments must be arrays");
    return unique(args[0].concat(args[1]), options === null || options === void 0 ? void 0 : options.hashFunction);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/set/index.js








;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/string/concat.js
/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */


/**
 * Concatenates two strings.
 *
 * @param obj
 * @param expr
 * @returns {string|*}
 */
const $concat = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    // does not allow concatenation with nulls
    if ([null, undefined].some(inArray.bind(null, args)))
        return null;
    return args.join("");
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/string/indexOfBytes.js
/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */


/**
 * Searches a string for an occurrence of a substring and returns the UTF-8 code point index of the first occurence.
 * If the substring is not found, returns -1.
 *
 * @param  {Object} obj
 * @param  {*} expr
 * @return {*}
 */
const $indexOfBytes = (obj, expr, options) => {
    const arr = computeValue(obj, expr, null, options);
    const errorMsg = "$indexOfBytes expression resolves to invalid an argument";
    if (isNil(arr[0]))
        return null;
    assert(isString(arr[0]) && isString(arr[1]), errorMsg);
    const str = arr[0];
    const searchStr = arr[1];
    let start = arr[2];
    let end = arr[3];
    let valid = isNil(start) ||
        (isNumber(start) && start >= 0 && Math.round(start) === start);
    valid =
        valid &&
            (isNil(end) || (isNumber(end) && end >= 0 && Math.round(end) === end));
    assert(valid, errorMsg);
    start = start || 0;
    end = end || str.length;
    if (start > end)
        return -1;
    const index = str.substring(start, end).indexOf(searchStr);
    return index > -1 ? index + start : index;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/string/_internal.js


/* eslint-disable*/
const WHITESPACE_CHARS = (/* unused pure expression or super */ null && ([
    0x0000,
    0x0020,
    0x0009,
    0x000a,
    0x000b,
    0x000c,
    0x000d,
    0x00a0,
    0x1680,
    0x2000,
    0x2001,
    0x2002,
    0x2003,
    0x2004,
    0x2005,
    0x2006,
    0x2007,
    0x2008,
    0x2009,
    0x200a // Hair space
]));
/**
 * Trims the resolved string
 *
 * @param obj
 * @param expr
 * @param options
 */
function _internal_trimString(obj, expr, options, trimOpts) {
    const val = computeValue(obj, expr, null, options);
    const s = val.input;
    if (isNil(s))
        return null;
    const codepoints = isNil(val.chars)
        ? WHITESPACE_CHARS
        : val.chars.split("").map((c) => c.codePointAt(0));
    let i = 0;
    let j = s.length - 1;
    while (trimOpts.left &&
        i <= j &&
        codepoints.indexOf(s[i].codePointAt(0)) !== -1)
        i++;
    while (trimOpts.right &&
        i <= j &&
        codepoints.indexOf(s[j].codePointAt(0)) !== -1)
        j--;
    return s.substring(i, j + 1);
}
/**
 * Performs a regex search
 *
 * @param obj
 * @param expr
 * @param opts
 */
function _internal_regexSearch(obj, expr, options, reOpts) {
    const val = computeValue(obj, expr, null, options);
    if (!isString(val.input))
        return [];
    const regexOptions = val.options;
    if (regexOptions) {
        assert(regexOptions.indexOf("x") === -1, "extended capability option 'x' not supported");
        assert(regexOptions.indexOf("g") === -1, "global option 'g' not supported");
    }
    let input = val.input;
    const re = new RegExp(val.regex, regexOptions);
    let m;
    const matches = new Array();
    let offset = 0;
    while ((m = re.exec(input))) {
        const result = {
            match: m[0],
            idx: m.index + offset,
            captures: []
        };
        for (let i = 1; i < m.length; i++)
            result.captures.push(m[i] || null);
        matches.push(result);
        if (!reOpts.global)
            break;
        offset = m.index + m[0].length;
        input = input.substring(offset);
    }
    return matches;
}
/*eslint-enable*/

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/string/ltrim.js
/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

/**
 * Removes whitespace characters, including null, or the specified characters from the beginning of a string.
 *
 * @param obj
 * @param expr
 */
const $ltrim = (obj, expr, options) => {
    return trimString(obj, expr, options, { left: true, right: false });
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/string/regexFind.js
/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

/**
 * Applies a regular expression (regex) to a string and returns information on the first matched substring.
 *
 * @param obj
 * @param expr
 */
const $regexFind = (obj, expr, options) => {
    const result = regexSearch(obj, expr, options, { global: false });
    return result && result.length > 0 ? result[0] : null;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/string/regexFindAll.js
/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

/**
 * Applies a regular expression (regex) to a string and returns information on the all matched substrings.
 *
 * @param obj
 * @param expr
 */
const $regexFindAll = (obj, expr, options) => {
    return regexSearch(obj, expr, options, { global: true });
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/string/regexMatch.js
/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

/**
 * Applies a regular expression (regex) to a string and returns a boolean that indicates if a match is found or not.
 *
 * @param obj
 * @param expr
 */
const $regexMatch = (obj, expr, options) => {
    return regexSearch(obj, expr, options, { global: false }).length != 0;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/string/replaceAll.js
/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */


/**
 * Replaces all instances of a matched string in a given input.
 *
 * @param  {Object} obj
 * @param  {Array} expr
 */
const $replaceAll = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    const arr = [args.input, args.find, args.replacement];
    if (arr.some(isNil))
        return null;
    assert(arr.every(isString), "$replaceAll expression fields must evaluate to string");
    return args.input.replace(new RegExp(args.find, "g"), args.replacement);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/string/replaceOne.js
/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */


/**
 * Replaces the first instance of a matched string in a given input.
 *
 * @param  {Object} obj
 * @param  {Array} expr
 */
const $replaceOne = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    const arr = [args.input, args.find, args.replacement];
    if (arr.some(isNil))
        return null;
    assert(arr.every(isString), "$replaceOne expression fields must evaluate to string");
    return args.input.replace(args.find, args.replacement);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/string/rtrim.js
/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

/**
 * Removes whitespace characters, including null, or the specified characters from the end of a string.
 *
 * @param obj
 * @param expr
 */
const $rtrim = (obj, expr, options) => {
    return trimString(obj, expr, options, { left: false, right: true });
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/string/split.js
/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */


/**
 * Splits a string into substrings based on a delimiter.
 * If the delimiter is not found within the string, returns an array containing the original string.
 *
 * @param  {Object} obj
 * @param  {Array} expr
 * @return {Array} Returns an array of substrings.
 */
const $split = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    if (isNil(args[0]))
        return null;
    assert(args.every(isString), "$split expression must result to array(2) of strings");
    return args[0].split(args[1]);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/string/strcasecmp.js
/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */


/**
 * Compares two strings and returns an integer that reflects the comparison.
 *
 * @param obj
 * @param expr
 * @returns {number}
 */
const $strcasecmp = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    let a = args[0];
    let b = args[1];
    if (isEqual(a, b) || args.every(isNil))
        return 0;
    assert(args.every(isString), "$strcasecmp must resolve to array(2) of strings");
    a = a.toUpperCase();
    b = b.toUpperCase();
    return (a > b && 1) || (a < b && -1) || 0;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/string/strLenBytes.js
/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

/**
 * Returns the number of UTF-8 encoded bytes in the specified string.
 *
 * @param  {Object} obj
 * @param  {String} expr
 * @return {Number}
 */
const $strLenBytes = (obj, expr, options) => {
    return ~-encodeURI(computeValue(obj, expr, null, options)).split(/%..|./).length;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/string/strLenCP.js
/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

/**
 * Returns the number of UTF-8 code points in the specified string.
 *
 * @param  {Object} obj
 * @param  {String} expr
 * @return {Number}
 */
const $strLenCP = (obj, expr, options) => {
    return computeValue(obj, expr, null, options).length;
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/string/substr.js
/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */


/**
 * Returns a substring of a string, starting at a specified index position and including the specified number of characters.
 * The index is zero-based.
 *
 * @param obj
 * @param expr
 * @returns {string}
 */
const substr_$substr = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    const s = args[0];
    const index = args[1];
    const count = args[2];
    if (isString(s)) {
        if (index < 0) {
            return "";
        }
        else if (count < 0) {
            return s.substr(index);
        }
        else {
            return s.substr(index, count);
        }
    }
    return "";
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/string/substrBytes.js
/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */


const UTF8_MASK = (/* unused pure expression or super */ null && ([0xc0, 0xe0, 0xf0]));
// encodes a unicode code point to a utf8 byte sequence
// https://encoding.spec.whatwg.org/#utf-8
function toUtf8(n) {
    if (n < 0x80)
        return [n];
    let count = (n < 0x0800 && 1) || (n < 0x10000 && 2) || 3;
    const offset = UTF8_MASK[count - 1];
    const utf8 = [(n >> (6 * count)) + offset];
    while (count > 0)
        utf8.push(0x80 | ((n >> (6 * --count)) & 0x3f));
    return utf8;
}
function utf8Encode(s) {
    const buf = [];
    for (let i = 0, len = s.length; i < len; i++) {
        buf.push(toUtf8(s.codePointAt(i)));
    }
    return buf;
}
/**
 * Returns a substring of a string, starting at a specified index position and including the specified number of characters.
 * The index is zero-based.
 *
 * @param obj
 * @param expr
 * @returns {string}
 */
const $substrBytes = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    const s = args[0];
    const index = args[1];
    const count = args[2];
    assert(isString(s) &&
        isNumber(index) &&
        index >= 0 &&
        isNumber(count) &&
        count >= 0, "$substrBytes: invalid arguments");
    const buf = utf8Encode(s);
    const validIndex = [];
    let acc = 0;
    for (let i = 0; i < buf.length; i++) {
        validIndex.push(acc);
        acc += buf[i].length;
    }
    const begin = validIndex.indexOf(index);
    const end = validIndex.indexOf(index + count);
    assert(begin > -1 && end > -1, "$substrBytes: invalid range, start or end index is a UTF-8 continuation byte.");
    return s.substring(begin, end);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/string/substrCP.js
/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

const $substrCP = (obj, expr, options) => {
    return $substr(obj, expr, options);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/string/toLower.js
/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */


/**
 * Converts a string to lowercase.
 *
 * @param obj
 * @param expr
 * @returns {string}
 */
const $toLower = (obj, expr, options) => {
    const value = computeValue(obj, expr, null, options);
    return isEmpty(value) ? "" : value.toLowerCase();
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/string/toUpper.js
/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */


/**
 * Converts a string to uppercase.
 *
 * @param obj
 * @param expr
 * @returns {string}
 */
const $toUpper = (obj, expr, options) => {
    const value = computeValue(obj, expr, null, options);
    return isEmpty(value) ? "" : value.toUpperCase();
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/string/trim.js
/**
 * String Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#string-expression-operators
 */

/**
 * Removes whitespace characters, including null, or the specified characters from the beginning and end of a string.
 *
 * @param obj
 * @param expr
 */
const $trim = (obj, expr, options) => {
    return trimString(obj, expr, options, { left: true, right: true });
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/string/index.js




















;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/trignometry/_internal.js
// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

const FIXED_POINTS = {
    undefined: null,
    null: null,
    NaN: NaN,
    Infinity: new Error(),
    "-Infinity": new Error()
};
/**
 * Returns an operator for a given trignometric function
 *
 * @param f The trignometric function
 */
function createTrignometryOperator(f, fixedPoints = FIXED_POINTS) {
    const fp = Object.assign({}, FIXED_POINTS, fixedPoints);
    const keySet = new Set(Object.keys(fp));
    return (obj, expr, options) => {
        const n = core_computeValue(obj, expr, null, options);
        if (keySet.has(`${n}`)) {
            const res = fp[`${n}`];
            if (res instanceof Error) {
                throw new Error(`cannot apply $${f.name} to -inf, value must in (-inf,inf)`);
            }
            return res;
        }
        return f(n);
    };
}

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/trignometry/acos.js
// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

/** Returns the inverse cosine (arc cosine) of a value in radians. */
const $acos = createTrignometryOperator(Math.acos, {
    Infinity: Infinity,
    0: new Error(),
});

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/trignometry/acosh.js
// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

/** Returns the inverse hyperbolic cosine (hyperbolic arc cosine) of a value in radians. */
const $acosh = createTrignometryOperator(Math.acosh, {
    Infinity: Infinity,
    0: new Error(),
});

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/trignometry/asin.js
// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

/** Returns the inverse sin (arc sine) of a value in radians. */
const $asin = createTrignometryOperator(Math.asin);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/trignometry/asinh.js
// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

/** Returns the inverse hyperbolic sine (hyperbolic arc sine) of a value in radians. */
const $asinh = createTrignometryOperator(Math.asinh, {
    Infinity: Infinity,
    "-Infinity": -Infinity,
});

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/trignometry/atan.js
// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

/** Returns the inverse tangent (arc tangent) of a value in radians. */
const $atan = createTrignometryOperator(Math.atan);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/trignometry/atan2.js
// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators


/**
 * Returns the inverse tangent (arc tangent) of y / x in radians, where y and x are the first and second values passed to the expression respectively. */
const $atan2 = (obj, expr, options) => {
    const [y, x] = computeValue(obj, expr, null, options);
    if (isNaN(y) || isNil(y))
        return y;
    if (isNaN(x) || isNil(x))
        return x;
    return Math.atan2(y, x);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/trignometry/atanh.js
// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

/** Returns the inverse hyperbolic tangent (hyperbolic arc tangent) of a value in radians. */
const $atanh = createTrignometryOperator(Math.atanh, {
    1: Infinity,
    "-1": -Infinity,
});

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/trignometry/cos.js
// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

/** Returns the cosine of a value that is measured in radians. */
const $cos = createTrignometryOperator(Math.cos);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/trignometry/cosh.js
// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

/** Returns the hyperbolic cosine of a value that is measured in radians. */
const $cosh = createTrignometryOperator(Math.cosh, {
    "-Infinity": Infinity,
    Infinity: Infinity,
    // [Math.PI]: -1,
});

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/trignometry/degreesToRadians.js
// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

const RADIANS_FACTOR = Math.PI / 180;
/** Converts a value from degrees to radians. */
const $degreesToRadians = createTrignometryOperator((n) => n * RADIANS_FACTOR, {
    Infinity: Infinity,
    "-Infinity": Infinity,
});

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/trignometry/radiansToDegrees.js
// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

const DEGREES_FACTOR = 180 / Math.PI;
/** Converts a value from radians to degrees. */
const $radiansToDegrees = createTrignometryOperator((n) => n * DEGREES_FACTOR, {
    Infinity: Infinity,
    "-Infinity": -Infinity,
});

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/trignometry/sin.js
// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

/** Returns the sine of a value that is measured in radians. */
const $sin = createTrignometryOperator(Math.sin);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/trignometry/sinh.js
// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

/** Returns the hyperbolic sine of a value that is measured in radians. */
const $sinh = createTrignometryOperator(Math.sinh, {
    "-Infinity": -Infinity,
    Infinity: Infinity,
});

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/trignometry/tan.js
// Trignometry Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#trigonometry-expression-operators

/** Returns the tangent of a value that is measured in radians. */
const $tan = createTrignometryOperator(Math.tan);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/trignometry/index.js















;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/type/_internal.js


class _internal_TypeConvertError extends (/* unused pure expression or super */ null && (Error)) {
    constructor(message) {
        super(message);
    }
}
function _internal_toInteger(obj, expr, options, max, min, typename) {
    const val = computeValue(obj, expr, null, options);
    if (isNil(val))
        return null;
    if (val instanceof Date)
        return val.getTime();
    if (val === true)
        return 1;
    if (val === false)
        return 0;
    const n = Number(val);
    if (isNumber(n) && n >= min && n <= max) {
        // weirdly a decimal in string format cannot be converted to int.
        // so we must check input if not string or if it is, not in decimal format
        if (!isString(val) || n.toString().indexOf(".") === -1) {
            return Math.trunc(n);
        }
    }
    throw new _internal_TypeConvertError(`cannot convert '${val}' to ${typename}`);
}

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/type/toBool.js
/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */


/**
 * Converts a value to a boolean.
 *
 * @param obj
 * @param expr
 */
const toBool_$toBool = (obj, expr, options) => {
    const val = computeValue(obj, expr, null, options);
    if (isNil(val))
        return null;
    if (isString(val))
        return true;
    return Boolean(val);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/type/toDate.js
/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */



/**
 * Converts a value to a date. If the value cannot be converted to a date, $toDate errors. If the value is null or missing, $toDate returns null.
 *
 * @param obj
 * @param expr
 */
const toDate_$toDate = (obj, expr, options) => {
    const val = computeValue(obj, expr, null, options);
    if (val instanceof Date)
        return val;
    if (isNil(val))
        return null;
    const d = new Date(val);
    const n = d.getTime();
    if (!isNaN(n))
        return d;
    throw new TypeConvertError(`cannot convert '${val}' to date`);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/type/toDouble.js
/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */



/**
 * Converts a value to a double. If the value cannot be converted to an double, $toDouble errors. If the value is null or missing, $toDouble returns null.
 *
 * @param obj
 * @param expr
 */
const toDouble_$toDouble = (obj, expr, options) => {
    const val = computeValue(obj, expr, null, options);
    if (isNil(val))
        return null;
    if (val instanceof Date)
        return val.getTime();
    if (val === true)
        return 1;
    if (val === false)
        return 0;
    const n = Number(val);
    if (isNumber(n))
        return n;
    throw new TypeConvertError(`cannot convert '${val}' to double/decimal`);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/type/toInt.js
/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */


/**
 * Converts a value to an integer. If the value cannot be converted to an integer, $toInt errors. If the value is null or missing, $toInt returns null.
 * @param obj
 * @param expr
 */
const toInt_$toInt = (obj, expr, options) => {
    return toInteger(obj, expr, options, MAX_INT, MIN_INT, "int");
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/type/toLong.js
/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */


/**
 * Converts a value to a long. If the value cannot be converted to a long, $toLong errors. If the value is null or missing, $toLong returns null.
 * @param obj
 * @param expr
 */
const toLong_$toLong = (obj, expr, options) => {
    return toInteger(obj, expr, options, MAX_LONG, MIN_LONG, "long");
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/type/toString.js
/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */



const toString_$toString = (obj, expr, options) => {
    const val = computeValue(obj, expr, null, options);
    if (isNil(val))
        return null;
    if (val instanceof Date) {
        const dateExpr = {
            date: expr,
            format: "%Y-%m-%dT%H:%M:%S.%LZ"
        };
        return $dateToString(obj, dateExpr, options);
    }
    else {
        return val.toString();
    }
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/type/convert.js
/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */









/**
 * Converts a value to a specified type.
 *
 * @param obj
 * @param expr
 */
const $convert = (obj, expr, options) => {
    const args = computeValue(obj, expr, null, options);
    args.onNull = args.onNull === undefined ? null : args.onNull;
    if (isNil(args.input))
        return args.onNull;
    try {
        switch (args.to) {
            case 2:
            case "string":
                return $toString(obj, args.input, options);
            case 8:
            case "boolean":
            case "bool":
                return $toBool(obj, args.input, options);
            case 9:
            case "date":
                return $toDate(obj, args.input, options);
            case 1:
            case 19:
            case "double":
            case "decimal":
            case "number":
                return $toDouble(obj, args.input, options);
            case 16:
            case "int":
                return $toInt(obj, args.input, options);
            case 18:
            case "long":
                return $toLong(obj, args.input, options);
        }
    }
    catch (e) {
        /*nothing to do*/
    }
    if (args.onError !== undefined)
        return args.onError;
    throw new TypeConvertError(`could not convert to type ${args.to}.`);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/type/isNumber.js
/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */


/**
 * Checks if the specified expression resolves to a numeric value
 *
 * @param obj
 * @param expr
 */
const $isNumber = (obj, expr, options) => {
    const n = computeValue(obj, expr, null, options);
    return isNumber(n);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/type/toDecimal.js
/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */

/**
 * Converts a value to a decimal. If the value cannot be converted to a decimal, $toDecimal errors.
 * If the value is null or missing, $toDecimal returns null.
 * This is just an alias for `$toDouble` in this library.
 */
const $toDecimal = (/* unused pure expression or super */ null && ($toDouble));

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/type/type.js
/**
 * Type Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#type-expression-operators
 */


const type_$type = (obj, expr, options) => {
    const val = computeValue(obj, expr, null, options);
    const typename = getType(val);
    const nativeType = typename.toLowerCase();
    switch (nativeType) {
        case "boolean":
            return "bool";
        case "number":
            if (val.toString().indexOf(".") >= 0)
                return "double";
            return val >= MIN_INT && val <= MAX_INT ? "int" : "long";
        case "regexp":
            return "regex";
        default:
            return nativeType;
    }
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/type/index.js











;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/variable/let.js
/**
 * Variable Expression Operators: https://docs.mongodb.com/manual/reference/operator/aggregation/#variable-expression-operators
 */

/**
 * Defines variables for use within the scope of a sub-expression and returns the result of the sub-expression.
 *
 * @param obj The target object for this expression
 * @param expr The right-hand side of the operator
 * @param options Options to use for this operattion
 * @returns {*}
 */
const $let = (obj, expr, options) => {
    // resolve vars
    const variables = {};
    for (const [key, val] of Object.entries(expr.vars)) {
        variables[key] = computeValue(obj, val, null, options);
    }
    return computeValue(obj, expr.in, null, ComputeOptions.init(options, obj, { variables }));
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/variable/index.js


;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/expression/index.js



















;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/merge.js




/**
 * Writes the resulting documents of the aggregation pipeline to a collection.
 *
 * The stage can incorporate (insert new documents, merge documents, replace documents,
 * keep existing documents, fail the operation, process documents with a custom update pipeline)
 * the results into an output collection. To use the $merge stage, it must be the last stage in the pipeline.
 *
 * Note: Object are deep cloned for outputing regardless of the ProcessingMode.
 *
 * @param collection
 * @param expr
 * @param options
 * @returns {*}
 */
const $merge = (collection, expr, options) => {
    const output = isString(expr.into)
        ? options === null || options === void 0 ? void 0 : options.collectionResolver(expr.into)
        : expr.into;
    assert(output instanceof Array, `$merge: option 'into' must resolve to an array`);
    const onField = expr.on || options.idKey;
    const getHash = (o) => {
        const val = isString(onField)
            ? resolve(o, onField)
            : onField.map(s => resolve(o, s));
        return hashCode(val, options.hashFunction);
    };
    const hash = {};
    // we assuming the lookup expressions are unique
    for (let i = 0; i < output.length; i++) {
        const obj = output[i];
        const k = getHash(obj);
        assert(!hash[k], "$merge: 'into' collection must have unique entries for the 'on' field.");
        hash[k] = [obj, i];
    }
    const copts = ComputeOptions.init(options);
    return collection.map((o) => {
        const k = getHash(o);
        if (hash[k]) {
            const [target, i] = hash[k];
            // compute variables
            const variables = computeValue(target, expr.let || { new: "$$ROOT" }, null, 
            // 'root' is the item from the iteration.
            copts.update(o));
            if (isArray(expr.whenMatched)) {
                const aggregator = new Aggregator(expr.whenMatched, Object.assign(Object.assign({}, options), { variables }));
                output[i] = aggregator.run([target])[0];
            }
            else {
                switch (expr.whenMatched) {
                    case "replace":
                        output[i] = o;
                        break;
                    case "fail":
                        throw new Error("$merge: failed due to matching as specified by 'whenMatched' option.");
                    case "keepExisting":
                        break;
                    case "merge":
                    default:
                        output[i] = $mergeObjects(target, [target, o], 
                        // 'root' is the item from the iteration.
                        copts.update(o, { variables }));
                        break;
                }
            }
        }
        else {
            switch (expr.whenNotMatched) {
                case "discard":
                    break;
                case "fail":
                    throw new Error("$merge: failed due to matching as specified by 'whenMatched' option.");
                case "insert":
                default:
                    output.push(o);
                    break;
            }
        }
        return o; // passthrough
    });
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/out.js

/**
 * Takes the documents returned by the aggregation pipeline and writes them to a specified collection.
 *
 * Unlike the $out operator in MongoDB, this operator can appear in any position in the pipeline and is
 * useful for collecting intermediate results of an aggregation operation.
 *
 * Note: Object are deep cloned for outputing regardless of the ProcessingMode.
 *
 * @param collection
 * @param expr
 * @param options
 * @returns {*}
 */
const $out = (collection, expr, options) => {
    const outputColl = isString(expr)
        ? options === null || options === void 0 ? void 0 : options.collectionResolver(expr)
        : expr;
    assert(outputColl instanceof Array, `expression must resolve to an array`);
    return collection.map((o) => {
        outputColl.push(cloneDeep(o));
        return o; // passthrough
    });
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/project.js


/**
 * Reshapes a document stream.
 * $project can rename, add, or remove fields as well as create computed values and sub-documents.
 *
 * @param collection
 * @param expr
 * @param opt
 * @returns {Array}
 */
const project_$project = (collection, expr, options) => {
    if (util_isEmpty(expr))
        return collection;
    // result collection
    let expressionKeys = Object.keys(expr);
    let idOnlyExcluded = false;
    // validate inclusion and exclusion
    validateExpression(expr, options);
    const ID_KEY = options.idKey;
    if (util_inArray(expressionKeys, ID_KEY)) {
        const id = expr[ID_KEY];
        if (id === 0 || id === false) {
            expressionKeys = expressionKeys.filter(util_notInArray.bind(null, [ID_KEY]));
            idOnlyExcluded = expressionKeys.length == 0;
        }
    }
    else {
        // if not specified the add the ID field
        expressionKeys.push(ID_KEY);
    }
    const copts = core_ComputeOptions.init(options);
    return collection.map(((obj) => processObject(obj, expr, copts.update(obj), expressionKeys, idOnlyExcluded)));
};
/**
 * Process the expression value for $project operators
 *
 * @param {Object} obj The object to use as options
 * @param {Object} expr The experssion object of $project operator
 * @param {Array} expressionKeys The key in the 'expr' object
 * @param {Boolean} idOnlyExcluded Boolean value indicating whether only the ID key is excluded
 */
function processObject(obj, expr, options, expressionKeys, idOnlyExcluded) {
    let newObj = {};
    let foundSlice = false;
    let foundExclusion = false;
    const dropKeys = [];
    if (idOnlyExcluded) {
        dropKeys.push(options.idKey);
    }
    for (const key of expressionKeys) {
        // final computed value of the key
        let value = undefined;
        // expression to associate with key
        const subExpr = expr[key];
        if (key !== options.idKey && util_inArray([0, false], subExpr)) {
            foundExclusion = true;
        }
        if (key === options.idKey && util_isEmpty(subExpr)) {
            // tiny optimization here to skip over id
            value = obj[key];
        }
        else if (util_isString(subExpr)) {
            value = core_computeValue(obj, subExpr, key, options);
        }
        else if (util_inArray([1, true], subExpr)) {
            // For direct projections, we use the resolved object value
        }
        else if (subExpr instanceof Array) {
            value = subExpr.map(v => {
                const r = core_computeValue(obj, v, null, options);
                if (util_isNil(r))
                    return null;
                return r;
            });
        }
        else if (esm_util_isObject(subExpr)) {
            const subExprObj = subExpr;
            const subExprKeys = Object.keys(subExpr);
            const operator = subExprKeys.length == 1 ? subExprKeys[0] : "";
            // first try a projection operator
            const call = core_getOperator(core_OperatorType.PROJECTION, operator, options);
            if (call) {
                // apply the projection operator on the operator expression for the key
                if (operator === "$slice") {
                    // $slice is handled differently for aggregation and projection operations
                    if (util_ensureArray(subExprObj[operator]).every(util_isNumber)) {
                        // $slice for projection operation
                        value = call(obj, subExprObj[operator], key, options);
                        foundSlice = true;
                    }
                    else {
                        // $slice for aggregation operation
                        value = core_computeValue(obj, subExprObj, key, options);
                    }
                }
                else {
                    value = call(obj, subExprObj[operator], key, options);
                }
            }
            else if (util_isOperator(operator)) {
                // compute if operator key
                value = core_computeValue(obj, subExprObj[operator], operator, options);
            }
            else if (util_has(obj, key)) {
                // compute the value for the sub expression for the key
                validateExpression(subExprObj, options);
                let target = obj[key];
                if (target instanceof Array) {
                    value = target.map((o) => processObject(o, subExprObj, options, subExprKeys, false));
                }
                else {
                    target = esm_util_isObject(target) ? target : obj;
                    value = processObject(target, subExprObj, options, subExprKeys, false);
                }
            }
            else {
                // compute the value for the sub expression for the key
                value = core_computeValue(obj, subExpr, null, options);
            }
        }
        else {
            dropKeys.push(key);
            continue;
        }
        // get value with object graph
        const objPathGraph = util_resolveGraph(obj, key, {
            preserveMissing: true
        });
        // add the value at the path
        if (objPathGraph !== undefined) {
            util_merge(newObj, objPathGraph, {
                flatten: true
            });
        }
        // if computed add/or remove accordingly
        if (util_notInArray([0, 1, false, true], subExpr)) {
            if (value === undefined) {
                util_removeValue(newObj, key, { descendArray: true });
            }
            else {
                util_setValue(newObj, key, value);
            }
        }
    }
    // filter out all missing values preserved to support correct merging
    filterMissing(newObj);
    // For the following cases we include all keys on the object that were not explicitly excluded.
    //
    // 1. projection included $slice operator
    // 2. some fields were explicitly excluded
    // 3. only the id field was excluded
    if (foundSlice || foundExclusion || idOnlyExcluded) {
        newObj = util_into({}, obj, newObj);
        if (dropKeys.length > 0) {
            for (const k of dropKeys) {
                util_removeValue(newObj, k, { descendArray: true });
            }
        }
    }
    return newObj;
}
/**
 * Validate inclusion and exclusion values in expression
 *
 * @param {Object} expr The expression given for the projection
 */
function validateExpression(expr, options) {
    const check = [false, false];
    for (const [k, v] of Object.entries(expr)) {
        if (k === (options === null || options === void 0 ? void 0 : options.idKey))
            return;
        if (v === 0 || v === false) {
            check[0] = true;
        }
        else if (v === 1 || v === true) {
            check[1] = true;
        }
        util_assert(!(check[0] && check[1]), "Projection cannot have a mix of inclusion and exclusion.");
    }
}

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/redact.js

/**
 * Restricts the contents of the documents based on information stored in the documents themselves.
 *
 * https://docs.mongodb.com/manual/reference/operator/aggregation/redact/
 */
const $redact = (collection, expr, options) => {
    const copts = ComputeOptions.init(options);
    return collection.map(((obj) => redact(obj, expr, copts.update(obj))));
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/replaceRoot.js


/**
 * Replaces a document with the specified embedded document or new one.
 * The replacement document can be any valid expression that resolves to a document.
 *
 * https://docs.mongodb.com/manual/reference/operator/aggregation/replaceRoot/
 *
 * @param  {Iterator} collection
 * @param  {Object} expr
 * @param  {Object} options
 * @return {*}
 */
const replaceRoot_$replaceRoot = (collection, expr, options) => {
    return collection.map(obj => {
        obj = computeValue(obj, expr.newRoot, null, options);
        assert(isObject(obj), "$replaceRoot expression must return an object");
        return obj;
    });
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/replaceWith.js

/**
 * Alias for $replaceRoot
 */
const $replaceWith = (/* unused pure expression or super */ null && ($replaceRoot));

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/set.js

/**
 * Alias for $addFields.
 */
const $set = (/* unused pure expression or super */ null && ($addFields));

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/sortByCount.js


/**
 * Groups incoming documents based on the value of a specified expression,
 * then computes the count of documents in each distinct group.
 *
 * https://docs.mongodb.com/manual/reference/operator/aggregation/sortByCount/
 *
 * @param  {Array} collection
 * @param  {Object} expr
 * @param  {Object} options
 * @return {*}
 */
const $sortByCount = (collection, expr, options) => {
    const newExpr = { count: { $sum: 1 } };
    newExpr["_id"] = expr;
    return $sort($group(collection, newExpr, options), { count: -1 }, options);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/unionWith.js



/**
 * Performs a union of two collections.
 *
 * @param collection
 * @param expr
 * @param opt
 */
const $unionWith = (collection, expr, options) => {
    const array = isString(expr.coll)
        ? options.collectionResolver(expr.coll)
        : expr.coll;
    const iterators = [collection];
    iterators.push(expr.pipeline
        ? new Aggregator(expr.pipeline, options).stream(array)
        : Lazy(array));
    return compose(...iterators);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/unset.js


/**
 * Removes/excludes fields from documents.
 *
 * @param collection
 * @param expr
 * @param options
 * @returns {Iterator}
 */
const $unset = (collection, expr, options) => {
    expr = ensureArray(expr);
    const doc = {};
    for (const k of expr)
        doc[k] = 0;
    return $project(collection, doc, options);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/unwind.js


/**
 * Takes an array of documents and returns them as a stream of documents.
 *
 * @param collection
 * @param expr
 * @param options
 * @returns {Array}
 */
const $unwind = (collection, expr, _options) => {
    if (isString(expr))
        expr = { path: expr };
    const path = expr.path;
    const field = path.substring(1);
    const includeArrayIndex = (expr === null || expr === void 0 ? void 0 : expr.includeArrayIndex) || false;
    const preserveNullAndEmptyArrays = expr.preserveNullAndEmptyArrays || false;
    const format = (o, i) => {
        if (includeArrayIndex !== false)
            o[includeArrayIndex] = i;
        return o;
    };
    let value;
    return Lazy(() => {
        for (;;) {
            // take from lazy sequence if available
            if (value instanceof Iterator) {
                const tmp = value.next();
                if (!tmp.done)
                    return tmp;
            }
            // fetch next object
            const wrapper = collection.next();
            if (wrapper.done)
                return wrapper;
            // unwrap value
            const obj = wrapper.value;
            // get the value of the field to unwind
            value = resolve(obj, field);
            // throw error if value is not an array???
            if (value instanceof Array) {
                if (value.length === 0 && preserveNullAndEmptyArrays === true) {
                    value = null; // reset unwind value
                    removeValue(obj, field);
                    return { value: format(obj, null), done: false };
                }
                else {
                    // construct a lazy sequence for elements per value
                    value = Lazy(value).map(((item, i) => {
                        const newObj = resolveGraph(obj, field, {
                            preserveKeys: true
                        });
                        setValue(newObj, field, item);
                        return format(newObj, i);
                    }));
                }
            }
            else if (!isEmpty(value) || preserveNullAndEmptyArrays === true) {
                return { value: format(obj, null), done: false };
            }
        }
    });
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/pipeline/index.js
/**
 * Pipeline Aggregation Stages. https://docs.mongodb.com/manual/reference/operator/aggregation-
 */


























;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/logical/and.js
// Query Logical Operators: https://docs.mongodb.com/manual/reference/operator/query-logical/


/**
 * Joins query clauses with a logical AND returns all documents that match the conditions of both clauses.
 *
 * @param selector
 * @param rhs
 * @returns {Function}
 */
const and_$and = (_, rhs, options) => {
    util_assert(util_isArray(rhs), "Invalid expression: $and expects value to be an Array.");
    const queries = rhs.map(expr => new query_Query(expr, options));
    return (obj) => queries.every(q => q.test(obj));
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/logical/or.js
// Query Logical Operators: https://docs.mongodb.com/manual/reference/operator/query-logical/


/**
 * Joins query clauses with a logical OR returns all documents that match the conditions of either clause.
 *
 * @param selector
 * @param rhs
 * @returns {Function}
 */
const or_$or = (_, rhs, options) => {
    util_assert(util_isArray(rhs), "Invalid expression. $or expects value to be an Array");
    const queries = rhs.map(expr => new query_Query(expr, options));
    return (obj) => queries.some(q => q.test(obj));
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/logical/nor.js
// Query Logical Operators: https://docs.mongodb.com/manual/reference/operator/query-logical/


/**
 * Joins query clauses with a logical NOR returns all documents that fail to match both clauses.
 *
 * @param selector
 * @param rhs
 * @returns {Function}
 */
const $nor = (_, rhs, options) => {
    util_assert(util_isArray(rhs), "Invalid expression. $nor expects value to be an array.");
    const f = or_$or("$or", rhs, options);
    return (obj) => !f(obj);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/logical/not.js
// Query Logical Operators: https://docs.mongodb.com/manual/reference/operator/query-logical/


/**
 * Inverts the effect of a query expression and returns documents that do not match the query expression.
 *
 * @param selector
 * @param rhs
 * @returns {Function}
 */
const not_$not = (selector, rhs, options) => {
    const criteria = {};
    criteria[selector] = normalize(rhs);
    const query = new query_Query(criteria, options);
    return (obj) => !query.test(obj);
};

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/logical/index.js





;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/comparison/eq.js
// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

/**
 * Matches values that are equal to a specified value.
 */
const comparison_eq_$eq = createQueryOperator($eq);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/comparison/gt.js
// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

/**
 * Matches values that are greater than a specified value.
 */
const comparison_gt_$gt = createQueryOperator($gt);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/comparison/gte.js
// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

/**
 * 	Matches values that are greater than or equal to a specified value.
 */
const comparison_gte_$gte = createQueryOperator($gte);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/comparison/in.js
// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

/**
 * Matches any of the values that exist in an array specified in the query.
 */
const in_$in = createQueryOperator(_predicates_$in);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/comparison/lt.js
// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

/**
 * Matches values that are less than the value specified in the query.
 */
const comparison_lt_$lt = createQueryOperator($lt);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/comparison/lte.js
// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

/**
 * Matches values that are less than or equal to the value specified in the query.
 */
const comparison_lte_$lte = createQueryOperator($lte);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/comparison/ne.js
// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

/**
 * Matches all values that are not equal to the value specified in the query.
 */
const comparison_ne_$ne = createQueryOperator($ne);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/comparison/nin.js
// Query Comparison Operators: https://docs.mongodb.com/manual/reference/operator/query-comparison/

/**
 * Matches values that do not exist in an array specified to the query.
 */
const comparison_nin_$nin = createQueryOperator($nin);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/comparison/index.js









;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/evaluation/expr.js
// Query Evaluation Operators: https://docs.mongodb.com/manual/reference/operator/query-evaluation/

/**
 * Allows the use of aggregation expressions within the query language.
 *
 * @param selector
 * @param rhs
 * @returns {Function}
 */
function $expr(_, rhs, options) {
    return obj => computeValue(obj, rhs, null, options);
}

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/evaluation/mod.js
// Query Evaluation Operators: https://docs.mongodb.com/manual/reference/operator/query-evaluation/

/**
 * Performs a modulo operation on the value of a field and selects documents with a specified result.
 */
const mod_$mod = createQueryOperator(_predicates_$mod);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/evaluation/regex.js
// Query Evaluation Operators: https://docs.mongodb.com/manual/reference/operator/query-evaluation/

/**
 * Selects documents where values match a specified regular expression.
 */
const regex_$regex = createQueryOperator($regex);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/evaluation/where.js
// Query Evaluation Operators: https://docs.mongodb.com/manual/reference/operator/query-evaluation/

/* eslint-disable */
/**
 * Matches documents that satisfy a JavaScript expression.
 *
 * @param selector
 * @param rhs
 * @returns {Function}
 */
function $where(_, rhs, options) {
    assert(options.scriptEnabled, "$where operator requires 'scriptEnabled' option to be true");
    const f = rhs;
    assert(isFunction(f), "$where only accepts a Function object");
    return (obj) => truthy(f.call(obj), options === null || options === void 0 ? void 0 : options.useStrictMode);
}

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/evaluation/index.js






;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/array/all.js
// Query Array Operators: https://docs.mongodb.com/manual/reference/operator/query-array/

/**
 * Matches arrays that contain all elements specified in the query.
 */
const all_$all = createQueryOperator($all);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/array/elemMatch.js
// Query Array Operators: https://docs.mongodb.com/manual/reference/operator/query-array/

/**
 * Selects documents if element in the array field matches all the specified $elemMatch conditions.
 */
const elemMatch_$elemMatch = createQueryOperator($elemMatch);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/array/size.js
// Query Array Operators: https://docs.mongodb.com/manual/reference/operator/query-array/

/**
 * Selects documents if the array field is a specified size.
 */
const array_size_$size = createQueryOperator($size);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/array/index.js




;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/element/exists.js
// Query Element Operators: https://docs.mongodb.com/manual/reference/operator/query-element/

/**
 * Matches documents that have the specified field.
 */
const exists_$exists = createQueryOperator($exists);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/element/type.js
// Query Element Operators: https://docs.mongodb.com/manual/reference/operator/query-element/

/**
 * Selects documents if a field is of the specified type.
 */
const element_type_$type = createQueryOperator($type);

;// CONCATENATED MODULE: ./node_modules/mingo/dist/esm/operators/query/element/index.js



;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/rx-query-mingo.js








var mingoInitDone = false;

/**
 * The MongoDB query library is huge and we do not need all the operators.
 * If you add an operator here, make sure that you properly add a test in
 * the file /test/unit/rx-storage-query-correctness.test.ts
 *
 * @link https://github.com/kofrasa/mingo#es6
 */
function getMingoQuery(selector) {
  if (!mingoInitDone) {
    useOperators(core_OperatorType.PIPELINE, {
      $sort: sort_$sort,
      $project: project_$project
    });
    useOperators(core_OperatorType.QUERY, {
      $and: and_$and,
      $eq: comparison_eq_$eq,
      $elemMatch: elemMatch_$elemMatch,
      $exists: exists_$exists,
      $gt: comparison_gt_$gt,
      $gte: comparison_gte_$gte,
      $in: in_$in,
      $lt: comparison_lt_$lt,
      $lte: comparison_lte_$lte,
      $ne: comparison_ne_$ne,
      $nin: comparison_nin_$nin,
      $mod: mod_$mod,
      $nor: $nor,
      $not: not_$not,
      $or: or_$or,
      $regex: regex_$regex,
      $size: array_size_$size,
      $type: element_type_$type
    });
    mingoInitDone = true;
  }
  return new query_Query(selector);
}
//# sourceMappingURL=rx-query-mingo.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/rx-query-helper.js







/**
 * Normalize the query to ensure we have all fields set
 * and queries that represent the same query logic are detected as equal by the caching.
 */
function normalizeMangoQuery(schema, mangoQuery) {
  var primaryKey = rx_schema_helper_getPrimaryFieldOfPrimaryKey(schema.primaryKey);
  mangoQuery = utils_object_flatClone(mangoQuery);
  var normalizedMangoQuery = utils_object_clone(mangoQuery);
  if (typeof normalizedMangoQuery.skip !== 'number') {
    normalizedMangoQuery.skip = 0;
  }
  if (!normalizedMangoQuery.selector) {
    normalizedMangoQuery.selector = {};
  } else {
    normalizedMangoQuery.selector = normalizedMangoQuery.selector;
    /**
     * In mango query, it is possible to have an
     * equals comparison by directly assigning a value
     * to a property, without the '$eq' operator.
     * Like:
     * selector: {
     *   foo: 'bar'
     * }
     * For normalization, we have to normalize this
     * so our checks can perform properly.
     *
     *
     * TODO this must work recursive with nested queries that
     * contain multiple selectors via $and or $or etc.
     */
    Object.entries(normalizedMangoQuery.selector).forEach(([field, matcher]) => {
      if (typeof matcher !== 'object' || matcher === null) {
        normalizedMangoQuery.selector[field] = {
          $eq: matcher
        };
      }
    });
  }

  /**
   * Ensure that if an index is specified,
   * the primaryKey is inside of it.
   */
  if (normalizedMangoQuery.index) {
    var indexAr = toArray(normalizedMangoQuery.index);
    if (!indexAr.includes(primaryKey)) {
      indexAr.push(primaryKey);
    }
    normalizedMangoQuery.index = indexAr;
  }

  /**
   * To ensure a deterministic sorting,
   * we have to ensure the primary key is always part
   * of the sort query.
   * Primary sorting is added as last sort parameter,
   * similar to how we add the primary key to indexes that do not have it.
   *
   */
  if (!normalizedMangoQuery.sort) {
    /**
     * If no sort is given at all,
     * we can assume that the user does not care about sort order at al.
     *
     * we cannot just use the primary key as sort parameter
     * because it would likely cause the query to run over the primary key index
     * which has a bad performance in most cases.
     */
    if (normalizedMangoQuery.index) {
      normalizedMangoQuery.sort = normalizedMangoQuery.index.map(field => {
        return {
          [field]: 'asc'
        };
      });
    } else {
      /**
       * Find the index that best matches the fields with the logical operators
       */
      if (schema.indexes) {
        var fieldsWithLogicalOperator = new Set();
        Object.entries(normalizedMangoQuery.selector).forEach(([field, matcher]) => {
          var hasLogical = false;
          if (typeof matcher === 'object' && matcher !== null) {
            hasLogical = !!Object.keys(matcher).find(operator => LOGICAL_OPERATORS.has(operator));
          } else {
            hasLogical = true;
          }
          if (hasLogical) {
            fieldsWithLogicalOperator.add(field);
          }
        });
        var currentFieldsAmount = -1;
        var currentBestIndexForSort;
        schema.indexes.forEach(index => {
          var useIndex = isMaybeReadonlyArray(index) ? index : [index];
          var firstWrongIndex = useIndex.findIndex(indexField => !fieldsWithLogicalOperator.has(indexField));
          if (firstWrongIndex > 0 && firstWrongIndex > currentFieldsAmount) {
            currentFieldsAmount = firstWrongIndex;
            currentBestIndexForSort = useIndex;
          }
        });
        if (currentBestIndexForSort) {
          normalizedMangoQuery.sort = currentBestIndexForSort.map(field => {
            return {
              [field]: 'asc'
            };
          });
        }
      }

      /**
       * Fall back to the primary key as sort order
       * if no better one has been found
       */
      if (!normalizedMangoQuery.sort) {
        normalizedMangoQuery.sort = [{
          [primaryKey]: 'asc'
        }];
      }
    }
  } else {
    var isPrimaryInSort = normalizedMangoQuery.sort.find(p => firstPropertyNameOfObject(p) === primaryKey);
    if (!isPrimaryInSort) {
      normalizedMangoQuery.sort = normalizedMangoQuery.sort.slice(0);
      normalizedMangoQuery.sort.push({
        [primaryKey]: 'asc'
      });
    }
  }
  return normalizedMangoQuery;
}

/**
 * Returns the sort-comparator,
 * which is able to sort documents in the same way
 * a query over the db would do.
 */
function getSortComparator(schema, query) {
  if (!query.sort) {
    throw rx_error_newRxError('SNH', {
      query
    });
  }
  var sortParts = [];
  query.sort.forEach(sortBlock => {
    var key = Object.keys(sortBlock)[0];
    var direction = Object.values(sortBlock)[0];
    sortParts.push({
      key,
      direction,
      getValueFn: objectPathMonad(key)
    });
  });
  var fun = (a, b) => {
    for (var i = 0; i < sortParts.length; ++i) {
      var sortPart = sortParts[i];
      var valueA = sortPart.getValueFn(a);
      var valueB = sortPart.getValueFn(b);
      if (valueA !== valueB) {
        var ret = sortPart.direction === 'asc' ? util_compare(valueA, valueB) : util_compare(valueB, valueA);
        return ret;
      }
    }
  };
  return fun;
}

/**
 * Returns a function
 * that can be used to check if a document
 * matches the query.
 */
function getQueryMatcher(_schema, query) {
  if (!query.sort) {
    throw rx_error_newRxError('SNH', {
      query
    });
  }
  var mingoQuery = getMingoQuery(query.selector);
  var fun = doc => {
    return mingoQuery.test(doc);
  };
  return fun;
}
//# sourceMappingURL=rx-query-helper.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/event-reduce.js




function event_reduce_getSortFieldsOfQuery(primaryKey, query) {
  if (!query.sort || query.sort.length === 0) {
    return [primaryKey];
  } else {
    return query.sort.map(part => Object.keys(part)[0]);
  }
}
var RXQUERY_QUERY_PARAMS_CACHE = new WeakMap();
function getQueryParams(rxQuery) {
  return getFromMapOrCreate(RXQUERY_QUERY_PARAMS_CACHE, rxQuery, () => {
    var collection = rxQuery.collection;
    var normalizedMangoQuery = normalizeMangoQuery(collection.storageInstance.schema, utils_object_clone(rxQuery.mangoQuery));
    var primaryKey = collection.schema.primaryPath;

    /**
     * Create a custom sort comparator
     * that uses the hooks to ensure
     * we send for example compressed documents to be sorted by compressed queries.
     */
    var sortComparator = getSortComparator(collection.schema.jsonSchema, normalizedMangoQuery);
    var useSortComparator = (docA, docB) => {
      var sortComparatorData = {
        docA,
        docB,
        rxQuery
      };
      return sortComparator(sortComparatorData.docA, sortComparatorData.docB);
    };

    /**
     * Create a custom query matcher
     * that uses the hooks to ensure
     * we send for example compressed documents to match compressed queries.
     */
    var queryMatcher = getQueryMatcher(collection.schema.jsonSchema, normalizedMangoQuery);
    var useQueryMatcher = doc => {
      var queryMatcherData = {
        doc,
        rxQuery
      };
      return queryMatcher(queryMatcherData.doc);
    };
    var ret = {
      primaryKey: rxQuery.collection.schema.primaryPath,
      skip: normalizedMangoQuery.skip,
      limit: normalizedMangoQuery.limit,
      sortFields: event_reduce_getSortFieldsOfQuery(primaryKey, normalizedMangoQuery),
      sortComparator: useSortComparator,
      queryMatcher: useQueryMatcher
    };
    return ret;
  });
}
function calculateNewResults(rxQuery, rxChangeEvents) {
  if (!rxQuery.collection.database.eventReduce) {
    return {
      runFullQueryAgain: true
    };
  }
  var queryParams = getQueryParams(rxQuery);
  var previousResults = utils_other_ensureNotFalsy(rxQuery._result).docsData.slice(0);
  var previousResultsMap = utils_other_ensureNotFalsy(rxQuery._result).docsDataMap;
  var changed = false;
  var eventReduceEvents = rxChangeEvents.map(cE => rxChangeEventToEventReduceChangeEvent(cE)).filter(arrayFilterNotEmpty);
  var foundNonOptimizeable = eventReduceEvents.find(eventReduceEvent => {
    var stateResolveFunctionInput = {
      queryParams,
      changeEvent: eventReduceEvent,
      previousResults,
      keyDocumentMap: previousResultsMap
    };
    var actionName = calculateActionName(stateResolveFunctionInput);
    if (actionName === 'runFullQueryAgain') {
      return true;
    } else if (actionName !== 'doNothing') {
      changed = true;
      runAction(actionName, queryParams, eventReduceEvent, previousResults, previousResultsMap);
      return false;
    }
  });
  if (foundNonOptimizeable) {
    return {
      runFullQueryAgain: true
    };
  } else {
    return {
      runFullQueryAgain: false,
      changed,
      newResults: previousResults
    };
  }
}
//# sourceMappingURL=event-reduce.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/query-cache.js
/**
 * the query-cache makes sure that on every query-state, exactly one instance can exist
 * if you use the same mango-query more then once, it will reuse the first RxQuery
 */


var QueryCache = /*#__PURE__*/function () {
  function QueryCache() {
    this._map = new Map();
  }
  var _proto = QueryCache.prototype;
  /**
   * check if an equal query is in the cache,
   * if true, return the cached one,
   * if false, save the given one and return it
   */
  _proto.getByQuery = function getByQuery(rxQuery) {
    var stringRep = rxQuery.toString();
    return getFromMapOrCreate(this._map, stringRep, () => rxQuery);
  };
  return QueryCache;
}();
function createQueryCache() {
  return new QueryCache();
}
function uncacheRxQuery(queryCache, rxQuery) {
  rxQuery.uncached = true;
  var stringRep = rxQuery.toString();
  queryCache._map.delete(stringRep);
}
function countRxQuerySubscribers(rxQuery) {
  return rxQuery.refCount$.observers.length;
}
var DEFAULT_TRY_TO_KEEP_MAX = 100;
var DEFAULT_UNEXECUTED_LIFETIME = 30 * 1000;

/**
 * The default cache replacement policy
 * See docs-src/query-cache.md to learn how it should work.
 * Notice that this runs often and should block the cpu as less as possible
 * This is a monad which makes it easier to unit test
 */
var defaultCacheReplacementPolicyMonad = (tryToKeepMax, unExecutedLifetime) => (_collection, queryCache) => {
  if (queryCache._map.size < tryToKeepMax) {
    return;
  }
  var minUnExecutedLifetime = utils_time_now() - unExecutedLifetime;
  var maybeUncache = [];
  var queriesInCache = Array.from(queryCache._map.values());
  for (var rxQuery of queriesInCache) {
    // filter out queries with subscribers
    if (countRxQuerySubscribers(rxQuery) > 0) {
      continue;
    }
    // directly uncache queries that never executed and are older then unExecutedLifetime
    if (rxQuery._lastEnsureEqual === 0 && rxQuery._creationTime < minUnExecutedLifetime) {
      uncacheRxQuery(queryCache, rxQuery);
      continue;
    }
    maybeUncache.push(rxQuery);
  }
  var mustUncache = maybeUncache.length - tryToKeepMax;
  if (mustUncache <= 0) {
    return;
  }
  var sortedByLastUsage = maybeUncache.sort((a, b) => a._lastEnsureEqual - b._lastEnsureEqual);
  var toRemove = sortedByLastUsage.slice(0, mustUncache);
  toRemove.forEach(rxQuery => uncacheRxQuery(queryCache, rxQuery));
};
var defaultCacheReplacementPolicy = defaultCacheReplacementPolicyMonad(DEFAULT_TRY_TO_KEEP_MAX, DEFAULT_UNEXECUTED_LIFETIME);
var COLLECTIONS_WITH_RUNNING_CLEANUP = new WeakSet();

/**
 * Triggers the cache replacement policy after waitTime has passed.
 * We do not run this directly because at exactly the time a query is created,
 * we need all CPU to minimize latency.
 * Also this should not be triggered multiple times when waitTime is still waiting.
 */
function triggerCacheReplacement(rxCollection) {
  if (COLLECTIONS_WITH_RUNNING_CLEANUP.has(rxCollection)) {
    // already started
    return;
  }
  COLLECTIONS_WITH_RUNNING_CLEANUP.add(rxCollection);

  /**
   * Do not run directly to not reduce result latency of a new query
   */
  nextTick() // wait at least one tick
  .then(() => requestIdlePromise(200)) // and then wait for the CPU to be idle
  .then(() => {
    if (!rxCollection.destroyed) {
      rxCollection.cacheReplacementPolicy(rxCollection, rxCollection._queryCache);
    }
    COLLECTIONS_WITH_RUNNING_CLEANUP.delete(rxCollection);
  });
}
//# sourceMappingURL=query-cache.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/doc-cache.js





/**
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry
 */

/**
 * The DocumentCache stores RxDocument objects
 * by their primary key and revision.
 * This is useful on client side applications where
 * it is not known how much memory can be used, so
 * we de-duplicate RxDocument states to save memory.
 * To not fill up the memory with old document states, the DocumentCache
 * only contains weak references to the RxDocuments themself.
 * @link https://caniuse.com/?search=weakref
 */
var DocumentCache = /*#__PURE__*/function () {
  /**
   * Some JavaScript runtimes like QuickJS,
   * so not have a FinalizationRegistry or WeakRef.
   * Therefore we need a workaround which might waste a lot of memory,
   * but at least works.
   */

  /**
   * Calling registry.register(() has shown to have
   * really bad performance. So we add the cached documents
   * lazily.
   */

  function DocumentCache(primaryPath, changes$,
  /**
   * A method that can create a RxDocument by the given document data.
   */
  documentCreator) {
    this.cacheItemByDocId = new Map();
    this.registry = typeof FinalizationRegistry === 'function' ? new FinalizationRegistry(docMeta => {
      var docId = docMeta.docId;
      var cacheItem = this.cacheItemByDocId.get(docId);
      if (cacheItem) {
        cacheItem.byRev.delete(docMeta.revisionHeight);
        if (cacheItem.byRev.size === 0) {
          /**
           * No state of the document is cached anymore,
           * so we can clean up.
           */
          this.cacheItemByDocId.delete(docId);
        }
      }
    }) : undefined;
    this.registerIdleTasks = [];
    this.primaryPath = primaryPath;
    this.changes$ = changes$;
    this.documentCreator = documentCreator;
    changes$.subscribe(changeEvent => {
      var docId = changeEvent.documentId;
      var cacheItem = this.cacheItemByDocId.get(docId);
      if (cacheItem) {
        var documentData = getDocumentDataOfRxChangeEvent(changeEvent);
        cacheItem.last = documentData;
      }
    });
  }

  /**
   * Get the RxDocument from the cache
   * and create a new one if not exits before.
   * @overwrites itself with the actual function
   * because this is @performance relevant.
   * It is called on each document row for each write and read.
   */
  var _proto = DocumentCache.prototype;
  /**
   * Throws if not exists
   */
  _proto.getLatestDocumentData = function getLatestDocumentData(docId) {
    var cacheItem = getFromMapOrThrow(this.cacheItemByDocId, docId);
    return cacheItem.last;
  };
  _proto.getLatestDocumentDataIfExists = function getLatestDocumentDataIfExists(docId) {
    var cacheItem = this.cacheItemByDocId.get(docId);
    if (cacheItem) {
      return cacheItem.last;
    }
  };
  _createClass(DocumentCache, [{
    key: "getCachedRxDocument",
    get: function () {
      var fn = getCachedRxDocumentMonad(this);
      return overwriteGetterForCaching(this, 'getCachedRxDocument', fn);
    }
  }]);
  return DocumentCache;
}();

/**
 * This function is called very very often.
 * This is likely the most important function for RxDB overall performance
 */
function getCachedRxDocumentMonad(docCache) {
  var primaryPath = docCache.primaryPath;
  var cacheItemByDocId = docCache.cacheItemByDocId;
  var registry = docCache.registry;
  var deepFreezeWhenDevMode = overwritable.deepFreezeWhenDevMode;
  var documentCreator = docCache.documentCreator;
  var fn = docData => {
    var docId = docData[primaryPath];
    var revisionHeight = getHeightOfRevision(docData._rev);
    var cacheItem = getFromMapOrCreate(cacheItemByDocId, docId, () => getNewCacheItem(docData));
    var byRev = cacheItem.byRev;
    var cachedRxDocumentWeakRef = byRev.get(revisionHeight);
    var cachedRxDocument = cachedRxDocumentWeakRef ? cachedRxDocumentWeakRef.deref() : undefined;
    if (!cachedRxDocument) {
      docData = deepFreezeWhenDevMode(docData);
      cachedRxDocument = documentCreator(docData);
      byRev.set(revisionHeight, createWeakRefWithFallback(cachedRxDocument));
      if (registry) {
        docCache.registerIdleTasks.push(cachedRxDocument);
        if (!docCache.registerIdlePromise) {
          docCache.registerIdlePromise = requestIdlePromiseNoQueue().then(() => {
            docCache.registerIdlePromise = undefined;
            var tasks = docCache.registerIdleTasks;
            if (tasks.length === 0) {
              return;
            }
            docCache.registerIdleTasks = [];
            tasks.forEach(doc => {
              registry.register(doc, {
                docId: doc.primary,
                revisionHeight: getHeightOfRevision(doc.revision)
              });
            });
          });
        }
      }
    }
    return cachedRxDocument;
  };
  return fn;
}
function mapDocumentsDataToCacheDocs(docCache, docsData) {
  var getCachedRxDocument = docCache.getCachedRxDocument;
  var documents = [];
  for (var i = 0; i < docsData.length; i++) {
    var _docData = docsData[i];
    var doc = getCachedRxDocument(_docData);
    documents.push(doc);
  }
  return documents;
}
function getNewCacheItem(docData) {
  return {
    byRev: new Map(),
    last: docData
  };
}

/**
 * Fallback for JavaScript runtimes that do not support WeakRef.
 * The fallback will keep the items in cache forever,
 * but at least works.
 */
var HAS_WEAK_REF = typeof WeakRef === 'function';
var createWeakRefWithFallback = HAS_WEAK_REF ? createWeakRef : createWeakRefFallback;
function createWeakRef(obj) {
  return new WeakRef(obj);
}
function createWeakRefFallback(obj) {
  return {
    deref() {
      return obj;
    }
  };
}
//# sourceMappingURL=doc-cache.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/rx-query-single-result.js



/**
 * RxDB needs the query results in multiple formats.
 * Sometimes as a Map or an array with only the documentData.
 * For better performance we work with this class
 * that initializes stuff lazily so that
 * we can directly work with the query results after RxQuery.exec()
 */
var RxQuerySingleResult = /*#__PURE__*/function () {
  /**
   * Time at which the current _result state was created.
   * Used to determine if the result set has changed since X
   * so that we do not emit the same result multiple times on subscription.
   */

  function RxQuerySingleResult(collection,
  // only used internally, do not use outside, use this.docsData instead
  docsDataFromStorageInstance,
  // can be overwritten for count-queries
  count) {
    this.time = utils_time_now();
    this.collection = collection;
    this.count = count;
    this.documents = mapDocumentsDataToCacheDocs(this.collection._docCache, docsDataFromStorageInstance);
  }

  /**
   * Instead of using the newResultData in the result cache,
   * we directly use the objects that are stored in the RxDocument
   * to ensure we do not store the same data twice and fill up the memory.
   * @overwrites itself with the actual value
   */
  _createClass(RxQuerySingleResult, [{
    key: "docsData",
    get: function () {
      return overwriteGetterForCaching(this, 'docsData', this.documents.map(d => d._data));
    }

    // A key->document map, used in the event reduce optimization.
  }, {
    key: "docsDataMap",
    get: function () {
      var map = new Map();
      this.documents.forEach(d => {
        map.set(d.primary, d._data);
      });
      return overwriteGetterForCaching(this, 'docsDataMap', map);
    }
  }, {
    key: "docsMap",
    get: function () {
      var map = new Map();
      var documents = this.documents;
      for (var i = 0; i < documents.length; i++) {
        var doc = documents[i];
        map.set(doc.primary, doc);
      }
      return overwriteGetterForCaching(this, 'docsMap', map);
    }
  }]);
  return RxQuerySingleResult;
}();
//# sourceMappingURL=rx-query-single-result.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/rx-query.js











var _queryCount = 0;
var newQueryID = function () {
  return ++_queryCount;
};
var RxQueryBase = /*#__PURE__*/function () {
  /**
   * Some stats then are used for debugging and cache replacement policies
   */

  // used in the query-cache to determine if the RxQuery can be cleaned up.

  // used to count the subscribers to the query

  /**
   * Contains the current result state
   * or null if query has not run yet.
   */

  function RxQueryBase(op, mangoQuery, collection,
  // used by some plugins
  other = {}) {
    this.id = newQueryID();
    this._execOverDatabaseCount = 0;
    this._creationTime = utils_time_now();
    this._lastEnsureEqual = 0;
    this.uncached = false;
    this.refCount$ = new BehaviorSubject(null);
    this._result = null;
    this._latestChangeEvent = -1;
    this._lastExecStart = 0;
    this._lastExecEnd = 0;
    this._ensureEqualQueue = PROMISE_RESOLVE_FALSE;
    this.op = op;
    this.mangoQuery = mangoQuery;
    this.collection = collection;
    this.other = other;
    if (!mangoQuery) {
      this.mangoQuery = _getDefaultQuery();
    }
    this.isFindOneByIdQuery = isFindOneByIdQuery(this.collection.schema.primaryPath, mangoQuery);
  }
  var _proto = RxQueryBase.prototype;
  /**
   * Returns an observable that emits the results
   * This should behave like an rxjs-BehaviorSubject which means:
   * - Emit the current result-set on subscribe
   * - Emit the new result-set when an RxChangeEvent comes in
   * - Do not emit anything before the first result-set was created (no null)
   */
  /**
   * set the new result-data as result-docs of the query
   * @param newResultData json-docs that were received from the storage
   */
  _proto._setResultData = function _setResultData(newResultData) {
    if (typeof newResultData === 'number') {
      this._result = new RxQuerySingleResult(this.collection, [], newResultData);
      return;
    } else if (newResultData instanceof Map) {
      newResultData = Array.from(newResultData.values());
    }
    var newQueryResult = new RxQuerySingleResult(this.collection, newResultData, newResultData.length);
    this._result = newQueryResult;
  }

  /**
   * executes the query on the database
   * @return results-array with document-data
   */;
  _proto._execOverDatabase = async function _execOverDatabase() {
    this._execOverDatabaseCount = this._execOverDatabaseCount + 1;
    this._lastExecStart = utils_time_now();
    if (this.op === 'count') {
      var preparedQuery = this.getPreparedQuery();
      var result = await this.collection.storageInstance.count(preparedQuery);
      if (result.mode === 'slow' && !this.collection.database.allowSlowCount) {
        throw rx_error_newRxError('QU14', {
          collection: this.collection,
          queryObj: this.mangoQuery
        });
      } else {
        return result.count;
      }
    }
    if (this.op === 'findByIds') {
      var ids = utils_other_ensureNotFalsy(this.mangoQuery.selector)[this.collection.schema.primaryPath].$in;
      var ret = new Map();
      var mustBeQueried = [];
      // first try to fill from docCache
      ids.forEach(id => {
        var docData = this.collection._docCache.getLatestDocumentDataIfExists(id);
        if (docData) {
          if (!docData._deleted) {
            var doc = this.collection._docCache.getCachedRxDocument(docData);
            ret.set(id, doc);
          }
        } else {
          mustBeQueried.push(id);
        }
      });
      // everything which was not in docCache must be fetched from the storage
      if (mustBeQueried.length > 0) {
        var docs = await this.collection.storageInstance.findDocumentsById(mustBeQueried, false);
        docs.forEach(docData => {
          var doc = this.collection._docCache.getCachedRxDocument(docData);
          ret.set(doc.primary, doc);
        });
      }
      return ret;
    }
    var docsPromise = queryCollection(this);
    return docsPromise.then(docs => {
      this._lastExecEnd = utils_time_now();
      return docs;
    });
  }

  /**
   * Execute the query
   * To have an easier implementations,
   * just subscribe and use the first result
   */;
  _proto.exec = function exec(throwIfMissing) {
    if (throwIfMissing && this.op !== 'findOne') {
      throw rx_error_newRxError('QU9', {
        collection: this.collection.name,
        query: this.mangoQuery,
        op: this.op
      });
    }

    /**
     * run _ensureEqual() here,
     * this will make sure that errors in the query which throw inside of the RxStorage,
     * will be thrown at this execution context and not in the background.
     */
    return _ensureEqual(this).then(() => firstValueFrom(this.$)).then(result => {
      if (!result && throwIfMissing) {
        throw rx_error_newRxError('QU10', {
          collection: this.collection.name,
          query: this.mangoQuery,
          op: this.op
        });
      } else {
        return result;
      }
    });
  }

  /**
   * cached call to get the queryMatcher
   * @overwrites itself with the actual value
   */;
  /**
   * returns a string that is used for equal-comparisons
   * @overwrites itself with the actual value
   */
  _proto.toString = function toString() {
    var stringObj = sortObject({
      op: this.op,
      query: this.mangoQuery,
      other: this.other
    }, true);
    var value = JSON.stringify(stringObj);
    this.toString = () => value;
    return value;
  }

  /**
   * returns the prepared query
   * which can be send to the storage instance to query for documents.
   * @overwrites itself with the actual value.
   */;
  _proto.getPreparedQuery = function getPreparedQuery() {
    var hookInput = {
      rxQuery: this,
      // can be mutated by the hooks so we have to deep clone first.
      mangoQuery: normalizeMangoQuery(this.collection.schema.jsonSchema, this.mangoQuery)
    };
    hookInput.mangoQuery.selector._deleted = {
      $eq: false
    };
    if (hookInput.mangoQuery.index) {
      hookInput.mangoQuery.index.unshift('_deleted');
    }
    runPluginHooks('prePrepareQuery', hookInput);
    var value = rx_query_prepareQuery(this.collection.schema.jsonSchema, hookInput.mangoQuery);
    this.getPreparedQuery = () => value;
    return value;
  }

  /**
   * returns true if the document matches the query,
   * does not use the 'skip' and 'limit'
   */;
  _proto.doesDocumentDataMatch = function doesDocumentDataMatch(docData) {
    // if doc is deleted, it cannot match
    if (docData._deleted) {
      return false;
    }
    return this.queryMatcher(docData);
  }

  /**
   * deletes all found documents
   * @return promise with deleted documents
   */;
  _proto.remove = function remove() {
    return this.exec().then(docs => {
      if (Array.isArray(docs)) {
        // TODO use a bulk operation instead of running .remove() on each document
        return Promise.all(docs.map(doc => doc.remove()));
      } else {
        return docs.remove();
      }
    });
  }

  /**
   * helper function to transform RxQueryBase to RxQuery type
   */;
  /**
   * updates all found documents
   * @overwritten by plugin (optional)
   */
  _proto.update = function update(_updateObj) {
    throw pluginMissing('update');
  }

  // we only set some methods of query-builder here
  // because the others depend on these ones
  ;
  _proto.where = function where(_queryObj) {
    throw pluginMissing('query-builder');
  };
  _proto.sort = function sort(_params) {
    throw pluginMissing('query-builder');
  };
  _proto.skip = function skip(_amount) {
    throw pluginMissing('query-builder');
  };
  _proto.limit = function limit(_amount) {
    throw pluginMissing('query-builder');
  };
  _createClass(RxQueryBase, [{
    key: "$",
    get: function () {
      if (!this._$) {
        var results$ = this.collection.$.pipe(
        /**
         * Performance shortcut.
         * Changes to local documents are not relevant for the query.
         */
        filter_filter(changeEvent => !changeEvent.isLocal),
        /**
         * Start once to ensure the querying also starts
         * when there where no changes.
         */
        startWith_startWith(null),
        // ensure query results are up to date.
        mergeMap(() => _ensureEqual(this)),
        // use the current result set, written by _ensureEqual().
        map_map(() => this._result),
        // do not run stuff above for each new subscriber, only once.
        shareReplay(RXJS_SHARE_REPLAY_DEFAULTS),
        // do not proceed if result set has not changed.
        distinctUntilChanged((prev, curr) => {
          if (prev && prev.time === utils_other_ensureNotFalsy(curr).time) {
            return true;
          } else {
            return false;
          }
        }), filter_filter(result => !!result),
        /**
         * Map the result set to a single RxDocument or an array,
         * depending on query type
         */
        map_map(result => {
          var useResult = utils_other_ensureNotFalsy(result);
          if (this.op === 'count') {
            return useResult.count;
          } else if (this.op === 'findOne') {
            // findOne()-queries emit RxDocument or null
            return useResult.documents.length === 0 ? null : useResult.documents[0];
          } else if (this.op === 'findByIds') {
            return useResult.docsMap;
          } else {
            // find()-queries emit RxDocument[]
            // Flat copy the array so it won't matter if the user modifies it.
            return useResult.documents.slice(0);
          }
        }));
        this._$ = merge(results$,
        /**
         * Also add the refCount$ to the query observable
         * to allow us to count the amount of subscribers.
         */
        this.refCount$.pipe(filter_filter(() => false)));
      }
      return this._$;
    }

    // stores the changeEvent-number of the last handled change-event

    // time stamps on when the last full exec over the database has run
    // used to properly handle events that happen while the find-query is running

    /**
     * ensures that the exec-runs
     * are not run in parallel
     */
  }, {
    key: "queryMatcher",
    get: function () {
      var schema = this.collection.schema.jsonSchema;
      var normalizedQuery = normalizeMangoQuery(this.collection.schema.jsonSchema, this.mangoQuery);
      return overwriteGetterForCaching(this, 'queryMatcher', getQueryMatcher(schema, normalizedQuery));
    }
  }, {
    key: "asRxQuery",
    get: function () {
      return this;
    }
  }]);
  return RxQueryBase;
}();
function _getDefaultQuery() {
  return {
    selector: {}
  };
}

/**
 * run this query through the QueryCache
 */
function tunnelQueryCache(rxQuery) {
  return rxQuery.collection._queryCache.getByQuery(rxQuery);
}
function createRxQuery(op, queryObj, collection, other) {
  runPluginHooks('preCreateRxQuery', {
    op,
    queryObj,
    collection,
    other
  });
  var ret = new RxQueryBase(op, queryObj, collection, other);

  // ensure when created with same params, only one is created
  ret = tunnelQueryCache(ret);
  triggerCacheReplacement(collection);
  return ret;
}

/**
 * Check if the current results-state is in sync with the database
 * which means that no write event happened since the last run.
 * @return false if not which means it should re-execute
 */
function _isResultsInSync(rxQuery) {
  var currentLatestEventNumber = rxQuery.asRxQuery.collection._changeEventBuffer.counter;
  if (rxQuery._latestChangeEvent >= currentLatestEventNumber) {
    return true;
  } else {
    return false;
  }
}

/**
 * wraps __ensureEqual()
 * to ensure it does not run in parallel
 * @return true if has changed, false if not
 */
function _ensureEqual(rxQuery) {
  // Optimisation shortcut
  if (rxQuery.collection.database.destroyed || _isResultsInSync(rxQuery)) {
    return PROMISE_RESOLVE_FALSE;
  }
  rxQuery._ensureEqualQueue = rxQuery._ensureEqualQueue.then(() => __ensureEqual(rxQuery));
  return rxQuery._ensureEqualQueue;
}

/**
 * ensures that the results of this query is equal to the results which a query over the database would give
 * @return true if results have changed
 */
function __ensureEqual(rxQuery) {
  rxQuery._lastEnsureEqual = utils_time_now();

  /**
   * Optimisation shortcuts
   */
  if (
  // db is closed
  rxQuery.collection.database.destroyed ||
  // nothing happened since last run
  _isResultsInSync(rxQuery)) {
    return PROMISE_RESOLVE_FALSE;
  }
  var ret = false;
  var mustReExec = false; // if this becomes true, a whole execution over the database is made
  if (rxQuery._latestChangeEvent === -1) {
    // have not executed yet -> must run
    mustReExec = true;
  }

  /**
   * try to use EventReduce to calculate the new results
   */
  if (!mustReExec) {
    var missedChangeEvents = rxQuery.asRxQuery.collection._changeEventBuffer.getFrom(rxQuery._latestChangeEvent + 1);
    if (missedChangeEvents === null) {
      // changeEventBuffer is of bounds -> we must re-execute over the database
      mustReExec = true;
    } else {
      rxQuery._latestChangeEvent = rxQuery.asRxQuery.collection._changeEventBuffer.counter;
      var runChangeEvents = rxQuery.asRxQuery.collection._changeEventBuffer.reduceByLastOfDoc(missedChangeEvents);
      if (rxQuery.op === 'count') {
        // 'count' query
        var previousCount = utils_other_ensureNotFalsy(rxQuery._result).count;
        var newCount = previousCount;
        runChangeEvents.forEach(cE => {
          var didMatchBefore = cE.previousDocumentData && rxQuery.doesDocumentDataMatch(cE.previousDocumentData);
          var doesMatchNow = rxQuery.doesDocumentDataMatch(cE.documentData);
          if (!didMatchBefore && doesMatchNow) {
            newCount++;
          }
          if (didMatchBefore && !doesMatchNow) {
            newCount--;
          }
        });
        if (newCount !== previousCount) {
          ret = true; // true because results changed
          rxQuery._setResultData(newCount);
        }
      } else {
        // 'find' or 'findOne' query
        var eventReduceResult = calculateNewResults(rxQuery, runChangeEvents);
        if (eventReduceResult.runFullQueryAgain) {
          // could not calculate the new results, execute must be done
          mustReExec = true;
        } else if (eventReduceResult.changed) {
          // we got the new results, we do not have to re-execute, mustReExec stays false
          ret = true; // true because results changed
          rxQuery._setResultData(eventReduceResult.newResults);
        }
      }
    }
  }

  // oh no we have to re-execute the whole query over the database
  if (mustReExec) {
    return rxQuery._execOverDatabase().then(newResultData => {
      /**
       * The RxStorage is defined to always first emit events and then return
       * on bulkWrite() calls. So here we have to use the counter AFTER the execOverDatabase()
       * has been run, not the one from before.
       */
      rxQuery._latestChangeEvent = rxQuery.collection._changeEventBuffer.counter;

      // A count query needs a different has-changed check.
      if (typeof newResultData === 'number') {
        if (!rxQuery._result || newResultData !== rxQuery._result.count) {
          ret = true;
          rxQuery._setResultData(newResultData);
        }
        return ret;
      }
      if (!rxQuery._result || !areRxDocumentArraysEqual(rxQuery.collection.schema.primaryPath, newResultData, rxQuery._result.docsData)) {
        ret = true; // true because results changed
        rxQuery._setResultData(newResultData);
      }
      return ret;
    });
  }
  return Promise.resolve(ret); // true if results have changed
}

/**
 * @returns a format of the query that can be used with the storage
 * when calling RxStorageInstance().query()
 */
function rx_query_prepareQuery(schema, mutateableQuery) {
  if (!mutateableQuery.sort) {
    throw rx_error_newRxError('SNH', {
      query: mutateableQuery
    });
  }

  /**
   * Store the query plan together with the
   * prepared query to save performance.
   */
  var queryPlan = getQueryPlan(schema, mutateableQuery);
  return {
    query: mutateableQuery,
    queryPlan
  };
}

/**
 * Runs the query over the storage instance
 * of the collection.
 * Does some optimizations to ensure findById is used
 * when specific queries are used.
 */
async function queryCollection(rxQuery) {
  var docs = [];
  var collection = rxQuery.collection;

  /**
   * Optimizations shortcut.
   * If query is find-one-document-by-id,
   * then we do not have to use the slow query() method
   * but instead can use findDocumentsById()
   */
  if (rxQuery.isFindOneByIdQuery) {
    if (Array.isArray(rxQuery.isFindOneByIdQuery)) {
      var docIds = rxQuery.isFindOneByIdQuery;
      docIds = docIds.filter(docId => {
        // first try to fill from docCache
        var docData = rxQuery.collection._docCache.getLatestDocumentDataIfExists(docId);
        if (docData) {
          if (!docData._deleted) {
            docs.push(docData);
          }
          return false;
        } else {
          return true;
        }
      });
      // otherwise get from storage
      if (docIds.length > 0) {
        var docsFromStorage = await collection.storageInstance.findDocumentsById(docIds, false);
        utils_array_appendToArray(docs, docsFromStorage);
      }
    } else {
      var docId = rxQuery.isFindOneByIdQuery;

      // first try to fill from docCache
      var docData = rxQuery.collection._docCache.getLatestDocumentDataIfExists(docId);
      if (!docData) {
        // otherwise get from storage
        var fromStorageList = await collection.storageInstance.findDocumentsById([docId], false);
        if (fromStorageList[0]) {
          docData = fromStorageList[0];
        }
      }
      if (docData && !docData._deleted) {
        docs.push(docData);
      }
    }
  } else {
    var preparedQuery = rxQuery.getPreparedQuery();
    var queryResult = await collection.storageInstance.query(preparedQuery);
    docs = queryResult.documents;
  }
  return docs;
}

/**
 * Returns true if the given query
 * selects exactly one document by its id.
 * Used to optimize performance because these kind of
 * queries do not have to run over an index and can use get-by-id instead.
 * Returns false if no query of that kind.
 * Returns the document id otherwise.
 */
function isFindOneByIdQuery(primaryPath, query) {
  // must have exactly one operator which must be $eq || $in
  if (!query.skip && query.selector && Object.keys(query.selector).length === 1 && query.selector[primaryPath]) {
    var value = query.selector[primaryPath];
    if (typeof value === 'string') {
      return value;
    } else if (Object.keys(value).length === 1 && typeof value.$eq === 'string') {
      return value.$eq;
    }

    // same with $in string arrays
    if (Object.keys(value).length === 1 && Array.isArray(value.$eq) &&
    // must only contain strings
    !value.$eq.find(r => typeof r !== 'string')) {
      return value.$eq;
    }
  }
  return false;
}
function isRxQuery(obj) {
  return obj instanceof RxQueryBase;
}
//# sourceMappingURL=rx-query.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/rx-database-internal-store.js





var INTERNAL_CONTEXT_COLLECTION = 'collection';
var INTERNAL_CONTEXT_STORAGE_TOKEN = 'storage-token';
var INTERNAL_CONTEXT_MIGRATION_STATUS = 'rx-migration-status';

/**
 * Do not change the title,
 * we have to flag the internal schema so that
 * some RxStorage implementations are able
 * to detect if the created RxStorageInstance
 * is from the internals or not,
 * to do some optimizations in some cases.
 */
var INTERNAL_STORE_SCHEMA_TITLE = 'RxInternalDocument';
var INTERNAL_STORE_SCHEMA = fillWithDefaultSettings({
  version: 0,
  title: INTERNAL_STORE_SCHEMA_TITLE,
  primaryKey: {
    key: 'id',
    fields: ['context', 'key'],
    separator: '|'
  },
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 200
    },
    key: {
      type: 'string'
    },
    context: {
      type: 'string',
      enum: [INTERNAL_CONTEXT_COLLECTION, INTERNAL_CONTEXT_STORAGE_TOKEN, INTERNAL_CONTEXT_MIGRATION_STATUS, 'OTHER']
    },
    data: {
      type: 'object',
      additionalProperties: true
    }
  },
  indexes: [],
  required: ['key', 'context', 'data'],
  additionalProperties: false,
  /**
   * If the sharding plugin is used,
   * it must not shard on the internal RxStorageInstance
   * because that one anyway has only a small amount of documents
   * and also its creation is in the hot path of the initial page load,
   * so we should spend less time creating multiple RxStorageInstances.
   */
  sharding: {
    shards: 1,
    mode: 'collection'
  }
});
function getPrimaryKeyOfInternalDocument(key, context) {
  return getComposedPrimaryKeyOfDocumentData(INTERNAL_STORE_SCHEMA, {
    key,
    context
  });
}

/**
 * Returns all internal documents
 * with context 'collection'
 */
async function getAllCollectionDocuments(storageInstance) {
  var getAllQueryPrepared = rx_query_prepareQuery(storageInstance.schema, {
    selector: {
      context: INTERNAL_CONTEXT_COLLECTION,
      _deleted: {
        $eq: false
      }
    },
    sort: [{
      id: 'asc'
    }],
    skip: 0
  });
  var queryResult = await storageInstance.query(getAllQueryPrepared);
  var allDocs = queryResult.documents;
  return allDocs;
}

/**
 * to not confuse multiInstance-messages with other databases that have the same
 * name and adapter, but do not share state with this one (for example in-memory-instances),
 * we set a storage-token and use it in the broadcast-channel
 */
var STORAGE_TOKEN_DOCUMENT_KEY = 'storageToken';
var STORAGE_TOKEN_DOCUMENT_ID = getPrimaryKeyOfInternalDocument(STORAGE_TOKEN_DOCUMENT_KEY, INTERNAL_CONTEXT_STORAGE_TOKEN);
async function ensureStorageTokenDocumentExists(rxDatabase) {
  /**
   * To have less read-write cycles,
   * we just try to insert a new document
   * and only fetch the existing one if a conflict happened.
   */
  var storageToken = randomCouchString(10);
  var passwordHash = rxDatabase.password ? await rxDatabase.hashFunction(JSON.stringify(rxDatabase.password)) : undefined;
  var docData = {
    id: STORAGE_TOKEN_DOCUMENT_ID,
    context: INTERNAL_CONTEXT_STORAGE_TOKEN,
    key: STORAGE_TOKEN_DOCUMENT_KEY,
    data: {
      rxdbVersion: rxDatabase.rxdbVersion,
      token: storageToken,
      /**
       * We add the instance token here
       * to be able to detect if a given RxDatabase instance
       * is the first instance that was ever created
       * or if databases have existed earlier on that storage
       * with the same database name.
       */
      instanceToken: rxDatabase.token,
      passwordHash
    },
    _deleted: false,
    _meta: getDefaultRxDocumentMeta(),
    _rev: utils_document_getDefaultRevision(),
    _attachments: {}
  };
  var writeResult = await rxDatabase.internalStore.bulkWrite([{
    document: docData
  }], 'internal-add-storage-token');
  if (writeResult.success[0]) {
    return writeResult.success[0];
  }

  /**
   * If we get a 409 error,
   * it means another instance already inserted the storage token.
   * So we get that token from the database and return that one.
   */
  var error = utils_other_ensureNotFalsy(writeResult.error[0]);
  if (error.isError && rx_error_isBulkWriteConflictError(error)) {
    var conflictError = error;
    if (!isDatabaseStateVersionCompatibleWithDatabaseCode(conflictError.documentInDb.data.rxdbVersion, rxDatabase.rxdbVersion)) {
      throw rx_error_newRxError('DM5', {
        args: {
          database: rxDatabase.name,
          databaseStateVersion: conflictError.documentInDb.data.rxdbVersion,
          codeVersion: rxDatabase.rxdbVersion
        }
      });
    }
    if (passwordHash && passwordHash !== conflictError.documentInDb.data.passwordHash) {
      throw rx_error_newRxError('DB1', {
        passwordHash,
        existingPasswordHash: conflictError.documentInDb.data.passwordHash
      });
    }
    var storageTokenDocInDb = conflictError.documentInDb;
    return utils_other_ensureNotFalsy(storageTokenDocInDb);
  }
  throw error;
}
function isDatabaseStateVersionCompatibleWithDatabaseCode(databaseStateVersion, codeVersion) {
  if (!databaseStateVersion) {
    return false;
  }
  if (codeVersion.includes('beta') && codeVersion !== databaseStateVersion) {
    return false;
  }
  var stateMajor = databaseStateVersion.split('.')[0];
  var codeMajor = codeVersion.split('.')[0];
  if (stateMajor !== codeMajor) {
    return false;
  }
  return true;
}
async function addConnectedStorageToCollection(collection, storageCollectionName, schema) {
  if (collection.schema.version !== schema.version) {
    throw newRxError('SNH', {
      schema,
      version: collection.schema.version,
      name: collection.name,
      collection,
      args: {
        storageCollectionName
      }
    });
  }
  var collectionNameWithVersion = _collectionNamePrimary(collection.name, collection.schema.jsonSchema);
  var collectionDocId = getPrimaryKeyOfInternalDocument(collectionNameWithVersion, INTERNAL_CONTEXT_COLLECTION);
  while (true) {
    var collectionDoc = await getSingleDocument(collection.database.internalStore, collectionDocId);
    var saveData = clone(ensureNotFalsy(collectionDoc));

    // do nothing if already in array
    var alreadyThere = saveData.data.connectedStorages.find(row => row.collectionName === storageCollectionName && row.schema.version === schema.version);
    if (alreadyThere) {
      return;
    }

    // otherwise add to array and save
    saveData.data.connectedStorages.push({
      collectionName: storageCollectionName,
      schema
    });
    try {
      await writeSingle(collection.database.internalStore, {
        previous: ensureNotFalsy(collectionDoc),
        document: saveData
      }, 'add-connected-storage-to-collection');
    } catch (err) {
      if (!isBulkWriteConflictError(err)) {
        throw err;
      }
      // retry on conflict
    }
  }
}

/**
 * returns the primary for a given collection-data
 * used in the internal store of a RxDatabase
 */
function _collectionNamePrimary(name, schema) {
  return name + '-' + schema.version;
}
//# sourceMappingURL=rx-database-internal-store.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/rx-storage-helper.js
/**
 * Helper functions for accessing the RxStorage instances.
 */







var INTERNAL_STORAGE_NAME = '_rxdb_internal';
var RX_DATABASE_LOCAL_DOCS_STORAGE_NAME = 'rxdatabase_storage_local';
async function rx_storage_helper_getSingleDocument(storageInstance, documentId) {
  var results = await storageInstance.findDocumentsById([documentId], false);
  var doc = results[0];
  if (doc) {
    return doc;
  } else {
    return undefined;
  }
}

/**
 * Writes a single document,
 * throws RxStorageBulkWriteError on failure
 */
async function rx_storage_helper_writeSingle(instance, writeRow, context) {
  var writeResult = await instance.bulkWrite([writeRow], context);
  if (writeResult.error.length > 0) {
    var error = writeResult.error[0];
    throw error;
  } else {
    var ret = writeResult.success[0];
    return ret;
  }
}

/**
 * Observe the plain document data of a single document.
 * Do not forget to unsubscribe.
 */
function observeSingle(storageInstance, documentId) {
  var firstFindPromise = rx_storage_helper_getSingleDocument(storageInstance, documentId);
  var ret = storageInstance.changeStream().pipe(map(evBulk => evBulk.events.find(ev => ev.documentId === documentId)), filter(ev => !!ev), map(ev => Promise.resolve(ensureNotFalsy(ev).documentData)), startWith(firstFindPromise), switchMap(v => v), filter(v => !!v));
  return ret;
}

/**
 * Checkpoints must be stackable over another.
 * This is required form some RxStorage implementations
 * like the sharding plugin, where a checkpoint only represents
 * the document state from some, but not all shards.
 */
function stackCheckpoints(checkpoints) {
  return Object.assign({}, ...checkpoints);
}
function storageChangeEventToRxChangeEvent(isLocal, rxStorageChangeEvent, rxCollection) {
  var documentData = rxStorageChangeEvent.documentData;
  var previousDocumentData = rxStorageChangeEvent.previousDocumentData;
  var ret = {
    documentId: rxStorageChangeEvent.documentId,
    collectionName: rxCollection ? rxCollection.name : undefined,
    isLocal,
    operation: rxStorageChangeEvent.operation,
    documentData: overwritable.deepFreezeWhenDevMode(documentData),
    previousDocumentData: overwritable.deepFreezeWhenDevMode(previousDocumentData)
  };
  return ret;
}
function throwIfIsStorageWriteError(collection, documentId, writeData, error) {
  if (error) {
    if (error.status === 409) {
      throw rx_error_newRxError('CONFLICT', {
        collection: collection.name,
        id: documentId,
        writeError: error,
        data: writeData
      });
    } else if (error.status === 422) {
      throw rx_error_newRxError('VD2', {
        collection: collection.name,
        id: documentId,
        writeError: error,
        data: writeData
      });
    } else {
      throw error;
    }
  }
}

/**
 * Analyzes a list of BulkWriteRows and determines
 * which documents must be inserted, updated or deleted
 * and which events must be emitted and which documents cause a conflict
 * and must not be written.
 * Used as helper inside of some RxStorage implementations.
 * @hotPath The performance of this function is critical
 */
function categorizeBulkWriteRows(storageInstance, primaryPath,
/**
 * Current state of the documents
 * inside of the storage. Used to determine
 * which writes cause conflicts.
 * This must be a Map for better performance.
 */
docsInDb,
/**
 * The write rows that are passed to
 * RxStorageInstance().bulkWrite().
 */
bulkWriteRows, context,
/**
 * Used by some storages for better performance.
 * For example when get-by-id and insert/update can run in parallel.
 */
onInsert, onUpdate) {
  var hasAttachments = !!storageInstance.schema.attachments;
  var bulkInsertDocs = [];
  var bulkUpdateDocs = [];
  var errors = [];
  var eventBulkId = randomCouchString(10);
  var eventBulk = {
    id: eventBulkId,
    events: [],
    checkpoint: null,
    context,
    startTime: utils_time_now(),
    endTime: 0
  };
  var eventBulkEvents = eventBulk.events;
  var attachmentsAdd = [];
  var attachmentsRemove = [];
  var attachmentsUpdate = [];
  var hasDocsInDb = docsInDb.size > 0;
  var newestRow;

  /**
   * @performance is really important in this loop!
   */
  var rowAmount = bulkWriteRows.length;
  var _loop = function () {
    var writeRow = bulkWriteRows[rowId];

    // use these variables to have less property accesses
    var document = writeRow.document;
    var previous = writeRow.previous;
    var docId = document[primaryPath];
    var documentDeleted = document._deleted;
    var previousDeleted = previous && previous._deleted;
    var documentInDb = undefined;
    if (hasDocsInDb) {
      documentInDb = docsInDb.get(docId);
    }
    var attachmentError;
    if (!documentInDb) {
      /**
       * It is possible to insert already deleted documents,
       * this can happen on replication.
       */
      var insertedIsDeleted = documentDeleted ? true : false;
      if (hasAttachments) {
        Object.entries(document._attachments).forEach(([attachmentId, attachmentData]) => {
          if (!attachmentData.data) {
            attachmentError = {
              documentId: docId,
              isError: true,
              status: 510,
              writeRow,
              attachmentId
            };
            errors.push(attachmentError);
          } else {
            attachmentsAdd.push({
              documentId: docId,
              attachmentId,
              attachmentData: attachmentData,
              digest: attachmentData.digest
            });
          }
        });
      }
      if (!attachmentError) {
        if (hasAttachments) {
          bulkInsertDocs.push(stripAttachmentsDataFromRow(writeRow));
          if (onInsert) {
            onInsert(document);
          }
        } else {
          bulkInsertDocs.push(writeRow);
          if (onInsert) {
            onInsert(document);
          }
        }
        newestRow = writeRow;
      }
      if (!insertedIsDeleted) {
        var event = {
          documentId: docId,
          operation: 'INSERT',
          documentData: hasAttachments ? stripAttachmentsDataFromDocument(document) : document,
          previousDocumentData: hasAttachments && previous ? stripAttachmentsDataFromDocument(previous) : previous
        };
        eventBulkEvents.push(event);
      }
    } else {
      // update existing document
      var revInDb = documentInDb._rev;

      /**
       * Check for conflict
       */
      if (!previous || !!previous && revInDb !== previous._rev) {
        // is conflict error
        var err = {
          isError: true,
          status: 409,
          documentId: docId,
          writeRow: writeRow,
          documentInDb
        };
        errors.push(err);
        return 1; // continue
      }

      // handle attachments data

      var updatedRow = hasAttachments ? stripAttachmentsDataFromRow(writeRow) : writeRow;
      if (hasAttachments) {
        if (documentDeleted) {
          /**
           * Deleted documents must have cleared all their attachments.
           */
          if (previous) {
            Object.keys(previous._attachments).forEach(attachmentId => {
              attachmentsRemove.push({
                documentId: docId,
                attachmentId,
                digest: utils_other_ensureNotFalsy(previous)._attachments[attachmentId].digest
              });
            });
          }
        } else {
          // first check for errors
          Object.entries(document._attachments).find(([attachmentId, attachmentData]) => {
            var previousAttachmentData = previous ? previous._attachments[attachmentId] : undefined;
            if (!previousAttachmentData && !attachmentData.data) {
              attachmentError = {
                documentId: docId,
                documentInDb: documentInDb,
                isError: true,
                status: 510,
                writeRow,
                attachmentId
              };
            }
            return true;
          });
          if (!attachmentError) {
            Object.entries(document._attachments).forEach(([attachmentId, attachmentData]) => {
              var previousAttachmentData = previous ? previous._attachments[attachmentId] : undefined;
              if (!previousAttachmentData) {
                attachmentsAdd.push({
                  documentId: docId,
                  attachmentId,
                  attachmentData: attachmentData,
                  digest: attachmentData.digest
                });
              } else {
                var newDigest = updatedRow.document._attachments[attachmentId].digest;
                if (attachmentData.data &&
                /**
                 * Performance shortcut,
                 * do not update the attachment data if it did not change.
                 */
                previousAttachmentData.digest !== newDigest) {
                  attachmentsUpdate.push({
                    documentId: docId,
                    attachmentId,
                    attachmentData: attachmentData,
                    digest: attachmentData.digest
                  });
                }
              }
            });
          }
        }
      }
      if (attachmentError) {
        errors.push(attachmentError);
      } else {
        if (hasAttachments) {
          bulkUpdateDocs.push(stripAttachmentsDataFromRow(updatedRow));
          if (onUpdate) {
            onUpdate(document);
          }
        } else {
          bulkUpdateDocs.push(updatedRow);
          if (onUpdate) {
            onUpdate(document);
          }
        }
        newestRow = updatedRow;
      }
      var eventDocumentData = null;
      var previousEventDocumentData = null;
      var operation = null;
      if (previousDeleted && !documentDeleted) {
        operation = 'INSERT';
        eventDocumentData = hasAttachments ? stripAttachmentsDataFromDocument(document) : document;
      } else if (previous && !previousDeleted && !documentDeleted) {
        operation = 'UPDATE';
        eventDocumentData = hasAttachments ? stripAttachmentsDataFromDocument(document) : document;
        previousEventDocumentData = previous;
      } else if (documentDeleted) {
        operation = 'DELETE';
        eventDocumentData = utils_other_ensureNotFalsy(document);
        previousEventDocumentData = previous;
      } else {
        throw rx_error_newRxError('SNH', {
          args: {
            writeRow
          }
        });
      }
      var _event = {
        documentId: docId,
        documentData: eventDocumentData,
        previousDocumentData: previousEventDocumentData,
        operation: operation
      };
      eventBulkEvents.push(_event);
    }
  };
  for (var rowId = 0; rowId < rowAmount; rowId++) {
    if (_loop()) continue;
  }
  return {
    bulkInsertDocs,
    bulkUpdateDocs,
    newestRow,
    errors,
    eventBulk,
    attachmentsAdd,
    attachmentsRemove,
    attachmentsUpdate
  };
}
function stripAttachmentsDataFromRow(writeRow) {
  return {
    previous: writeRow.previous,
    document: stripAttachmentsDataFromDocument(writeRow.document)
  };
}
function getAttachmentSize(attachmentBase64String) {
  return atob(attachmentBase64String).length;
}

/**
 * Used in custom RxStorage implementations.
 */
function attachmentWriteDataToNormalData(writeData) {
  var data = writeData.data;
  if (!data) {
    return writeData;
  }
  var ret = {
    length: getAttachmentSize(data),
    digest: writeData.digest,
    type: writeData.type
  };
  return ret;
}
function stripAttachmentsDataFromDocument(doc) {
  if (!doc._attachments || Object.keys(doc._attachments).length === 0) {
    return doc;
  }
  var useDoc = utils_object_flatClone(doc);
  useDoc._attachments = {};
  Object.entries(doc._attachments).forEach(([attachmentId, attachmentData]) => {
    useDoc._attachments[attachmentId] = attachmentWriteDataToNormalData(attachmentData);
  });
  return useDoc;
}

/**
 * Flat clone the document data
 * and also the _meta field.
 * Used many times when we want to change the meta
 * during replication etc.
 */
function flatCloneDocWithMeta(doc) {
  var ret = utils_object_flatClone(doc);
  ret._meta = utils_object_flatClone(doc._meta);
  return ret;
}
/**
 * Wraps the normal storageInstance of a RxCollection
 * to ensure that all access is properly using the hooks
 * and other data transformations and also ensure that database.lockedRun()
 * is used properly.
 */
function getWrappedStorageInstance(database, storageInstance,
/**
 * The original RxJsonSchema
 * before it was mutated by hooks.
 */
rxJsonSchema) {
  overwritable.deepFreezeWhenDevMode(rxJsonSchema);
  var primaryPath = rx_schema_helper_getPrimaryFieldOfPrimaryKey(rxJsonSchema.primaryKey);
  function transformDocumentDataFromRxDBToRxStorage(writeRow) {
    var data = utils_object_flatClone(writeRow.document);
    data._meta = utils_object_flatClone(data._meta);

    /**
     * Do some checks in dev-mode
     * that would be too performance expensive
     * in production.
     */
    if (overwritable.isDevMode()) {
      // ensure that the primary key has not been changed
      data = fillPrimaryKey(primaryPath, rxJsonSchema, data);

      /**
       * Ensure it can be structured cloned
       */
      try {
        /**
         * Notice that structuredClone() is not available
         * in ReactNative, so we test for JSON.stringify() instead
         * @link https://github.com/pubkey/rxdb/issues/5046#issuecomment-1827374498
         */
        if (typeof structuredClone === 'function') {
          structuredClone(writeRow);
        } else {
          JSON.parse(JSON.stringify(writeRow));
        }
      } catch (err) {
        throw rx_error_newRxError('DOC24', {
          collection: storageInstance.collectionName,
          document: writeRow.document
        });
      }

      /**
       * Ensure that the new revision is higher
       * then the previous one
       */
      if (writeRow.previous) {
        // TODO run this in the dev-mode plugin
        // const prev = parseRevision(writeRow.previous._rev);
        // const current = parseRevision(writeRow.document._rev);
        // if (current.height <= prev.height) {
        //     throw newRxError('SNH', {
        //         dataBefore: writeRow.previous,
        //         dataAfter: writeRow.document,
        //         args: {
        //             prev,
        //             current
        //         }
        //     });
        // }
      }

      /**
       * Ensure that _meta fields have been merged
       * and not replaced.
       * This is important so that when one plugin A
       * sets a _meta field and another plugin B does a write
       * to the document, it must be ensured that the
       * field of plugin A was not removed.
       */
      if (writeRow.previous) {
        Object.keys(writeRow.previous._meta).forEach(metaFieldName => {
          if (!Object.prototype.hasOwnProperty.call(writeRow.document._meta, metaFieldName)) {
            throw rx_error_newRxError('SNH', {
              dataBefore: writeRow.previous,
              dataAfter: writeRow.document
            });
          }
        });
      }
    }
    data._meta.lwt = utils_time_now();

    /**
     * Yes we really want to set the revision here.
     * If you make a plugin that relies on having its own revision
     * stored into the storage, use this.originalStorageInstance.bulkWrite() instead.
     */
    data._rev = utils_revision_createRevision(database.token, writeRow.previous);
    return {
      document: data,
      previous: writeRow.previous
    };
  }
  var ret = {
    originalStorageInstance: storageInstance,
    schema: storageInstance.schema,
    internals: storageInstance.internals,
    collectionName: storageInstance.collectionName,
    databaseName: storageInstance.databaseName,
    options: storageInstance.options,
    bulkWrite(rows, context) {
      var toStorageWriteRows = rows.map(row => transformDocumentDataFromRxDBToRxStorage(row));
      return database.lockedRun(() => storageInstance.bulkWrite(toStorageWriteRows, context))
      /**
       * The RxStorageInstance MUST NOT allow to insert already _deleted documents,
       * without sending the previous document version.
       * But for better developer experience, RxDB does allow to re-insert deleted documents.
       * We do this by automatically fixing the conflict errors for that case
       * by running another bulkWrite() and merging the results.
       * @link https://github.com/pubkey/rxdb/pull/3839
       */.then(writeResult => {
        var useWriteResult = {
          error: [],
          success: writeResult.success.slice(0)
        };
        var reInsertErrors = writeResult.error.filter(error => {
          if (error.status === 409 && !error.writeRow.previous && !error.writeRow.document._deleted && utils_other_ensureNotFalsy(error.documentInDb)._deleted) {
            return true;
          }
          useWriteResult.error.push(error);
          return false;
        });
        if (reInsertErrors.length > 0) {
          var reInserts = reInsertErrors.map(error => {
            return {
              previous: error.documentInDb,
              document: Object.assign({}, error.writeRow.document, {
                _rev: utils_revision_createRevision(database.token, error.documentInDb)
              })
            };
          });
          return database.lockedRun(() => storageInstance.bulkWrite(reInserts, context)).then(subResult => {
            utils_array_appendToArray(useWriteResult.error, subResult.error);
            utils_array_appendToArray(useWriteResult.success, subResult.success);
            return useWriteResult;
          });
        }
        return writeResult;
      });
    },
    query(preparedQuery) {
      return database.lockedRun(() => storageInstance.query(preparedQuery));
    },
    count(preparedQuery) {
      return database.lockedRun(() => storageInstance.count(preparedQuery));
    },
    findDocumentsById(ids, deleted) {
      return database.lockedRun(() => storageInstance.findDocumentsById(ids, deleted));
    },
    getAttachmentData(documentId, attachmentId, digest) {
      return database.lockedRun(() => storageInstance.getAttachmentData(documentId, attachmentId, digest));
    },
    getChangedDocumentsSince: !storageInstance.getChangedDocumentsSince ? undefined : (limit, checkpoint) => {
      return database.lockedRun(() => storageInstance.getChangedDocumentsSince(utils_other_ensureNotFalsy(limit), checkpoint));
    },
    cleanup(minDeletedTime) {
      return database.lockedRun(() => storageInstance.cleanup(minDeletedTime));
    },
    remove() {
      database.storageInstances.delete(ret);
      return database.lockedRun(() => storageInstance.remove());
    },
    close() {
      database.storageInstances.delete(ret);
      return database.lockedRun(() => storageInstance.close());
    },
    changeStream() {
      return storageInstance.changeStream();
    },
    conflictResultionTasks() {
      return storageInstance.conflictResultionTasks();
    },
    resolveConflictResultionTask(taskSolution) {
      if (taskSolution.output.isEqual) {
        return storageInstance.resolveConflictResultionTask(taskSolution);
      }
      var doc = Object.assign({}, taskSolution.output.documentData, {
        _meta: getDefaultRxDocumentMeta(),
        _rev: utils_document_getDefaultRevision(),
        _attachments: {}
      });
      var documentData = utils_object_flatClone(doc);
      delete documentData._meta;
      delete documentData._rev;
      delete documentData._attachments;
      return storageInstance.resolveConflictResultionTask({
        id: taskSolution.id,
        output: {
          isEqual: false,
          documentData
        }
      });
    }
  };
  database.storageInstances.add(ret);
  return ret;
}

/**
 * Each RxStorage implementation should
 * run this method at the first step of createStorageInstance()
 * to ensure that the configuration is correct.
 */
function ensureRxStorageInstanceParamsAreCorrect(params) {
  if (params.schema.keyCompression) {
    throw rx_error_newRxError('UT5', {
      args: {
        params
      }
    });
  }
  if (hasEncryption(params.schema)) {
    throw rx_error_newRxError('UT6', {
      args: {
        params
      }
    });
  }
  if (params.schema.attachments && params.schema.attachments.compression) {
    throw rx_error_newRxError('UT7', {
      args: {
        params
      }
    });
  }
}
function hasEncryption(jsonSchema) {
  if (!!jsonSchema.encrypted && jsonSchema.encrypted.length > 0 || jsonSchema.attachments && jsonSchema.attachments.encrypted) {
    return true;
  } else {
    return false;
  }
}
async function getChangedDocumentsSince(storageInstance, limit, checkpoint) {
  if (storageInstance.getChangedDocumentsSince) {
    return storageInstance.getChangedDocumentsSince(limit, checkpoint);
  }
  var primaryPath = getPrimaryFieldOfPrimaryKey(storageInstance.schema.primaryKey);
  var sinceLwt = checkpoint ? checkpoint.lwt : RX_META_LWT_MINIMUM;
  var sinceId = checkpoint ? checkpoint.id : '';
  var query = prepareQuery(storageInstance.schema, {
    selector: {
      $or: [{
        '_meta.lwt': {
          $gt: sinceLwt
        }
      }, {
        '_meta.lwt': {
          $eq: sinceLwt
        },
        [primaryPath]: {
          $gt: checkpoint ? sinceId : ''
        }
      }],
      // add this hint for better index usage
      '_meta.lwt': {
        $gte: sinceLwt
      }
    },
    sort: [{
      '_meta.lwt': 'asc'
    }, {
      [primaryPath]: 'asc'
    }],
    skip: 0,
    limit,
    index: ['_meta.lwt', primaryPath]
  });
  var result = await storageInstance.query(query);
  var documents = result.documents;
  var lastDoc = lastOfArray(documents);
  return {
    documents: documents,
    checkpoint: lastDoc ? {
      id: lastDoc[primaryPath],
      lwt: lastDoc._meta.lwt
    } : checkpoint ? checkpoint : {
      id: '',
      lwt: 0
    }
  };
}

/**
 * Wraps the storage and simluates
 * delays. Mostly used in tests.
 */
function randomDelayStorage(input) {
  var retStorage = {
    name: 'random-delay-' + input.storage.name,
    async createStorageInstance(params) {
      await promiseWait(input.delayTimeBefore());
      var storageInstance = await input.storage.createStorageInstance(params);
      await promiseWait(input.delayTimeAfter());

      // write still must be processed in order
      var writeQueue = PROMISE_RESOLVE_TRUE;
      return {
        databaseName: storageInstance.databaseName,
        internals: storageInstance.internals,
        options: storageInstance.options,
        schema: storageInstance.schema,
        collectionName: storageInstance.collectionName,
        async bulkWrite(a, b) {
          writeQueue = writeQueue.then(async () => {
            await promiseWait(input.delayTimeBefore());
            var response = await storageInstance.bulkWrite(a, b);
            await promiseWait(input.delayTimeAfter());
            return response;
          });
          var ret = await writeQueue;
          return ret;
        },
        async findDocumentsById(a, b) {
          await promiseWait(input.delayTimeBefore());
          var ret = await storageInstance.findDocumentsById(a, b);
          await promiseWait(input.delayTimeAfter());
          return ret;
        },
        async query(a) {
          await promiseWait(input.delayTimeBefore());
          var ret = await storageInstance.query(a);
          return ret;
        },
        async count(a) {
          await promiseWait(input.delayTimeBefore());
          var ret = await storageInstance.count(a);
          await promiseWait(input.delayTimeAfter());
          return ret;
        },
        async getAttachmentData(a, b, c) {
          await promiseWait(input.delayTimeBefore());
          var ret = await storageInstance.getAttachmentData(a, b, c);
          await promiseWait(input.delayTimeAfter());
          return ret;
        },
        getChangedDocumentsSince: !storageInstance.getChangedDocumentsSince ? undefined : async (a, b) => {
          await promiseWait(input.delayTimeBefore());
          var ret = await ensureNotFalsy(storageInstance.getChangedDocumentsSince)(a, b);
          await promiseWait(input.delayTimeAfter());
          return ret;
        },
        changeStream() {
          return storageInstance.changeStream();
        },
        conflictResultionTasks() {
          return storageInstance.conflictResultionTasks();
        },
        resolveConflictResultionTask(a) {
          return storageInstance.resolveConflictResultionTask(a);
        },
        async cleanup(a) {
          await promiseWait(input.delayTimeBefore());
          var ret = await storageInstance.cleanup(a);
          await promiseWait(input.delayTimeAfter());
          return ret;
        },
        async close() {
          await promiseWait(input.delayTimeBefore());
          var ret = await storageInstance.close();
          await promiseWait(input.delayTimeAfter());
          return ret;
        },
        async remove() {
          await promiseWait(input.delayTimeBefore());
          var ret = await storageInstance.remove();
          await promiseWait(input.delayTimeAfter());
          return ret;
        }
      };
    }
  };
  return retStorage;
}
//# sourceMappingURL=rx-storage-helper.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/rx-collection-helper.js







/**
 * fills in the default data.
 * This also clones the data.
 */
function fillObjectDataBeforeInsert(schema, data) {
  data = utils_object_flatClone(data);
  data = fillObjectWithDefaults(schema, data);
  data = fillPrimaryKey(schema.primaryPath, schema.jsonSchema, data);
  data._meta = getDefaultRxDocumentMeta();
  if (!Object.prototype.hasOwnProperty.call(data, '_deleted')) {
    data._deleted = false;
  }
  if (!Object.prototype.hasOwnProperty.call(data, '_attachments')) {
    data._attachments = {};
  }
  if (!Object.prototype.hasOwnProperty.call(data, '_rev')) {
    data._rev = utils_document_getDefaultRevision();
  }
  return data;
}

/**
 * Creates the storage instances that are used internally in the collection
 */
async function createRxCollectionStorageInstance(rxDatabase, storageInstanceCreationParams) {
  storageInstanceCreationParams.multiInstance = rxDatabase.multiInstance;
  var storageInstance = await rxDatabase.storage.createStorageInstance(storageInstanceCreationParams);
  return storageInstance;
}

/**
 * Removes the main storage of the collection
 * and all connected storages like the ones from the replication meta etc.
 */
async function removeCollectionStorages(storage, databaseInternalStorage, databaseInstanceToken, databaseName, collectionName, password,
/**
 * If no hash function is provided,
 * we assume that the whole internal store is removed anyway
 * so we do not have to delete the meta documents.
 */
hashFunction) {
  var allCollectionMetaDocs = await getAllCollectionDocuments(databaseInternalStorage);
  var relevantCollectionMetaDocs = allCollectionMetaDocs.filter(metaDoc => metaDoc.data.name === collectionName);
  var removeStorages = [];
  relevantCollectionMetaDocs.forEach(metaDoc => {
    removeStorages.push({
      collectionName: metaDoc.data.name,
      schema: metaDoc.data.schema,
      isCollection: true
    });
    metaDoc.data.connectedStorages.forEach(row => removeStorages.push({
      collectionName: row.collectionName,
      isCollection: false,
      schema: row.schema
    }));
  });

  // ensure uniqueness
  var alreadyAdded = new Set();
  removeStorages = removeStorages.filter(row => {
    var key = row.collectionName + '||' + row.schema.version;
    if (alreadyAdded.has(key)) {
      return false;
    } else {
      alreadyAdded.add(key);
      return true;
    }
  });

  // remove all the storages
  await Promise.all(removeStorages.map(async row => {
    var storageInstance = await storage.createStorageInstance({
      collectionName: row.collectionName,
      databaseInstanceToken,
      databaseName,
      multiInstance: false,
      options: {},
      schema: row.schema,
      password,
      devMode: overwritable.isDevMode()
    });
    await storageInstance.remove();
    if (row.isCollection) {
      await runAsyncPluginHooks('postRemoveRxCollection', {
        storage,
        databaseName: databaseName,
        collectionName
      });
    }
  }));

  // remove the meta documents
  if (hashFunction) {
    var writeRows = relevantCollectionMetaDocs.map(doc => {
      var writeDoc = flatCloneDocWithMeta(doc);
      writeDoc._deleted = true;
      writeDoc._meta.lwt = utils_time_now();
      writeDoc._rev = utils_revision_createRevision(databaseInstanceToken, doc);
      return {
        previous: doc,
        document: writeDoc
      };
    });
    await databaseInternalStorage.bulkWrite(writeRows, 'rx-database-remove-collection-all');
  }
}
//# sourceMappingURL=rx-collection-helper.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/change-event-buffer.js
/**
 * a buffer-cache which holds the last X changeEvents of the collection
 */


var ChangeEventBuffer = /*#__PURE__*/function () {
  /**
   * array with changeEvents
   * starts with oldest known event, ends with newest
   */

  function ChangeEventBuffer(collection) {
    this.subs = [];
    this.limit = 100;
    this.counter = 0;
    this.eventCounterMap = new WeakMap();
    this.buffer = [];
    this.collection = collection;
    this.subs.push(this.collection.$.pipe(filter_filter(cE => !cE.isLocal)).subscribe(cE => this._handleChangeEvent(cE)));
  }
  var _proto = ChangeEventBuffer.prototype;
  _proto._handleChangeEvent = function _handleChangeEvent(changeEvent) {
    this.counter++;
    this.buffer.push(changeEvent);
    this.eventCounterMap.set(changeEvent, this.counter);
    while (this.buffer.length > this.limit) {
      this.buffer.shift();
    }
  }

  /**
   * gets the array-index for the given pointer
   * @return arrayIndex which can be used to iterate from there. If null, pointer is out of lower bound
   */;
  _proto.getArrayIndexByPointer = function getArrayIndexByPointer(pointer) {
    var oldestEvent = this.buffer[0];
    var oldestCounter = this.eventCounterMap.get(oldestEvent);
    if (pointer < oldestCounter) return null; // out of bounds

    var rest = pointer - oldestCounter;
    return rest;
  }

  /**
   * get all changeEvents which came in later than the pointer-event
   * @return array with change-events. If null, pointer out of bounds
   */;
  _proto.getFrom = function getFrom(pointer) {
    var ret = [];
    var currentIndex = this.getArrayIndexByPointer(pointer);
    if (currentIndex === null)
      // out of bounds
      return null;
    while (true) {
      var nextEvent = this.buffer[currentIndex];
      currentIndex++;
      if (!nextEvent) {
        return ret;
      } else {
        ret.push(nextEvent);
      }
    }
  };
  _proto.runFrom = function runFrom(pointer, fn) {
    var ret = this.getFrom(pointer);
    if (ret === null) {
      throw new Error('out of bounds');
    } else {
      ret.forEach(cE => fn(cE));
    }
  }

  /**
   * no matter how many operations are done on one document,
   * only the last operation has to be checked to calculate the new state
   * this function reduces the events to the last ChangeEvent of each doc
   */;
  _proto.reduceByLastOfDoc = function reduceByLastOfDoc(changeEvents) {
    return changeEvents.slice(0);
    // TODO the old implementation was wrong
    // because it did not correctly reassigned the previousData of the changeevents
    // this should be added to the event-reduce library and not be done in RxDB
    var docEventMap = {};
    changeEvents.forEach(changeEvent => {
      docEventMap[changeEvent.documentId] = changeEvent;
    });
    return Object.values(docEventMap);
  };
  _proto.destroy = function destroy() {
    this.subs.forEach(sub => sub.unsubscribe());
  };
  return ChangeEventBuffer;
}();
function createChangeEventBuffer(collection) {
  return new ChangeEventBuffer(collection);
}
//# sourceMappingURL=change-event-buffer.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/incremental-write.js


/**
 * The incremental write queue
 * batches up all incremental writes to a collection
 * so that performance can be improved by:
 * - Running only one write even when there are multiple modifications to the same document.
 * - Run all writes ins a single bulkWrite() call even when there are writes to many documents.
 */
var IncrementalWriteQueue = /*#__PURE__*/function () {
  function IncrementalWriteQueue(storageInstance, primaryPath,
  // can be used to run hooks etc.
  preWrite, postWrite) {
    this.queueByDocId = new Map();
    this.isRunning = false;
    this.storageInstance = storageInstance;
    this.primaryPath = primaryPath;
    this.preWrite = preWrite;
    this.postWrite = postWrite;
  }
  var _proto = IncrementalWriteQueue.prototype;
  _proto.addWrite = function addWrite(lastKnownDocumentState, modifier) {
    var docId = lastKnownDocumentState[this.primaryPath];
    var ar = getFromMapOrCreate(this.queueByDocId, docId, () => []);
    var ret = new Promise((resolve, reject) => {
      var item = {
        lastKnownDocumentState,
        modifier,
        resolve,
        reject
      };
      utils_other_ensureNotFalsy(ar).push(item);
      this.triggerRun();
    });
    return ret;
  };
  _proto.triggerRun = async function triggerRun() {
    if (this.isRunning === true || this.queueByDocId.size === 0) {
      // already running
      return;
    }
    this.isRunning = true;
    var writeRows = [];

    /**
     * 'take over' so that while the async functions runs,
     * new incremental updates could be added from the outside.
     */
    var itemsById = this.queueByDocId;
    this.queueByDocId = new Map();
    await Promise.all(Array.from(itemsById.entries()).map(async ([_docId, items]) => {
      var oldData = findNewestOfDocumentStates(items.map(i => i.lastKnownDocumentState));
      var newData = oldData;
      for (var item of items) {
        try {
          newData = await item.modifier(
          /**
           * We have to clone() each time because the modifier
           * might throw while it already changed some properties
           * of the document.
           */
          utils_object_clone(newData));
        } catch (err) {
          item.reject(err);
          item.reject = () => {};
          item.resolve = () => {};
        }
      }
      try {
        await this.preWrite(newData, oldData);
      } catch (err) {
        /**
         * If the before-hooks fail,
         * we reject all of the writes because it is
         * not possible to determine which one is to blame.
         */
        items.forEach(item => item.reject(err));
        return;
      }
      writeRows.push({
        previous: oldData,
        document: newData
      });
    }));
    var writeResult = writeRows.length > 0 ? await this.storageInstance.bulkWrite(writeRows, 'incremental-write') : {
      error: [],
      success: []
    };

    // process success
    await Promise.all(writeResult.success.map(result => {
      var docId = result[this.primaryPath];
      this.postWrite(result);
      var items = getFromMapOrThrow(itemsById, docId);
      items.forEach(item => item.resolve(result));
    }));

    // process errors
    writeResult.error.forEach(error => {
      var docId = error.documentId;
      var items = getFromMapOrThrow(itemsById, docId);
      var isConflict = rx_error_isBulkWriteConflictError(error);
      if (isConflict) {
        // had conflict -> retry afterwards
        var ar = getFromMapOrCreate(this.queueByDocId, docId, () => []);
        /**
         * Add the items back to this.queueByDocId
         * by maintaining the original order.
         */
        items.reverse().forEach(item => {
          item.lastKnownDocumentState = utils_other_ensureNotFalsy(isConflict.documentInDb);
          utils_other_ensureNotFalsy(ar).unshift(item);
        });
      } else {
        // other error -> must be thrown
        var rxError = rxStorageWriteErrorToRxError(error);
        items.forEach(item => item.reject(rxError));
      }
    });
    this.isRunning = false;

    /**
     * Always trigger another run
     * because in between there might be new items
     * been added to the queue.
     */
    return this.triggerRun();
  };
  return IncrementalWriteQueue;
}();
function modifierFromPublicToInternal(publicModifier) {
  var ret = async docData => {
    var withoutMeta = stripMetaDataFromDocument(docData);
    withoutMeta._deleted = docData._deleted;
    var modified = await publicModifier(withoutMeta);
    var reattachedMeta = Object.assign({}, modified, {
      _meta: docData._meta,
      _attachments: docData._attachments,
      _rev: docData._rev,
      _deleted: typeof modified._deleted !== 'undefined' ? modified._deleted : docData._deleted
    });
    if (typeof reattachedMeta._deleted === 'undefined') {
      reattachedMeta._deleted = false;
    }
    return reattachedMeta;
  };
  return ret;
}
function findNewestOfDocumentStates(docs) {
  var newest = docs[0];
  var newestRevisionHeight = parseRevision(newest._rev).height;
  docs.forEach(doc => {
    var height = parseRevision(doc._rev).height;
    if (height > newestRevisionHeight) {
      newest = doc;
      newestRevisionHeight = height;
    }
  });
  return newest;
}
//# sourceMappingURL=incremental-write.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/rx-document.js









var basePrototype = {
  get primaryPath() {
    var _this = this;
    if (!_this.isInstanceOfRxDocument) {
      return undefined;
    }
    return _this.collection.schema.primaryPath;
  },
  get primary() {
    var _this = this;
    if (!_this.isInstanceOfRxDocument) {
      return undefined;
    }
    return _this._data[_this.primaryPath];
  },
  get revision() {
    var _this = this;
    if (!_this.isInstanceOfRxDocument) {
      return undefined;
    }
    return _this._data._rev;
  },
  get deleted$() {
    var _this = this;
    if (!_this.isInstanceOfRxDocument) {
      return undefined;
    }
    return _this.$.pipe(map_map(d => d._data._deleted));
  },
  get deleted() {
    var _this = this;
    if (!_this.isInstanceOfRxDocument) {
      return undefined;
    }
    return _this._data._deleted;
  },
  getLatest() {
    var latestDocData = this.collection._docCache.getLatestDocumentData(this.primary);
    return this.collection._docCache.getCachedRxDocument(latestDocData);
  },
  /**
   * returns the observable which emits the plain-data of this document
   */
  get $() {
    var _this = this;
    return _this.collection.$.pipe(filter_filter(changeEvent => !changeEvent.isLocal), filter_filter(changeEvent => changeEvent.documentId === this.primary), map_map(changeEvent => getDocumentDataOfRxChangeEvent(changeEvent)), startWith_startWith(_this.collection._docCache.getLatestDocumentData(this.primary)), distinctUntilChanged((prev, curr) => prev._rev === curr._rev), map_map(docData => this.collection._docCache.getCachedRxDocument(docData)), shareReplay(RXJS_SHARE_REPLAY_DEFAULTS));
  },
  /**
   * returns observable of the value of the given path
   */
  get$(path) {
    if (overwritable.isDevMode()) {
      if (path.includes('.item.')) {
        throw rx_error_newRxError('DOC1', {
          path
        });
      }
      if (path === this.primaryPath) {
        throw rx_error_newRxError('DOC2');
      }

      // final fields cannot be modified and so also not observed
      if (this.collection.schema.finalFields.includes(path)) {
        throw rx_error_newRxError('DOC3', {
          path
        });
      }
      var schemaObj = getSchemaByObjectPath(this.collection.schema.jsonSchema, path);
      if (!schemaObj) {
        throw rx_error_newRxError('DOC4', {
          path
        });
      }
    }
    return this.$.pipe(map_map(data => getProperty(data, path)), distinctUntilChanged());
  },
  /**
   * populate the given path
   */
  populate(path) {
    var schemaObj = getSchemaByObjectPath(this.collection.schema.jsonSchema, path);
    var value = this.get(path);
    if (!value) {
      return PROMISE_RESOLVE_NULL;
    }
    if (!schemaObj) {
      throw rx_error_newRxError('DOC5', {
        path
      });
    }
    if (!schemaObj.ref) {
      throw rx_error_newRxError('DOC6', {
        path,
        schemaObj
      });
    }
    var refCollection = this.collection.database.collections[schemaObj.ref];
    if (!refCollection) {
      throw rx_error_newRxError('DOC7', {
        ref: schemaObj.ref,
        path,
        schemaObj
      });
    }
    if (schemaObj.type === 'array') {
      return refCollection.findByIds(value).exec().then(res => {
        var valuesIterator = res.values();
        return Array.from(valuesIterator);
      });
    } else {
      return refCollection.findOne(value).exec();
    }
  },
  /**
   * get data by objectPath
   * @hotPath Performance here is really important,
   * run some tests before changing anything.
   */
  get(objPath) {
    return getFromMapOrCreate(this._propertyCache, objPath, () => {
      var valueObj = getProperty(this._data, objPath);

      // direct return if array or non-object
      if (typeof valueObj !== 'object' || valueObj === null || Array.isArray(valueObj)) {
        return overwritable.deepFreezeWhenDevMode(valueObj);
      }
      var _this = this;
      var proxy = new Proxy(
      /**
       * In dev-mode, the _data is deep-frozen
       * so we have to flat clone here so that
       * the proxy can work.
       */
      utils_object_flatClone(valueObj), {
        get(target, property) {
          if (typeof property !== 'string') {
            return target[property];
          }
          var lastChar = property.charAt(property.length - 1);
          if (lastChar === '$') {
            var key = property.slice(0, -1);
            return _this.get$(trimDots(objPath + '.' + key));
          } else if (lastChar === '_') {
            var _key = property.slice(0, -1);
            return _this.populate(trimDots(objPath + '.' + _key));
          } else {
            return _this.get(trimDots(objPath + '.' + property));
          }
        }
      });
      return proxy;
    });
  },
  toJSON(withMetaFields = false) {
    if (!withMetaFields) {
      var data = utils_object_flatClone(this._data);
      delete data._rev;
      delete data._attachments;
      delete data._deleted;
      delete data._meta;
      return overwritable.deepFreezeWhenDevMode(data);
    } else {
      return overwritable.deepFreezeWhenDevMode(this._data);
    }
  },
  toMutableJSON(withMetaFields = false) {
    return utils_object_clone(this.toJSON(withMetaFields));
  },
  /**
   * updates document
   * @overwritten by plugin (optional)
   * @param updateObj mongodb-like syntax
   */
  update(_updateObj) {
    throw pluginMissing('update');
  },
  incrementalUpdate(_updateObj) {
    throw pluginMissing('update');
  },
  updateCRDT(_updateObj) {
    throw pluginMissing('crdt');
  },
  putAttachment() {
    throw pluginMissing('attachments');
  },
  getAttachment() {
    throw pluginMissing('attachments');
  },
  allAttachments() {
    throw pluginMissing('attachments');
  },
  get allAttachments$() {
    throw pluginMissing('attachments');
  },
  async modify(mutationFunction,
  // used by some plugins that wrap the method
  _context) {
    var oldData = this._data;
    var newData = await modifierFromPublicToInternal(mutationFunction)(oldData);
    return this._saveData(newData, oldData);
  },
  /**
   * runs an incremental update over the document
   * @param function that takes the document-data and returns a new data-object
   */
  incrementalModify(mutationFunction,
  // used by some plugins that wrap the method
  _context) {
    return this.collection.incrementalWriteQueue.addWrite(this._data, modifierFromPublicToInternal(mutationFunction)).then(result => this.collection._docCache.getCachedRxDocument(result));
  },
  patch(patch) {
    var oldData = this._data;
    var newData = utils_object_clone(oldData);
    Object.entries(patch).forEach(([k, v]) => {
      newData[k] = v;
    });
    return this._saveData(newData, oldData);
  },
  /**
   * patches the given properties
   */
  incrementalPatch(patch) {
    return this.incrementalModify(docData => {
      Object.entries(patch).forEach(([k, v]) => {
        docData[k] = v;
      });
      return docData;
    });
  },
  /**
   * saves the new document-data
   * and handles the events
   */
  async _saveData(newData, oldData) {
    newData = utils_object_flatClone(newData);

    // deleted documents cannot be changed
    if (this._data._deleted) {
      throw rx_error_newRxError('DOC11', {
        id: this.primary,
        document: this
      });
    }
    await beforeDocumentUpdateWrite(this.collection, newData, oldData);
    var writeResult = await this.collection.storageInstance.bulkWrite([{
      previous: oldData,
      document: newData
    }], 'rx-document-save-data');
    var isError = writeResult.error[0];
    throwIfIsStorageWriteError(this.collection, this.primary, newData, isError);
    await this.collection._runHooks('post', 'save', newData, this);
    return this.collection._docCache.getCachedRxDocument(writeResult.success[0]);
  },
  /**
   * Remove the document.
   * Notice that there is no hard delete,
   * instead deleted documents get flagged with _deleted=true.
   */
  remove() {
    var collection = this.collection;
    if (this.deleted) {
      return Promise.reject(rx_error_newRxError('DOC13', {
        document: this,
        id: this.primary
      }));
    }
    var deletedData = utils_object_flatClone(this._data);
    var removedDocData;
    return collection._runHooks('pre', 'remove', deletedData, this).then(async () => {
      deletedData._deleted = true;
      var writeResult = await collection.storageInstance.bulkWrite([{
        previous: this._data,
        document: deletedData
      }], 'rx-document-remove');
      var isError = writeResult.error[0];
      throwIfIsStorageWriteError(collection, this.primary, deletedData, isError);
      return writeResult.success[0];
    }).then(removed => {
      removedDocData = removed;
      return this.collection._runHooks('post', 'remove', deletedData, this);
    }).then(() => {
      return this.collection._docCache.getCachedRxDocument(removedDocData);
    });
  },
  incrementalRemove() {
    return this.incrementalModify(async docData => {
      await this.collection._runHooks('pre', 'remove', docData, this);
      docData._deleted = true;
      return docData;
    }).then(async newDoc => {
      await this.collection._runHooks('post', 'remove', newDoc._data, newDoc);
      return newDoc;
    });
  },
  destroy() {
    throw rx_error_newRxError('DOC14');
  }
};
function createRxDocumentConstructor(proto = basePrototype) {
  var constructor = function RxDocumentConstructor(collection, docData) {
    this.collection = collection;

    // assume that this is always equal to the doc-data in the database
    this._data = docData;
    this._propertyCache = new Map();

    /**
     * because of the prototype-merge,
     * we can not use the native instanceof operator
     */
    this.isInstanceOfRxDocument = true;
  };
  constructor.prototype = proto;
  return constructor;
}
function createWithConstructor(constructor, collection, jsonData) {
  var doc = new constructor(collection, jsonData);
  runPluginHooks('createRxDocument', doc);
  return doc;
}
function isRxDocument(obj) {
  return typeof obj === 'object' && obj !== null && 'isInstanceOfRxDocument' in obj;
}
function beforeDocumentUpdateWrite(collection, newData, oldData) {
  /**
   * Meta values must always be merged
   * instead of overwritten.
   * This ensures that different plugins do not overwrite
   * each others meta properties.
   */
  newData._meta = Object.assign({}, oldData._meta, newData._meta);

  // ensure modifications are ok
  if (overwritable.isDevMode()) {
    collection.schema.validateChange(oldData, newData);
  }
  return collection._runHooks('pre', 'save', newData, oldData);
}
//# sourceMappingURL=rx-document.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/rx-document-prototype-merge.js
/**
 * For the ORM capabilities,
 * we have to merge the document prototype
 * with the ORM functions and the data
 * We do this iterating over the properties and
 * adding them to a new object.
 * In the future we should do this by chaining the __proto__ objects
 */





var constructorForCollection = new WeakMap();
function getDocumentPrototype(rxCollection) {
  var schemaProto = rxCollection.schema.getDocumentPrototype();
  var ormProto = getDocumentOrmPrototype(rxCollection);
  var baseProto = basePrototype;
  var proto = {};
  [schemaProto, ormProto, baseProto].forEach(obj => {
    var props = Object.getOwnPropertyNames(obj);
    props.forEach(key => {
      var desc = Object.getOwnPropertyDescriptor(obj, key);

      /**
       * When enumerable is true, it will show on console dir(instance)
       * To not pollute the output, only getters and methods are enumerable
       */
      var enumerable = true;
      if (key.startsWith('_') || key.endsWith('_') || key.startsWith('$') || key.endsWith('$')) enumerable = false;
      if (typeof desc.value === 'function') {
        // when getting a function, we automatically do a .bind(this)
        Object.defineProperty(proto, key, {
          get() {
            return desc.value.bind(this);
          },
          enumerable,
          configurable: false
        });
      } else {
        desc.enumerable = enumerable;
        desc.configurable = false;
        if (desc.writable) desc.writable = false;
        Object.defineProperty(proto, key, desc);
      }
    });
  });
  return proto;
}
function getRxDocumentConstructor(rxCollection) {
  return getFromMapOrCreate(constructorForCollection, rxCollection, () => createRxDocumentConstructor(getDocumentPrototype(rxCollection)));
}

/**
 * Create a RxDocument-instance from the jsonData
 * and the prototype merge.
 * You should never call this method directly,
 * instead you should get the document from collection._docCache.getCachedRxDocument().
 */
function createNewRxDocument(rxCollection, docData) {
  var doc = createWithConstructor(getRxDocumentConstructor(rxCollection), rxCollection, overwritable.deepFreezeWhenDevMode(docData));
  rxCollection._runHooksSync('post', 'create', docData, doc);
  runPluginHooks('postCreateRxDocument', doc);
  return doc;
}

/**
 * returns the prototype-object
 * that contains the orm-methods,
 * used in the proto-merge
 */
function getDocumentOrmPrototype(rxCollection) {
  var proto = {};
  Object.entries(rxCollection.methods).forEach(([k, v]) => {
    proto[k] = v;
  });
  return proto;
}
//# sourceMappingURL=rx-document-prototype-merge.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/replication-protocol/conflicts.js


var defaultConflictHandler = function (i, _context) {
  var newDocumentState = stripAttachmentsDataFromDocument(i.newDocumentState);
  var realMasterState = stripAttachmentsDataFromDocument(i.realMasterState);

  /**
   * If the documents are deep equal,
   * we have no conflict.
   * On your custom conflict handler you might only
   * check some properties, like the updatedAt time,
   * for better performance, because deepEqual is expensive.
   */
  if (deepEqual(newDocumentState, realMasterState)) {
    return Promise.resolve({
      isEqual: true
    });
  }

  /**
   * The default conflict handler will always
   * drop the fork state and use the master state instead.
   */
  return Promise.resolve({
    isEqual: false,
    documentData: i.realMasterState
  });
};

/**
 * Resolves a conflict error or determines that the given document states are equal.
 * Returns the resolved document that must be written to the fork.
 * Then the new document state can be pushed upstream.
 * If document is not in conflict, returns undefined.
 * If error is non-409, it throws an error.
 * Conflicts are only solved in the upstream, never in the downstream.
 */
async function resolveConflictError(state, input, forkState) {
  var conflictHandler = state.input.conflictHandler;
  var conflictHandlerOutput = await conflictHandler(input, 'replication-resolve-conflict');
  if (conflictHandlerOutput.isEqual) {
    /**
     * Documents are equal,
     * so this is not a conflict -> do nothing.
     */
    return undefined;
  } else {
    /**
     * We have a resolved conflict,
     * use the resolved document data.
     */
    var resolvedDoc = Object.assign({}, conflictHandlerOutput.documentData, {
      /**
       * Because the resolved conflict is written to the fork,
       * we have to keep/update the forks _meta data, not the masters.
       */
      _meta: flatClone(forkState._meta),
      _rev: getDefaultRevision(),
      _attachments: flatClone(forkState._attachments)
    });
    resolvedDoc._meta.lwt = now();
    resolvedDoc._rev = createRevision(await state.checkpointKey, forkState);
    return {
      resolvedDoc,
      output: conflictHandlerOutput
    };
  }
}
//# sourceMappingURL=conflicts.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/rx-collection.js
















var HOOKS_WHEN = ['pre', 'post'];
var HOOKS_KEYS = ['insert', 'save', 'remove', 'create'];
var hooksApplied = false;
var RxCollectionBase = /*#__PURE__*/function () {
  /**
   * Stores all 'normal' documents
   */

  function RxCollectionBase(database, name, schema, internalStorageInstance, instanceCreationOptions = {}, migrationStrategies = {}, methods = {}, attachments = {}, options = {}, cacheReplacementPolicy = defaultCacheReplacementPolicy, statics = {}, conflictHandler = defaultConflictHandler) {
    this.storageInstance = {};
    this.timeouts = new Set();
    this.incrementalWriteQueue = {};
    this._incrementalUpsertQueues = new Map();
    this.synced = false;
    this.hooks = {};
    this._subs = [];
    this._docCache = {};
    this._queryCache = createQueryCache();
    this.$ = {};
    this.checkpoint$ = {};
    this._changeEventBuffer = {};
    this.onDestroy = [];
    this.destroyed = false;
    this.database = database;
    this.name = name;
    this.schema = schema;
    this.internalStorageInstance = internalStorageInstance;
    this.instanceCreationOptions = instanceCreationOptions;
    this.migrationStrategies = migrationStrategies;
    this.methods = methods;
    this.attachments = attachments;
    this.options = options;
    this.cacheReplacementPolicy = cacheReplacementPolicy;
    this.statics = statics;
    this.conflictHandler = conflictHandler;
    _applyHookFunctions(this.asRxCollection);
  }
  var _proto = RxCollectionBase.prototype;
  _proto.prepare = async function prepare() {
    this.storageInstance = getWrappedStorageInstance(this.database, this.internalStorageInstance, this.schema.jsonSchema);
    this.incrementalWriteQueue = new IncrementalWriteQueue(this.storageInstance, this.schema.primaryPath, (newData, oldData) => beforeDocumentUpdateWrite(this, newData, oldData), result => this._runHooks('post', 'save', result));
    var collectionEventBulks$ = this.database.eventBulks$.pipe(filter_filter(changeEventBulk => changeEventBulk.collectionName === this.name));
    this.$ = collectionEventBulks$.pipe(mergeMap(changeEventBulk => changeEventBulk.events));
    this.checkpoint$ = collectionEventBulks$.pipe(map_map(changeEventBulk => changeEventBulk.checkpoint));
    this._changeEventBuffer = createChangeEventBuffer(this.asRxCollection);
    this._docCache = new DocumentCache(this.schema.primaryPath, this.$.pipe(filter_filter(cE => !cE.isLocal)), docData => createNewRxDocument(this.asRxCollection, docData));

    /**
     * Instead of resolving the EventBulk array here and spit it into
     * single events, we should fully work with event bulks internally
     * to save performance.
     */
    var databaseStorageToken = await this.database.storageToken;
    var subDocs = this.storageInstance.changeStream().subscribe(eventBulk => {
      var changeEventBulk = {
        id: eventBulk.id,
        internal: false,
        collectionName: this.name,
        storageToken: databaseStorageToken,
        events: eventBulk.events.map(ev => storageChangeEventToRxChangeEvent(false, ev, this)),
        databaseToken: this.database.token,
        checkpoint: eventBulk.checkpoint,
        context: eventBulk.context,
        endTime: eventBulk.endTime,
        startTime: eventBulk.startTime
      };
      this.database.$emit(changeEventBulk);
    });
    this._subs.push(subDocs);

    /**
     * Resolve the conflict tasks
     * of the RxStorageInstance
     */
    this._subs.push(this.storageInstance.conflictResultionTasks().subscribe(task => {
      this.conflictHandler(task.input, task.context).then(output => {
        this.storageInstance.resolveConflictResultionTask({
          id: task.id,
          output
        });
      });
    }));
    return PROMISE_RESOLVE_VOID;
  }

  /**
   * Manually call the cleanup function of the storage.
   * @link https://rxdb.info/cleanup.html
   */;
  _proto.cleanup = function cleanup(_minimumDeletedTime) {
    throw pluginMissing('cleanup');
  }

  // overwritten by migration-plugin
  ;
  _proto.migrationNeeded = function migrationNeeded() {
    throw pluginMissing('migration');
  };
  _proto.getMigrationState = function getMigrationState() {
    throw pluginMissing('migration');
  };
  _proto.startMigration = function startMigration(batchSize = 10) {
    return this.getMigrationState().startMigration(batchSize);
  };
  _proto.migratePromise = function migratePromise(batchSize = 10) {
    return this.getMigrationState().migratePromise(batchSize);
  };
  _proto.insert = async function insert(json) {
    var writeResult = await this.bulkInsert([json]);
    var isError = writeResult.error[0];
    throwIfIsStorageWriteError(this, json[this.schema.primaryPath], json, isError);
    var insertResult = utils_other_ensureNotFalsy(writeResult.success[0]);
    return insertResult;
  };
  _proto.bulkInsert = async function bulkInsert(docsData) {
    /**
     * Optimization shortcut,
     * do nothing when called with an empty array
    */
    if (docsData.length === 0) {
      return {
        success: [],
        error: []
      };
    }
    var primaryPath = this.schema.primaryPath;
    var useDocs = docsData.map(docData => {
      var useDocData = fillObjectDataBeforeInsert(this.schema, docData);
      return useDocData;
    });
    var docs = this.hasHooks('pre', 'insert') ? await Promise.all(useDocs.map(doc => {
      return this._runHooks('pre', 'insert', doc).then(() => {
        return doc;
      });
    })) : useDocs;
    var insertRows = docs.map(doc => {
      var row = {
        document: doc
      };
      return row;
    });
    var results = await this.storageInstance.bulkWrite(insertRows, 'rx-collection-bulk-insert');

    // create documents
    var rxDocuments = mapDocumentsDataToCacheDocs(this._docCache, results.success);
    if (this.hasHooks('post', 'insert')) {
      var docsMap = new Map();
      docs.forEach(doc => {
        docsMap.set(doc[primaryPath], doc);
      });
      await Promise.all(rxDocuments.map(doc => {
        return this._runHooks('post', 'insert', docsMap.get(doc.primary), doc);
      }));
    }
    return {
      success: rxDocuments,
      error: results.error
    };
  };
  _proto.bulkRemove = async function bulkRemove(ids) {
    var primaryPath = this.schema.primaryPath;
    /**
     * Optimization shortcut,
     * do nothing when called with an empty array
     */
    if (ids.length === 0) {
      return {
        success: [],
        error: []
      };
    }
    var rxDocumentMap = await this.findByIds(ids).exec();
    var docsData = [];
    var docsMap = new Map();
    Array.from(rxDocumentMap.values()).forEach(rxDocument => {
      var data = rxDocument.toMutableJSON(true);
      docsData.push(data);
      docsMap.set(rxDocument.primary, data);
    });
    await Promise.all(docsData.map(doc => {
      var primary = doc[this.schema.primaryPath];
      return this._runHooks('pre', 'remove', doc, rxDocumentMap.get(primary));
    }));
    var removeDocs = docsData.map(doc => {
      var writeDoc = utils_object_flatClone(doc);
      writeDoc._deleted = true;
      return {
        previous: doc,
        document: writeDoc
      };
    });
    var results = await this.storageInstance.bulkWrite(removeDocs, 'rx-collection-bulk-remove');
    var successIds = results.success.map(d => d[primaryPath]);

    // run hooks
    await Promise.all(successIds.map(id => {
      return this._runHooks('post', 'remove', docsMap.get(id), rxDocumentMap.get(id));
    }));
    var rxDocuments = successIds.map(id => getFromMapOrThrow(rxDocumentMap, id));
    return {
      success: rxDocuments,
      error: results.error
    };
  }

  /**
   * same as bulkInsert but overwrites existing document with same primary
   */;
  _proto.bulkUpsert = async function bulkUpsert(docsData) {
    var insertData = [];
    var useJsonByDocId = new Map();
    docsData.forEach(docData => {
      var useJson = fillObjectDataBeforeInsert(this.schema, docData);
      var primary = useJson[this.schema.primaryPath];
      if (!primary) {
        throw rx_error_newRxError('COL3', {
          primaryPath: this.schema.primaryPath,
          data: useJson,
          schema: this.schema.jsonSchema
        });
      }
      useJsonByDocId.set(primary, useJson);
      insertData.push(useJson);
    });
    var insertResult = await this.bulkInsert(insertData);
    var success = insertResult.success.slice(0);
    var error = [];

    // update the ones that existed already
    await Promise.all(insertResult.error.map(async err => {
      if (err.status !== 409) {
        error.push(err);
      } else {
        var id = err.documentId;
        var writeData = getFromMapOrThrow(useJsonByDocId, id);
        var docDataInDb = utils_other_ensureNotFalsy(err.documentInDb);
        var doc = this._docCache.getCachedRxDocument(docDataInDb);
        var newDoc = await doc.incrementalModify(() => writeData);
        success.push(newDoc);
      }
    }));
    return {
      error,
      success
    };
  }

  /**
   * same as insert but overwrites existing document with same primary
   */;
  _proto.upsert = async function upsert(json) {
    var bulkResult = await this.bulkUpsert([json]);
    throwIfIsStorageWriteError(this.asRxCollection, json[this.schema.primaryPath], json, bulkResult.error[0]);
    return bulkResult.success[0];
  }

  /**
   * upserts to a RxDocument, uses incrementalModify if document already exists
   */;
  _proto.incrementalUpsert = function incrementalUpsert(json) {
    var useJson = fillObjectDataBeforeInsert(this.schema, json);
    var primary = useJson[this.schema.primaryPath];
    if (!primary) {
      throw rx_error_newRxError('COL4', {
        data: json
      });
    }

    // ensure that it won't try 2 parallel runs
    var queue = this._incrementalUpsertQueues.get(primary);
    if (!queue) {
      queue = PROMISE_RESOLVE_VOID;
    }
    queue = queue.then(() => _incrementalUpsertEnsureRxDocumentExists(this, primary, useJson)).then(wasInserted => {
      if (!wasInserted.inserted) {
        return _incrementalUpsertUpdate(wasInserted.doc, useJson);
      } else {
        return wasInserted.doc;
      }
    });
    this._incrementalUpsertQueues.set(primary, queue);
    return queue;
  };
  _proto.find = function find(queryObj) {
    if (typeof queryObj === 'string') {
      throw rx_error_newRxError('COL5', {
        queryObj
      });
    }
    if (!queryObj) {
      queryObj = _getDefaultQuery();
    }
    var query = createRxQuery('find', queryObj, this);
    return query;
  };
  _proto.findOne = function findOne(queryObj) {
    // TODO move this check to dev-mode plugin
    if (typeof queryObj === 'number' || Array.isArray(queryObj)) {
      throw newRxTypeError('COL6', {
        queryObj
      });
    }
    var query;
    if (typeof queryObj === 'string') {
      query = createRxQuery('findOne', {
        selector: {
          [this.schema.primaryPath]: queryObj
        },
        limit: 1
      }, this);
    } else {
      if (!queryObj) {
        queryObj = _getDefaultQuery();
      }

      // cannot have limit on findOne queries because it will be overwritten
      if (queryObj.limit) {
        throw rx_error_newRxError('QU6');
      }
      queryObj = utils_object_flatClone(queryObj);
      queryObj.limit = 1;
      query = createRxQuery('findOne', queryObj, this);
    }
    return query;
  };
  _proto.count = function count(queryObj) {
    if (!queryObj) {
      queryObj = _getDefaultQuery();
    }
    var query = createRxQuery('count', queryObj, this);
    return query;
  }

  /**
   * find a list documents by their primary key
   * has way better performance then running multiple findOne() or a find() with a complex $or-selected
   */;
  _proto.findByIds = function findByIds(ids) {
    var mangoQuery = {
      selector: {
        [this.schema.primaryPath]: {
          $in: ids.slice(0)
        }
      }
    };
    var query = createRxQuery('findByIds', mangoQuery, this);
    return query;
  }

  /**
   * Export collection to a JSON friendly format.
   */;
  _proto.exportJSON = function exportJSON() {
    throw pluginMissing('json-dump');
  }

  /**
   * Import the parsed JSON export into the collection.
   * @param _exportedJSON The previously exported data from the `<collection>.exportJSON()` method.
   */;
  _proto.importJSON = function importJSON(_exportedJSON) {
    throw pluginMissing('json-dump');
  };
  _proto.insertCRDT = function insertCRDT(_updateObj) {
    throw pluginMissing('crdt');
  }

  /**
   * HOOKS
   */;
  _proto.addHook = function addHook(when, key, fun, parallel = false) {
    if (typeof fun !== 'function') {
      throw newRxTypeError('COL7', {
        key,
        when
      });
    }
    if (!HOOKS_WHEN.includes(when)) {
      throw newRxTypeError('COL8', {
        key,
        when
      });
    }
    if (!HOOKS_KEYS.includes(key)) {
      throw rx_error_newRxError('COL9', {
        key
      });
    }
    if (when === 'post' && key === 'create' && parallel === true) {
      throw rx_error_newRxError('COL10', {
        when,
        key,
        parallel
      });
    }

    // bind this-scope to hook-function
    var boundFun = fun.bind(this);
    var runName = parallel ? 'parallel' : 'series';
    this.hooks[key] = this.hooks[key] || {};
    this.hooks[key][when] = this.hooks[key][when] || {
      series: [],
      parallel: []
    };
    this.hooks[key][when][runName].push(boundFun);
  };
  _proto.getHooks = function getHooks(when, key) {
    if (!this.hooks[key] || !this.hooks[key][when]) {
      return {
        series: [],
        parallel: []
      };
    }
    return this.hooks[key][when];
  };
  _proto.hasHooks = function hasHooks(when, key) {
    var hooks = this.getHooks(when, key);
    if (!hooks) {
      return false;
    }
    return hooks.series.length > 0 || hooks.parallel.length > 0;
  };
  _proto._runHooks = function _runHooks(when, key, data, instance) {
    var hooks = this.getHooks(when, key);
    if (!hooks) {
      return PROMISE_RESOLVE_VOID;
    }

    // run parallel: false
    var tasks = hooks.series.map(hook => () => hook(data, instance));
    return promiseSeries(tasks)
    // run parallel: true
    .then(() => Promise.all(hooks.parallel.map(hook => hook(data, instance))));
  }

  /**
   * does the same as ._runHooks() but with non-async-functions
   */;
  _proto._runHooksSync = function _runHooksSync(when, key, data, instance) {
    var hooks = this.getHooks(when, key);
    if (!hooks) return;
    hooks.series.forEach(hook => hook(data, instance));
  }

  /**
   * Returns a promise that resolves after the given time.
   * Ensures that is properly cleans up when the collection is destroyed
   * so that no running timeouts prevent the exit of the JavaScript process.
   */;
  _proto.promiseWait = function promiseWait(time) {
    var ret = new Promise(res => {
      var timeout = setTimeout(() => {
        this.timeouts.delete(timeout);
        res();
      }, time);
      this.timeouts.add(timeout);
    });
    return ret;
  };
  _proto.destroy = function destroy() {
    if (this.destroyed) {
      return PROMISE_RESOLVE_FALSE;
    }

    /**
     * Settings destroyed = true
     * must be the first thing to do,
     * so for example the replication can directly stop
     * instead of sending requests to a closed storage.
     */
    this.destroyed = true;
    Array.from(this.timeouts).forEach(timeout => clearTimeout(timeout));
    if (this._changeEventBuffer) {
      this._changeEventBuffer.destroy();
    }
    /**
     * First wait until the whole database is idle.
     * This ensures that the storage does not get closed
     * while some operation is running.
     * It is important that we do not intercept a running call
     * because it might lead to undefined behavior like when a doc is written
     * but the change is not added to the changes collection.
     */
    return this.database.requestIdlePromise().then(() => Promise.all(this.onDestroy.map(fn => fn()))).then(() => this.storageInstance.close()).then(() => {
      /**
       * Unsubscribing must be done AFTER the storageInstance.close()
       * Because the conflict handling is part of the subscriptions and
       * otherwise there might be open conflicts to be resolved which
       * will then stuck and never resolve.
       */
      this._subs.forEach(sub => sub.unsubscribe());
      delete this.database.collections[this.name];
      return runAsyncPluginHooks('postDestroyRxCollection', this).then(() => true);
    });
  }

  /**
   * remove all data of the collection
   */;
  _proto.remove = async function remove() {
    await this.destroy();
    await removeCollectionStorages(this.database.storage, this.database.internalStore, this.database.token, this.database.name, this.name, this.database.password, this.database.hashFunction);
  };
  _createClass(RxCollectionBase, [{
    key: "insert$",
    get: function () {
      return this.$.pipe(filter_filter(cE => cE.operation === 'INSERT'));
    }
  }, {
    key: "update$",
    get: function () {
      return this.$.pipe(filter_filter(cE => cE.operation === 'UPDATE'));
    }
  }, {
    key: "remove$",
    get: function () {
      return this.$.pipe(filter_filter(cE => cE.operation === 'DELETE'));
    }

    // defaults

    /**
     * When the collection is destroyed,
     * these functions will be called an awaited.
     * Used to automatically clean up stuff that
     * belongs to this collection.
     */
  }, {
    key: "asRxCollection",
    get: function () {
      return this;
    }
  }]);
  return RxCollectionBase;
}();

/**
 * adds the hook-functions to the collections prototype
 * this runs only once
 */
function _applyHookFunctions(collection) {
  if (hooksApplied) return; // already run
  hooksApplied = true;
  var colProto = Object.getPrototypeOf(collection);
  HOOKS_KEYS.forEach(key => {
    HOOKS_WHEN.map(when => {
      var fnName = when + ucfirst(key);
      colProto[fnName] = function (fun, parallel) {
        return this.addHook(when, key, fun, parallel);
      };
    });
  });
}
function _incrementalUpsertUpdate(doc, json) {
  return doc.incrementalModify(_innerDoc => {
    return json;
  });
}

/**
 * ensures that the given document exists
 * @return promise that resolves with new doc and flag if inserted
 */
function _incrementalUpsertEnsureRxDocumentExists(rxCollection, primary, json) {
  /**
   * Optimisation shortcut,
   * first try to find the document in the doc-cache
   */
  var docDataFromCache = rxCollection._docCache.getLatestDocumentDataIfExists(primary);
  if (docDataFromCache) {
    return Promise.resolve({
      doc: rxCollection._docCache.getCachedRxDocument(docDataFromCache),
      inserted: false
    });
  }
  return rxCollection.findOne(primary).exec().then(doc => {
    if (!doc) {
      return rxCollection.insert(json).then(newDoc => ({
        doc: newDoc,
        inserted: true
      }));
    } else {
      return {
        doc,
        inserted: false
      };
    }
  });
}

/**
 * creates and prepares a new collection
 */
function createRxCollection({
  database,
  name,
  schema,
  instanceCreationOptions = {},
  migrationStrategies = {},
  autoMigrate = true,
  statics = {},
  methods = {},
  attachments = {},
  options = {},
  localDocuments = false,
  cacheReplacementPolicy = defaultCacheReplacementPolicy,
  conflictHandler = defaultConflictHandler
}) {
  var storageInstanceCreationParams = {
    databaseInstanceToken: database.token,
    databaseName: database.name,
    collectionName: name,
    schema: schema.jsonSchema,
    options: instanceCreationOptions,
    multiInstance: database.multiInstance,
    password: database.password,
    devMode: overwritable.isDevMode()
  };
  runPluginHooks('preCreateRxStorageInstance', storageInstanceCreationParams);
  return createRxCollectionStorageInstance(database, storageInstanceCreationParams).then(storageInstance => {
    var collection = new RxCollectionBase(database, name, schema, storageInstance, instanceCreationOptions, migrationStrategies, methods, attachments, options, cacheReplacementPolicy, statics, conflictHandler);
    return collection.prepare().then(() => {
      // ORM add statics
      Object.entries(statics).forEach(([funName, fun]) => {
        Object.defineProperty(collection, funName, {
          get: () => fun.bind(collection)
        });
      });
      var ret = PROMISE_RESOLVE_VOID;
      if (autoMigrate && collection.schema.version !== 0) {
        ret = collection.migratePromise();
      }
      return ret;
    }).then(() => {
      runPluginHooks('createRxCollection', {
        collection,
        creator: {
          name,
          schema,
          storageInstance,
          instanceCreationOptions,
          migrationStrategies,
          methods,
          attachments,
          options,
          cacheReplacementPolicy,
          localDocuments,
          statics
        }
      });
      return collection;
    })
    /**
     * If the collection creation fails,
     * we yet have to close the storage instances.
     */.catch(err => {
      return storageInstance.close().then(() => Promise.reject(err));
    });
  });
}
function isRxCollection(obj) {
  return obj instanceof RxCollectionBase;
}
//# sourceMappingURL=rx-collection.js.map
;// CONCATENATED MODULE: ./node_modules/oblivious-set/dist/esm/src/index.js
/**
 * this is a set which automatically forgets
 * a given entry when a new entry is set and the ttl
 * of the old one is over
 */
class ObliviousSet {
    ttl;
    map = new Map();
    /**
     * Creating calls to setTimeout() is expensive,
     * so we only do that if there is not timeout already open.
     */
    _to = false;
    constructor(ttl) {
        this.ttl = ttl;
    }
    has(value) {
        return this.map.has(value);
    }
    add(value) {
        this.map.set(value, src_now());
        /**
         * When a new value is added,
         * start the cleanup at the next tick
         * to not block the cpu for more important stuff
         * that might happen.
         */
        if (!this._to) {
            this._to = true;
            setTimeout(() => {
                this._to = false;
                removeTooOldValues(this);
            }, 0);
        }
    }
    clear() {
        this.map.clear();
    }
}
/**
 * Removes all entries from the set
 * where the TTL has expired
 */
function removeTooOldValues(obliviousSet) {
    const olderThen = src_now() - obliviousSet.ttl;
    const iterator = obliviousSet.map[Symbol.iterator]();
    /**
     * Because we can assume the new values are added at the bottom,
     * we start from the top and stop as soon as we reach a non-too-old value.
     */
    while (true) {
        const next = iterator.next().value;
        if (!next) {
            return; // no more elements
        }
        const value = next[0];
        const time = next[1];
        if (time < olderThen) {
            obliviousSet.map.delete(value);
        }
        else {
            // We reached a value that is not old enough
            return;
        }
    }
}
function src_now() {
    return Date.now();
}
//# sourceMappingURL=index.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/rx-database.js














/**
 * stores the used database names
 * so we can throw when the same database is created more then once.
 */
var USED_DATABASE_NAMES = new Set();
var DB_COUNT = 0;
var RxDatabaseBase = /*#__PURE__*/function () {
  /**
   * Contains all known non-closed storage instances
   * that belong to this database.
   * Used in plugins and unit tests.
   */

  function RxDatabaseBase(name,
  /**
   * Uniquely identifies the instance
   * of this RxDatabase.
   */
  token, storage, instanceCreationOptions, password, multiInstance, eventReduce = false, options = {},
  /**
   * Stores information documents about the collections of the database
   */
  internalStore, hashFunction, cleanupPolicy, allowSlowCount) {
    this.idleQueue = new IdleQueue();
    this.rxdbVersion = RXDB_VERSION;
    this.storageInstances = new Set();
    this._subs = [];
    this.startupErrors = [];
    this.onDestroy = [];
    this.destroyed = false;
    this.collections = {};
    this.eventBulks$ = new Subject();
    this.observable$ = this.eventBulks$.pipe(mergeMap(changeEventBulk => changeEventBulk.events));
    this.storageToken = PROMISE_RESOLVE_FALSE;
    this.storageTokenDocument = PROMISE_RESOLVE_FALSE;
    this.emittedEventBulkIds = new ObliviousSet(60 * 1000);
    this.name = name;
    this.token = token;
    this.storage = storage;
    this.instanceCreationOptions = instanceCreationOptions;
    this.password = password;
    this.multiInstance = multiInstance;
    this.eventReduce = eventReduce;
    this.options = options;
    this.internalStore = internalStore;
    this.hashFunction = hashFunction;
    this.cleanupPolicy = cleanupPolicy;
    this.allowSlowCount = allowSlowCount;
    DB_COUNT++;

    /**
     * In the dev-mode, we create a pseudoInstance
     * to get all properties of RxDatabase and ensure they do not
     * conflict with the collection names etc.
     * So only if it is not pseudoInstance,
     * we have all values to prepare a real RxDatabase.
     *
     * TODO this is ugly, we should use a different way in the dev-mode
     * so that all non-dev-mode code can be cleaner.
     */
    if (this.name !== 'pseudoInstance') {
      /**
       * Wrap the internal store
       * to ensure that calls to it also end up in
       * calculation of the idle state and the hooks.
       */
      this.internalStore = getWrappedStorageInstance(this.asRxDatabase, internalStore, INTERNAL_STORE_SCHEMA);

      /**
       * Start writing the storage token.
       * Do not await the creation because it would run
       * in a critical path that increases startup time.
       *
       * Writing the token takes about 20 milliseconds
       * even on a fast adapter, so this is worth it.
       */
      this.storageTokenDocument = ensureStorageTokenDocumentExists(this.asRxDatabase).catch(err => this.startupErrors.push(err));
      this.storageToken = this.storageTokenDocument.then(doc => doc.data.token).catch(err => this.startupErrors.push(err));
    }
  }
  var _proto = RxDatabaseBase.prototype;
  /**
   * This is the main handle-point for all change events
   * ChangeEvents created by this instance go:
   * RxDocument -> RxCollection -> RxDatabase.$emit -> MultiInstance
   * ChangeEvents created by other instances go:
   * MultiInstance -> RxDatabase.$emit -> RxCollection -> RxDatabase
   */
  _proto.$emit = function $emit(changeEventBulk) {
    if (this.emittedEventBulkIds.has(changeEventBulk.id)) {
      return;
    }
    this.emittedEventBulkIds.add(changeEventBulk.id);

    // emit into own stream
    this.eventBulks$.next(changeEventBulk);
  }

  /**
   * removes the collection-doc from the internalStore
   */;
  _proto.removeCollectionDoc = async function removeCollectionDoc(name, schema) {
    var doc = await rx_storage_helper_getSingleDocument(this.internalStore, getPrimaryKeyOfInternalDocument(_collectionNamePrimary(name, schema), INTERNAL_CONTEXT_COLLECTION));
    if (!doc) {
      throw rx_error_newRxError('SNH', {
        name,
        schema
      });
    }
    var writeDoc = flatCloneDocWithMeta(doc);
    writeDoc._deleted = true;
    await this.internalStore.bulkWrite([{
      document: writeDoc,
      previous: doc
    }], 'rx-database-remove-collection');
  }

  /**
   * creates multiple RxCollections at once
   * to be much faster by saving db txs and doing stuff in bulk-operations
   * This function is not called often, but mostly in the critical path at the initial page load
   * So it must be as fast as possible.
   */;
  _proto.addCollections = async function addCollections(collectionCreators) {
    var jsonSchemas = {};
    var schemas = {};
    var bulkPutDocs = [];
    var useArgsByCollectionName = {};
    await Promise.all(Object.entries(collectionCreators).map(async ([name, args]) => {
      var collectionName = name;
      var rxJsonSchema = args.schema;
      jsonSchemas[collectionName] = rxJsonSchema;
      var schema = createRxSchema(rxJsonSchema, this.hashFunction);
      schemas[collectionName] = schema;

      // collection already exists
      if (this.collections[name]) {
        throw rx_error_newRxError('DB3', {
          name
        });
      }
      var collectionNameWithVersion = _collectionNamePrimary(name, rxJsonSchema);
      var collectionDocData = {
        id: getPrimaryKeyOfInternalDocument(collectionNameWithVersion, INTERNAL_CONTEXT_COLLECTION),
        key: collectionNameWithVersion,
        context: INTERNAL_CONTEXT_COLLECTION,
        data: {
          name: collectionName,
          schemaHash: await schema.hash,
          schema: schema.jsonSchema,
          version: schema.version,
          connectedStorages: []
        },
        _deleted: false,
        _meta: getDefaultRxDocumentMeta(),
        _rev: utils_document_getDefaultRevision(),
        _attachments: {}
      };
      bulkPutDocs.push({
        document: collectionDocData
      });
      var useArgs = Object.assign({}, args, {
        name: collectionName,
        schema,
        database: this
      });

      // run hooks
      var hookData = utils_object_flatClone(args);
      hookData.database = this;
      hookData.name = name;
      runPluginHooks('preCreateRxCollection', hookData);
      useArgs.conflictHandler = hookData.conflictHandler;
      useArgsByCollectionName[collectionName] = useArgs;
    }));
    var putDocsResult = await this.internalStore.bulkWrite(bulkPutDocs, 'rx-database-add-collection');
    await ensureNoStartupErrors(this);
    await Promise.all(putDocsResult.error.map(async error => {
      if (error.status !== 409) {
        throw rx_error_newRxError('DB12', {
          database: this.name,
          writeError: error
        });
      }
      var docInDb = utils_other_ensureNotFalsy(error.documentInDb);
      var collectionName = docInDb.data.name;
      var schema = schemas[collectionName];
      // collection already exists but has different schema
      if (docInDb.data.schemaHash !== (await schema.hash)) {
        throw rx_error_newRxError('DB6', {
          database: this.name,
          collection: collectionName,
          previousSchemaHash: docInDb.data.schemaHash,
          schemaHash: await schema.hash,
          previousSchema: docInDb.data.schema,
          schema: utils_other_ensureNotFalsy(jsonSchemas[collectionName])
        });
      }
    }));
    var ret = {};
    await Promise.all(Object.keys(collectionCreators).map(async collectionName => {
      var useArgs = useArgsByCollectionName[collectionName];
      var collection = await createRxCollection(useArgs);
      ret[collectionName] = collection;

      // set as getter to the database
      this.collections[collectionName] = collection;
      if (!this[collectionName]) {
        Object.defineProperty(this, collectionName, {
          get: () => this.collections[collectionName]
        });
      }
    }));
    return ret;
  }

  /**
   * runs the given function between idleQueue-locking
   */;
  _proto.lockedRun = function lockedRun(fn) {
    return this.idleQueue.wrapCall(fn);
  };
  _proto.requestIdlePromise = function requestIdlePromise() {
    return this.idleQueue.requestIdlePromise();
  }

  /**
   * Export database to a JSON friendly format.
   */;
  _proto.exportJSON = function exportJSON(_collections) {
    throw pluginMissing('json-dump');
  }

  /**
   * Import the parsed JSON export into the collection.
   * @param _exportedJSON The previously exported data from the `<db>.exportJSON()` method.
   * @note When an interface is loaded in this collection all base properties of the type are typed as `any`
   * since data could be encrypted.
   */;
  _proto.importJSON = function importJSON(_exportedJSON) {
    throw pluginMissing('json-dump');
  };
  _proto.backup = function backup(_options) {
    throw pluginMissing('backup');
  };
  _proto.leaderElector = function leaderElector() {
    throw pluginMissing('leader-election');
  };
  _proto.isLeader = function isLeader() {
    throw pluginMissing('leader-election');
  }
  /**
   * returns a promise which resolves when the instance becomes leader
   */;
  _proto.waitForLeadership = function waitForLeadership() {
    throw pluginMissing('leader-election');
  };
  _proto.migrationStates = function migrationStates() {
    throw pluginMissing('migration');
  }

  /**
   * destroys the database-instance and all collections
   */;
  _proto.destroy = async function destroy() {
    if (this.destroyed) {
      return PROMISE_RESOLVE_FALSE;
    }

    // settings destroyed = true must be the first thing to do.
    this.destroyed = true;
    await runAsyncPluginHooks('preDestroyRxDatabase', this);
    /**
     * Complete the event stream
     * to stop all subscribers who forgot to unsubscribe.
     */
    this.eventBulks$.complete();
    DB_COUNT--;
    this._subs.map(sub => sub.unsubscribe());

    /**
     * Destroying the pseudo instance will throw
     * because stuff is missing
     * TODO we should not need the pseudo instance on runtime.
     * we should generate the property list on build time.
     */
    if (this.name === 'pseudoInstance') {
      return PROMISE_RESOLVE_FALSE;
    }

    /**
     * First wait until the database is idle
     */
    return this.requestIdlePromise().then(() => Promise.all(this.onDestroy.map(fn => fn())))
    // destroy all collections
    .then(() => Promise.all(Object.keys(this.collections).map(key => this.collections[key]).map(col => col.destroy())))
    // destroy internal storage instances
    .then(() => this.internalStore.close())
    // remove combination from USED_COMBINATIONS-map
    .then(() => USED_DATABASE_NAMES.delete(this.name)).then(() => true);
  }

  /**
   * deletes the database and its stored data.
   * Returns the names of all removed collections.
   */;
  _proto.remove = function remove() {
    return this.destroy().then(() => removeRxDatabase(this.name, this.storage, this.password));
  };
  _createClass(RxDatabaseBase, [{
    key: "$",
    get: function () {
      return this.observable$;
    }

    /**
     * Because having unhandled exceptions would fail,
     * we have to store the async errors of the constructor here
     * so we can throw them later.
     */

    /**
     * When the database is destroyed,
     * these functions will be called an awaited.
     * Used to automatically clean up stuff that
     * belongs to this collection.
     */

    /**
     * Unique token that is stored with the data.
     * Used to detect if the dataset has been deleted
     * and if two RxDatabase instances work on the same dataset or not.
     *
     * Because reading and writing the storageToken runs in the hot path
     * of database creation, we do not await the storageWrites but instead
     * work with the promise when we need the value.
     */

    /**
     * Stores the whole state of the internal storage token document.
     * We need this in some plugins.
     */

    /**
     * Contains the ids of all event bulks that have been emitted
     * by the database.
     * Used to detect duplicates that come in again via BroadcastChannel
     * or other streams.
     * TODO instead of having this here, we should add a test to ensure each RxStorage
     * behaves equal and does never emit duplicate eventBulks.
     */
  }, {
    key: "asRxDatabase",
    get: function () {
      return this;
    }
  }]);
  return RxDatabaseBase;
}();

/**
 * checks if an instance with same name and adapter already exists
 * @throws {RxError} if used
 */
function throwIfDatabaseNameUsed(name) {
  if (!USED_DATABASE_NAMES.has(name)) {
    return;
  } else {
    throw rx_error_newRxError('DB8', {
      name,
      link: 'https://pubkey.github.io/rxdb/rx-database.html#ignoreduplicate'
    });
  }
}

/**
 * Creates the storage instances that are used internally in the database
 * to store schemas and other configuration stuff.
 */
async function createRxDatabaseStorageInstance(databaseInstanceToken, storage, databaseName, options, multiInstance, password) {
  var internalStore = await storage.createStorageInstance({
    databaseInstanceToken,
    databaseName,
    collectionName: INTERNAL_STORAGE_NAME,
    schema: INTERNAL_STORE_SCHEMA,
    options,
    multiInstance,
    password,
    devMode: overwritable.isDevMode()
  });
  return internalStore;
}
function createRxDatabase({
  storage,
  instanceCreationOptions,
  name,
  password,
  multiInstance = true,
  eventReduce = true,
  ignoreDuplicate = false,
  options = {},
  cleanupPolicy,
  allowSlowCount = false,
  localDocuments = false,
  hashFunction = defaultHashSha256
}) {
  runPluginHooks('preCreateRxDatabase', {
    storage,
    instanceCreationOptions,
    name,
    password,
    multiInstance,
    eventReduce,
    ignoreDuplicate,
    options,
    localDocuments
  });
  // check if combination already used
  if (!ignoreDuplicate) {
    throwIfDatabaseNameUsed(name);
  }
  USED_DATABASE_NAMES.add(name);
  var databaseInstanceToken = randomCouchString(10);
  return createRxDatabaseStorageInstance(databaseInstanceToken, storage, name, instanceCreationOptions, multiInstance, password)
  /**
   * Creating the internal store might fail
   * if some RxStorage wrapper is used that does some checks
   * and then throw.
   * In that case we have to properly clean up the database.
   */.catch(err => {
    USED_DATABASE_NAMES.delete(name);
    throw err;
  }).then(storageInstance => {
    var rxDatabase = new RxDatabaseBase(name, databaseInstanceToken, storage, instanceCreationOptions, password, multiInstance, eventReduce, options, storageInstance, hashFunction, cleanupPolicy, allowSlowCount);
    return runAsyncPluginHooks('createRxDatabase', {
      database: rxDatabase,
      creator: {
        storage,
        instanceCreationOptions,
        name,
        password,
        multiInstance,
        eventReduce,
        ignoreDuplicate,
        options,
        localDocuments
      }
    }).then(() => rxDatabase);
  });
}

/**
 * Removes the database and all its known data
 * with all known collections and all internal meta data.
 *
 * Returns the names of the removed collections.
 */
async function removeRxDatabase(databaseName, storage, password) {
  var databaseInstanceToken = randomCouchString(10);
  var dbInternalsStorageInstance = await createRxDatabaseStorageInstance(databaseInstanceToken, storage, databaseName, {}, false, password);
  var collectionDocs = await getAllCollectionDocuments(dbInternalsStorageInstance);
  var collectionNames = new Set();
  collectionDocs.forEach(doc => collectionNames.add(doc.data.name));
  var removedCollectionNames = Array.from(collectionNames);
  await Promise.all(removedCollectionNames.map(collectionName => removeCollectionStorages(storage, dbInternalsStorageInstance, databaseInstanceToken, databaseName, collectionName, password)));
  await runAsyncPluginHooks('postRemoveRxDatabase', {
    databaseName,
    storage
  });
  await dbInternalsStorageInstance.remove();
  return removedCollectionNames;
}
function isRxDatabase(obj) {
  return obj instanceof RxDatabaseBase;
}
function dbCount() {
  return DB_COUNT;
}

/**
 * Returns true if the given RxDatabase was the first
 * instance that was created on the storage with this name.
 *
 * Can be used for some optimizations because on the first instantiation,
 * we can assume that no data was written before.
 */
async function isRxDatabaseFirstTimeInstantiated(database) {
  var tokenDoc = await database.storageTokenDocument;
  return tokenDoc.data.instanceToken === database.token;
}

/**
 * For better performance some tasks run async
 * and are awaited later.
 * But we still have to ensure that there have been no errors
 * on database creation.
 */
async function ensureNoStartupErrors(rxDatabase) {
  await rxDatabase.storageToken;
  if (rxDatabase.startupErrors[0]) {
    throw rxDatabase.startupErrors[0];
  }
}
//# sourceMappingURL=rx-database.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/custom-index.js
/**
 * For some RxStorage implementations,
 * we need to use our custom crafted indexes
 * so we can easily iterate over them. And sort plain arrays of document data.
 *
 * We really often have to craft an index string for a given document.
 * Performance of everything in this file is very important
 * which is why the code sometimes looks strange.
 * Run performance tests before and after you touch anything here!
 */





/**
 * Prepare all relevant information
 * outside of the returned function
 * from getIndexableStringMonad()
 * to save performance when the returned
 * function is called many times.
 */

function getIndexMeta(schema, index) {
  var fieldNameProperties = index.map(fieldName => {
    var schemaPart = getSchemaByObjectPath(schema, fieldName);
    if (!schemaPart) {
      throw new Error('not in schema: ' + fieldName);
    }
    var type = schemaPart.type;
    var parsedLengths;
    if (type === 'number' || type === 'integer') {
      parsedLengths = getStringLengthOfIndexNumber(schemaPart);
    }
    var getValue = objectPathMonad(fieldName);
    var maxLength = schemaPart.maxLength ? schemaPart.maxLength : 0;
    var getIndexStringPart;
    if (type === 'string') {
      getIndexStringPart = docData => {
        var fieldValue = getValue(docData);
        if (!fieldValue) {
          fieldValue = '';
        }
        return fieldValue.padEnd(maxLength, ' ');
      };
    } else if (type === 'boolean') {
      getIndexStringPart = docData => {
        var fieldValue = getValue(docData);
        return fieldValue ? '1' : '0';
      };
    } else {
      // number
      getIndexStringPart = docData => {
        var fieldValue = getValue(docData);
        return getNumberIndexString(parsedLengths, fieldValue);
      };
    }
    var ret = {
      fieldName,
      schemaPart,
      parsedLengths,
      getValue,
      getIndexStringPart
    };
    return ret;
  });
  return fieldNameProperties;
}

/**
 * Crafts an indexable string that can be used
 * to check if a document would be sorted below or above
 * another documents, dependent on the index values.
 * @monad for better performance
 *
 * IMPORTANT: Performance is really important here
 * which is why we code so 'strange'.
 * Always run performance tests when you want to
 * change something in this method.
 */
function getIndexableStringMonad(schema, index) {
  var fieldNameProperties = getIndexMeta(schema, index);
  var fieldNamePropertiesAmount = fieldNameProperties.length;
  var indexPartsFunctions = fieldNameProperties.map(r => r.getIndexStringPart);

  /**
   * @hotPath Performance of this function is very critical!
   */
  var ret = function (docData) {
    var str = '';
    for (var i = 0; i < fieldNamePropertiesAmount; ++i) {
      str += indexPartsFunctions[i](docData);
    }
    return str;
  };
  return ret;
}
function getStringLengthOfIndexNumber(schemaPart) {
  var minimum = Math.floor(schemaPart.minimum);
  var maximum = Math.ceil(schemaPart.maximum);
  var multipleOf = schemaPart.multipleOf;
  var valueSpan = maximum - minimum;
  var nonDecimals = valueSpan.toString().length;
  var multipleOfParts = multipleOf.toString().split('.');
  var decimals = 0;
  if (multipleOfParts.length > 1) {
    decimals = multipleOfParts[1].length;
  }
  return {
    minimum,
    maximum,
    nonDecimals,
    decimals,
    roundedMinimum: minimum
  };
}
function getIndexStringLength(schema, index) {
  var fieldNameProperties = getIndexMeta(schema, index);
  var length = 0;
  fieldNameProperties.forEach(props => {
    var schemaPart = props.schemaPart;
    var type = schemaPart.type;
    if (type === 'string') {
      length += schemaPart.maxLength;
    } else if (type === 'boolean') {
      length += 1;
    } else {
      var parsedLengths = props.parsedLengths;
      length = length + parsedLengths.nonDecimals + parsedLengths.decimals;
    }
  });
  return length;
}
function getPrimaryKeyFromIndexableString(indexableString, primaryKeyLength) {
  var paddedPrimaryKey = indexableString.slice(primaryKeyLength * -1);
  // we can safely trim here because the primary key is not allowed to start or end with a space char.
  var primaryKey = paddedPrimaryKey.trim();
  return primaryKey;
}
function getNumberIndexString(parsedLengths, fieldValue) {
  /**
   * Ensure that the given value is in the boundaries
   * of the schema, otherwise it would create a broken index string.
   * This can happen for example if you have a minimum of 0
   * and run a query like
   * selector {
   *  numField: { $gt: -1000 }
   * }
   */
  if (typeof fieldValue === 'undefined') {
    fieldValue = 0;
  }
  if (fieldValue < parsedLengths.minimum) {
    fieldValue = parsedLengths.minimum;
  }
  if (fieldValue > parsedLengths.maximum) {
    fieldValue = parsedLengths.maximum;
  }
  var nonDecimalsValueAsString = (Math.floor(fieldValue) - parsedLengths.roundedMinimum).toString();
  var str = nonDecimalsValueAsString.padStart(parsedLengths.nonDecimals, '0');
  if (parsedLengths.decimals > 0) {
    var splitByDecimalPoint = fieldValue.toString().split('.');
    var decimalValueAsString = splitByDecimalPoint.length > 1 ? splitByDecimalPoint[1] : '0';
    str += decimalValueAsString.padEnd(parsedLengths.decimals, '0');
  }
  return str;
}
function getStartIndexStringFromLowerBound(schema, index, lowerBound, inclusiveStart) {
  var str = '';
  index.forEach((fieldName, idx) => {
    var schemaPart = getSchemaByObjectPath(schema, fieldName);
    var bound = lowerBound[idx];
    var type = schemaPart.type;
    switch (type) {
      case 'string':
        var maxLength = utils_other_ensureNotFalsy(schemaPart.maxLength);
        if (typeof bound === 'string') {
          str += bound.padEnd(maxLength, ' ');
        } else {
          // str += ''.padStart(maxLength, inclusiveStart ? ' ' : INDEX_MAX);
          str += ''.padEnd(maxLength, ' ');
        }
        break;
      case 'boolean':
        if (bound === null) {
          str += inclusiveStart ? '0' : INDEX_MAX;
        } else if (bound === INDEX_MIN) {
          str += '0';
        } else if (bound === INDEX_MAX) {
          str += '1';
        } else {
          var boolToStr = bound ? '1' : '0';
          str += boolToStr;
        }
        break;
      case 'number':
      case 'integer':
        var parsedLengths = getStringLengthOfIndexNumber(schemaPart);
        if (bound === null || bound === INDEX_MIN) {
          var fillChar = inclusiveStart ? '0' : INDEX_MAX;
          str += fillChar.repeat(parsedLengths.nonDecimals + parsedLengths.decimals);
        } else {
          str += getNumberIndexString(parsedLengths, bound);
        }
        break;
      default:
        throw new Error('unknown index type ' + type);
    }
  });
  return str;
}
function getStartIndexStringFromUpperBound(schema, index, upperBound, inclusiveEnd) {
  var str = '';
  index.forEach((fieldName, idx) => {
    var schemaPart = getSchemaByObjectPath(schema, fieldName);
    var bound = upperBound[idx];
    var type = schemaPart.type;
    switch (type) {
      case 'string':
        var maxLength = utils_other_ensureNotFalsy(schemaPart.maxLength);
        if (typeof bound === 'string' && bound !== INDEX_MAX) {
          str += bound.padEnd(maxLength, ' ');
        } else {
          str += ''.padEnd(maxLength, inclusiveEnd ? INDEX_MAX : ' ');
        }
        break;
      case 'boolean':
        if (bound === null) {
          str += inclusiveEnd ? '0' : '1';
        } else {
          var boolToStr = bound ? '1' : '0';
          str += boolToStr;
        }
        break;
      case 'number':
      case 'integer':
        var parsedLengths = getStringLengthOfIndexNumber(schemaPart);
        if (bound === null || bound === INDEX_MAX) {
          var fillChar = inclusiveEnd ? '9' : '0';
          str += fillChar.repeat(parsedLengths.nonDecimals + parsedLengths.decimals);
        } else {
          str += getNumberIndexString(parsedLengths, bound);
        }
        break;
      default:
        throw new Error('unknown index type ' + type);
    }
  });
  return str;
}

/**
 * Used in storages where it is not possible
 * to define inclusiveEnd/inclusiveStart
 */
function changeIndexableStringByOneQuantum(str, direction) {
  var lastChar = str.slice(-1);
  var charCode = lastChar.charCodeAt(0);
  charCode = charCode + direction;
  var withoutLastChar = str.slice(0, -1);
  return withoutLastChar + String.fromCharCode(charCode);
}
//# sourceMappingURL=custom-index.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/plugins/storage-memory/binary-search-bounds.js
/**
 * Everything in this file was copied and adapted from
 * @link https://github.com/mikolalysenko/binary-search-bounds
 *
 * TODO We should use the original npm module instead when this bug is fixed:
 * @link https://github.com/mikolalysenko/binary-search-bounds/pull/14
 */

function ge(a, y, c, l, h) {
  var i = h + 1;
  while (l <= h) {
    var m = l + h >>> 1;
    var x = a[m];
    var p = c !== undefined ? c(x, y) : x - y;
    if (p >= 0) {
      i = m;
      h = m - 1;
    } else {
      l = m + 1;
    }
  }
  return i;
}
function gt(a, y, c, l, h) {
  var i = h + 1;
  while (l <= h) {
    var m = l + h >>> 1;
    var x = a[m];
    var p = c !== undefined ? c(x, y) : x - y;
    if (p > 0) {
      i = m;
      h = m - 1;
    } else {
      l = m + 1;
    }
  }
  return i;
}
function lt(a, y, c, l, h) {
  var i = l - 1;
  while (l <= h) {
    var m = l + h >>> 1,
      x = a[m];
    var p = c !== undefined ? c(x, y) : x - y;
    if (p < 0) {
      i = m;
      l = m + 1;
    } else {
      h = m - 1;
    }
  }
  return i;
}
function le(a, y, c, l, h) {
  var i = l - 1;
  while (l <= h) {
    var m = l + h >>> 1,
      x = a[m];
    var p = c !== undefined ? c(x, y) : x - y;
    if (p <= 0) {
      i = m;
      l = m + 1;
    } else {
      h = m - 1;
    }
  }
  return i;
}
function eq(a, y, c, l, h) {
  while (l <= h) {
    var m = l + h >>> 1,
      x = a[m];
    var p = c !== undefined ? c(x, y) : x - y;
    if (p === 0) {
      return m;
    }
    if (p <= 0) {
      l = m + 1;
    } else {
      h = m - 1;
    }
  }
  return -1;
}
function norm(a, y, c, l, h, f) {
  if (typeof c === 'function') {
    return f(a, y, c, l === undefined ? 0 : l | 0, h === undefined ? a.length - 1 : h | 0);
  }
  return f(a, y, undefined, c === undefined ? 0 : c | 0, l === undefined ? a.length - 1 : l | 0);
}
function boundGE(a, y, c, l, h) {
  return norm(a, y, c, l, h, ge);
}
function boundGT(a, y, c, l, h) {
  return norm(a, y, c, l, h, gt);
}
function boundLT(a, y, c, l, h) {
  return norm(a, y, c, l, h, lt);
}
function boundLE(a, y, c, l, h) {
  return norm(a, y, c, l, h, le);
}
function boundEQ(a, y, c, l, h) {
  return norm(a, y, c, l, h, eq);
}
//# sourceMappingURL=binary-search-bounds.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/plugins/storage-memory/memory-helper.js



function getMemoryCollectionKey(databaseName, collectionName, schemaVersion) {
  return [databaseName, collectionName, schemaVersion].join('--memory--');
}
function ensureNotRemoved(instance) {
  if (instance.internals.removed) {
    throw new Error('removed');
  }
}
function attachmentMapKey(documentId, attachmentId) {
  return documentId + '||' + attachmentId;
}
function sortByIndexStringComparator(a, b) {
  if (a.indexString < b.indexString) {
    return -1;
  } else {
    return 1;
  }
}

/**
 * @hotPath
 */
function putWriteRowToState(docId, state, stateByIndex, row, docInState) {
  var document = row.document;
  state.documents.set(docId, document);
  for (var i = 0; i < stateByIndex.length; ++i) {
    var byIndex = stateByIndex[i];
    var docsWithIndex = byIndex.docsWithIndex;
    var getIndexableString = byIndex.getIndexableString;
    var newIndexString = getIndexableString(document);
    var insertPosition = pushAtSortPosition(docsWithIndex, {
      id: docId,
      doc: document,
      indexString: newIndexString
    }, sortByIndexStringComparator, 0);

    /**
     * Remove previous if it was in the state
     */
    if (docInState) {
      var previousIndexString = getIndexableString(docInState);
      if (previousIndexString === newIndexString) {
        /**
         * Performance shortcut.
         * If index was not changed -> The old doc must be before or after the new one.
         */
        var prev = docsWithIndex[insertPosition - 1];
        if (prev && prev.id === docId) {
          docsWithIndex.splice(insertPosition - 1, 1);
        } else {
          var next = docsWithIndex[insertPosition + 1];
          if (next.id === docId) {
            docsWithIndex.splice(insertPosition + 1, 1);
          } else {
            throw rx_error_newRxError('SNH', {
              args: {
                row,
                byIndex
              }
            });
          }
        }
      } else {
        /**
         * Index changed, we must search for the old one and remove it.
         */
        var indexBefore = boundEQ(docsWithIndex, {
          indexString: previousIndexString
        }, compareDocsWithIndex);
        docsWithIndex.splice(indexBefore, 1);
      }
    }
  }
}
function removeDocFromState(primaryPath, schema, state, doc) {
  var docId = doc[primaryPath];
  state.documents.delete(docId);
  Object.values(state.byIndex).forEach(byIndex => {
    var docsWithIndex = byIndex.docsWithIndex;
    var indexString = byIndex.getIndexableString(doc);
    var positionInIndex = boundEQ(docsWithIndex, {
      indexString
    }, compareDocsWithIndex);
    docsWithIndex.splice(positionInIndex, 1);
  });
}
function compareDocsWithIndex(a, b) {
  var indexStringA = a.indexString;
  var indexStringB = b.indexString;
  if (indexStringA < indexStringB) {
    return -1;
  } else if (indexStringA === indexStringB) {
    return 0;
  } else {
    return 1;
  }
}
//# sourceMappingURL=memory-helper.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/plugins/storage-memory/memory-indexes.js



function addIndexesToInternalsState(state, schema) {
  var primaryPath = rx_schema_helper_getPrimaryFieldOfPrimaryKey(schema.primaryKey);
  var useIndexes = !schema.indexes ? [] : schema.indexes.map(row => toArray(row));

  // we need this index for running cleanup()
  useIndexes.push(['_deleted', '_meta.lwt', primaryPath]);
  useIndexes.forEach(indexAr => {
    state.byIndex[getMemoryIndexName(indexAr)] = {
      index: indexAr,
      docsWithIndex: [],
      getIndexableString: getIndexableStringMonad(schema, indexAr)
    };
  });
}
function getMemoryIndexName(index) {
  return index.join(',');
}
//# sourceMappingURL=memory-indexes.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/plugins/storage-memory/rx-storage-instance-memory.js










/**
 * Used in tests to ensure everything
 * is closed correctly
 */
var OPEN_MEMORY_INSTANCES = new Set();
var RxStorageInstanceMemory = /*#__PURE__*/function () {
  function RxStorageInstanceMemory(storage, databaseName, collectionName, schema, internals, options, settings) {
    this.closed = false;
    this.storage = storage;
    this.databaseName = databaseName;
    this.collectionName = collectionName;
    this.schema = schema;
    this.internals = internals;
    this.options = options;
    this.settings = settings;
    OPEN_MEMORY_INSTANCES.add(this);
    this.primaryPath = rx_schema_helper_getPrimaryFieldOfPrimaryKey(this.schema.primaryKey);
  }
  var _proto = RxStorageInstanceMemory.prototype;
  _proto.bulkWrite = function bulkWrite(documentWrites, context) {
    this.ensurePersistence();
    ensureNotRemoved(this);
    var internals = this.internals;
    var documentsById = this.internals.documents;
    var primaryPath = this.primaryPath;
    var categorized = categorizeBulkWriteRows(this, primaryPath, documentsById, documentWrites, context);
    var error = categorized.errors;
    var success = new Array(categorized.bulkInsertDocs.length);
    var bulkInsertDocs = categorized.bulkInsertDocs;
    for (var i = 0; i < bulkInsertDocs.length; ++i) {
      var writeRow = bulkInsertDocs[i];
      var doc = writeRow.document;
      success[i] = doc;
    }
    var bulkUpdateDocs = categorized.bulkUpdateDocs;
    for (var _i = 0; _i < bulkUpdateDocs.length; ++_i) {
      var _writeRow = bulkUpdateDocs[_i];
      var _doc = _writeRow.document;
      success.push(_doc);
    }
    this.internals.ensurePersistenceTask = categorized;
    if (!this.internals.ensurePersistenceIdlePromise) {
      this.internals.ensurePersistenceIdlePromise = requestIdlePromiseNoQueue().then(() => {
        this.internals.ensurePersistenceIdlePromise = undefined;
        this.ensurePersistence();
      });
    }

    /**
     * Important: The events must be emitted AFTER the persistence
     * task has been added.
     */
    if (categorized.eventBulk.events.length > 0) {
      var lastState = utils_other_ensureNotFalsy(categorized.newestRow).document;
      categorized.eventBulk.checkpoint = {
        id: lastState[primaryPath],
        lwt: lastState._meta.lwt
      };
      categorized.eventBulk.endTime = utils_time_now();
      utils_promise_PROMISE_RESOLVE_TRUE.then(() => {
        internals.changes$.next(categorized.eventBulk);
      });
    }
    var ret = Promise.resolve({
      success,
      error
    });
    return ret;
  }

  /**
   * Instead of directly inserting the documents into all indexes,
   * we do it lazy in the background. This gives the application time
   * to directly work with the write-result and to do stuff like rendering DOM
   * notes and processing RxDB queries.
   * Then in some later time, or just before the next read/write,
   * it is ensured that the indexes have been written.
   */;
  _proto.ensurePersistence = function ensurePersistence() {
    if (!this.internals.ensurePersistenceTask) {
      return;
    }
    var internals = this.internals;
    var documentsById = this.internals.documents;
    var primaryPath = this.primaryPath;
    var categorized = this.internals.ensurePersistenceTask;
    delete this.internals.ensurePersistenceTask;

    /**
     * Do inserts/updates
     */
    var stateByIndex = Object.values(this.internals.byIndex);
    var bulkInsertDocs = categorized.bulkInsertDocs;
    for (var i = 0; i < bulkInsertDocs.length; ++i) {
      var writeRow = bulkInsertDocs[i];
      var doc = writeRow.document;
      var docId = doc[primaryPath];
      putWriteRowToState(docId, internals, stateByIndex, writeRow, undefined);
    }
    var bulkUpdateDocs = categorized.bulkUpdateDocs;
    for (var _i2 = 0; _i2 < bulkUpdateDocs.length; ++_i2) {
      var _writeRow2 = bulkUpdateDocs[_i2];
      var _doc2 = _writeRow2.document;
      var _docId = _doc2[primaryPath];
      putWriteRowToState(_docId, internals, stateByIndex, _writeRow2, documentsById.get(_docId));
    }

    /**
     * Handle attachments
     */
    if (this.schema.attachments) {
      var attachmentsMap = internals.attachments;
      categorized.attachmentsAdd.forEach(attachment => {
        attachmentsMap.set(attachmentMapKey(attachment.documentId, attachment.attachmentId), {
          writeData: attachment.attachmentData,
          digest: attachment.digest
        });
      });
      if (this.schema.attachments) {
        categorized.attachmentsUpdate.forEach(attachment => {
          attachmentsMap.set(attachmentMapKey(attachment.documentId, attachment.attachmentId), {
            writeData: attachment.attachmentData,
            digest: attachment.digest
          });
        });
        categorized.attachmentsRemove.forEach(attachment => {
          attachmentsMap.delete(attachmentMapKey(attachment.documentId, attachment.attachmentId));
        });
      }
    }
  };
  _proto.findDocumentsById = function findDocumentsById(docIds, withDeleted) {
    this.ensurePersistence();
    var documentsById = this.internals.documents;
    var ret = [];
    if (documentsById.size === 0) {
      return Promise.resolve(ret);
    }
    for (var i = 0; i < docIds.length; ++i) {
      var docId = docIds[i];
      var docInDb = documentsById.get(docId);
      if (docInDb && (!docInDb._deleted || withDeleted)) {
        ret.push(docInDb);
      }
    }
    return Promise.resolve(ret);
  };
  _proto.query = function query(preparedQuery) {
    this.ensurePersistence();
    var queryPlan = preparedQuery.queryPlan;
    var query = preparedQuery.query;
    var skip = query.skip ? query.skip : 0;
    var limit = query.limit ? query.limit : Infinity;
    var skipPlusLimit = skip + limit;
    var queryMatcher = false;
    if (!queryPlan.selectorSatisfiedByIndex) {
      queryMatcher = getQueryMatcher(this.schema, preparedQuery.query);
    }
    var queryPlanFields = queryPlan.index;
    var mustManuallyResort = !queryPlan.sortSatisfiedByIndex;
    var index = queryPlanFields;
    var lowerBound = queryPlan.startKeys;
    var lowerBoundString = getStartIndexStringFromLowerBound(this.schema, index, lowerBound, queryPlan.inclusiveStart);
    var upperBound = queryPlan.endKeys;
    upperBound = upperBound;
    var upperBoundString = getStartIndexStringFromUpperBound(this.schema, index, upperBound, queryPlan.inclusiveEnd);
    var indexName = getMemoryIndexName(index);
    var docsWithIndex = this.internals.byIndex[indexName].docsWithIndex;
    var indexOfLower = (queryPlan.inclusiveStart ? boundGE : boundGT)(docsWithIndex, {
      indexString: lowerBoundString
    }, compareDocsWithIndex);
    var indexOfUpper = (queryPlan.inclusiveEnd ? boundLE : boundLT)(docsWithIndex, {
      indexString: upperBoundString
    }, compareDocsWithIndex);
    var rows = [];
    var done = false;
    while (!done) {
      var currentRow = docsWithIndex[indexOfLower];
      if (!currentRow || indexOfLower > indexOfUpper) {
        break;
      }
      var currentDoc = currentRow.doc;
      if (!queryMatcher || queryMatcher(currentDoc)) {
        rows.push(currentDoc);
      }
      if (rows.length >= skipPlusLimit && !mustManuallyResort) {
        done = true;
      }
      indexOfLower++;
    }
    if (mustManuallyResort) {
      var sortComparator = getSortComparator(this.schema, preparedQuery.query);
      rows = rows.sort(sortComparator);
    }

    // apply skip and limit boundaries.
    rows = rows.slice(skip, skipPlusLimit);
    return Promise.resolve({
      documents: rows
    });
  };
  _proto.count = async function count(preparedQuery) {
    this.ensurePersistence();
    var result = await this.query(preparedQuery);
    return {
      count: result.documents.length,
      mode: 'fast'
    };
  };
  _proto.cleanup = function cleanup(minimumDeletedTime) {
    this.ensurePersistence();
    var maxDeletionTime = utils_time_now() - minimumDeletedTime;
    var index = ['_deleted', '_meta.lwt', this.primaryPath];
    var indexName = getMemoryIndexName(index);
    var docsWithIndex = this.internals.byIndex[indexName].docsWithIndex;
    var lowerBoundString = getStartIndexStringFromLowerBound(this.schema, index, [true, 0, ''], false);
    var indexOfLower = boundGT(docsWithIndex, {
      indexString: lowerBoundString
    }, compareDocsWithIndex);
    var done = false;
    while (!done) {
      var currentDoc = docsWithIndex[indexOfLower];
      if (!currentDoc || currentDoc.doc._meta.lwt > maxDeletionTime) {
        done = true;
      } else {
        removeDocFromState(this.primaryPath, this.schema, this.internals, currentDoc.doc);
        indexOfLower++;
      }
    }
    return utils_promise_PROMISE_RESOLVE_TRUE;
  };
  _proto.getAttachmentData = function getAttachmentData(documentId, attachmentId, digest) {
    this.ensurePersistence();
    ensureNotRemoved(this);
    var key = attachmentMapKey(documentId, attachmentId);
    var data = this.internals.attachments.get(key);
    if (!digest || !data || data.digest !== digest) {
      throw new Error('attachment does not exist: ' + key);
    }
    return Promise.resolve(data.writeData.data);
  };
  _proto.changeStream = function changeStream() {
    ensureNotRemoved(this);
    return this.internals.changes$.asObservable();
  };
  _proto.remove = async function remove() {
    if (this.closed) {
      throw new Error('closed');
    }
    this.ensurePersistence();
    ensureNotRemoved(this);
    this.internals.removed = true;
    this.storage.collectionStates.delete(getMemoryCollectionKey(this.databaseName, this.collectionName, this.schema.version));
    await this.close();
  };
  _proto.close = function close() {
    OPEN_MEMORY_INSTANCES.delete(this);
    this.ensurePersistence();
    if (this.closed) {
      return PROMISE_RESOLVE_VOID;
    }
    this.closed = true;
    this.internals.refCount = this.internals.refCount - 1;
    return PROMISE_RESOLVE_VOID;
  };
  _proto.conflictResultionTasks = function conflictResultionTasks() {
    return this.internals.conflictResultionTasks$.asObservable();
  };
  _proto.resolveConflictResultionTask = function resolveConflictResultionTask(_taskSolution) {
    return PROMISE_RESOLVE_VOID;
  };
  return RxStorageInstanceMemory;
}();
function createMemoryStorageInstance(storage, params, settings) {
  var collectionKey = getMemoryCollectionKey(params.databaseName, params.collectionName, params.schema.version);
  var internals = storage.collectionStates.get(collectionKey);
  if (!internals) {
    internals = {
      schema: params.schema,
      removed: false,
      refCount: 1,
      documents: new Map(),
      attachments: params.schema.attachments ? new Map() : undefined,
      byIndex: {},
      conflictResultionTasks$: new Subject(),
      changes$: new Subject()
    };
    addIndexesToInternalsState(internals, params.schema);
    storage.collectionStates.set(collectionKey, internals);
  } else {
    /**
     * Ensure that the storage was not already
     * created with a different schema.
     * This is very important because if this check
     * does not exist here, we have hard-to-debug problems
     * downstream.
     */
    if (params.devMode && !deepEqual(internals.schema, params.schema)) {
      throw new Error('storage was already created with a different schema');
    }
    internals.refCount = internals.refCount + 1;
  }
  var instance = new RxStorageInstanceMemory(storage, params.databaseName, params.collectionName, params.schema, internals, params.options, settings);
  return Promise.resolve(instance);
}
//# sourceMappingURL=rx-storage-instance-memory.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/plugins/storage-memory/index.js



/**
 * Keep the state even when the storage instance is closed.
 * This makes it easier to use the memory storage
 * to test filesystem-like and multiInstance behaviors.
 */
var COLLECTION_STATES = new Map();
function getRxStorageMemory(settings = {}) {
  var storage = {
    name: 'memory',
    collectionStates: COLLECTION_STATES,
    createStorageInstance(params) {
      ensureRxStorageInstanceParamsAreCorrect(params);
      var useSettings = Object.assign({}, settings, params.options);
      return createMemoryStorageInstance(this, params, useSettings);
    }
  };
  return storage;
}





//# sourceMappingURL=index.js.map
;// CONCATENATED MODULE: ./node_modules/rxdb/dist/esm/plugins/flutter/index.js
function setFlutterRxDatabaseConnector(createDB) {
  process.init = async databaseName => {
    var db = await createDB(databaseName);
    db.eventBulks$.subscribe(eventBulk => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      sendRxDBEvent(JSON.stringify(eventBulk));
    });
    process.db = db;
    var collections = [];
    Object.entries(db.collections).forEach(([collectionName, collection]) => {
      collections.push({
        name: collectionName,
        primaryKey: collection.schema.primaryPath
      });
    });
    return {
      databaseName,
      collections
    };
  };
}

/**
 * Create a simple lokijs adapter so that we can persist string via flutter
 * @link https://github.com/techfort/LokiJS/blob/master/tutorials/Persistence%20Adapters.md#creating-your-own-basic-persistence-adapter
 */
function getLokijsAdapterFlutter() {
  var ret = {
    async loadDatabase(databaseName, callback) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      var serializedDb = await readKeyValue(databaseName);
      var success = true;
      if (success) {
        callback(serializedDb);
      } else {
        callback(new Error('There was a problem loading the database'));
      }
    },
    async saveDatabase(databaseName, dbstring, callback) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await persistKeyValue(databaseName, dbstring);
      var success = true; // make your own determinations
      if (success) {
        callback(null);
      } else {
        callback(new Error('An error was encountered loading " + dbname + " database.'));
      }
    }
  };
  return ret;
}
//# sourceMappingURL=index.js.map
;// CONCATENATED MODULE: ./src/index.js




async function createDB(databaseName) {
    const db = await createRxDatabase({
        name: databaseName,
        storage: getRxStorageMemory(),
        multiInstance: false
    });
    await db.addCollections({
        AppState: {
            schema: {
                version: 0,
                primaryKey: 'id',
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        maxLength: 100
                    },
                    width: {
                        type: 'number'
                    },
                    length: {
                        type: 'number'
                    },
                    area: {
                        type: 'number'
                    },
                    killSwitch: {
                        type: 'boolean'
                    }
                },
                required: ['id']
            }
        }
    });
    return db;
}

setFlutterRxDatabaseConnector(
    createDB
);

/******/ })()
;