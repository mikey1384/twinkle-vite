import assert from 'node:assert/strict';
import test from 'node:test';
import { getMarkdownPreviewPlainText } from '../src/helpers/markdownPreviewText';

test('featured-subject previews drop embed markup and keep the prose', () => {
  assert.equal(
    getMarkdownPreviewPlainText(
      '![](https://www.twin-kle.com/subjects/123)\nb[Inktober is a h[drawing]h challenge.]b\n\n**It begins October 1st.**'
    ),
    'Inktober is a drawing challenge. It begins October 1st.'
  );
});

test('previews turn links into their label and strip list/heading syntax', () => {
  assert.equal(
    getMarkdownPreviewPlainText(
      '# Rules\n\n1. *NO AI DRAWINGS!* See [the guide](https://example.com/guide).\n2. ~~Old~~ `code`'
    ),
    'Rules NO AI DRAWINGS! See the guide. Old code'
  );
});

test('previews keep literal punctuation and return empty for embed-only text', () => {
  assert.equal(
    getMarkdownPreviewPlainText('3~5 pm right? x > y, a_b and 2 * 3'),
    '3~5 pm right? x > y, a_b and 2 * 3'
  );
  assert.equal(
    getMarkdownPreviewPlainText(
      '![](https://d3jvoamd2k4p0s.cloudfront.net/attachments/embed/x/y.pdf)'
    ),
    ''
  );
  assert.equal(getMarkdownPreviewPlainText(undefined), '');
});
