const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { transformSync } = require('esbuild');
const source = readFileSync(path.resolve(__dirname, '../src/containers/Chat/Message/MessageBody/reactionPickerLayout.ts'), 'utf8');
const mod = { exports: {} };
new Function('module', 'exports', 'document', 'getComputedStyle', transformSync(source, {loader:'ts',format:'cjs'}).code)(mod, mod.exports,
  {documentElement:{clientWidth:1000,clientHeight:700}}, element => element.style);
const { positionReactionPicker: position, getReactionPickerBounds: bounds } = mod.exports;
const viewport = {top:120,right:820,bottom:560,left:350}, size = {width:202,height:112};

test('reaction picker flips above the last message and stays within the chat scroller', () => {
  const anchor = {top:478,right:760,bottom:522,left:716};
  const result = position(anchor, viewport, size);
  assert.equal(result.above, true);
  assert.equal(anchor.top + result.top, 366);
  assert.ok(anchor.top + result.top + size.height <= viewport.bottom - 4);
});

test('reaction picker opens below a top-edge message and clamps its left edge on a phone', () => {
  const anchor = {top:70,right:180,bottom:114,left:136};
  const result = position(anchor, {top:64,left:0,right:320,bottom:660}, size);
  assert.equal(result.above, false);
  assert.equal(anchor.top + result.top, 114);
  assert.equal(anchor.left + result.left, 4);
});

test('a very short message scroller gets a bounded, internally scrollable picker', () => {
  const anchor = {top:155,right:700,bottom:199,left:656};
  const result = position(anchor, {top:140,left:350,right:820,bottom:220}, size);
  assert.equal(result.maxHeight, 66);
  assert.equal(anchor.top + result.top, 144);
});

test('picker bounds intersect nested clipping ancestors, borders and scrollbars', () => {
  const parent = (rect, style, client, parentElement = null) => ({style, ...client, parentElement, getBoundingClientRect:()=>rect});
  const outer = parent({left:20,top:50}, {overflowX:'hidden',overflowY:'hidden'}, {clientLeft:2,clientTop:2,clientWidth:780,clientHeight:600});
  const inner = parent({left:350,top:120}, {overflowX:'auto',overflowY:'scroll'}, {clientLeft:1,clientTop:1,clientWidth:449,clientHeight:439}, outer);
  assert.deepEqual(bounds({parentElement:inner}), {left:351,top:121,right:800,bottom:560});
});
