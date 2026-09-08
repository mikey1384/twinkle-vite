const assert = require('node:assert/strict');
const test = require('node:test');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { transformSync } = require('esbuild');
const ts = require('typescript');
const React = require('react');
const root = path.resolve(__dirname, '../..');
const base = 'src/containers/Chat/Modals/';
const source = file => readFileSync(path.join(root, file), 'utf8');
function compile(file, deps, globals = {}) {
  const module = { exports: {} };
  const code = transformSync(source(file), { loader: 'tsx', format: 'cjs', jsx: 'transform' }).code;
  new Function('require', 'module', 'exports', ...Object.keys(globals), code)(name => {
    assert.ok(Object.hasOwn(deps, name), `Unexpected import ${name}`);
    return deps[name];
  }, module, module.exports, ...Object.values(globals));
  return module.exports;
}
function driver() {
  const slots = [], effects = [];
  let cursor = 0, dirty = false, disposed = false, late = 0;
  const hooks = {
    ...React, useMemo: fn => fn(), memo: fn => fn,
    useId() { const i = cursor++; return slots[i] ||= `field-${i}`; },
    useRef(value) { const i = cursor++; return slots[i] ||= { current: value }; },
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], next => {
        if (disposed) late++;
        const value = typeof next === 'function' ? next(slots[i]) : next;
        if (!Object.is(value, slots[i])) { slots[i] = value; dirty = true; }
      }];
    },
    useEffect(effect, deps) {
      const i = cursor++, previous = slots[i];
      if (!previous || deps.some((value, j) => !Object.is(value, previous.deps[j]))) {
        slots[i] = { deps, cleanup: previous?.cleanup };
        effects.push(() => { slots[i].cleanup?.(); slots[i].cleanup = effect(); });
      }
    }
  };
  return {
    hooks, get lateUpdates() { return late; },
    render(fn) {
      for (let i = 0; i < 30; i++) {
        cursor = 0; dirty = false;
        const tree = fn();
        while (effects.length) effects.shift()();
        if (!dirty) return tree;
      }
      throw new Error('Render loop');
    },
    dispose() { disposed = true; slots.forEach(value => value?.cleanup?.()); }
  };
}

const css = (parts, ...values) => parts.reduce((s, part, i) => s + part + (values[i] ?? ''), '');
function nodes(tree, predicate) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(item => nodes(item, predicate));
  return [...(predicate(tree) ? [tree] : []), ...nodes(tree.props?.children, predicate)];
}
const find = (tree, predicate) => { const result = nodes(tree, predicate); assert.equal(result.length, 1); return result[0]; };
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const settle = async () => { for (let i = 0; i < 16; i++) await Promise.resolve(); };
function callback(file, name, dependencies) {
  const text = source(file), ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let expression;
  function visit(node) { if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name) expression = node.initializer.arguments[0].getText(ast); ts.forEachChild(node, visit); }
  visit(ast); assert.ok(expression);
  const code = transformSync('module.exports = ' + expression, { loader: 'ts', format: 'cjs' }).code;
  const module = { exports: {} }; new Function('module', ...Object.keys(dependencies), code)(module, ...Object.values(dependencies)); return module.exports;
}

module.exports = { assert, test, React, root, base, source, compile, driver, css, nodes, find, deferred, settle, callback };
