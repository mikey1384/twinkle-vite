const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { transformSync } = require('esbuild');

const inputRoot = path.resolve(__dirname, '../src/containers/Chat/Body/MessagesContainer/MessageInput');

test('every icon-only or abbreviated composer action has an explicit name', () => {
  const expected = {
    'LeftButtons.tsx': ['Open chess game', 'Open Omok game', 'Play Wordle', 'Reply to topic'],
    'RightButtons/AddButtons.tsx': ['Open trade', 'Attach a video'],
    'RightButtons/index.tsx': ['Stop AI response'],
    'index.tsx': ['Send message']
  };
  for (const [filename, labels] of Object.entries(expected)) {
    const source = ts.createSourceFile(filename, readFileSync(path.join(inputRoot, filename), 'utf8'),
      ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const found = [];
    function visit(node) {
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(source) === 'Button') {
        const label = node.attributes.properties.find(attribute =>
          ts.isJsxAttribute(attribute) && attribute.name.getText(source) === 'aria-label');
        if (label && ts.isStringLiteral(label.initializer)) found.push(label.initializer.text);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    assert.deepEqual(found, labels, filename);
  }
});

test('shared Button renders the action name on the native disabled/loading control', () => {
  const source = readFileSync(path.resolve(__dirname, '../src/components/Button.tsx'), 'utf8');
  const mod = { exports: {} };
  const dependencies = {
    react: React, '@emotion/css': require('@emotion/css'), '~/components/Icon': () => null,
    '~/constants/css': { mobileMaxWidth: '767px', borderRadius: '8px',
      Color: new Proxy({}, { get: () => () => '#334155' }) }
  };
  const code = transformSync(source, { loader: 'tsx', format: 'cjs', jsx: 'transform' }).code;
  new Function('require', 'module', 'exports', code)(name => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
    return dependencies[name];
  }, mod, mod.exports);
  for (const loading of [false, true]) {
    const markup = renderToStaticMarkup(React.createElement(mod.exports.default,
      { 'aria-label': 'Stop AI response', 'aria-expanded': loading,
        'aria-controls': 'controlled-panel', buttonRef: React.createRef(), loading,
        onClick: () => assert.fail('render must not activate') }));
    assert.match(markup, /<button[^>]+aria-label="Stop AI response"/);
    assert.match(markup, /type="button"/);
    assert.match(markup, new RegExp(`aria-expanded="${loading}"`));
    assert.match(markup, /aria-controls="controlled-panel"/);
    assert.equal(/ disabled=""/.test(markup), loading);
  }
});
