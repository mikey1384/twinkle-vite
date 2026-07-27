import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  AI_ENERGY_SPONSOR_PLACEHOLDER_SUFFIX,
  getAiEnergyPlaceholderSponsoredAt,
  mergeLiveCommentState,
  normalizeAiEnergySponsorState,
  resolveAiEnergyPlaceholderName,
  resolveAiEnergySponsorPhase
} from '../src/helpers/aiEnergySponsorship';
import { chooseHomeFeedPreviewComment } from '../src/containers/Home/Stories/FeedCard/helpers/previewComments';

const placeholderComment = {
  id: 4021,
  commentId: 3990,
  content: `Ciel ${AI_ENERGY_SPONSOR_PLACEHOLDER_SUFFIX}`,
  settings: JSON.stringify({
    aiEnergySponsorPlaceholder: {
      aiUsername: 'Ciel',
      kind: 'zero_ciel_public_reply',
      statusToken: 'token-1',
      targetCommentId: 3990
    }
  }),
  timeStamp: 1_784_786_325
};

const resolvedCommentState = {
  content: 'HEHEHE here is the actual answer!',
  settings: JSON.stringify({
    aiEnergySponsorPlaceholder: {
      aiUsername: 'Ciel',
      kind: 'zero_ciel_public_reply',
      resolvedAt: 1_784_786_400,
      statusToken: 'token-1',
      targetCommentId: 3990
    }
  })
};

test('an unresolved placeholder still asks for a sponsor', () => {
  assert.equal(
    resolveAiEnergyPlaceholderName({
      aiName: 'Ciel',
      comment: placeholderComment
    }),
    'Ciel'
  );
});

test('canonical comment state resolves the placeholder on a stale snapshot', () => {
  const liveComment = mergeLiveCommentState(
    placeholderComment,
    resolvedCommentState
  );

  assert.equal(liveComment.content, resolvedCommentState.content);
  assert.equal(
    resolveAiEnergyPlaceholderName({ aiName: 'Ciel', comment: liveComment }),
    ''
  );
});

test('a content entry holding only sponsorship state never blanks a snapshot', () => {
  const liveComment = mergeLiveCommentState(placeholderComment, {
    aiEnergySponsor: { message: '', phase: 'replying', statusToken: 'token-1' },
    comments: [],
    loaded: false,
    profileTheme: 'logoBlue'
  });

  assert.equal(liveComment.content, placeholderComment.content);
  assert.equal(
    resolveAiEnergyPlaceholderName({ aiName: 'Ciel', comment: liveComment }),
    'Ciel'
  );
});

test('home feed previews take the canonical copy over the feed snapshot', () => {
  const chosen = chooseHomeFeedPreviewComment(
    { ...placeholderComment, ...resolvedCommentState },
    // The feed payload copy carries the same creation timeStamp, so freshness
    // can never be decided by comparing timestamps.
    { ...placeholderComment, profilePicUrl: '/pic.png' }
  );

  assert.equal(chosen.content, resolvedCommentState.content);
  assert.equal(chosen.profilePicUrl, '/pic.png');
  assert.equal(
    resolveAiEnergyPlaceholderName({ aiName: 'Ciel', comment: chosen }),
    ''
  );
});

test('sponsorship state defaults to idle and survives partial patches', () => {
  assert.deepEqual(normalizeAiEnergySponsorState(undefined), {
    message: '',
    phase: 'idle',
    sponsoredAt: 0,
    statusToken: ''
  });
  assert.deepEqual(normalizeAiEnergySponsorState({ phase: 'replying' }), {
    message: '',
    phase: 'replying',
    sponsoredAt: 0,
    statusToken: ''
  });
});

test('a placeholder nobody sponsored is not treated as in flight', () => {
  // Placeholders are born with a statusToken, so token presence says nothing
  // about whether a reply is being written.
  assert.equal(getAiEnergyPlaceholderSponsoredAt(placeholderComment), 0);
  assert.equal(
    resolveAiEnergySponsorPhase({
      sponsoredAt: 0,
      sponsorState: normalizeAiEnergySponsorState(undefined)
    }),
    'idle'
  );
});

