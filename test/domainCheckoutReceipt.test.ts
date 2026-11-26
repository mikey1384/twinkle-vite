import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (file: string) => readFileSync(new URL(file, import.meta.url), 'utf8');

test('after Stripe, the going-live and live screens carry the order’s own price', () => {
  const steps = read('../src/components/Build/AppAddress/checkout/steps.tsx');
  // payment confirming, setting up and live all pass the server-recorded price
  assert.match(steps, /title=\{t\.paymentCheckingTitle\}[\s\S]{0,120}priceCents=\{order\.priceCents\}/);
  assert.match(steps, /domain=\{order\.domain\}\s+priceCents=\{order\.priceCents\}\s+reached=/);
  assert.match(steps, /<LiveView t=\{t\} assistant=\{assistant\} domain=\{order\.domain\} priceCents=\{order\.priceCents\}/);
  // and the receipt is the summary beside them
  assert.match(steps, /aside=\{priceCents \? <ReceiptSummary/);
});

test('the parent request is sent with the price the child saw', () => {
  const flow = read('../src/components/Build/AppAddress/index.tsx');
  assert.match(flow, /startDomainOrder\(\{[\s\S]{0,600}priceCents: idea\.priceCents/);
  const helpers = read('../src/contexts/requestHelpers/build.ts');
  assert.match(helpers, /domain-orders`, \{ domain, parentEmail, lang, priceCents \}/);
});
