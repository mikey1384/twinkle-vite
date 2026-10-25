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
  search = '',
  referrer = '',
  navigatorObject = { webdriver: false, userAgent: 'Mozilla/5.0 Chrome/140' },
  optedOut = false
}: {
  cachedUserId?: number;
  embedded?: boolean;
  hostname?: string;
  parentOrigin?: string;
  pathname?: string;
  search?: string;
  referrer?: string;
  navigatorObject?: { webdriver?: boolean; userAgent?: string };
  optedOut?: boolean;
} = {}) {
  const appendedScripts: Array<Record<string, unknown>> = [];
  const dataLayer: unknown[] = [];
  const listeners = new Map<string, Set<(event: unknown) => void>>();
  const intervals: Array<{ run: () => void; cleared: boolean }> = [];
  const documentObject: Record<string, any> = {
    referrer,
    visibilityState: 'visible',
    createElement() {
      return {};
    },
    head: {
      appendChild(script: Record<string, unknown>) {
        appendedScripts.push(script);
      }
    }
  };
  const windowObject: Record<string, any> = {
    dataLayer,
    addEventListener(type: string, listener: (event: unknown) => void) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(listener);
    },
    removeEventListener(type: string, listener: (event: unknown) => void) {
      listeners.get(type)?.delete(listener);
    },
    localStorage: {
      getItem(key: string) {
        if (key === 'twinkle-analytics-opt-out') return optedOut ? '1' : null;
        return key === 'userId' && cachedUserId ? String(cachedUserId) : null;
      }
    },
    location: {
      hostname,
      href: `https://${hostname}${pathname}${search}`,
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
    URL,
    URLSearchParams,
    dataLayer,
    navigator: navigatorObject,
    document: documentObject,
    window: windowObject,
    setInterval(run: () => void) {
      const interval = { run, cleared: false };
      intervals.push(interval);
      return interval;
    },
    clearInterval(interval: { cleared: boolean }) {
      if (interval) interval.cleared = true;
    }
  });

  function dispatch(type: string, isTrusted = true) {
    for (const listener of [...(listeners.get(type) || [])]) {
      listener({ type, isTrusted });
    }
  }
  function passSeconds(seconds: number) {
    for (let i = 0; i < seconds; i++) {
      for (const interval of intervals) if (!interval.cleared) interval.run();
    }
  }

  return {
    analyticsEnabled: windowObject.twinkleAnalyticsEnabled,
    analyticsIdentityReady: windowObject.twinkleAnalyticsIdentityReady,
    appendedScripts,
    dataLayer,
    configureAnalytics: windowObject.twinkleConfigureAnalytics,
    windowObject,
    documentObject,
    dispatch,
    passSeconds,
    configCount: () =>
      dataLayer.filter((entry: any) => entry && entry[0] === 'config').length,
    actLikePerson: () => dispatch('pointerdown'),
    analyticsUrl: windowObject.twinkleAnalyticsUrl as (input: string) => string
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
  assert.equal(production.dataLayer.length, 1);
  production.actLikePerson();
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

  pendingIdentity.actLikePerson();
  assert.equal(pendingIdentity.configCount(), 0);

  pendingIdentity.windowObject.twinkleAnalyticsIdentityReady = true;
  pendingIdentity.configureAnalytics();
  pendingIdentity.configureAnalytics();

  assert.equal(pendingIdentity.dataLayer.length, 2);
});

test('nothing reaches GA until the visitor acts like a person', () => {
  // A bot that loads the page and leaves within seconds sends nothing.
  const bot = runAnalyticsBootstrap();
  bot.passSeconds(9);
  bot.configureAnalytics();
  assert.equal(bot.configCount(), 0);

  for (const type of ['pointerdown', 'touchstart', 'keydown', 'wheel']) {
    const person = runAnalyticsBootstrap();
    person.dispatch(type);
    assert.equal(person.configCount(), 1, type);
    person.dispatch(type);
    person.passSeconds(20);
    assert.equal(person.configCount(), 1, `${type} configures once`);
  }

  // Scrolling by itself (the app scrolls chat) and script-made events are
  // not a person.
  const scripted = runAnalyticsBootstrap();
  scripted.dispatch('scroll');
  scripted.dispatch('pointerdown', false);
  assert.equal(scripted.configCount(), 0);

  // A reader who never touches anything counts after 10 seconds in view.
  const reader = runAnalyticsBootstrap();
  reader.passSeconds(10);
  assert.equal(reader.configCount(), 1);

  // Time in a background tab does not count.
  const background = runAnalyticsBootstrap();
  background.documentObject.visibilityState = 'hidden';
  background.passSeconds(30);
  assert.equal(background.configCount(), 0);
  background.documentObject.visibilityState = 'visible';
  background.passSeconds(10);
  assert.equal(background.configCount(), 1);
});

