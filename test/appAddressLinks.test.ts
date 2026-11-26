import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { appAddressIntentPath } from '../src/helpers/appAddressLinks';

test('Stripe returns and wand links on /app/<id> go to the checkout page with their query', () => {
  // Stripe success and cancel (twinkle-api domainOrders.ts successUrl / cancelUrl)
  assert.equal(appAddressIntentPath('/app/42', '?domainOrder=17'), '/build/42/domain?domainOrder=17');
  assert.equal(appAddressIntentPath('/app/42', '?domainOrder=17&cancelled=1'), '/build/42/domain?domainOrder=17&cancelled=1');
  // the wand's four screens (twinkle-api sponsoredHelp appAddressPath)
  for (const screen of ['find', 'buy', 'connect', 'status']) {
    assert.equal(
      appAddressIntentPath('/app/42', `?appAddress=${screen}&domain=redsquaregame.com`),
      `/build/42/domain?appAddress=${screen}&domain=redsquaregame.com`
    );
  }
  assert.equal(appAddressIntentPath('/app/42/', '?appAddress=find'), '/build/42/domain?appAddress=find');
});

test('Other app links stay on the runtime', () => {
  assert.equal(appAddressIntentPath('/app/42', ''), null);
  assert.equal(appAddressIntentPath('/app/42', '?from=home'), null);
  assert.equal(appAddressIntentPath('/app/42/432-some-book', '?domainOrder=1'), null);
  assert.equal(appAddressIntentPath('/build/42', '?domainOrder=1'), null);
});

test('the app router sends those links to the checkout page and keeps the runtime host away', () => {
  const app = readFileSync(new URL('../src/containers/App/index.tsx', import.meta.url), 'utf8');
  assert.match(app, /if \(appAddressIntent\) return <Navigate to=\{appAddressIntent\} replace \/>;/);
  assert.match(app, /!appAddressIntentPath\(location\.pathname, location\.search\)/);
});

