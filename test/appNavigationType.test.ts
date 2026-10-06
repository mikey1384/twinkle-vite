import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  NavigationType,
  Route,
  Router,
  Routes,
  useNavigationType
} from 'react-router-dom';
import {
  AppNavigationTypeProvider,
  useAppNavigationType
} from '../src/helpers/hooks/useAppNavigationType';

const h = React.createElement;
const navigator = {
  createHref: () => '',
  go: () => {},
  push: () => {},
  replace: () => {}
};

function Probe() {
  return h('span', null, `${useNavigationType()}|${useAppNavigationType()}`);
}

// The same shape as NavigationFeedbackProvider: the real router location, then
// the app rendered through <Routes location={acceptedLocation}>.
function renderLikeApp(
  navigationType: NavigationType,
  { withProvider }: { withProvider: boolean }
) {
  const routes = h(
    Routes,
    { location: { pathname: '/comments/5' } },
    h(Route, { path: '*', element: h(Probe) })
  );
  return renderToStaticMarkup(
    h(
      Router,
      { location: '/comments/5', navigationType, navigator: navigator as any },
      withProvider
        ? h(AppNavigationTypeProvider, { navigationType }, routes)
        : routes
    )
  );
}

test('inside <Routes location> React Router says POP; the app hook says what really happened', () => {
  for (const type of [
    NavigationType.Push,
    NavigationType.Replace,
    NavigationType.Pop
  ]) {
    assert.equal(
      renderLikeApp(type, { withProvider: true }),
      `<span>POP|${type}</span>`
    );
  }
  // Without the provider the hook falls back to React Router's own value.
  assert.equal(
    renderLikeApp(NavigationType.Push, { withProvider: false }),
    '<span>POP|POP</span>'
  );
});

const read = (file: string) =>
  readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');

test('the provider passes the accepted navigation type around its Routes', () => {
  const source = read('containers/App/navigationFeedback.tsx');
  assert.match(
    source,
    /const navigationType = useNavigationType\(\);[\s\S]*setAcceptedLocation\(destination\);\s*\/\/[^\n]*\n\s*setAcceptedNavigationType\(navigationType\);/
  );
  assert.match(
    source,
    /<AppNavigationTypeProvider navigationType=\{acceptedNavigationType\}>\s*<Routes location=\{acceptedLocation\}>/
  );
});

test('the forward-navigation top reset reads the real type, so it runs on PUSH and REPLACE', () => {
  const source = read('helpers/hooks/useScrollAnchorRestoration.ts');
  assert.match(
    source,
    /const navigationType = useAppNavigationType\(\);\s*useLayoutEffect\(\(\) => \{\s*if \(navigationType === 'POP'\) return;[\s\S]{0,900}note: 'forward-nav-mount'/
  );
  assert.doesNotMatch(source, /useNavigationType/);
  assert.match(read('helpers/hooks/useOwnerTrace.ts'), /useAppNavigationType\(\)/);
});
