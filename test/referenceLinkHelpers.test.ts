import assert from 'node:assert/strict';
import test from 'node:test';
import { getInternalEmbedPreviewInfo } from '../src/helpers/aiCardEmbedHelpers';
import {
  getExternalLinkUrl,
  getInternalPath
} from '../src/helpers/referenceLinkHelpers';

function internalPathFor(src: string) {
  return getInternalPath(src, getInternalEmbedPreviewInfo(src)?.normalizedSrc);
}

test('an internal reference never links off-site through extra slashes', () => {
  for (const src of [
    'https://www.twin-kle.com//example.org/phish',
    'https://www.twin-kle.com///example.org/phish',
    '//example.org/phish'
  ]) {
    const path = internalPathFor(src);
    assert.ok(!path.startsWith('//'), `${src} -> ${path}`);
    if (path) {
      const url = new URL(path, 'https://www.twin-kle.com');
      assert.equal(url.host, 'www.twin-kle.com', `${src} -> ${path}`);
    }
  }
  assert.equal(getInternalPath('', '//example.org/x'), '/example.org/x');
  assert.equal(getInternalPath('', '/\\example.org/x'), '');
});

test('script and data sources are never links', () => {
  for (const src of [
    'javascript:alert(1)',
    ' JavaScript:alert(1)',
    'data:text/html,hi'
  ]) {
    assert.equal(internalPathFor(src), '', src);
    assert.equal(getExternalLinkUrl(src), null, src);
  }
});

test('ordinary internal paths keep exactly one leading slash', () => {
  assert.equal(getInternalPath('', '/users/mikey'), '/users/mikey');
  assert.equal(
    getInternalPath('', '/comments/335037?x=1'),
    '/comments/335037?x=1'
  );
  assert.equal(getInternalPath('', 'users/mikey'), '');
});

test('external links: www. reads as https, only http(s) gets a URL', () => {
  assert.equal(
    getExternalLinkUrl('www.example.com/page')?.href,
    'https://www.example.com/page'
  );
  assert.equal(getExternalLinkUrl('ftp://example.com'), null);
  assert.equal(getExternalLinkUrl('/relative'), null);
});
