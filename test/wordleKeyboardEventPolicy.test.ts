import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldIgnoreWordleKeyboardEvent } from '../src/containers/Chat/Modals/WordleModal/Game/Keyboard/keyboardEventPolicy';

function targetMatching(matchedSelector?: string) {
  return {
    closest(selectorList: string) {
      if (!matchedSelector) return null;
      return selectorList
        .split(',')
        .some((selector) => selector.trim() === matchedSelector)
        ? {}
        : null;
    }
  } as unknown as EventTarget;
}

function keyboardEvent({
  code,
  matchedSelector,
  defaultPrevented = false
}: {
  code: string;
  matchedSelector?: string;
  defaultPrevented?: boolean;
}) {
  return {
    code,
    defaultPrevented,
    target: targetMatching(matchedSelector)
  } as Pick<KeyboardEvent, 'code' | 'defaultPrevented' | 'target'>;
}

test('focused Wordle controls consume Enter without also submitting a guess', () => {
  for (const matchedSelector of [
    'button',
    'a[href]',
    '[role="button"]',
    '[role="switch"]'
  ]) {
    assert.equal(
      shouldIgnoreWordleKeyboardEvent(
        keyboardEvent({ code: 'Enter', matchedSelector })
      ),
      true
    );
  }
});

test('physical letter input still works after a mouse-focused button', () => {
  assert.equal(
    shouldIgnoreWordleKeyboardEvent(
      keyboardEvent({ code: 'KeyA', matchedSelector: 'button' })
    ),
    false
  );
});

test('text-entry controls are isolated from every Wordle keyboard shortcut', () => {
  for (const code of ['KeyA', 'Backspace', 'Enter']) {
    assert.equal(
      shouldIgnoreWordleKeyboardEvent(
        keyboardEvent({ code, matchedSelector: 'input' })
      ),
      true
    );
  }
});

test('unconsumed keys outside controls continue to reach the game', () => {
  assert.equal(
    shouldIgnoreWordleKeyboardEvent(keyboardEvent({ code: 'Enter' })),
    false
  );
  assert.equal(
    shouldIgnoreWordleKeyboardEvent(
      keyboardEvent({ code: 'Enter', defaultPrevented: true })
    ),
    true
  );
});
