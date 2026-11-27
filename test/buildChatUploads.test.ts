import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  getReferenceDocumentUploadMimeType,
  isImageChatReferenceFile,
  isReferenceDocumentChatFile
} from '../src/containers/Build/Editor/helpers/chatUploads';

function fakeFile(name: string, type = ''): File {
  return { name, type } as File;
}

test('Build chat client classifies code files and zip archives as reference documents while keeping images separate', () => {
  for (const [name, type, expectedMime] of [
    ['project.zip', 'application/zip', 'application/zip'],
    ['project.zip', '', 'application/zip'],
    ['main.ts', '', 'text/plain'],
    ['App.tsx', 'application/typescript', 'text/plain'],
    ['game.js', 'application/javascript', 'text/plain'],
    ['styles.css', '', 'text/plain'],
    ['helper.py', '', 'text/plain']
  ] as const) {
    const file = fakeFile(name, type);
    assert.equal(isReferenceDocumentChatFile(file), true, name);
    assert.equal(isImageChatReferenceFile(file), false, name);
    assert.equal(getReferenceDocumentUploadMimeType(file), expectedMime, name);
  }

  const reviveImg = fakeFile('REVIVE+.png', 'image/png');
  assert.equal(isImageChatReferenceFile(reviveImg), true);
  assert.equal(isReferenceDocumentChatFile(reviveImg), false);
});

test('UploadFileModal disables embed/drop-into-caption in custom Build chat upload mode', () => {
  const modalSource = readFileSync(
    path.resolve('src/components/Modals/UploadFileModal/index.tsx'),
    'utf8'
  );
  assert.match(
    modalSource,
    /onEmbedAttachment=\{\s*isCustomUploadMode\s*\?\s*undefined\s*:\s*handleEmbedImageAttachment\s*\}/
  );
  assert.match(
    modalSource,
    /onAttachmentDrop=\{\s*isCustomUploadMode\s*\?\s*undefined\s*:\s*handleEmbedImageAttachment\s*\}/
  );
});

test('attemptUpload does not double-encode fileName when signing S3 uploads', () => {
  const helpersSource = readFileSync(path.resolve('src/helpers/index.ts'), 'utf8');
  assert.doesNotMatch(
    helpersSource,
    /queryParams\.append\(\s*['"]fileName['"]\s*,\s*encodeURIComponent\(/
  );
  assert.match(
    helpersSource,
    /queryParams\.append\(\s*['"]fileName['"]\s*,\s*fileName\s*\)/
  );
});
