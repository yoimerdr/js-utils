import {Nullable, StringNullable} from "../definitions/helpers/utils";

export class LocationManager {
  static changeUrl(url: StringNullable, reload: Nullable<boolean> = true) {
    if(!url || !location)
      return;

    if(reload)
      location.href = url;
    else if(history)
      history.pushState({}, "", url);
  }
}