import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  appendOpenWandEmbed,
  openWandEmbedMarkdown,
  openWandIdsInText,
  openWandSlotsLine,
  removeOpenWandEmbed
} from '../src/helpers/sponsoredHelp';

// Open wand cards in rich text: the embed line the composers insert, how
// the draft preview finds it, and Remove.

test('the embed is an internal link the rich-text embed maps to /wand/<id>', () => {
  const markdown = openWandEmbedMarkdown(12);
  assert.equal(markdown, '![Wand card](https://www.twin-kle.com/wand/12)');
  const url = markdown.slice(markdown.indexOf('(') + 1, -1);
  // the same host rule as stringHelpers processInternalLink
  const internal = /^(https?:\/\/(?:www\.)?|www\.)(twin-kle\.com|twinkle\.network|localhost:3000)/;
  assert.ok(internal.test(url));
  assert.equal(url.replace(internal, ''), '/wand/12');
});

test('insert goes on its own line at the end; the preview finds each card once', () => {
  const once = appendOpenWandEmbed('I bought redsquare.com! You can too:', 12);
  assert.equal(once, 'I bought redsquare.com! You can too:\n\n![Wand card](https://www.twin-kle.com/wand/12)');
  assert.equal(appendOpenWandEmbed('', 3), '![Wand card](https://www.twin-kle.com/wand/3)');
  const twice = appendOpenWandEmbed(appendOpenWandEmbed(once, 7), 12);
  assert.deepEqual(openWandIdsInText(twice), [12, 7]);
  // a plain link or another embed is not a wand card
  assert.deepEqual(openWandIdsInText('see https://www.twin-kle.com/wand/5 and ![](https://www.twin-kle.com/subjects/5)'), []);
});

test('Remove takes out only that card and leaves the rest of the text', () => {
  const text = appendOpenWandEmbed(appendOpenWandEmbed('Hello', 12), 7);
  assert.equal(removeOpenWandEmbed(text, 12), 'Hello\n\n![Wand card](https://www.twin-kle.com/wand/7)');
  assert.equal(removeOpenWandEmbed(removeOpenWandEmbed(text, 12), 7), 'Hello');
});

test('slots read plainly', () => {
  assert.equal(openWandSlotsLine({ left: 18, cap: 20 }), '18 of 20 left');
  assert.equal(openWandSlotsLine({ left: 0, cap: 20 }), 'All 20 used');
});
