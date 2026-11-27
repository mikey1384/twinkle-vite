import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ADDRESS_TEXT } from '../src/components/Build/AppAddress/text';

function readSrc(relPath: string) {
  return readFileSync(new URL(`../src/${relPath}`, import.meta.url), 'utf8');
}

test('AppAddress keys on build.id in Header and guards async mutations against buildId switches', () => {
  const header = readSrc('containers/Build/Editor/Header.tsx');
  assert.match(
    header,
    /<AppAddress\s+key=\{Number\(build\.id\)\}\s+buildId=\{Number\(build\.id\)\}/
  );

  const appAddress = readSrc('components/Build/AppAddress/index.tsx');
  assert.match(appAddress, /const\s+buildIdRef\s*=\s*useRef\(buildId\)/);
  assert.match(appAddress, /sameBuild:\s*\(\)\s*=>\s*mountedRef\.current\s*&&\s*buildIdRef\.current\s*===\s*reqBuildId/);
  assert.match(
    appAddress,
    /current:\s*\(\)\s*=>\s*mountedRef\.current\s*&&\s*buildIdRef\.current\s*===\s*reqBuildId\s*&&\s*flowGenRef\.current\s*===\s*gen\s*&&\s*stepRef\.current\s*===\s*from/
  );
  assert.match(appAddress, /if\s*\(fresh\s*&&\s*request\.sameBuild\(\)\)\s*setInfo\(fresh\)/);
});

test('removeDomain, removeElsewhere, and useHere isolate errors from checkout and surface failures during Rename', () => {
  const appAddress = readSrc('components/Build/AppAddress/index.tsx');
  const menuActions = appAddress.slice(
    appAddress.indexOf('async function removeDomain('),
    appAddress.indexOf('async function checkConnect(')
  );
  assert.ok(menuActions.length > 0);
  assert.doesNotMatch(menuActions, /\bsetError\(/);
  assert.equal(
    (menuActions.match(/if\s*\(!request\.current\(\)\s*&&\s*!\(request\.sameBuild\(\)\s*&&\s*stepRef\.current\?\.kind\s*===\s*'rename'\)\)\s*return;/g) || []).length,
    3
  );
  assert.match(
    appAddress,
    /\{actionError\s*&&\s*!checkoutOpen\s*&&\s*\(\s*<Modal\s+modalKey="AppAddressError"[\s\S]*?modalLevel=\{step\?\.kind\s*===\s*'rename'\s*\?\s*2\s*:\s*1\}/
  );
});

test('HeaderMenu notifies onOpenChange on every close/open path and AddressMenuView clears confirming', () => {
  const headerChip = readSrc('components/Build/HeaderChip.tsx');
  assert.match(headerChip, /onOpenChange\?:\s*\(open:\s*boolean\)\s*=>\s*void/);
  assert.match(headerChip, /function\s+setMenuContext\(/);
  assert.match(headerChip, /if\s*\(event\.key\s*===\s*'Escape'\)\s*setMenuContext\(null\)/);
  assert.match(headerChip, /function\s+handleHide\(\)\s*\{[\s\S]*?setMenuContext\(null\)/);

  const views = readSrc('components/Build/AppAddress/views.tsx');
  assert.match(
    views,
    /<HeaderMenu\s+items=\{items\}\s+label=\{shownHost\}\s+onOpenChange=\{\(\)\s*=>\s*setConfirming\(0\)\}/
  );
});

test('openOwnFlow relies on the guarded useEffect instead of issuing a duplicate loadDomainPurchase call', () => {
  const appAddress = readSrc('components/Build/AppAddress/index.tsx');
  const openOwnFlowMatch = appAddress.match(/function\s+openOwnFlow\(\)\s*\{([\s\S]*?)\n  \}/);
  assert.ok(openOwnFlowMatch, 'openOwnFlow must exist');
  assert.doesNotMatch(openOwnFlowMatch[1], /loadDomainPurchase/);
});

test('SelectBuildsModal and TransactionModal preserve async initialBuild.domains across selection', () => {
  const selectBuilds = readSrc('containers/Chat/Modals/TransactionModal/SelectBuildsModal.tsx');
  assert.match(
    selectBuilds,
    /useEffect\(\(\)\s*=>\s*\{[\s\S]*?selected[\s\S]*?setSelection\(/
  );

  const txModal = readSrc('containers/Chat/Modals/TransactionModal/index.tsx');
  assert.match(txModal, /function\s+mergeInitialBuildDomains\(/);
  assert.match(
    txModal,
    /<SelectBuildsModal[\s\S]*?onDone=\{\(builds\)\s*=>\s*\{\s*const\s+merged\s*=\s*mergeInitialBuildDomains\(builds\)/
  );
});

test('otherDomains remove labels include the hostname in both unarmed and armed states for screen readers', () => {
  assert.equal(ADDRESS_TEXT.en.removeFrom('Space', 'a.com'), 'Remove a.com from Space');
  assert.equal(ADDRESS_TEXT.en.removeFrom('', 'a.com'), 'Remove a.com from that app');
  assert.notEqual(
    ADDRESS_TEXT.en.removeFrom('', 'a.com'),
    ADDRESS_TEXT.en.removeFrom('', 'b.com')
  );
  assert.equal(ADDRESS_TEXT.en.removeFrom('Space'), 'Remove it from Space');
  assert.equal(ADDRESS_TEXT.en.removeFrom(''), 'Remove it from that app');

  assert.equal(ADDRESS_TEXT.ko.removeFrom('우주', 'a.com'), '우주에서 a.com 빼기');
  assert.equal(ADDRESS_TEXT.ko.removeFrom('', 'a.com'), '그 앱에서 a.com 빼기');
  assert.notEqual(
    ADDRESS_TEXT.ko.removeFrom('', 'a.com'),
    ADDRESS_TEXT.ko.removeFrom('', 'b.com')
  );
  assert.equal(ADDRESS_TEXT.ko.removeFrom('우주'), '우주에서 빼기');
  assert.equal(ADDRESS_TEXT.ko.removeFrom(''), '그 앱에서 빼기');

  const views = readSrc('components/Build/AppAddress/views.tsx');
  assert.match(
    views,
    /armed\s*\?\s*`\$\{domain\.hostname\}:\s*\$\{t\.removeFromConfirm\}`\s*:\s*t\.removeFrom\(domain\.appTitle,\s*domain\.hostname\)/
  );
});
