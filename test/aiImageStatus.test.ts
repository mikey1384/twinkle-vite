import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  createAIImageRequestFingerprint,
  pollCanonicalAIImageStatus,
  resolveAIImageStatusImageUrl,
  shouldRecoverAIImageUnknownOutcome
} from '../src/helpers/aiImageStatus';
import {
  markBrowserNetworkReachable,
  resetBrowserNetworkForTests
} from '../src/helpers/browserNetwork';
import { createHash } from 'node:crypto';

test.beforeEach(() => {
  resetBrowserNetworkForTests();
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { onLine: true }
  });
});

test.afterEach(() => {
  resetBrowserNetworkForTests();
});

test('AI image recovery covers every response-less transport outcome', () => {
  assert.equal(
    shouldRecoverAIImageUnknownOutcome({
      reachedServer: false,
      hasServerProgress: true
    }),
    true
  );
  assert.equal(
    shouldRecoverAIImageUnknownOutcome({
      reachedServer: false,
      hasServerProgress: false,
      hasPendingCompletion: true
    }),
    true
  );
  assert.equal(
    shouldRecoverAIImageUnknownOutcome({
      reachedServer: true,
      hasServerProgress: true,
      hasPendingCompletion: true
    }),
    false
  );
  assert.equal(
    shouldRecoverAIImageUnknownOutcome({
      reachedServer: false,
      hasServerProgress: false
    }),
    true
  );
});

test('AI image status fingerprint matches the server request identity without resending image bytes', async () => {
  const input = {
    prompt: 'Turn this into watercolor',
    previousResponseId: 'resp_123',
    previousImageId: 'file_123',
    referenceImageB64: 'large-base64-placeholder',
    engine: 'openai' as const,
    quality: 'medium' as const
  };
  const expected = createHash('sha256')
    .update(
      [
        input.engine,
        input.quality,
        input.prompt,
        input.previousResponseId,
        input.previousImageId,
        input.referenceImageB64
      ].join('\n')
    )
    .digest('hex');

  assert.equal(await createAIImageRequestFingerprint(input), expected);
});

test('fingerprinted status recovery preserves the requested image engine and quality', () => {
  for (const relativePath of [
    '../src/contexts/requestHelpers/content.ts',
    '../src/contexts/requestHelpers/build.ts'
  ]) {
    const requestHelpers = readFileSync(
      new URL(relativePath, import.meta.url),
      'utf8'
    );
    assert.match(
      requestHelpers,
      /requestFingerprint\s*\? \{ requestId, requestFingerprint, engine, quality \}/,
      `${relativePath} must preserve generation metadata during result recovery`
    );
  }
});

test('AI image status keeps an existing canonical image without recovery I/O', async () => {
  let recoveryCalls = 0;
  const imageUrl = await resolveAIImageStatusImageUrl({
    imageUrl: 'data:image/png;base64,AAAA',
    recovery: { objectKey: 'unused', format: 'png' },
    loadResult: async () => {
      recoveryCalls += 1;
      return { imageUrl: 'unexpected' };
    }
  });

  assert.equal(imageUrl, 'data:image/png;base64,AAAA');
  assert.equal(recoveryCalls, 0);
});

test('AI image status rehydrates a canonical completion from its private locator', async () => {
  const recovery = {
    objectKey: `ai-image-results/123/${'a'.repeat(64)}.png`,
    format: 'png'
  };
  const imageUrl = await resolveAIImageStatusImageUrl({
    recovery,
    loadResult: async (payload) => {
      assert.deepEqual(payload, { recovery });
      return { imageUrl: 'data:image/png;base64,BBBB' };
    }
  });

  assert.equal(imageUrl, 'data:image/png;base64,BBBB');
});

test('AI image status does not synthesize an image without canonical data', async () => {
  const imageUrl = await resolveAIImageStatusImageUrl({
    loadResult: async () => ({ imageUrl: 'unexpected' })
  });

  assert.equal(imageUrl, undefined);
});

test('AI image completion polling only reads status until canonical output exists', async () => {
  const statuses = [
    { status: 'processing', retryAfterSeconds: 2 },
    {
      status: 'completed',
      success: true,
      imageUrl: 'data:image/png;base64,CCCC'
    }
  ];
  const waits: number[] = [];
  const result = await pollCanonicalAIImageStatus({
    loadStatus: async () => statuses.shift(),
    wait: async (delayMs) => {
      waits.push(delayMs);
    }
  });

  assert.equal(result?.imageUrl, 'data:image/png;base64,CCCC');
  assert.deepEqual(waits, [2_000]);
});

test('AI image completion polling never turns an absent request into generation', async () => {
  let statusReads = 0;
  const result = await pollCanonicalAIImageStatus({
    loadStatus: async () => {
      statusReads += 1;
      return {
        success: false,
        generationStatus: 'not_found',
        code: 'ai_image_generation_not_found'
      };
    },
    wait: async () => undefined
  });

  assert.equal(statusReads, 1);
  assert.equal(result?.code, 'ai_image_generation_not_found');
});

test('unknown-outcome recovery tolerates an initial status visibility race', async () => {
  const statuses = [
    { success: false, generationStatus: 'not_found' },
    { status: 'processing' },
    { success: true, imageUrl: 'data:image/png;base64,DDDD' }
  ];
  let time = 0;
  const result = await pollCanonicalAIImageStatus({
    loadStatus: async () => statuses.shift(),
    transientInitialStatuses: ['not_found'],
    transientInitialStatusTimeoutMs: 10_000,
    now: () => time,
    wait: async (delayMs) => {
      time += delayMs;
    }
  });

  assert.equal(result?.imageUrl, 'data:image/png;base64,DDDD');
  assert.equal(statuses.length, 0);
});