test('the checkout is its own page: no overlay, scroll lock, focus trap or history entries', () => {
  const ui = readFileSync(new URL('../src/components/Build/AppAddress/checkout/ui.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(ui, /lockBodyScroll|trapModalFocus|createPortal\(content|position: fixed;\s+inset: 0;\s+z-index: 100000/);
  const page = readFileSync(new URL('../src/components/Build/AppAddress/DomainCheckoutPage.tsx', import.meta.url), 'utf8');
  assert.match(page, /<CheckoutSurface variant="page"/);
  assert.doesNotMatch(page, /appAddressCheckout|navigate\(-1\)/);
  // leaving replaces the checkout's entry: Back from the editor doesn't reopen it
  assert.match(page, /function closeFlow\(\) \{[\s\S]{0,120}navigate\(appPath, \{ replace: true \}\)/);
  const routes = readFileSync(new URL('../src/containers/Build/index.tsx', import.meta.url), 'utf8');
  assert.match(routes, /path="\/:buildId\/domain" element=\{<DomainCheckoutRoute \/>\}/);
  assert.ok(routes.indexOf('/:buildId/domain') < routes.indexOf('/:buildId/:branchNumber'));
});

test('Stripe’s return opens its order before anything can send the member away', () => {
  const page = readFileSync(new URL('../src/components/Build/AppAddress/DomainCheckoutPage.tsx', import.meta.url), 'utf8');
  // the order step starts from valid positive integer ?domainOrder alone (no app/address needed)
  assert.match(page, /if \(startedRef\.current \|\| !userId \|\| !Number\.isSafeInteger\(returnOrderId\) \|\| returnOrderId <= 0\) return;/);
  assert.ok(page.indexOf('returnOrderId <= 0') < page.indexOf('navigate(appPath, { replace: true });\n      return;'));
  // a failed transient load is an error with Try again, never "hosting off"
  assert.doesNotMatch(page, /loadAppAddress\(\{ buildId \}\)\.catch\(\(\) => \(\{ enabled: false \}\)\)/);
  assert.match(page, /setLoadFailed\(true\)/);
  // non-owners / unpublished / missing builds redirect instead of trapping on Try again,
  // and deterministic 4xx errors do not retry
  assert.match(page, /access\?\.kind === 'redirect-runtime' && access\.runtimePath/);
  assert.match(page, /status >= 400 && status < 500 && status !== 408 && status !== 429/);
  assert.match(page, /if \(status === 403 \|\| status === 404\)/);
});

test('a save that finishes after the owner moved on doesn’t open the old app’s checkout', () => {
  const chip = readFileSync(new URL('../src/components/Build/AppAddress/index.tsx', import.meta.url), 'utf8');
  assert.match(chip, /await onSaveChanges\(\)[\s\S]{0,140}if \(!stillHere\(\)\) return;[\s\S]{0,200}navigate\(domainCheckoutPath\(buildId\)\)/);
  // switching builds clears leaving/leaveError and uses fixed bottom offset above keyboard
  assert.match(chip, /setLeaving\(false\);\s+setLeaveError\(''\);\s+\}, \[buildId\]\);/);
  assert.match(chip, /bottom: calc\(var\(--app-shell-bottom-offset, 0px\) \+ 12px\);/);
  // before-leaving save errors surface via pageFeedbackEvents even when no AI run is active
  const drafts = readFileSync(new URL('../src/containers/Build/Editor/hooks/useProjectFileDrafts.ts', import.meta.url), 'utf8');
  assert.match(drafts, /ensureProjectFilesPersistedBeforeLeaving\(\) \{[\s\S]*?pageFeedbackOnMissingRequestId: true/);
});

test('CountryField mobile autofill, touch popover stability, a11y, and mobile button wrapping', () => {
  const ui = readFileSync(new URL('../src/components/Build/AppAddress/checkout/ui.tsx', import.meta.url), 'utf8');
  const steps = readFileSync(new URL('../src/components/Build/AppAddress/checkout/steps.tsx', import.meta.url), 'utf8');
  // phone mode keeps readOnly trigger for iOS sheet but adds hidden writable autofill input
  assert.match(ui, /autoComplete="country-name"\s+aria-hidden="true"\s+tabIndex=\{-1\}[\s\S]{0,160}matchCountry\(event\.target\.value\)/);
  assert.match(ui, /readOnly=\{phone\}/);
  // a11y: aria-expanded reflects open state on phones too; Escape guards IME keyCode 229
  assert.match(ui, /aria-expanded=\{open\}/);
  assert.match(ui, /if \(event\.isComposing \|\| event\.keyCode === 229\) return;/);
  // blur timer is cancellable and defers commitTyped out of synchronous onBlur
  assert.match(ui, /clearBlurTimer\(\);[\s\S]{0,160}blurTimerRef\.current = window\.setTimeout\(\(\) => \{\s+blurTimerRef\.current = null;\s+commitTypedRef\.current\(\);\s+setOpen\(false\);\s+\}, 120\);/);
  // phone footer buttons wrap naturally without min-width: 0 clipping
  assert.match(ui, /flex: 1 0 auto;\s+max-width: 100%;/);
  // long domains wrap in lead and body text
  assert.match(ui, /const leadClass = css`[\s\S]*?overflow-wrap: anywhere;/);
  assert.match(steps, /const bodyTextClass = css`[\s\S]*?overflow-wrap: anywhere;/);
});

test('checkout pages hide the site header; the page restarts for another member or a new link', async () => {
  const { isCheckoutPagePath } = await import('../src/helpers/appAddressLinks');
  assert.equal(isCheckoutPagePath('/build/12/domain'), true);
  assert.equal(isCheckoutPagePath('/domain/parent'), true);
  assert.equal(isCheckoutPagePath('/build/12'), false);
  assert.equal(isCheckoutPagePath('/build/12/3'), false);
  const app = readFileSync(new URL('../src/containers/App/index.tsx', import.meta.url), 'utf8');
  assert.match(app, /const suppressHeader =\s+isCheckoutPagePath\(location\.pathname\) \|\|/);
  const route = readFileSync(new URL('../src/containers/Build/DomainCheckoutRoute.tsx', import.meta.url), 'utf8');
  assert.match(route, /key=\{`\$\{id\}:\$\{userId \|\| 0\}:\$\{intentKey\(search\)\}`\}/);
});
