import { bundleCSS } from "./lightningcss.conifg.mjs";

bundleCSS({
  filename: "src/styles/paginator.css",
  minify: true,
  outfile: "build/helpers/paginator.min.css",
})