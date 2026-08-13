// The document itself — the parts of the page that are not any register's.
//
// None of this is visible when it is right and all of it is subtle when it is
// wrong: a missing doctype renders the whole console in quirks mode, a missing
// theme-color leaves a white bar above a black page, viewport-fit without a
// safe-area inset puts the dossier under a home indicator. Cheap to assert,
// expensive to notice by eye.

const fs = require('fs');
const path = require('path');

module.exports = ({ok, ROOT}) => {
  const html = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));

  // ---- standards mode ----------------------------------------------------
  ok(/^<!doctype html>/i.test(html.trimStart()),
     'the page must open with a doctype or the browser renders it in quirks mode');
  ok(/<html\s+lang="[a-z-]+"/i.test(html), '<html> needs a lang for screen readers');

  const once = (re, what) => {
    const n = (html.match(re) || []).length;
    ok(n === 1, `expected exactly one ${what}, found ${n}`);
  };
  once(/<html[\s>]/gi, '<html>');
  once(/<head[\s>]/gi, '<head>');
  once(/<body[\s>]/gi, '<body>');
  ok(/<\/body>\s*<\/html>\s*$/i.test(html.trimEnd()), 'the document does not close cleanly');

  // ---- dark before the first paint ---------------------------------------
  ok(/<meta\s+name="color-scheme"\s+content="dark">/i.test(head),
     'color-scheme should be declared in the head, before any CSS is parsed');

  // The browser chrome takes its colour from theme-color, so if it drifts from
  // the page background the phone paints a stripe of last month's palette.
  const themed = /<meta\s+name="theme-color"\s+content="(#[0-9a-f]{3,8})"/i.exec(head);
  ok(themed, 'no theme-color declared');
  const void_ = /--void:\s*(#[0-9a-f]{3,8})\s*;/i.exec(html);
  ok(void_, 'could not find --void in the stylesheet');
  if (themed && void_) {
    ok(themed[1].toLowerCase() === void_[1].toLowerCase(),
       `theme-color ${themed[1]} no longer matches --void ${void_[1]}`);
  }

  // ---- the two halves of edge-to-edge ------------------------------------
  // viewport-fit=cover is what makes env(safe-area-inset-*) report anything,
  // and it is also what lets content slide under the home indicator. Declaring
  // it without honouring an inset somewhere is strictly worse than not
  // declaring it at all.
  const cover = /viewport-fit=cover/i.test(head);
  const inset = /env\(safe-area-inset-/.test(html);
  ok(cover === inset,
     cover ? 'viewport-fit=cover is declared but nothing honours a safe-area inset'
           : 'something honours a safe-area inset but viewport-fit=cover is not declared');

  console.log(`  ${html.length.toLocaleString()} bytes, standards mode, theme ${themed ? themed[1] : '?'}`);
};
