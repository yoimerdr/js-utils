import multiEntry from "@rollup/plugin-multi-entry";

export default [
  {
    input: {
      include: ['src/helpers/*.js']
    },
    plugins: [multiEntry()],
    /*
    input: {
      "paginator": "src/helpers/paginator.js"
    },
    * */
    output: {
      strict: true,
      format: 'es',
      file: "build/helpers/paginator.js"
    },
    onwarn: function(warning, handler) {
      // Skip certain warnings

      // should intercept ... but doesn't in some rollup versions
      if ( warning.code === 'THIS_IS_UNDEFINED' ) { return; }

      // console.warn everything else
      handler( warning );
    },
    context: "this"
  }
];