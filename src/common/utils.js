const toString = Object.prototype.toString;
import { asFlat } from 'mobx';
import { CONTEXT_NAME } from './constants';
import { PropTypes } from 'react';
/**
 * @param {Object} target
 * @param {Array<String>} methods
 */
export function autobind(target, methods) {
  methods.forEach(methodName => {
    if (!target[methodName]) {
      throw new Error(`Undefined method "${methodName}"`);
    }
    target[methodName] = target[methodName].bind(this);
  });
}
/**
 * Applies a function to every key-value pair inside an object.
 *
 * @param {Object} obj - The source object.
 * @param {Function} fn - The mapper function that receives the value and the key.
 * @param {Object?} res - Result object
 * @returns {Object} A new object that contains the mapped values for the keys.
 */
export function mapValues(obj, fn, res = {}) {
  return Object.keys(obj).reduce((result, key) => {
    result[key] = fn(obj[key], key);
    return result;
  }, res);
}
/**
 * @param {*} val
 * @returns {Promise}
 */
export function toPromise(val) {
  if (val && typeof val.then === 'function') {
    return val;
  }
  return Promise.resolve(val);
}
export function toObservableObj(obj = {}) {
  return mapValues(obj, (item) => {
    return typeof item === 'object' ? asFlat(item) : item;
  });
}
/**
 * @param {React.Component} WrappedComponent
 */
export function addMobxContextToComponent(WrappedComponent) {
  WrappedComponent.contextTypes = {
    [CONTEXT_NAME]: PropTypes.object.isRequired,
    ...WrappedComponent.contextTypes,
  };
}
export function each(obj = {}, fn) {
  Object.keys(obj).forEach((key) => {
    fn(obj[key], key);
  });
}
export const isFunction = arg => toString.call(arg) === '[object Function]';
export const isRegExp = arg => toString.call(arg) === '[object RegExp]';
export function compose(arr, arg) {
  return arr.reduce((cur, fn) => {
    return cur.then(res => fn(res));
  }, Promise.resolve(arg));
}
export function nameToUpperCase(name = '') {
  return name[0].toUpperCase() + name.slice(1);
}
export function inherits(subClass, superClass) {
  if (typeof superClass !== 'function' && superClass !== null) {
    throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass);
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true,
    },
  });
  if (superClass) {
    if (Object.setPrototypeOf) Object.setPrototypeOf(subClass, superClass);
    else subClass.__proto__ = superClass;
  }
}
export function classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}
export function possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return call && (typeof call === 'object' || typeof call === 'function') ? call : self;
}