test('a reloaded client adopts the in-flight state the placeholder carries', () => {
  const sponsoredPlaceholder = {
    ...placeholderComment,
    settings: JSON.stringify({
      aiEnergySponsorPlaceholder: {
        aiUsername: 'Ciel',
        kind: 'zero_ciel_public_reply',
        sponsoredAt: 1_784_786_380,
        statusToken: 'token-1',
        targetCommentId: 3990
      }
    })
  };

  assert.equal(
    getAiEnergyPlaceholderSponsoredAt(sponsoredPlaceholder),
    1_784_786_380
  );
  assert.equal(
    resolveAiEnergySponsorPhase({
      sponsoredAt: getAiEnergyPlaceholderSponsoredAt(sponsoredPlaceholder),
      sponsorState: normalizeAiEnergySponsorState(undefined)
    }),
    'replying'
  );
  // It is still a placeholder, so the sponsor notice keeps rendering.
  assert.equal(
    resolveAiEnergyPlaceholderName({
      aiName: 'Ciel',
      comment: sponsoredPlaceholder
    }),
    'Ciel'
  );
});

test('a settled sponsorship is not re-detected, but a newer one is', () => {
  const settled = normalizeAiEnergySponsorState({
    phase: 'idle',
    sponsoredAt: 1_784_786_380
  });

  assert.equal(
    resolveAiEnergySponsorPhase({ sponsoredAt: 1_784_786_380, sponsorState: settled }),
    'idle'
  );
  assert.equal(
    resolveAiEnergySponsorPhase({ sponsoredAt: 1_784_786_999, sponsorState: settled }),
    'replying'
  );
});

test('every sponsorship state write settles the server stamp', () => {
  const hookSource = readFileSync(
    new URL('../src/helpers/hooks/useAiEnergySponsorship.ts', import.meta.url),
    'utf8'
  );

  // Otherwise a poll that hands the placeholder back to 'idle' is re-derived as
  // 'replying' on the next render and polls forever.
  assert.match(
    hookSource,
    /sponsoredAt: Math\.max\(\s*sponsoredAtRef\.current,\s*sponsorStateRef\.current\.sponsoredAt\s*\)/
  );
  assert.match(
    hookSource,
    /if \(!commentId \|\| !userId \|\| !isAiEnergySponsorPollPhase\(phase\)\) return;/
  );
});

test('sponsorship progress is stored per comment, not per component', () => {
  const hookSource = readFileSync(
    new URL('../src/helpers/hooks/useAiEnergySponsorship.ts', import.meta.url),
    'utf8'
  );
  const buttonSource = readFileSync(
    new URL(
      '../src/components/Comments/AiEnergySponsorButton.tsx',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(
    hookSource,
    /useContentContext\(\s*\(v\) => v\.state\[`comment\$\{commentId\}`\]\?\.aiEnergySponsor\s*\)/
  );
  assert.match(hookSource, /contentType: 'comment',\s*newState: \{\s*aiEnergySponsor/);
  assert.doesNotMatch(buttonSource, /useState/);
});

test('a content edit lands under the edited content own key', () => {
  const reducerSource = readFileSync(
    new URL('../src/contexts/Content/reducer.ts', import.meta.url),
    'utf8'
  );
  const editCase = reducerSource.match(
    /case 'EDIT_CONTENT': \{[\s\S]*?case 'EDIT_REWARD_COMMENT'/
  );

  assert.ok(editCase, 'Expected an EDIT_CONTENT case.');
  assert.match(
    editCase[0],
    /if \(action\.contentType && action\.contentId && !newState\[contentKey\]\) \{\s*newState\[contentKey\] = \{\s*\.\.\.defaultState,\s*\.\.\.action\.data\s*\};/
  );
});
