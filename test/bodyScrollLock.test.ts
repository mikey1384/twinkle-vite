import assert from 'node:assert/strict';
import test from 'node:test';
import { lockBodyScroll } from '../src/helpers/bodyScrollLock';

function makeBody() {
  const properties = new Map<string, { value: string; priority: string }>();
  const style = {
    getPropertyValue: (name: string) => properties.get(name)?.value || '',
    getPropertyPriority: (name: string) => properties.get(name)?.priority || '',
    setProperty: (name: string, value: string, priority = '') => {
      properties.set(name, { value, priority });
    },
    removeProperty: (name: string) => properties.delete(name)
  };
  return { style } as unknown as HTMLElement;
}

for (const pageClosesFirst of [true, false]) {
  test(`page and dialog release safely with ${pageClosesFirst ? 'page' : 'dialog'} closing first`, () => {
    const body = makeBody();
    const releasePage = lockBodyScroll(body);
    const releaseDialog = lockBodyScroll(body);
    const [first, last] = pageClosesFirst
      ? [releasePage, releaseDialog]
      : [releaseDialog, releasePage];
    first();
    assert.equal(body.style.getPropertyValue('overflow-y'), 'hidden');
    first(); // React teardown or a caller retry must not release another owner.
    assert.equal(body.style.getPropertyValue('overflow-y'), 'hidden');
    last();
    assert.equal(body.style.getPropertyValue('overflow-y'), '');
    assert.equal(body.style.getPropertyValue('overflow-x'), '');
  });
}

test('the last dialog restores inline axes and priorities without pinning responsive CSS', () => {
  const body = makeBody();
  body.style.setProperty('overflow-x', 'clip', 'important');
  body.style.setProperty('color', 'red');
  const releases = [lockBodyScroll(body), lockBodyScroll(body), lockBodyScroll(body)];
  releases[1]();
  releases[0]();
  assert.equal(body.style.getPropertyValue('overflow-y'), 'hidden');
  releases[2]();
  assert.equal(body.style.getPropertyValue('overflow-x'), 'clip');
  assert.equal(body.style.getPropertyPriority('overflow-x'), 'important');
  assert.equal(body.style.getPropertyValue('overflow-y'), '');
  assert.equal(body.style.getPropertyValue('color'), 'red');
});

test('locks are independent for dialogs in different documents', () => {
  const first = makeBody();
  const second = makeBody();
  const releaseFirst = lockBodyScroll(first);
  const releaseSecond = lockBodyScroll(second);
  releaseFirst();
  assert.equal(first.style.getPropertyValue('overflow-y'), '');
  assert.equal(second.style.getPropertyValue('overflow-y'), 'hidden');
  releaseSecond();
  assert.equal(second.style.getPropertyValue('overflow-y'), '');
});

test('a later visit snapshots fresh styles and ignores an old cleanup', () => {
  const body = makeBody();
  const releaseOld = lockBodyScroll(body);
  releaseOld();
  body.style.setProperty('overflow-y', 'auto');
  const releaseNew = lockBodyScroll(body);
  releaseOld();
  assert.equal(body.style.getPropertyValue('overflow-y'), 'hidden');
  releaseNew();
  assert.equal(body.style.getPropertyValue('overflow-y'), 'auto');
});
