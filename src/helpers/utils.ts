// Object utils functions

import {Nullable, StringNullable} from "../definitions/helpers/utils";

if(!Object.isObject) {
  Object.isObject = (value) => Object.isValidType(value) && typeof value === "object";
}

if(!Object.isFunction) {
  Object.isFunction = (value) => typeof value === "function";
}

if(!Object.isString) {
  Object.isString = (value) => typeof value === "string";
}

if(!Object.isNumber) {
  Object.isNumber = (value) => typeof value === "number";
}

if(!Object.isValidType) {
  Object.isValidType = function<Ty>(value: Nullable<Ty>) {
    const type = typeof value;
    return type !== "undefined" && value !== null
  }
}

if(!Object.orDefault) {
  Object.orDefault = function (value, defaultValue) {
    return value || defaultValue;
  }
}

if(!Object.assignIfNotPresent) {
  Object.assignIfNotPresent = function (target, source) {
    if(!Object.isObject(source) || !Object.isObject(target))
      return;
    for (let key in source) {
      if (target.hasOwnProperty(key)) {
        if (Object.isObject(target[key]) && Object.isObject(source[key]) && (target[key] as Object).constructor === {}.constructor)
          Object.assignIfNotPresent((target[key] as Object), (source[key] as Object));
      } else target[key] = source[key];
    }
  }
}

if(!Object.getPropertyValue) {
  Object.getPropertyValue = function<Ty extends Object, Re> (source: Ty, key: string) {
    if(typeof source !== "object")
      return undefined;

    const { [key as keyof typeof source]: value } = source;
    return value as Nullable<Re>;
  }
}

// Array util functions
if(!Array.prototype.isEmpty) {
  Array.prototype.isEmpty = function () { return this.length === 0 }
}

// String util functions
if(!String.prototype.isEmpty) {
  String.prototype.isEmpty = function () { return this.length === 0; }
}

export class ErrorManager {

  // util function for try catch block
  static manage(callback: Function, type?: StringNullable) {
    try {
      callback();
    } catch (e) { console.log(`An error occurs while run ${Object.isValidType(type) ? type! : callback.name}: ${e}`) }
  }
}
