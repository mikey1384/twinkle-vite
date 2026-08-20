import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import ExploreReducer from '../src/contexts/Explore/reducer';
import {
  LINK_PREVIEW_FALLBACK_IMAGE,
  resolveLinkPreviewImageSrc
} from '../src/helpers/linkPreviewImage';

function buildState() {
  const existing = {
    id: 7,
    title: 'Existing',
    content: 'https://existing.example'
  };
  return {
    links: {
      byUserLinks: [existing],
      recommendeds: [existing],
      links: [existing]
    }
  };
}

test('new links enter Explore from the complete canonical server response', () => {
  const canonicalResponse = {
    contentId: 42,
    contentType: 'url',
    content: 'https://example.com/story',
    title: 'User title',
    description: 'User description',
    actualTitle: 'Canonical page title',
    actualDescription: 'Canonical page description',
    siteUrl: 'Example',
    thumbUrl: '/thumbs/42/key',
    likes: [],
    numComments: 0,
    lastInteraction: 123,
    uploader: { id: 42, username: 'tester' }
  };

  const nextState = ExploreReducer(buildState(), {
    type: 'UPLOAD_LINK',
    linkItem: canonicalResponse
  });

  assert.deepEqual(nextState.links.links[0], {
    contentType: 'url',
    content: 'https://example.com/story',
    title: 'User title',
    description: 'User description',
    actualTitle: 'Canonical page title',
    actualDescription: 'Canonical page description',
    siteUrl: 'Example',
    thumbUrl: '/thumbs/42/key',
    likes: [],
    numComments: 0,
    uploader: { id: 42, username: 'tester' },
    id: 42,
    timeStamp: 123
  });
});

test('edited link lists merge the canonical URL and refreshed preview fields', () => {
  const canonicalEdit = {
    title: 'Edited title',
    content: 'https://example.com/edited',
    actualTitle: 'Edited page title',
    actualDescription: 'Edited page description',
    siteUrl: 'Example Edited',
    thumbUrl: ''
  };
  const state = buildState();
  state.links.byUserLinks[0].id = 7;
  state.links.recommendeds[0].id = 7;
  state.links.links[0].id = 7;

  const nextState = ExploreReducer(state, {
    type: 'EDIT_LINK_PAGE',
    id: 7,
    data: canonicalEdit
  });

  for (const collection of [
    nextState.links.byUserLinks,
    nextState.links.recommendeds,
    nextState.links.links
  ]) {
    assert.equal(collection[0].title, canonicalEdit.title);
    assert.equal(collection[0].content, canonicalEdit.content);
    assert.equal(collection[0].actualTitle, canonicalEdit.actualTitle);
    assert.equal(collection[0].siteUrl, canonicalEdit.siteUrl);
    assert.equal(collection[0].thumbUrl, '');
  }
});

test('missing and managed thumbnails resolve to stable display sources', () => {
  const resolve = (src: unknown) =>
    resolveLinkPreviewImageSrc({
      src,
      cloudFrontUrl: 'https://cdn.example'
    });
  assert.equal(resolve(null), LINK_PREVIEW_FALLBACK_IMAGE);
  assert.equal(
    resolve('https://images.example/cover.jpg'),
    'https://images.example/cover.jpg'
  );
  assert.equal(resolve('/thumbs/42/key'), 'https://cdn.example/thumbs/42/key');
});

test('Embedly treats loaded URL metadata as server-owned and image errors as local fallback only', () => {
  const embedlySource = readFileSync(
    fileURLToPath(
      new URL('../src/components/Embedly/index.tsx', import.meta.url)
    ),
    'utf8'
  );
  const linkPageSource = readFileSync(
    fileURLToPath(
      new URL('../src/containers/LinkPage/index.tsx', import.meta.url)
    ),
    'utf8'
  );
  const addLinkSource = readFileSync(
    fileURLToPath(
      new URL(
        '../src/containers/Explore/Links/AddLinkModal.tsx',
        import.meta.url
      )
    ),
    'utf8'
  );
  const linkItemSource = readFileSync(
    fileURLToPath(
      new URL(
        '../src/containers/Explore/Links/LinkItem.tsx',
        import.meta.url
      )
    ),
    'utf8'
  );
  const imageSource = readFileSync(
    fileURLToPath(
      new URL('../src/components/LinkPreviewImage.tsx', import.meta.url)
    ),
    'utf8'
  );

  assert.match(embedlySource, /contentType === 'url'[\s\S]*?Boolean\(loaded\)/);
  assert.match(
    embedlySource,
    /contentType !== 'url' &&[\s\S]*?userCanEditThis/
  );
  const imageErrorHandler = embedlySource.slice(
    embedlySource.indexOf('function handleImageLoadError'),
    embedlySource.indexOf(
      '// eslint-disable-next-line',
      embedlySource.indexOf('function handleImageLoadError')
    )
  );
  assert.match(imageErrorHandler, /setImageUrl\(fallbackSrc\)/);
  assert.doesNotMatch(imageErrorHandler, /onSetThumbUrl/);
  assert.doesNotMatch(
    embedlySource,
    /setImageUrl\(fallbackImage\);\s*onHideAttachment\(\)/
  );
  assert.match(
    imageSource,
    /imageSrc === appliedFallbackSrc \? \{ objectFit: 'contain' \}/
  );
  assert.match(linkPageSource, /onEditContent\(\{\s*data,/);
  assert.match(linkPageSource, /onEditLinkPage\(\{\s*id: linkId,\s*data/);
  assert.match(addLinkSource, /submittingRef\.current/);
  assert.match(addLinkSource, /loading=\{submitting\}/);
  assert.match(addLinkSource, /setForm\(\(currentForm\) =>/);
  assert.match(linkItemSource, /onEditContent\(\{ data,/);
  assert.match(linkItemSource, /onEditLinkPage\(\{ id, data \}\)/);
});
