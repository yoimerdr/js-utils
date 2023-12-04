import { bundle } from 'lightningcss';
import * as fs from "fs";
import * as path from "path";

export function bundleCSS(options) {
  options = options || {};
  let { code, map } = bundle(options);
  if(options.outfile) {
    if(!options.outfile.endsWith(".css"))
      options.outfile = `${options.outfile}.css`;

    fs.mkdirSync(path.dirname(options.outfile), {
      recursive: true
    });

    fs.writeFileSync(options.outfile, new TextDecoder().decode(code));
  }
}