test('explicitly offline time does not consume the canonical recovery budget', async () => {
  let time = 0;
  let reads = 0;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { onLine: false }
  });

  const result = await pollCanonicalAIImageStatus({
    loadStatus: async () => {
      reads += 1;
      return { success: true, imageUrl: 'data:image/png;base64,EEEE' };
    },
    timeoutMs: 1_000,
    now: () => time,
    wait: async () => {
      time += 60 * 60 * 1000;
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: { onLine: true }
      });
    }
  });

  assert.equal(reads, 1);
  assert.equal(result?.imageUrl, 'data:image/png;base64,EEEE');
});

test('initial status visibility grace starts after an offline interval', async () => {
  let time = 0;
  let reads = 0;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { onLine: false }
  });

  const result = await pollCanonicalAIImageStatus({
    loadStatus: async () => {
      reads += 1;
      return reads === 1
        ? { success: false, generationStatus: 'not_found' }
        : { success: true, imageUrl: 'data:image/png;base64,FFFF' };
    },
    transientInitialStatuses: ['not_found'],
    transientInitialStatusTimeoutMs: 10_000,
    now: () => time,
    wait: async (delayMs) => {
      time += reads === 0 ? 60 * 60 * 1000 : delayMs;
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: { onLine: true }
      });
    }
  });

  assert.equal(reads, 2);
  assert.equal(result?.imageUrl, 'data:image/png;base64,FFFF');
});

test('canonical status reads keep a long generation moving through a stale Safari offline hint', async (t) => {
  let time = 0;
  let reads = 0;
  const waits: number[] = [];
  const originalDateNow = Date.now;
  Date.now = () => time;
  t.after(() => {
    Date.now = originalDateNow;
  });
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { onLine: false }
  });
  markBrowserNetworkReachable(time);

  const result = await pollCanonicalAIImageStatus({
    loadStatus: async () => {
      reads += 1;
      return reads < 21
        ? { status: 'processing', retryAfterSeconds: 2 }
        : { success: true, imageUrl: 'data:image/png;base64,STALE' };
    },
    now: () => time,
    wait: async (delayMs) => {
      waits.push(delayMs);
      time += delayMs;
    }
  });

  assert.equal(time, 40_000);
  assert.equal(reads, 21);
  assert.equal(result?.imageUrl, 'data:image/png;base64,STALE');
  assert.deepEqual(waits, Array(20).fill(2_000));
});

test('response-less image status failures back off without replaying generation', async () => {
  const statuses = [
    { success: false, retryable: true, isTransportError: true },
    { success: false, retryable: true, isTransportError: true },
    { success: false, retryable: true, isTransportError: true },
    { success: true, imageUrl: 'data:image/png;base64,GGGG' }
  ];
  const waits: number[] = [];
  const result = await pollCanonicalAIImageStatus({
    loadStatus: async () => statuses.shift(),
    wait: async (delayMs) => {
      waits.push(delayMs);
    }
  });

  assert.equal(result?.imageUrl, 'data:image/png;base64,GGGG');
  assert.deepEqual(waits, [2_000, 4_000, 8_000]);
});

test('a rejected image status read uses the same bounded transport recovery', async () => {
  let reads = 0;
  const waits: number[] = [];
  const result = await pollCanonicalAIImageStatus({
    loadStatus: async () => {
      reads += 1;
      if (reads === 1) throw new Error('network unavailable');
      return { success: true, imageUrl: 'data:image/png;base64,HHHH' };
    },
    wait: async (delayMs) => {
      waits.push(delayMs);
    }
  });

  assert.equal(result?.imageUrl, 'data:image/png;base64,HHHH');
  assert.deepEqual(waits, [2_000]);
});

test('retryable server status failures back off while active processing stays responsive', async () => {
  const statuses = [
    {
      success: false,
      generationStatus: 'unknown',
      retryable: true,
      retryAfterSeconds: 2
    },
    {
      success: false,
      generationStatus: 'unknown',
      retryable: true,
      retryAfterSeconds: 2
    },
    { status: 'processing', retryAfterSeconds: 2 },
    { success: true, imageUrl: 'data:image/png;base64,IIII' }
  ];
  const waits: number[] = [];
  const result = await pollCanonicalAIImageStatus({
    loadStatus: async () => statuses.shift(),
    wait: async (delayMs) => {
      waits.push(delayMs);
    }
  });

  assert.equal(result?.imageUrl, 'data:image/png;base64,IIII');
  assert.deepEqual(waits, [2_000, 4_000, 2_000]);
});

test('Build image recovery returns a socket completion that wins the status-poll race', () => {
  const hostBridge = readFileSync(
    new URL(
      '../src/containers/Build/PreviewPanel/hooks/useHostBridge.ts',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(
    hostBridge,
    /target\.terminalResponse = hasCompletedImage[\s\S]*?success: true[\s\S]*?imageUrl: payload\.imageUrl/
  );
  assert.match(
    hostBridge,
    /response = aiImageStatusTarget\s*\? await Promise\.race\(\[\s*httpResponsePromise,\s*aiImageStatusTarget\.terminalResponsePromise\s*\]\)/
  );
  assert.match(
    hostBridge,
    /completionFallbackTimer = window\.setTimeout\([\s\S]*?recoverAndForwardAiImageCompletion\(target, payload\)[\s\S]*?1_000/
  );
  assert.match(
    hostBridge,
    /if \(canonicalResult\) \{[\s\S]*?response = canonicalResult;[\s\S]*?else if \(aiImageStatusTarget\.terminalResponse\)[\s\S]*?response = aiImageStatusTarget\.terminalResponse;/
  );
});
