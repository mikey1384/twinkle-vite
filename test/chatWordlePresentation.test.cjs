const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const ts = require('typescript');
const { transformSync } = require('esbuild');

function declaration(file, name) {
  const source = ts.createSourceFile(file, readFileSync(path.resolve(__dirname, '../', file), 'utf8'),
    ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const node = source.statements.find(node =>
    (ts.isFunctionDeclaration(node) && node.name?.text === name) ||
    (ts.isVariableStatement(node) && node.declarationList.declarations.some(item => item.name.getText(source) === name)));
  assert.ok(node, `${name} exists`);
  return node.getText(source);
}
function compile(source, deps = {}) {
  const mod = { exports: {} };
  new Function('require', 'module', 'exports',
    transformSync(source, { loader: 'tsx', format: 'cjs', jsx: 'transform' }).code
  )(name => {
    assert.ok(Object.hasOwn(deps, name), `Unexpected dependency: ${name}`);
    return deps[name];
  }, mod, mod.exports);
  return mod.exports;
}
const { Color } = compile(declaration('src/constants/css.ts', 'Color'));
const { useWordleLabels } = compile([
  "import React, { useMemo } from 'react'; import { Color } from '~/constants/css';",
  'const UsernameText = ({ user }) => <span>{user.username}</span>;',
  'const addCommasToNumber = value => Number(value).toLocaleString("en-US");',
  declaration('src/constants/defaultValues.ts', 'wordleGuessReaction'),
  declaration('src/constants/defaultValues.ts', 'wordLevelHash'),
  declaration('src/helpers/hooks/index.tsx', 'useWordleLabels')
].join('\n'), { react: React, '~/constants/css': { Color } });
function renderLabels(wordLevelColor) {
  let labels;
  function Fixture() {
    labels = useWordleLabels({ isSolved: true, isStrict: true, numGuesses: 5,
      solution: 'STOPS', wordLevel: 1, xpRewardAmount: 4000,
      username: 'Preview', userId: 5, myId: 5, wordLevelColor });
    return null;
  }
  // The test itself is CJS: render the hook through a real React component.
  renderToStaticMarkup(React.createElement(Fixture));
  return { solution: renderToStaticMarkup(React.createElement('p', null, labels.solutionLabel)),
    result: renderToStaticMarkup(React.createElement('p', null, labels.resultLabel)),
    bonus: labels.bonusLabel };
}

test('Wordle label color can adapt to a dark chat surface without changing text or rewards', () => {
  const normal = renderLabels();
  const dark = renderLabels('#75c0ff');
  assert.match(normal.solution, /color:rgba\(65, 140, 235,1\)/);
  assert.match(dark.solution, /color:#75c0ff/);
  assert.equal(dark.result, normal.result);
  assert.equal(dark.bonus, 'double reward bonus');
  assert.match(dark.solution, /STOPS/);
  assert.match(dark.solution, /basic/);
  assert.match(dark.solution, /<span style="white-space:nowrap">\(<b/);
});

test('every chat-banner word level has at least 4.5:1 contrast against its dark surface', () => {
  const source = readFileSync(path.resolve(__dirname,
    '../src/containers/Chat/constants/wordlePresentation.ts'), 'utf8');
  const { getWordleBannerLevelColor } = compile(source, { '~/constants/css': { Color } });
  function luminance(color) {
    const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number);
    const linear = rgb.map(value => {
      value /= 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  }
  const background = luminance(Color.darkBlueGray());
  for (const level of [0, 1, 2, 3, 4, 5, -1, 999]) {
    const ink = getWordleBannerLevelColor(level);
    const ratio = (luminance(ink) + 0.05) / (background + 0.05);
    assert.ok(ratio >= 4.5, `level ${level}: ${ratio.toFixed(2)}:1`);
  }
  assert.equal(getWordleBannerLevelColor(1), Color.lightBlue());
  assert.equal(getWordleBannerLevelColor(4), Color.lightRed());
});
