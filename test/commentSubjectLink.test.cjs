const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const router = require('react-router-dom');
const ts = require('typescript');

// Render the actual shared link with the actual router. Theme and error
// wrappers are irrelevant to destination selection and have browser globals.
const source = readFileSync(
  path.join(__dirname, '../src/components/Comments/Container/SubjectLink.tsx'),
  'utf8'
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.React,
    esModuleInterop: true
  }
}).outputText;
const moduleValue = { exports: {} };
vm.runInNewContext(compiled, {
  exports: moduleValue.exports,
  module: moduleValue,
  require(name) {
    if (name === 'react') return React;
    if (name === 'react-router-dom') return router;
    if (name === '~/theme/hooks/useRoleColor') {
      return {
        useRoleColor: () => ({ color: '#448aff', themeName: 'logoBlue' })
      };
    }
    if (
      name === '~/components/ErrorBoundary' ||
      name === '~/theme/ScopedTheme'
    ) {
      return { __esModule: true, default: ({ children }) => children };
    }
    throw new Error(`Unexpected dependency: ${name}`);
  }
});
const SubjectLink = moduleValue.exports.default;

function render(subject) {
  return renderToStaticMarkup(
    React.createElement(
      router.MemoryRouter,
      null,
      React.createElement(SubjectLink, { subject })
    )
  );
}

test('Build and other direct-root comments never render a phantom Subject link', () => {
  for (const subject of [undefined, null, {}, { title: 'No Subject' }]) {
    assert.equal(render(subject), '');
  }
});

test('invalid Subject identities cannot become navigable URLs', () => {
  for (const id of [0, -1, NaN, Infinity, 1.5, '', 'undefined']) {
    assert.equal(render({ id, title: 'Invalid' }), '');
  }
});

test('real Subject links retain their title, styling and canonical destination', () => {
  const html = render({ id: 36742, title: 'Studying log' });
  assert.match(html, /href="\/subjects\/36742"/);
  assert.match(html, />Studying log<\/a>/);
  assert.match(html, /font-weight:bold/);
});

test('normal and pinned comment rows both use the protected shared renderer', () => {
  for (const relativePath of ['Comment.tsx', 'PinnedComment/Comment.tsx']) {
    const caller = readFileSync(
      path.join(__dirname, '../src/components/Comments/Container', relativePath),
      'utf8'
    );
    assert.match(caller, /<SubjectLink theme=\{theme\} subject=\{subject\}/);
  }
});
