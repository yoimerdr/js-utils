// class for query string item in url
import {Nullable, StringNullable, UriQueryParam} from "../definitions/helpers/utils";

export class UriQueryItem implements UriQueryParam {
  constructor(public key: string, public value: string) {
  }
  toString() {
    return `${this.key.trim()}=${encodeURIComponent(this.value)}`
  }
  valueOf() {
    return this.toString();
  }
}

// class for extract query string parameters from a url.
export class UriQueryParameters {
  private readonly items: UriQueryItem[];
  private constructor(private readonly url: string) {
    this.items = UriQueryParameters.getParametersFrom(this.url);
    if(!this.items.isEmpty())
      this.url = this.url.substring(0, this.url.indexOf("?"));

  }

  static from(url: string) { return new UriQueryParameters(url); }
  static fromCurrent(): Nullable<UriQueryParameters> { return typeof location !== "undefined" ? UriQueryParameters.from(location.href) : undefined; }
  static getParametersFrom(url: StringNullable): UriQueryItem[] {
    url = Object.orDefault(url, "");
    if(url.isEmpty())
      return []

    const start = url.indexOf("?");
    const queries = url.substring(start === -1 ? 0 : start + 1).split("&");
    const items: UriQueryItem[] = [];

    queries.forEach(it => {
      const query = it.split("=");
      if(query.length === 2)
        items.push(new UriQueryItem(query[0], decodeURIComponent(query[1])));
    });

    return items;
  }

  __validateParam(param: UriQueryParam) {
    // check if param is an object
    if(!Object.isObject(param)) {
      console.log(`Invalid query param:`)
      console.log(param);
      return false;
    }

    // assign default values
    Object.assignIfNotPresent(param, {
      key: "",
      value: ""
    });

    // check if values are default
    if(param.key.toString().isEmpty() || param.value.toString().isEmpty()) {
      console.log("Invalid query param values");
      console.log(param);
      return false;
    }

    return true;
  }

  push(param: UriQueryParam): UriQueryParameters {
    if(!this.__validateParam(param))
      return this;

    // find existing item with same values, push if not present
    const item = new UriQueryItem(param.key, param.value)
    if(this.items.findIndex(it => it.key === item.key) === -1)
      this.items.push(item)

    return this;
  }

  set(param: UriQueryParam, push?: boolean): UriQueryParameters {
    if(!this.__validateParam(param))
      return this;

    const index = this._getIndexOf(param.key);
    if(index !== -1)
      this.items[index].value = param.value;
    else if(Object.orDefault(push, false))
      this.items.push(new UriQueryItem(param.key, param.value));
    return this;
  }

  remove(key: string): UriQueryParameters {
    if(!Object.isValidType(key))
      return this;

    const index = this._getIndexOf(key.toString());
    if(index !== -1)
      this.items.splice(index, 1);

    return this;
  }

  extend(params: UriQueryParam[]): UriQueryParameters {
    Object.orDefault(params, [])
      .forEach(it => this.push(it));
    return this;
  }

  getParameters() {
    return this.items;
  }

  private _getIndexOf(key: string) {
    if(!Object.isValidType(key))
      return -1;

    return this.items.findIndex(it => it.key === key);
  }

  getParameter(key: string): Nullable<UriQueryItem> {
    const index = this._getIndexOf(key.toString());
    if(index === -1)
      return undefined;

    return this.items[index];
  }

  contains(key: string): boolean {
    return this._getIndexOf(key) != -1;
  }

  buildUri() {
    if(this.items.isEmpty())
      return this.getBaseUrl();
    return `${this.url}?${this.items.join("&")}`
  }

  getBaseUrl() {
    return this.url;
  }
}

export class UriUtils {
  static clean(url: string) {
    // Remove consecutive slashes in the pathname
    return url.replace(/\/{2,}/g, (text, index) => {
      if(typeof index === "number" && index > 0 && url[index - 1] === ":")
        return text;
      return "/";
    });
  }
}