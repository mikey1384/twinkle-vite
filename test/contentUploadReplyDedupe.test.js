import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function readSource(path) {
  return readSource.cache[path] ||
    (readSource.cache[path] = readFileSync(
      new URL(`../${path}`, import.meta.url),
      'utf8'
    ));
}
readSource.cache = Object.create(null);

const reducerSource = readSource('src/contexts/Content/reducer.ts');

assert.match(
  reducerSource,
  /function appendUniqueById/,
  'Expected appendUniqueById helper for idempotent comment list updates'
);
assert.match(
  reducerSource,
  /function prependUniqueById/,
  'Expected prependUniqueById helper for idempotent comment list updates'
);

const uploadReplyCase = reducerSource.match(
  /case 'UPLOAD_REPLY': \{[\s\S]*?case 'UPLOAD_SUBJECT':/
);
assert.ok(uploadReplyCase, 'Expected UPLOAD_REPLY case in Content reducer');

assert.match(
  uploadReplyCase[0],
  /appendUniqueById\(comment\.replies, uploadItems\)/,
  'UPLOAD_REPLY must dedupe nested replies by id'
);
assert.match(
  uploadReplyCase[0],
  /appendUniqueById\(newComments, uploadItems\)/,
  'UPLOAD_REPLY must dedupe comment-page reply lists by id'
);
assert.doesNotMatch(
  uploadReplyCase[0],
  /\.concat\(uploadItems\)/,
  'UPLOAD_REPLY must not blind-concat uploadItems (duplicate realtime delivery)'
);

const uploadCommentCase = reducerSource.match(
  /case 'UPLOAD_COMMENT': \{[\s\S]*?case 'UPLOAD_REPLY':/
);
assert.ok(uploadCommentCase, 'Expected UPLOAD_COMMENT case in Content reducer');
assert.match(
  uploadCommentCase[0],
  /appendUniqueById|prependUniqueById/,
  'UPLOAD_COMMENT must use id-based unique list helpers'
);
assert.doesNotMatch(
  uploadCommentCase[0],
  /replies: \(comment\.replies \|\| \[\]\)\.concat\(action\.data\)/,
  'UPLOAD_COMMENT must not blind-concat replies'
);

console.log('contentUploadReplyDedupe.test.js: ok');
