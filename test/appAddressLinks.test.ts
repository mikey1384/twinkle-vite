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
  // the order step starts from ?domainOrder alone (no app/address needed)
  assert.match(page, /if \(startedRef\.current \|\| !userId \|\| returnOrderId <= 0\) return;/);
  assert.ok(page.indexOf('returnOrderId <= 0') < page.indexOf('navigate(appPath, { replace: true });\n      return;'));
  // a failed load is an error with Try again, never "hosting off"
  assert.doesNotMatch(page, /loadAppAddress\(\{ buildId \}\)\.catch\(\(\) => \(\{ enabled: false \}\)\)/);
  assert.match(page, /setLoadFailed\(true\)/);
});

test('a save that finishes after the owner moved on doesn’t open the old app’s checkout', () => {
  const chip = readFileSync(new URL('../src/components/Build/AppAddress/index.tsx', import.meta.url), 'utf8');
  assert.match(chip, /await onSaveChanges\(\)[\s\S]{0,140}if \(!stillHere\(\)\) return;[\s\S]{0,200}navigate\(domainCheckoutPath\(buildId\)\)/);
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
