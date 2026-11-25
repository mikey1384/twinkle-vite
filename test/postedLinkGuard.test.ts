import assert from 'node:assert/strict';
import test from 'node:test';

import { createLinkBlocklistClient, LINK_BLOCKLIST_FRESH_MS } from '../src/helpers/linkBlocklistClient';
import {
  createPostedLinkGuard,
  findOutsideLink,
  linkPreviewHidden,
  markCheckedOutsideLink,
  POSTED_LINK_COUNT_CAP
} from '../src/helpers/postedLinkGuard';

// Twinkle's blocked-site list on posted links: the page's one click guard
// (helpers/postedLinkGuard.ts) with the app sheet's list rules.
const PAGE = 'https://www.twin-kle.com/comments/12';

function anchor(attrs: Record<string, string>, extra: Record<string, any> = {}) {
  return {
    tagName: 'A',
    baseURI: PAGE,
    getAttribute: (name: string) => (name in attrs ? attrs[name] : null),
    hasAttribute: (name: string) => name in attrs,
    parentNode: null,
    ...extra
  };
}

function click(target: any, extra: Record<string, any> = {}) {
  const event = {
    type: 'click',
    button: 0,
    target,
    prevented: false,
    stopped: false,
    preventDefault() {
      event.prevented = true;
    },
    stopPropagation() {
      event.stopped = true;
    },
    ...extra
  };
  return event;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function setup({
  hosts = ['blocked.com'],
  status,
  delayMs = 0,
  waitMs = 200
}: { hosts?: string[]; status?: number; delayMs?: number; waitMs?: number } = {}) {
  let clock = 1_000_000;
  const config = { hosts, status, delayMs, loads: 0 };
  const blocklist = createLinkBlocklistClient({
    now: () => clock,
    fetchList: () => {
      config.loads += 1;
      return new Promise((resolve, reject) =>
        setTimeout(
          () =>
            config.status !== undefined
              ? reject(Object.assign(new Error('list'), { status: config.status }))
              : resolve({ hosts: config.hosts }),
          config.delayMs
        )
      );
    }
  });
  const opened: Array<{ href: string; newTab: boolean }> = [];
  const notices: Array<{ kind: string; url: string }> = [];
  const guard = createPostedLinkGuard({
    blocklist,
    openUrl: (href, newTab) => opened.push({ href, newTab }),
    pageUrl: () => PAGE,
    waitMs
  });
  guard.onNotice((notice) => notices.push(notice));
  return {
    blocklist,
    guard,
    opened,
    notices,
    config,
    advance: (ms: number) => {
      clock += ms;
    }
  };
}

test('only outside http(s) links are guarded', () => {
  const outside = findOutsideLink(click(anchor({ href: 'https://Example.com/a' })), PAGE);
  assert.equal(outside?.url.hostname, 'example.com');
  assert.equal(outside?.newTab, false);
  // a click on text inside the link finds the link
  const inner = { tagName: 'SPAN', parentNode: anchor({ href: 'https://example.com', target: '_blank' }) };
  assert.equal(findOutsideLink(click(inner), PAGE)?.newTab, true);
  for (const attrs of [
    { href: '/subjects/3' },
    { href: 'https://www.twin-kle.com/users/zero' },
    { href: 'mailto:a@b.com' },
    { href: 'javascript:alert(1)' },
    { href: 'https://example.com/file.pdf', download: '' }
  ]) {
    assert.equal(findOutsideLink(click(anchor(attrs)), PAGE), null, JSON.stringify(attrs));
  }
  assert.equal(findOutsideLink(click(anchor({ href: 'https://example.com' }, { isContentEditable: true })), PAGE), null);
  assert.equal(findOutsideLink(click(anchor({ href: 'https://example.com' }), { button: 2 }), PAGE), null);
  assert.equal(findOutsideLink(click(anchor({ href: 'https://example.com' }), { defaultPrevented: true }), PAGE), null);
  // SVG links, middle clicks and modifier clicks
  const svg = { ...anchor({ 'xlink:href': 'https://example.com' }), tagName: 'a' };
  assert.equal(findOutsideLink(click(svg), PAGE)?.url.hostname, 'example.com');
  assert.equal(findOutsideLink(click(anchor({ href: 'https://example.com' }), { type: 'auxclick', button: 1 }), PAGE)?.newTab, true);
  assert.equal(findOutsideLink(click(anchor({ href: 'https://example.com' }), { metaKey: true }), PAGE)?.newTab, true);
  // the page's own checked links pass
  const checked = anchor({ href: 'https://blocked.com' });
  markCheckedOutsideLink(checked);
  assert.equal(findOutsideLink(click(checked), PAGE), null);
});

test('with a fresh list, a blocked link is stopped inside the tap and an allowed one is left alone', async () => {
  const { blocklist, guard, opened, notices } = setup();
  blocklist.preload();
  await sleep(5);
  const blocked = click(anchor({ href: 'https://www.blocked.com/x', target: '_blank' }));
  assert.equal(guard.handleClick(blocked), true);
  assert.equal(blocked.prevented, true);
  assert.equal(blocked.stopped, true);
  assert.deepEqual(notices, [{ kind: 'blocked', url: 'https://www.blocked.com/x' }]);
  // a_b.blocked.com is a legal host and still blocked; notblocked.com is not
  assert.equal(guard.handleClick(click(anchor({ href: 'https://a_b.blocked.com/' }))), true);
  const allowed = click(anchor({ href: 'https://notblocked.com/' }));
  assert.equal(guard.handleClick(allowed), false);
  assert.equal(allowed.prevented, false);
  assert.deepEqual(opened, []);
  assert.deepEqual(guard.takeCounts(), { blocked: 2 });
  assert.deepEqual(guard.takeCounts(), {});
});

test('without a fresh list the tap waits briefly for it, then decides', async () => {
  const slow = setup({ delayMs: 50, waitMs: 500 });
  const tap = click(anchor({ href: 'https://blocked.com/', target: '_blank' }));
  assert.equal(slow.guard.handleClick(tap), true);
  assert.equal(tap.prevented, true);
  // a second tap while held is taken but opens nothing extra
  slow.guard.handleClick(click(anchor({ href: 'https://ok.com/' })));
  await sleep(80);
  assert.deepEqual(slow.notices.map((n) => n.kind), ['blocked']);
  assert.deepEqual(slow.opened, []);
  slow.guard.handleClick(click(anchor({ href: 'https://ok.com/', target: '_blank' })));
  assert.deepEqual(slow.opened, [], 'fresh and allowed: the browser opens it');

  const allowed = setup({ delayMs: 30, waitMs: 500 });
  allowed.guard.handleClick(click(anchor({ href: 'https://ok.com/a' }), { ctrlKey: true }));
  await sleep(60);
  assert.deepEqual(allowed.opened, [{ href: 'https://ok.com/a', newTab: true }]);
  assert.equal(allowed.config.loads, 1);

  // a list slower than the wait: the link opens unchecked
  const late = setup({ delayMs: 300, waitMs: 40 });
  late.guard.handleClick(click(anchor({ href: 'https://blocked.com/' })));
  await sleep(70);
  assert.deepEqual(late.opened, [{ href: 'https://blocked.com/', newTab: false }]);
  await sleep(300);
});

test('a 4xx never opens the link; a network error or 5xx opens it only with no list, else the older list decides', async () => {
  for (const status of [400, 404, 429]) {
    const refused = setup({ status });
    refused.guard.handleClick(click(anchor({ href: 'https://ok.com/' })));
    await sleep(10);
    assert.deepEqual(refused.opened, [], `status ${status}`);
    assert.deepEqual(refused.notices.map((n) => n.kind), ['unchecked']);
    assert.deepEqual(refused.guard.takeCounts(), { unchecked: 1 });
    assert.equal(linkPreviewHidden('https://ok.com', refused.blocklist), 'unchecked');
  }
  for (const status of [0, 503]) {
    const down = setup({ status });
    down.guard.handleClick(click(anchor({ href: 'https://blocked.com/' })));
    await sleep(10);
    assert.deepEqual(down.opened, [{ href: 'https://blocked.com/', newTab: false }], `status ${status}`);
  }
  // an older list is used when the refresh fails
  const older = setup();
  older.blocklist.preload();
  await sleep(5);
  older.advance(LINK_BLOCKLIST_FRESH_MS + 1);
  older.config.status = 503;
  older.guard.handleClick(click(anchor({ href: 'https://blocked.com/' })));
  await sleep(10);
  assert.deepEqual(older.notices.map((n) => n.kind), ['blocked']);
  assert.deepEqual(older.opened, []);
});

test('links opened from script are checked the same way', async () => {
  const { blocklist, guard, opened, notices } = setup();
  blocklist.preload();
  await sleep(5);
  guard.open('http://blocked.com/channel');
  guard.open('javascript:alert(1)');
  guard.open('https://youtube.com/@me');
  assert.deepEqual(notices.map((n) => n.kind), ['blocked']);
  assert.deepEqual(opened, [{ href: 'https://youtube.com/@me', newTab: true }]);
});

test('counts are capped per kind', async () => {
  const { blocklist, guard } = setup();
  blocklist.preload();
  await sleep(5);
  for (let i = 0; i < 200; i += 1) guard.handleClick(click(anchor({ href: 'https://blocked.com/' })));
  assert.deepEqual(guard.takeCounts(), { blocked: POSTED_LINK_COUNT_CAP });
});

test('link previews hide for blocked sites, bare hosts included', async () => {
  const { blocklist } = setup();
  assert.equal(linkPreviewHidden('https://blocked.com/a', blocklist), false, 'before the list loads');
  blocklist.preload();
  await sleep(5);
  assert.equal(linkPreviewHidden('https://blocked.com/a', blocklist), 'blocked');
  assert.equal(linkPreviewHidden('www.blocked.com/a', blocklist), 'blocked');
  assert.equal(linkPreviewHidden('https://ok.com', blocklist), false);
  assert.equal(linkPreviewHidden('', blocklist), false);
});
