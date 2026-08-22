import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { applySpoilerStatusChange } from '../src/contexts/Content/spoilerState';
import {
  invalidateSecretVisibilityRequest,
  loadCanonicalSecretVisibility,
  resetSecretVisibilityRequestsForTests
} from '../src/contexts/Content/secretVisibilityRequests';

const spoilerAction = {
  type: 'CHANGE_SPOILER_STATUS',
  contentType: 'subject',
  contentId: 28648,
  shown: false,
  prevSecretViewerId: 14940
};

test('repeating an unchanged spoiler result is a shared-state no-op', () => {
  const unrelatedContent = {
    contentId: 50,
    contentType: 'subject',
    title: 'Unrelated'
  };
  const initialState = {
    comment343021: {
      contentId: 343021,
      contentType: 'comment',
      targetObj: {
        subject: {
          id: 28648
        }
      }
    },
    subject50: unrelatedContent
  };

  const updatedState = applySpoilerStatusChange({
    state: initialState,
    contentId: spoilerAction.contentId,
    contentType: spoilerAction.contentType,
    prevSecretViewerId: spoilerAction.prevSecretViewerId,
    shown: spoilerAction.shown,
    missingSubjectState: {
      contentId: spoilerAction.contentId,
      contentType: spoilerAction.contentType,
      prevSecretViewerId: spoilerAction.prevSecretViewerId,
      secretShown: spoilerAction.shown
    }
  });
  assert.notEqual(updatedState, initialState);
  assert.equal(updatedState.subject50, unrelatedContent);
  assert.equal(updatedState.comment343021.secretShown, false);
  assert.equal(updatedState.comment343021.targetObj.subject.secretShown, false);
  assert.equal(updatedState.subject28648.secretShown, false);

  const repeatedState = applySpoilerStatusChange({
    state: updatedState,
    contentId: spoilerAction.contentId,
    contentType: spoilerAction.contentType,
    prevSecretViewerId: spoilerAction.prevSecretViewerId,
    shown: spoilerAction.shown,
    missingSubjectState: updatedState.subject28648
  });
  assert.equal(repeatedState, updatedState);
});

test('concurrent secret-response consumers share one canonical request', async () => {
  resetSecretVisibilityRequestsForTests();
  let loadCount = 0;
  let resolveLoad!: (result: { responded: boolean }) => void;
  const load = () => {
    loadCount += 1;
    return new Promise<{ responded: boolean }>((resolve) => {
      resolveLoad = resolve;
    });
  };

  const first = loadCanonicalSecretVisibility({
    load,
    subjectId: 28648,
    userId: 14940
  });
  const second = loadCanonicalSecretVisibility({
    load,
    subjectId: 28648,
    userId: 14940
  });

  assert.equal(loadCount, 1);
  resolveLoad({ responded: true });
  assert.deepEqual(await Promise.all([first, second]), [true, true]);
});

test('a confirmed subject refresh invalidates a stale response check', async () => {
  resetSecretVisibilityRequestsForTests();
  let resolveLoad!: (result: { responded: boolean }) => void;
  const stale = loadCanonicalSecretVisibility({
    load: () =>
      new Promise<{ responded: boolean }>((resolve) => {
        resolveLoad = resolve;
      }),
    subjectId: 28648,
    userId: 14940
  });

  invalidateSecretVisibilityRequest({ subjectId: 28648, userId: 14940 });
  resolveLoad({ responded: false });
  assert.equal(await stale, null);
  assert.equal(
    await loadCanonicalSecretVisibility({
      load: async () => ({ responded: true }),
      subjectId: 28648,
      userId: 14940
    }),
    true
  );
});

test('secret-response checks have one shared request owner', () => {
  const hookSource = readFileSync(
    new URL(
      '../src/helpers/hooks/useSubjectSecretVisibility.ts',
      import.meta.url
    ),
    'utf8'
  );
  const consumerPaths = [
    '../src/components/ContentPanel/Body/index.tsx',
    '../src/components/SecretAnswer.tsx',
    '../src/components/Comments/Container/Comment.tsx',
    '../src/components/Comments/Container/PinnedComment/Comment.tsx',
    '../src/components/Comments/Container/Searched/Comment.tsx'
  ];

  assert.match(hookSource, /checkIfUserResponded\(subjectId\)/);
  for (const consumerPath of consumerPaths) {
    const source = readFileSync(new URL(consumerPath, import.meta.url), 'utf8');
    assert.match(source, /useSubjectSecretVisibility\(/);
    assert.doesNotMatch(source, /checkIfUserResponded/);
  }

  const secretCommentSource = readFileSync(
    new URL('../src/components/SecretComment.tsx', import.meta.url),
    'utf8'
  );
  assert.doesNotMatch(secretCommentSource, /onMount/);
});

test('secret unlock waits for canonical subject state and records the viewer', () => {
  for (const componentPath of [
    '../src/components/ContentPanel/Body/index.tsx',
    '../src/components/Subjects/SubjectPanel.tsx'
  ]) {
    const source = readFileSync(new URL(componentPath, import.meta.url), 'utf8');
    assert.match(
      source,
      /const secretIsCanonicallyShown = await refreshSubjectAfterSecretUnlock\(\);[\s\S]*if \(!secretIsCanonicallyShown[^\n]*\) return;[\s\S]*onChangeSpoilerStatus\(\{[\s\S]*prevSecretViewerId: (?:requestUserId|userId|myId)/
    );
    assert.match(source, /return data\.secretShown === true/);
  }
});
