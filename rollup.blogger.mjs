import multiEntry from "@rollup/plugin-multi-entry";

export default [
  {

    input: {
      include: [
        'src/helpers/*.js',
        'src/blogger/*.js'
      ]
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
      file: "build/blogger/blogger.utils.js"
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