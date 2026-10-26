const TEXT_ENTRY_SELECTOR = [
  'input',
  'textarea',
  'select',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="textbox"]',
  '[role="combobox"]'
].join(', ');

const ENTER_ACTIVATION_SELECTOR = [
  'button',
  'a[href]',
  'summary',
  '[role="button"]',
  '[role="switch"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="tab"]'
].join(', ');

type WordleKeyboardEvent = Pick<
  KeyboardEvent,
  'code' | 'defaultPrevented' | 'target'
> &
  Partial<
    Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'metaKey' | 'isComposing'>
  >;

export function shouldIgnoreWordleKeyboardEvent(event: WordleKeyboardEvent) {
  if (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.isComposing
  ) {
    return true;
  }

  const target = event.target as
    | (EventTarget & {
        closest?: (selector: string) => Element | null;
      })
    | null;

  if (typeof target?.closest !== 'function') return false;

  if (target.closest(TEXT_ENTRY_SELECTOR)) return true;

  // Enter already has native activation semantics on these controls. Let the
  // focused control consume it instead of also submitting a Wordle guess.
  return (
    (event.code === 'Enter' || event.code === 'NumpadEnter') &&
    Boolean(target.closest(ENTER_ACTIVATION_SELECTOR))
  );
}
