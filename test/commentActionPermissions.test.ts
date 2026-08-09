import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { getCommentActionPermissions } from '../src/components/Comments/permissions';

const commentActionSurfaces = [
  'src/components/Comments/Container/Comment.tsx',
  'src/components/Comments/Container/PinnedComment/Comment.tsx',
  'src/components/Comments/Container/Replies/Reply.tsx',
  'src/components/Comments/Container/Searched/Comment.tsx',
  'src/components/ContentPanel/TargetContent/Comment.tsx'
];

test('a lower-level moderator cannot edit or remove a higher-level reply', () => {
  assert.deepEqual(
    getCommentActionPermissions({
      canDelete: true,
      canEdit: false,
      uploaderId: 17881,
      uploaderLevel: 3,
      userId: 13174,
      userLevel: 2
    }),
    {
      userCanDeleteThis: false,
      userCanEditThis: false,
      userIsUploader: false
    }
  );
});

test('comment authors can edit and remove their own comments', () => {
  assert.deepEqual(
    getCommentActionPermissions({
      canDelete: false,
      canEdit: false,
      uploaderId: 12,
      uploaderLevel: 5,
      userId: 12,
      userLevel: 1
    }),
    {
      userCanDeleteThis: true,
      userCanEditThis: true,
      userIsUploader: true
    }
  );
});

test('moderation capabilities stay action-specific above a lower-level author', () => {
  assert.deepEqual(
    getCommentActionPermissions({
      canDelete: true,
      canEdit: false,
      uploaderId: 12,
      uploaderLevel: 1,
      userId: 34,
      userLevel: 2
    }),
    {
      userCanDeleteThis: true,
      userCanEditThis: false,
      userIsUploader: false
    }
  );
  assert.deepEqual(
    getCommentActionPermissions({
      canDelete: false,
      canEdit: true,
      uploaderId: 12,
      uploaderLevel: 1,
      userId: 34,
      userLevel: 2
    }),
    {
      userCanDeleteThis: false,
      userCanEditThis: true,
      userIsUploader: false
    }
  );
});

test('equal or unknown uploader levels do not grant moderation actions', () => {
  for (const uploaderLevel of [2, undefined]) {
    assert.deepEqual(
      getCommentActionPermissions({
        canDelete: true,
        canEdit: true,
        uploaderId: 12,
        uploaderLevel,
        userId: 34,
        userLevel: 2
      }),
      {
        userCanDeleteThis: false,
        userCanEditThis: false,
        userIsUploader: false
      }
    );
  }
});

test('every comment action surface uses the shared hierarchy permission', () => {
  for (const relativePath of commentActionSurfaces) {
    const source = readFileSync(path.join(process.cwd(), relativePath), 'utf8');
    assert.match(source, /getCommentActionPermissions/);
    assert.doesNotMatch(source, /userIsUploader\s*\|\|\s*can(?:Delete|Edit)/);
  }
});