test('the app sends its waiting commands once GA is configured', () => {
  const run = runAnalyticsBootstrap();
  let flushed = 0;
  run.windowObject.twinkleOnAnalyticsConfigured = () => flushed++;
  assert.equal(run.windowObject.twinkleAnalyticsConfigured, false);
  run.actLikePerson();
  assert.equal(run.windowObject.twinkleAnalyticsConfigured, true);
  assert.equal(flushed, 1);
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

test('automated browsers and opted-out devices never load GA', () => {
  const webdriver = runAnalyticsBootstrap({
    navigatorObject: { webdriver: true, userAgent: 'Mozilla/5.0 Chrome/140' }
  });
  const oldHeadless = runAnalyticsBootstrap({
    navigatorObject: { userAgent: 'Mozilla/5.0 HeadlessChrome/120' }
  });
  const optedOut = runAnalyticsBootstrap({ optedOut: true });

  for (const run of [webdriver, oldHeadless, optedOut]) {
    assert.equal(run.analyticsEnabled, false);
    assert.equal(run.appendedScripts.length, 0);
  }
});

test('URLs sent to GA never carry secrets from links', () => {
  const { analyticsUrl } = runAnalyticsBootstrap();
  const origin = 'https://www.twin-kle.com';

  assert.equal(
    analyticsUrl('/reset/password/eyJhbGciOiJIUzI1NiJ9+eyJpZCI6NX0+sig'),
    `${origin}/reset/password/:token`
  );
  assert.equal(
    analyticsUrl('/verify/email/abc.def.ghi'),
    `${origin}/verify/email/:token`
  );
  assert.equal(
    analyticsUrl('/signup/guardian?token=secret123&choice=decline&lang=ko'),
    `${origin}/signup/guardian?choice=decline&lang=ko`
  );
  assert.equal(analyticsUrl('/cli?code=ABCD-1234'), `${origin}/cli`);
  assert.equal(
    analyticsUrl('/?mcpass=Zx81kQwertyuiopasdfghjkl'),
    `${origin}/`
  );
  assert.equal(
    analyticsUrl('/management/payment?stripeCheckoutSessionId=cs_live_1&session_id=cs_2'),
    `${origin}/management/payment`
  );
  // A future secret parameter is dropped by default (allowlist).
  assert.equal(analyticsUrl('/subjects/37021?invite=xyz'), `${origin}/subjects/37021`);
  // Safe parameters, campaign tags and ordinary slugs survive; the hash goes.
  assert.equal(
    analyticsUrl(`${origin}/ai-cards?cardId=78491&sort=new&utm_source=kakao#top`),
    `${origin}/ai-cards?cardId=78491&sort=new&utm_source=kakao`
  );
  assert.equal(
    analyticsUrl('/app/2206/song-144619-full-circle'),
    `${origin}/app/2206/song-144619-full-circle`
  );
  // A long dotted token anywhere in the path is masked.
  assert.equal(
    analyticsUrl('/app/2610/join/aaaaaaaaaaaaaaaa.bbbbbbbbbbbbbbbb'),
    `${origin}/app/2610/join/:token`
  );
  // Outside referrers keep only their origin.
  assert.equal(
    analyticsUrl('https://mail.example.com/inbox/123?msg=reset-link'),
    'https://mail.example.com/'
  );
});

test('the first gtag config already uses the cleaned address and referrer', () => {
  const run = runAnalyticsBootstrap({
    pathname: '/verify/email/abc.def.ghi',
    referrer: 'https://mail.example.com/inbox/123'
  });
  run.actLikePerson();
  const config = run.dataLayer.find(
    (entry: any) => entry && entry[0] === 'config'
  ) as any;
  assert.ok(config, 'config was sent');
  assert.equal(config[2].page_location, 'https://www.twin-kle.com/verify/email/:token');
  assert.equal(config[2].page_referrer, 'https://mail.example.com/');
});
