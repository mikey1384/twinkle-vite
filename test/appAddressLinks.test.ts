import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { appAddressIntentPath } from '../src/helpers/appAddressLinks';

test('Stripe returns and wand links on /app/<id> go to the Build page checkout with their query', () => {
  // Stripe success and cancel (twinkle-api domainOrders.ts successUrl / cancelUrl)
  assert.equal(appAddressIntentPath('/app/42', '?domainOrder=17'), '/build/42?domainOrder=17');
  assert.equal(appAddressIntentPath('/app/42', '?domainOrder=17&cancelled=1'), '/build/42?domainOrder=17&cancelled=1');
  // the wand's four screens (twinkle-api sponsoredHelp appAddressPath)
  for (const screen of ['find', 'buy', 'connect', 'status']) {
    assert.equal(
      appAddressIntentPath('/app/42', `?appAddress=${screen}&domain=redsquaregame.com`),
      `/build/42?appAddress=${screen}&domain=redsquaregame.com`
    );
  }
  assert.equal(appAddressIntentPath('/app/42/', '?appAddress=find'), '/build/42?appAddress=find');
});

test('Other app links stay on the runtime', () => {
  assert.equal(appAddressIntentPath('/app/42', ''), null);
  assert.equal(appAddressIntentPath('/app/42', '?from=home'), null);
  assert.equal(appAddressIntentPath('/app/42/432-some-book', '?domainOrder=1'), null);
  assert.equal(appAddressIntentPath('/build/42', '?domainOrder=1'), null);
});

test('the app router sends those links to the Build page and keeps the runtime host away', () => {
  const app = readFileSync(new URL('../src/containers/App/index.tsx', import.meta.url), 'utf8');
  assert.match(app, /if \(appAddressIntent\) return <Navigate to=\{appAddressIntent\} replace \/>;/);
  assert.match(app, /!appAddressIntentPath\(location\.pathname, location\.search\)/);
});
