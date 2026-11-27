import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ADDRESS_TEXT } from '../src/components/Build/AppAddress/text';

test('TransactionModal syncs async initialBuild.domains into selectedBuilds and review', () => {
  const src = readFileSync(
    new URL('../src/containers/Chat/Modals/TransactionModal/index.tsx', import.meta.url),
    'utf8'
  );
  assert.match(
    src,
    /useEffect\(\(\)\s*=>\s*\{\s*if\s*\(!initialBuild\?\.domains\)\s*return;[\s\S]*?setSelectedBuilds\([\s\S]*?setReview\([\s\S]*?\},\s*\[initialBuild\?\.id,\s*initialBuild\?\.domains\]\)/
  );
});

test('AppAddress guards useHere/removeDomain/removeElsewhere, shows alert banner on failure, and DomainCheckoutPage loads purchase for intro', () => {
  const src = readFileSync(
    new URL('../src/components/Build/AppAddress/index.tsx', import.meta.url),
    'utf8'
  );
  const checkoutSrc = readFileSync(
    new URL('../src/components/Build/AppAddress/DomainCheckoutPage.tsx', import.meta.url),
    'utf8'
  );
  const useHereBlock = src.match(/async function useHere\([\s\S]*?\n  \}/);
  assert.ok(useHereBlock, 'useHere handler must exist');
  assert.match(useHereBlock[0], /claimAction\('useHere'\)/);
  assert.match(useHereBlock[0], /if\s*\(action\.sameScope\(\)\)\s*setLeaveError\(e\?\.message\s*\|\|\s*t\.actionFailed\)/);
  assert.doesNotMatch(useHereBlock[0], /setStep\(\{\s*kind:\s*'intro'\s*\}\)/);

  const removeDomainBlock = src.match(/async function removeDomain\([\s\S]*?\n  \}/);
  assert.ok(removeDomainBlock, 'removeDomain handler must exist');
  assert.match(removeDomainBlock[0], /claimAction\('removeDomain'\)/);
  assert.match(removeDomainBlock[0], /if\s*\(action\.sameScope\(\)\)\s*setLeaveError\(e\?\.message\s*\|\|\s*t\.actionFailed\)/);

  const removeElsewhereBlock = src.match(/async function removeElsewhere\([\s\S]*?\n  \}/);
  assert.ok(removeElsewhereBlock, 'removeElsewhere handler must exist');
  assert.match(removeElsewhereBlock[0], /claimAction\('removeElsewhere'\)/);
  assert.match(removeElsewhereBlock[0], /if\s*\(action\.sameScope\(\)\)\s*setLeaveError\(e\?\.message\s*\|\|\s*t\.actionFailed\)/);

  assert.match(
    src,
    /\{\(leaving\s*\|\|\s*leaveError\)\s*&&\s*\([\s\S]*?<div\s+className=\{leaveNoticeClass\}\s+role=\{leaveError\s*\?\s*'alert'\s*:\s*'status'\}/
  );
  assert.match(checkoutSrc, /if\s*\(step\?\.kind\s*!==\s*'intro'\s*\|\|\s*purchase\)/);
});

test('ADDRESS_TEXT handles blanked private app titles in onApp and removeFrom', () => {
  assert.equal(ADDRESS_TEXT.en.onApp('Star Game'), 'on Star Game');
  assert.equal(ADDRESS_TEXT.en.onApp(''), 'on another app');
  assert.equal(ADDRESS_TEXT.en.removeFrom('Star Game'), 'Remove it from Star Game');
  assert.equal(ADDRESS_TEXT.en.removeFrom(''), 'Remove it from that app');
  assert.equal(ADDRESS_TEXT.ko.onApp('별 게임'), '별 게임에 연결됨');
  assert.equal(ADDRESS_TEXT.ko.onApp(''), '다른 앱에 연결됨');
  assert.equal(ADDRESS_TEXT.ko.removeFrom('별 게임'), '별 게임에서 빼기');
  assert.equal(ADDRESS_TEXT.ko.removeFrom(''), '그 앱에서 빼기');
});

test('AppAddress views omit disabled:true on otherDomains heading and non-live rows, and handle mobile truncation/wrapping', () => {
  const viewsSrc = readFileSync(
    new URL('../src/components/Build/AppAddress/views.tsx', import.meta.url),
    'utf8'
  );
  const chipSrc = readFileSync(
    new URL('../src/components/Build/HeaderChip.tsx', import.meta.url),
    'utf8'
  );

  // Finding #4: no disabled: true stacking opacity: 0.3 on fine text
  assert.doesNotMatch(viewsSrc, /yourOtherAddresses[\s\S]{0,80}disabled:\s*true/);
  assert.doesNotMatch(viewsSrc, /domain\.status\s*===\s*'live'\s*\?[\s\S]{0,80}disabled:\s*true/);

  // Finding #6: stackedLabel + wrapLabel on grid rows and armed confirmations
  assert.doesNotMatch(viewsSrc, /style=\{\{\s*display:\s*'grid'/);
  assert.match(viewsSrc, /const\s+stackedLabel\s*=\s*css`[\s\S]*?text-overflow:\s*ellipsis[\s\S]*?white-space:\s*normal/);
  assert.match(viewsSrc, /const\s+wrapLabel\s*=\s*css`[\s\S]*?white-space:\s*normal/);
  assert.match(
    viewsSrc,
    /<span\s+className=\{armed\s*\?\s*wrapLabel\s*:\s*undefined\}>\s*\{armed\s*\?\s*`\$\{domain\.hostname\}:\s*\$\{t\.removeFromConfirm\}`/
  );
  assert.match(chipSrc, /&&\s*li\s*>\s*span\s*>\s*span,\s*&&\s*li\s*>\s*span\s*>\s*small/);
});

test('TradeBuilds renders domain-ownership note outside the link and wires aria-describedby', () => {
  const src = readFileSync(
    new URL('../src/components/Build/TradeBuilds.tsx', import.meta.url),
    'utf8'
  );
  assert.match(src, /<div\s+className="app-preview">/);
  assert.match(
    src,
    /<a\s+className="app-open-link"[\s\S]*?aria-label=\{`Open \$\{build\.title\}`\}[\s\S]*?aria-describedby=\{domainNoteIds\s*\|\|\s*undefined\}[\s\S]*?>\s*<strong>\{build\.title\}<\/strong>\s*<\/a>/
  );
  // Ensure app-domain is rendered after the closing </a>, not nested inside the link
  const linkCloseIdx = src.indexOf('</a>');
  const domainNoteIdx = src.indexOf('className="app-domain"');
  assert.ok(linkCloseIdx > 0 && domainNoteIdx > linkCloseIdx, 'app-domain disclosure must be outside <a>');
});
