import assert from 'node:assert/strict';
import test from 'node:test';
import { getCommentPreviewPlainText } from '../src/containers/Home/Stories/FeedCard/helpers/commentPreviewText';

test('comment previews preserve literal punctuation instead of joining words', () => {
  assert.equal(
    getCommentPreviewPlainText('3~5 pm right?'),
    '3~5 pm right?'
  );
  assert.equal(
    getCommentPreviewPlainText(
      '3 ~ 5 pm right? x > y, 2 * 3, snake_case, C# and `unfinished'
    ),
    '3 ~ 5 pm right? x > y, 2 * 3, snake_case, C# and `unfinished'
  );
});

test('comment previews remove only Markdown syntax that the renderer recognizes', () => {
  assert.equal(
    getCommentPreviewPlainText(
      '# Heading\n\n* first **bold** item\n* second ~old~ item with [Twinkle](https://www.twin-kle.com) and `code`'
    ),
    'Heading first bold item second old item with Twinkle and code'
  );
});

test('comment previews omit Markdown media while retaining surrounding text', () => {
  assert.equal(
    getCommentPreviewPlainText(
      'before ![photo](https://example.com/photo.png) after'
    ),
    'before after'
  );
});

test('comment previews strip Twinkle presentation markers without losing text', () => {
  assert.equal(
    getCommentPreviewPlainText(
      'b|blue|b, h[large]h, __underlined__, and a_b'
    ),
    'blue, large, underlined, and a_b'
  );
});

test('AI comment previews retain math operators and follow AI block Markdown', () => {
  assert.equal(
    getCommentPreviewPlainText('> Solve $x * y$ between 3 ~ 5', {
      isAIMessage: true
    }),
    'Solve x * y between 3 ~ 5'
  );
});

test('table cells remain separated in compact comment previews', () => {
  assert.equal(
    getCommentPreviewPlainText('| Name | Age |\n| --- | --- |\n| Mina | 12 |'),
    'Name Age Mina 12'
  );
});
