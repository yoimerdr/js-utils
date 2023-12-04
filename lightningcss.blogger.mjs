import { bundleCSS } from "./lightningcss.conifg.mjs";

bundleCSS({
  filename: "src/styles/blogger.css",
  minify: true,
  outfile: "build/blogger/blogger.utils.min.css",
})