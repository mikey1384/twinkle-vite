import test from 'node:test';
import assert from 'node:assert/strict';
import { createIframeFocusController } from '../src/helpers/iframeFocus';

function createFixture() {
  const primaryFrame = {};
  const secondaryFrame = {};
  let activeElement: unknown = null;
  let documentFocused = true;
  let nextCheckId = 1;
  let restoreCount = 0;
  const scheduledChecks = new Map<number, () => void>();

  const controller = createIframeFocusController({
    cancelScheduledCheck(checkId) {
      scheduledChecks.delete(checkId);
    },
    documentHasFocus() {
      return documentFocused;
    },
    getActiveElement() {
      return activeElement;
    },
    getOwnedFrames() {
      return [primaryFrame, secondaryFrame];
    },
    restoreWindowFocus() {
      restoreCount += 1;
    },
    scheduleCheck(callback) {
      const checkId = nextCheckId;
      nextCheckId += 1;
      scheduledChecks.set(checkId, callback);
      return checkId;
    }
  });

  return {
    controller,
    primaryFrame,
    secondaryFrame,
    flushChecks() {
      const pendingChecks = Array.from(scheduledChecks.values());
      scheduledChecks.clear();
      for (const check of pendingChecks) check();
    },
    getRestoreCount() {
      return restoreCount;
    },
    setActiveElement(element: unknown) {
      activeElement = element;
    },
    setDocumentFocused(focused: boolean) {
      documentFocused = focused;
    },
    getScheduledCheckCount() {
      return scheduledChecks.size;
    }
  };
}

test('restores semantic window focus when a preview iframe receives focus', () => {
  const fixture = createFixture();
  fixture.setActiveElement(fixture.primaryFrame);

  fixture.controller.handleWindowBlur();
  assert.equal(fixture.getRestoreCount(), 0);
  fixture.flushChecks();

  assert.equal(fixture.getRestoreCount(), 1);
});

test('does not mask a genuine browser window or tab blur', () => {
  const fixture = createFixture();
  fixture.setActiveElement(fixture.primaryFrame);
  fixture.setDocumentFocused(false);

  fixture.controller.handleWindowBlur();
  fixture.flushChecks();

  assert.equal(fixture.getRestoreCount(), 0);
});

test('does not restore focus for elements outside this preview panel', () => {
  const fixture = createFixture();
  fixture.setActiveElement({});

  fixture.controller.handleWindowBlur();
  fixture.flushChecks();

  assert.equal(fixture.getRestoreCount(), 0);
});

test('uses the latest deferred blur check and cancels work on disposal', () => {
  const fixture = createFixture();
  fixture.setActiveElement(fixture.secondaryFrame);

  fixture.controller.handleWindowBlur();
  fixture.controller.handleWindowBlur();
  assert.equal(fixture.getScheduledCheckCount(), 1);

  fixture.controller.dispose();
  assert.equal(fixture.getScheduledCheckCount(), 0);
  fixture.flushChecks();

  assert.equal(fixture.getRestoreCount(), 0);
});
