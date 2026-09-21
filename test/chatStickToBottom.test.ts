import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveChatStickToBottom } from '../src/containers/Build/Editor/helpers/chatStickToBottom';

const view = { scrollHeight: 2000, clientHeight: 500 };

test('a small scroll up releases the pin even inside the bottom threshold', () => {
  // 30px above the bottom: the old position-only rule kept this pinned, so the
  // next streamed line pulled the reader back down.
  assert.equal(
    resolveChatStickToBottom({ ...view, scrollTop: 1470, previousScrollTop: 1500 }),
    false
  );
});

test('scrolling back down into the threshold pins again', () => {
  assert.equal(
    resolveChatStickToBottom({ ...view, scrollTop: 1450, previousScrollTop: 1300 }),
    true
  );
});

test('following streamed growth to the bottom stays pinned', () => {
  assert.equal(
    resolveChatStickToBottom({ ...view, scrollTop: 1500, previousScrollTop: 1440 }),
    true
  );
});

test('shrinking content that clamps the view onto the bottom stays pinned', () => {
  assert.equal(
    resolveChatStickToBottom({
      scrollHeight: 1800,
      clientHeight: 500,
      scrollTop: 1300,
      previousScrollTop: 1500
    }),
    true
  );
});

test('far from the bottom is never pinned, and the first event uses position', () => {
  assert.equal(
    resolveChatStickToBottom({ ...view, scrollTop: 400, previousScrollTop: 300 }),
    false
  );
  assert.equal(
    resolveChatStickToBottom({ ...view, scrollTop: 1480, previousScrollTop: null }),
    true
  );
});
