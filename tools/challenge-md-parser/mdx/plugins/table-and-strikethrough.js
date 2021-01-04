'use strict';

var strikethrough = require('micromark-extension-gfm-strikethrough');
var table = require('micromark-extension-gfm-table');
var fromMarkdown = require('mdast-util-gfm/from-markdown');
var toMarkdown = require('mdast-util-gfm/to-markdown');

module.exports = tableAndStrikethrough;

function tableAndStrikethrough() {
  var data = this.data();

  add('micromarkExtensions', strikethrough());
  add('micromarkExtensions', table);
  add('fromMarkdownExtensions', fromMarkdown);
  add('toMarkdownExtensions', toMarkdown());

  function add(field, value) {
    if (data[field]) data[field].push(value);
    else data[field] = [value];
  }
}

// Based on remark-gfm, extended as described in
// https://github.com/remarkjs/remark/tree/main/packages/remark-parse#extending-the-parser
