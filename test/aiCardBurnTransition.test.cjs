const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const path = require('node:path');
const esbuild = require('esbuild');

const entryPoint = path.resolve(
  __dirname,
  '../src/helpers/aiCardBurnTransition.ts'
);
const burnTransitionModule = loadTypeScriptModule(entryPoint);
const { queueCanonicalAICardBurnTransition } = burnTransitionModule.exports;
const canonicalUpdatesModule = loadTypeScriptModule(
  path.resolve(__dirname, '../src/helpers/aiCardCanonicalUpdates.ts')
);
const {
  AI_CARD_DIRECT_TRANSFER_PAYLOAD_VERSION,
  getConfirmedAICardDirectTransferState,
  getConfirmedAICardImageState,
  getConfirmedAICardImageTerminalState,
  getConfirmedAICardListingState,
  getConfirmedAICardTransferState,
  normalizeAICardId
} = canonicalUpdatesModule.exports;

test('applies only burn-owned fields at the animation boundary', () => {
  const scheduledCallbacks = [];
  const originalSetTimeout = globalThis.setTimeout;
  globalThis.setTimeout = (callback, delay) => {
    scheduledCallbacks.push({ callback, delay });
    return scheduledCallbacks.length;
  };

  try {
    const updates = [];
    const staleBurnCard = {
      id: 41,
      isBurned: true,
      style: 'storybook',
      quality: 'rare',
      prompt: 'A confirmed prompt',
      isMysteryCard: false,
      imagePath: '',
      isImageGenerating: true,
      isListed: false,
      ownerId: 7
    };

    assert.equal(
      queueCanonicalAICardBurnTransition({
        cardId: 41,
        card: staleBurnCard,
        onUpdateAICard: (update) => updates.push(update)
      }),
      true
    );
    assert.deepEqual(updates, [
      { cardId: 41, newState: { isBurning: true } }
    ]);
    assert.equal(scheduledCallbacks[0].delay, 2000);

    scheduledCallbacks[0].callback();

    assert.equal(updates.length, 2);
    assert.deepEqual(updates[1], {
      cardId: 41,
      newState: {
        style: 'storybook',
        quality: 'rare',
        prompt: 'A confirmed prompt',
        isMysteryCard: false,
        isBurned: true,
        isBurning: false
      }
    });
  } finally {
    globalThis.setTimeout = originalSetTimeout;
  }
});

test('canonical operation updates do not cross field ownership boundaries', () => {
  const card = {
    id: 41,
    imagePath: '/ai-arts/completed.png',
    engine: 'image-2',
    style: 'storybook',
    quality: 'rare',
    prompt: 'A confirmed prompt',
    isMysteryCard: false,
    isImageGenerating: false,
    isBurned: true,
    isListed: true,
    askPrice: 250,
    ownerId: 9,
    owner: { id: 9 }
  };

  assert.deepEqual(getConfirmedAICardImageState(card), {
    style: 'storybook',
    quality: 'rare',
    prompt: 'A confirmed prompt',
    isMysteryCard: false,
    imagePath: '/ai-arts/completed.png',
    engine: 'image-2',
    isImageGenerating: false
  });
  assert.deepEqual(getConfirmedAICardListingState(card), {
    isListed: true,
    askPrice: 250
  });
  assert.deepEqual(getConfirmedAICardTransferState(card), {
    ownerId: 9,
    owner: { id: 9 },
    isListed: true,
    askPrice: 250
  });
});

test('normalizes legacy string card IDs', () => {
  assert.equal(normalizeAICardId('41'), 41);
  assert.equal(normalizeAICardId(41), 41);
  assert.equal(normalizeAICardId('not-a-card'), null);
});

test('canonical image terminal states reconcile shared progress from the server card', () => {
  assert.deepEqual(
    getConfirmedAICardImageTerminalState({
      card: {
        imagePath: '',
        isImageGenerating: false,
        isListed: true
      },
      stage: 'error'
    }),
    {
      imagePath: '',
      isImageGenerating: false,
      imageGenerationStage: 'error',
      imageGenerationInProgress: false,
      imageGenerationPreviewUrl: ''
    }
  );
  assert.deepEqual(
    getConfirmedAICardImageTerminalState({
      card: {
        imagePath: '',
        isImageGenerating: true
      },
      stage: 'completed'
    }),
    {
      imagePath: '',
      isImageGenerating: true,
      imageGenerationStage: 'completed',
      imageGenerationInProgress: true,
      imageGenerationPreviewUrl: ''
    }
  );
  assert.equal(
    getConfirmedAICardImageTerminalState({
      card: { imagePath: '' },
      stage: 'error'
    }),
    null
  );
});

test('direct transfers distinguish canonical cards from legacy payloads', () => {
  assert.deepEqual(
    getConfirmedAICardDirectTransferState({
      aiCardPayloadVersion: AI_CARD_DIRECT_TRANSFER_PAYLOAD_VERSION,
      ownerId: 9,
      card: {
        id: 41,
        ownerId: 9,
        owner: { id: 9, username: 'new-owner' },
        imagePath: '/ai-arts/revealed.png',
        engine: 'image-2',
        style: 'storybook',
        quality: 'rare',
        isMysteryCard: false,
        isListed: false,
        askPrice: null
      }
    }),
    {
      style: 'storybook',
      quality: 'rare',
      isMysteryCard: false,
      imagePath: '/ai-arts/revealed.png',
      engine: 'image-2',
      ownerId: 9,
      isListed: false,
      askPrice: null,
      owner: { id: 9, username: 'new-owner' }
    }
  );

  const newerWriterState = getConfirmedAICardDirectTransferState({
    aiCardPayloadVersion: AI_CARD_DIRECT_TRANSFER_PAYLOAD_VERSION,
    ownerId: 9,
    card: {
      ownerId: 12,
      owner: { id: 12, username: 'latest-owner' },
      isListed: 1,
      askPrice: 400
    }
  });
  assert.deepEqual(newerWriterState, {
    ownerId: 12,
    owner: { id: 12, username: 'latest-owner' },
    isListed: 1,
    askPrice: 400
  });

  const legacyState = getConfirmedAICardDirectTransferState({
    ownerId: 9,
    card: {
      quality: 'rare',
      imagePath: '',
      ownerId: 4,
      owner: { id: 4, username: 'old-owner' },
      isListed: true,
      askPrice: 250
    }
  });
  assert.deepEqual(legacyState, {
    ownerId: 9,
    owner: null,
    isListed: false,
    askPrice: null
  });
});

function loadTypeScriptModule(modulePath) {
  const output = esbuild.buildSync({
    bundle: true,
    entryPoints: [modulePath],
    format: 'cjs',
    platform: 'node',
    write: false
  }).outputFiles[0].text;
  const mod = { exports: {} };
  const localRequire = createRequire(modulePath);
  const compiled = new Function('require', 'module', 'exports', output);

  compiled(localRequire, mod, mod.exports);

  return mod;
}
