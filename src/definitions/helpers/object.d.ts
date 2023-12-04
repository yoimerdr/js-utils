import {Nullable} from "./utils";

declare global {
  export interface ObjectConstructor {
    isValidType<Ty>(value: Nullable<Ty>): boolean
    isObject<Ty>(value: Nullable<Ty>): boolean
    isString<Ty>(value: Nullable<Ty>): boolean
    isFunction<Ty>(value: Nullable<Ty>): boolean
    isNumber<Ty>(value: Nullable<Ty>): boolean
    orDefault<Ty>(value: Nullable<Ty>, defaultValue: Ty): Ty
    getPropertyValue<Ty extends Object, Re>(source: Ty, key: string): Nullable<Re>
    assignIfNotPresent<Ty extends Object>(target: Ty, source: Ty): void
  }

  export interface Array<T> {
    isEmpty(): boolean
  }

  export interface String {
    isEmpty(): boolean
  }
}