import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { swapAttachmentWithNeighbor } from '../src/helpers/imageAttachmentOrder';

function readSource(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('photo attachment order changes immutably and respects list boundaries', () => {
  const attachments = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const movedLeft = swapAttachmentWithNeighbor(attachments, 'b', 'left');
  assert.deepEqual(
    movedLeft.map((item) => item.id),
    ['b', 'a', 'c']
  );
  assert.deepEqual(
    attachments.map((item) => item.id),
    ['a', 'b', 'c']
  );
  assert.notEqual(movedLeft, attachments);

  const movedRight = swapAttachmentWithNeighbor(attachments, 'b', 'right');
  assert.deepEqual(
    movedRight.map((item) => item.id),
    ['a', 'c', 'b']
  );
  assert.equal(
    swapAttachmentWithNeighbor(attachments, 'a', 'left'),
    attachments
  );
  assert.equal(
    swapAttachmentWithNeighbor(attachments, 'missing', 'right'),
    attachments
  );
});

test('generic multi-select and ordered photo submission stay wired end to end', () => {
  const inputForm = readSource('src/components/Forms/InputForm.tsx');
  const uploadOption = readSource(
    'src/components/Modals/UploadModal/FileUploadOption.tsx'
  );
  const photoModal = readSource(
    'src/components/Modals/PhotoUploadModal/index.tsx'
  );
  const chatUploadModal = readSource(
    'src/components/Modals/UploadFileModal/index.tsx'
  );

  assert.match(
    inputForm,
    /multiple\s*\n\s*\/\/[\s\S]*allowMultipleGenericFileSelection/
  );
  assert.match(uploadOption, /multiple=\{allowsMultipleGenericFileSelection\}/);
  assert.match(photoModal, /swapAttachmentWithNeighbor/);
  assert.match(photoModal, /attachmentsSnapshot\.map/);
  assert.match(chatUploadModal, /swapAttachmentWithNeighbor/);
  assert.match(chatUploadModal, /attachmentsSnapshot\.map/);
  assert.match(chatUploadModal, /isCustomUploadMode\s*\?\s*undefined/);
});

test('chess level dropdown uses the shared capture-phase portal boundary', () => {
  const source = readSource(
    'src/containers/Home/ChessPuzzleModal/Puzzle/LevelDropdown/index.tsx'
  );
  assert.match(source, /useOutsideClick\(outsideClickRefs/);
  assert.match(source, /\[btnRef, menuRef\]/);
  assert.match(source, /capture: true/);
  assert.match(source, /enabled: open/);
});
