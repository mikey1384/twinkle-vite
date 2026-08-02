import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const indexHtml = readFileSync(
  new URL('../index.html', import.meta.url),
  'utf8'
);
const analyticsScriptMatch = indexHtml.match(
  /<!-- Google tag \(gtag\.js\) -->\s*<script>([\s\S]*?)<\/script>/
);

assert.ok(analyticsScriptMatch, 'analytics bootstrap script is present');
const analyticsScript = analyticsScriptMatch[1];

function runAnalyticsBootstrap({
  cachedUserId = 0,
  embedded = false,
  hostname = 'www.twin-kle.com',
  parentOrigin = 'https://www.twin-kle.com',
  pathname = '/',
  search = ''
}: {
  cachedUserId?: number;
  embedded?: boolean;
  hostname?: string;
  parentOrigin?: string;
  pathname?: string;
  search?: string;
} = {}) {
  const appendedScripts: Array<Record<string, unknown>> = [];
  const dataLayer: unknown[] = [];
  const windowObject: Record<string, any> = {
    dataLayer,
    localStorage: {
      getItem(key: string) {
        return key === 'userId' && cachedUserId ? String(cachedUserId) : null;
      }
    },
    location: {
      hostname,
      origin: `https://${hostname}`,
      pathname,
      search
    }
  };
  windowObject.self = windowObject;
  windowObject.top = embedded ? {} : windowObject;
  windowObject.parent = embedded
    ? { location: { origin: parentOrigin } }
    : windowObject;

  vm.runInNewContext(analyticsScript, {
    URLSearchParams,
    dataLayer,
    document: {
      createElement() {
        return {};
      },
      head: {
        appendChild(script: Record<string, unknown>) {
          appendedScripts.push(script);
        }
      }
    },
    window: windowObject
  });

  return {
    analyticsEnabled: windowObject.twinkleAnalyticsEnabled,
    analyticsIdentityReady: windowObject.twinkleAnalyticsIdentityReady,
    appendedScripts,
    dataLayer,
    configureAnalytics: windowObject.twinkleConfigureAnalytics
  };
}

test('loads GA only on Twinkle public production websites', () => {
  const production = runAnalyticsBootstrap();
  const productionAlias = runAnalyticsBootstrap({
    hostname: 'www.twinkle.network'
  });
  const lumineProductionAlias = runAnalyticsBootstrap({
    hostname: 'www.lumine.network'
  });
  const preview = runAnalyticsBootstrap({
    hostname: 'twinkle-git-fix.vercel.app'
  });
  const capture = runAnalyticsBootstrap({ pathname: '/app-capture/884' });

  assert.equal(production.analyticsEnabled, true);
  assert.equal(production.analyticsIdentityReady, true);
  assert.equal(production.appendedScripts.length, 1);
  assert.equal(production.dataLayer.length, 2);
  assert.equal(productionAlias.analyticsEnabled, true);
  assert.equal(productionAlias.appendedScripts.length, 1);
  assert.equal(lumineProductionAlias.analyticsEnabled, true);
  assert.equal(lumineProductionAlias.appendedScripts.length, 1);
  assert.equal(preview.analyticsEnabled, false);
  assert.equal(preview.appendedScripts.length, 0);
  assert.equal(capture.analyticsEnabled, false);
  assert.equal(capture.appendedScripts.length, 0);
});

test('delays GA configuration until a cached user identity is resolved', () => {
  const pendingIdentity = runAnalyticsBootstrap({ cachedUserId: 42 });

  assert.equal(pendingIdentity.analyticsEnabled, true);
  assert.equal(pendingIdentity.analyticsIdentityReady, false);
  assert.equal(pendingIdentity.dataLayer.length, 1);

  pendingIdentity.configureAnalytics();
  pendingIdentity.configureAnalytics();

  assert.equal(pendingIdentity.dataLayer.length, 2);
});

test('the Twinkle parent owns analytics for its embedded app frame', () => {
  const twinkleEmbed = runAnalyticsBootstrap({
    embedded: true,
    pathname: '/app/884',
    search: '?embedded=1'
  });
  const directVisit = runAnalyticsBootstrap({
    pathname: '/app/884',
    search: '?embedded=1'
  });
  const externalEmbed = runAnalyticsBootstrap({
    embedded: true,
    parentOrigin: 'https://example.com',
    pathname: '/app/884',
    search: '?embedded=1'
  });

  assert.equal(twinkleEmbed.analyticsEnabled, false);
  assert.equal(twinkleEmbed.appendedScripts.length, 0);
  assert.equal(directVisit.analyticsEnabled, true);
  assert.equal(externalEmbed.analyticsEnabled, true);
});
