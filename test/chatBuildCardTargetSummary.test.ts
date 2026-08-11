import assert from 'node:assert/strict';
import test from 'node:test';
import { getBuildCardTargetSummary } from '../src/containers/Chat/Message/MessageBody/BuildCardTargetSummary';

test('build thumbnail reply targets preserve their project and image context', () => {
  assert.deepEqual(
    getBuildCardTargetSummary({
      rootId: 22,
      rootType: 'buildThumbnailSuggestion',
      settings: JSON.stringify({
        buildThumbnailSuggestion: {
          rootBuildId: 11,
          branchBuildId: 22,
          title: 'Puzzle Lab',
          branchNumber: 4,
          suggestedThumbnailUrl: 'https://example.test/thumb.png'
        }
      })
    }),
    {
      icon: 'image',
      label: 'Suggested a thumbnail for Puzzle Lab',
      detail: 'Branch #4',
      thumbUrl: 'https://example.test/thumb.png'
    }
  );
});

test('build contribution reply targets preserve project and branch context', () => {
  assert.deepEqual(
    getBuildCardTargetSummary({
      rootId: 22,
      rootType: 'buildContributionSubmission',
      settings: {
        buildContributionSubmission: {
          rootBuildId: 11,
          branchBuildId: 22,
          title: 'Puzzle Lab',
          branchLabel: 'Mikey · Branch #4'
        }
      }
    }),
    {
      icon: 'code-branch',
      label: 'Made updates to Puzzle Lab',
      detail: 'Mikey · Branch #4'
    }
  );
});

test('malformed and ordinary targets fall back to their original reply text', () => {
  for (const message of [
    null,
    { rootId: 0, rootType: 'buildContributionSubmission' },
    {
      rootId: 22,
      rootType: 'buildContributionSubmission',
      settings: '{}'
    },
    {
      rootId: 22,
      rootType: 'buildThumbnailSuggestion',
      settings: {
        buildThumbnailSuggestion: {
          rootBuildId: 11,
          branchBuildId: 22,
          suggestedThumbnailUrl: ''
        }
      }
    },
    { rootId: 22, rootType: 'subject', settings: {} }
  ]) {
    assert.equal(getBuildCardTargetSummary(message), null);
  }
});
