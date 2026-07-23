import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { popupTargetIsOutside } from '../src/helpers/popupBoundary.ts';

test('a trigger press is inside the popup boundary so its click owns the toggle', () => {
  const triggerTarget = {};
  const menuTarget = {};
  const outsideTarget = {};
  const trigger = fakeElementContaining(triggerTarget);
  const menu = fakeElementContaining(menuTarget);
  const boundaries = [{ current: menu }, { current: trigger }];
  let menuOpen = true;
  let dismissals = 0;

  if (
    popupTargetIsOutside(
      boundaries,
      triggerTarget as unknown as Node
    )
  ) {
    dismissals += 1;
    menuOpen = false;
  }
  menuOpen = !menuOpen;

  assert.equal(dismissals, 0);
  assert.equal(menuOpen, false);
  assert.equal(
    popupTargetIsOutside(boundaries, menuTarget as unknown as Node),
    false
  );
  assert.equal(
    popupTargetIsOutside(boundaries, outsideTarget as unknown as Node),
    true
  );
});

test('a true outside press still dismisses the open popup', () => {
  const outsideTarget = {};
  const boundaries = [
    { current: fakeElementContaining({}) },
    { current: fakeElementContaining({}) }
  ];
  let menuOpen = true;

  if (
    popupTargetIsOutside(
      boundaries,
      outsideTarget as unknown as Node
    )
  ) {
    menuOpen = false;
  }

  assert.equal(menuOpen, false);
  assert.equal(popupTargetIsOutside(boundaries, null), true);
});

test('dropdown wrappers provide their trigger boundary without cooldown timers', () => {
  const dropdownListSource = source('../src/components/DropdownList.tsx');
  const dropdownButtonSource = source(
    '../src/components/Buttons/DropdownButton.tsx'
  );
  const starButtonSource = source('../src/components/Buttons/StarButton.tsx');
  const buildHeaderSource = source('../src/containers/Build/Editor/Header.tsx');
  const userPopupSource = source('../src/components/UserPopup/Popup.tsx');
  const userPopupOwnerSource = source('../src/components/UserPopup/index.tsx');
  const reactionButtonSource = source(
    '../src/containers/Chat/Message/MessageBody/ReactionButton.tsx'
  );

  assert.match(
    dropdownListSource,
    /useOutsideClick\(outsideClickRefs, onHideMenu, \{\s*capture: true,/
  );
  assert.doesNotMatch(dropdownListSource, /document\.addEventListener/);
  assert.match(dropdownButtonSource, /triggerRef=\{ButtonRef\}/);
  assert.match(starButtonSource, /triggerRef=\{StarButtonRef\}/);
  assert.match(buildHeaderSource, /triggerRef=\{triggerRef\}/);
  assert.match(
    userPopupSource,
    /const outsideClickRefs = useMemo\(\s*\(\) => \[MenuRef, triggerRef\]/
  );
  assert.match(userPopupOwnerSource, /<Popup[\s\S]*triggerRef=\{triggerRef\}/);
  assert.match(reactionButtonSource, /ref=\{ContainerRef\}/);

  for (const componentSource of [
    dropdownButtonSource,
    starButtonSource,
    buildHeaderSource,
    reactionButtonSource
  ]) {
    assert.doesNotMatch(componentSource, /coolDownRef/);
  }
});

function fakeElementContaining(targetInside: object) {
  return {
    contains(target: Node) {
      return target === targetInside;
    }
  } as unknown as HTMLElement;
}

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), 'utf8');
}
