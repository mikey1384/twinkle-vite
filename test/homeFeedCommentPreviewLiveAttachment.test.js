import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const bodySource = readFileSync(
  new URL('../src/containers/Home/Stories/FeedCard/Body/index.tsx', import.meta.url),
  'utf8'
);

function sliceFunction(header, nextHeader) {
  const start = bodySource.indexOf(header);
  assert(start > -1, `missing ${header}`);
  const end = bodySource.indexOf(nextHeader, start);
  assert(end > -1, `missing ${nextHeader}`);
  return bodySource.slice(start, end);
}

// A comment's canonical copy can carry an attachment the feed payload never had
// — `helpers/ai/comment-assistant` writes fileName/filePath/fileSize onto the
// placeholder when a sponsored reply generates a file, and broadcasts them as
// `edit_content`. mergeLiveCommentState overlays those onto the snapshot, so the
// preview's text and its attachment must be read from the SAME copy. Reading
// text from the live copy and the attachment from the feed payload drops a
// generated file, or pairs new text with a replaced comment's old attachment.
test('the comment preview reads its attachment from the live copy, not the feed payload', () => {
  const commentPreview = sliceFunction(
    'function renderCommentPreview() {',
    'function renderSubjectPreview() {'
  );

  assert.match(
    commentPreview,
    /const liveContent = mergeLiveCommentState\(content, liveContentState\);/
  );
  // the same object that supplies the text supplies the attachment
  assert.match(commentPreview, /text: liveContent\?\.content \|\| '',/);
  assert.match(commentPreview, /source: liveContent/);
});

test('the preview helpers resolve attachments from their source argument', () => {
  const textPreview = sliceFunction(
    'function renderTextPreview({',
    'function renderRichTextEmbedPreview('
  );
  const attachmentPreview = sliceFunction(
    'function renderAttachmentPreview(',
    'function getContentAttachmentFileType('
  );

  // both helpers default to the feed payload for branches with no live copy...
  assert.match(textPreview, /source = content,/);
  assert.match(attachmentPreview, /source: any = content/);

  // ...and neither may reach past that argument for attachment fields.
  assert.match(textPreview, /getContentAttachmentFileType\(source\)/);
  assert.doesNotMatch(textPreview, /getContentAttachmentFileType\(content\)/);
  assert.match(textPreview, /: 'comment',\n\s*source\n\s*\)/);

  assert.match(attachmentPreview, /getContentAttachmentFilePath\(source\)/);
  assert.doesNotMatch(attachmentPreview, /getContentAttachmentFilePath\(content\)/);
  assert.match(attachmentPreview, /getContentAttachmentFileType\(\{ \.\.\.source, filePath \}\)/);
  assert.match(attachmentPreview, /source=\{\{ \.\.\.source, filePath \}\}/);
  assert.doesNotMatch(attachmentPreview, /source=\{\{ \.\.\.content, filePath \}\}/);
});
