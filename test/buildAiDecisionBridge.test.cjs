const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function decisionBridge(type = 'ai:decide') {
  const source = fs.readFileSync('src/containers/Build/PreviewPanel/hooks/useHostBridge.ts', 'utf8');
  const ast = ts.createSourceFile('bridge.ts', source, ts.ScriptTarget.Latest, true);
  // 'ai:decide' falls through to the shared 'ai:decide-images' clause.
  const clauses = [];
  function visit(node) {
    if (ts.isCaseClause(node) && ts.isStringLiteral(node.expression) &&
      ['ai:decide', 'ai:decide-images'].includes(node.expression.text)) clauses.push(node.getText(ast));
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.equal(clauses.length, 2);
  const code = `(async function(payload, previewAuth, requestRefs, getActiveAppMcpInvocation, triggerGuestRestriction, onAiUsagePolicyUpdateRef, serializeBuildDecisionImages, assertDecisionSawImages) {
    const activeBuild = { id: 91 }; const sourceWindow = {}; let response;
    const getAppInfoRelease = () => ({ source: 'published', artifactVersionId: null });
    const runtimeOnlyRef = { current: false }; const previewSrcOverrideRef = { current: null };
    const type = ${JSON.stringify(type)};
    switch (type) { ${clauses.join('\n')} }
    return response;
  })`;
  const fn = vm.runInNewContext(ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText);
  const images = loadImagesHelper();
  return (...args) => fn(...args.slice(0, 6), images.serializeBuildDecisionImages, images.assertDecisionSawImages);
}

function loadImagesHelper() {
  const source = fs.readFileSync('src/containers/Build/PreviewPanel/helpers/buildRuntimeDecisionImages.ts', 'utf8');
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, Blob, btoa, Uint8Array, String, Object, Array, Number, Error });
  return exports;
}

const run = decisionBridge();
const runImages = decisionBridge('ai:decide-images');

test('JEV bridge takes build identity and billing context from the host, not the iframe', async () => {
  const payload = { state: 'fixture', questions: { q: { type: 'noul', instructions: 'Judge' } }, buildId: 999, appMcpSessionId: 'forged', billAiEnergy: false };
  const calls = [];
  const policies = [];
  const invocation = { appMcpSessionId: 'trusted', appMcpCallId: 'active-call' };
  const response = { answers: { q: { type: 'noul', noul: 0.5 } }, aiUsagePolicy: { energyRemaining: 100 } };
  const result = await run(payload, { userIdRef: { current: 17 } }, {
    callBuildRuntimeAiDecisionRef: { current: async input => { calls.push(input); return response; } }
  }, () => invocation, () => { throw new Error('guest_restricted'); }, { current: policy => policies.push(policy) });
  assert.equal(result, response);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].buildId, 91);
  assert.equal(calls[0].state, payload.state);
  assert.equal(calls[0].questions, payload.questions);
  assert.equal(calls[0].appMcpInvocation, invocation);
  assert.equal(calls[0].billAiEnergy, undefined);
  assert.deepEqual(policies, [response.aiUsagePolicy]);
});

test('guest and failed JEV calls cannot update Energy or synthesize an answer', async () => {
  let calls = 0;
  let updates = 0;
  const refs = { callBuildRuntimeAiDecisionRef: { current: async () => { calls++; throw new Error('AI Energy exhausted'); } } };
  const policy = { current: () => updates++ };
  await assert.rejects(run({}, { userIdRef: { current: 0 } }, refs, () => null, () => { throw new Error('guest_restricted'); }, policy), /guest_restricted/);
  assert.equal(calls, 0);
  await assert.rejects(run({}, { userIdRef: { current: 17 } }, refs, () => null, () => {}, policy), /AI Energy exhausted/);
  assert.equal(calls, 1);
  assert.equal(updates, 0);
});

test('JEV is a paid mutating request, so existing inactive-preview protections apply', () => {
  const source = fs.readFileSync('src/containers/Build/PreviewPanel/helpers/previewRequestPolicy.ts', 'utf8');
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports });
  assert.equal(exports.isMutatingPreviewRequestType('ai:decide'), true);
});

test('the authenticated request helper preserves canonical usage errors and never retries', async () => {
  const source = fs.readFileSync('src/contexts/requestHelpers/build.ts', 'utf8');
  const exports = {};
  const calls = [];
  const policy = { energyRemaining: 0 };
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === './axiosInstance') return { post: async (...args) => {
        calls.push(args);
        throw { response: { status: 403, data: { code: 'energy_exhausted', error: 'AI Energy exhausted', aiUsagePolicy: policy } } };
      } };
      if (name === '~/constants/URL') return 'https://fixture.invalid';
      // constructed when the helpers are built; unused by decisions
      if (name === '~/helpers/buildRewardRuntimeRenewal') return { createRewardRuntimeRenewal: () => async () => { throw new Error('unused'); } };
      return {};
    },
    console
  });
  const helpers = exports.default({ auth: () => ({ headers: { authorization: 'fixture-token' } }), handleError: error => Promise.reject(error) });
  await assert.rejects(helpers.callBuildRuntimeAiDecision({ buildId: 91, state: 'fixture', questions: {} }), error => {
    assert.equal(error.status, 403);
    assert.equal(error.code, 'energy_exhausted');
    assert.equal(error.aiUsagePolicy, policy);
    return true;
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'https://fixture.invalid/build/91/runtime-ai-decision');
  assert.equal(calls[0][2].headers.authorization, 'fixture-token');
  // no images: the body is exactly the old one
  assert.equal(Object.prototype.hasOwnProperty.call(calls[0][1], 'images'), false);
});

test('the request helper forwards serialized images and keeps an image decision\'s unavailable reason', async () => {
  const source = fs.readFileSync('src/contexts/requestHelpers/build.ts', 'utf8');
  const exports = {};
  const calls = [];
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(compiled, {
    exports,
    require(name) {
      if (name === './axiosInstance') return { post: async (...args) => {
        calls.push(args);
        throw { response: { status: 503, data: { code: 'ai_decision_unavailable', error: 'Image decisions are not available right now.', reason: 'disabled', requestId: '0b8a3f1e-4c2d-4e5f-8a9b-1c2d3e4f5a6b' } } };
      } };
      if (name === '~/constants/URL') return 'https://fixture.invalid';
      if (name === '~/helpers/buildRewardRuntimeRenewal') return { createRewardRuntimeRenewal: () => async () => { throw new Error('unused'); } };
      return {};
    },
    console
  });
  const helpers = exports.default({ auth: () => ({ headers: {} }), handleError: error => Promise.reject(error) });
  const images = { drawing: { kind: 'snapshot', mimeType: 'image/png', dataBase64: 'iVBORw0KGgo=' } };
  await assert.rejects(helpers.callBuildRuntimeAiDecision({ buildId: 91, state: { a: 1 }, questions: {}, images }), error => {
    assert.equal(error.code, 'ai_decision_unavailable');
    assert.equal(error.reason, 'disabled');
    assert.equal(error.requestId, '0b8a3f1e-4c2d-4e5f-8a9b-1c2d3e4f5a6b');
    return true;
  });
  assert.equal(calls[0][1].images, images);
});

test('image decisions serialize Blob snapshots, pass uploads through and require the server to have seen every picture', async () => {
  const png = new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3])], { type: 'image/png' });
  const url = 'https://d3jvoamd2k4p0s.cloudfront.net/attachments/build-runtime/91/a/drawing.png';
  const payload = { state: { prompt: 'cat' }, questions: { q: { type: 'noul', instructions: 'Is `drawing` a cat?' } },
    images: { drawing: { kind: 'snapshot', blob: png }, photo: { kind: 'upload', url } } };
  const calls = [];
  const ok = { answers: { q: { type: 'noul', noul: 0.8 } }, imageCount: 2, aiUsagePolicy: { energyRemaining: 5 } };
  const refs = { callBuildRuntimeAiDecisionRef: { current: async input => { calls.push(input); return ok; } } };
  const result = await runImages(payload, { userIdRef: { current: 17 } }, refs, () => null, () => {}, { current: () => {} });
  assert.equal(result, ok);
  assert.equal(calls.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0].images.photo)), { kind: 'upload', url });
  assert.equal(calls[0].images.drawing.kind, 'snapshot');
  assert.equal(calls[0].images.drawing.mimeType, 'image/png');
  assert.deepEqual([...Buffer.from(calls[0].images.drawing.dataBase64, 'base64')], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
  assert.equal(calls[0].buildId, 91);

  // an API that ignored the pictures must never pass for an image decision
  const blind = { callBuildRuntimeAiDecisionRef: { current: async () => ({ answers: ok.answers }) } };
  await assert.rejects(runImages(payload, { userIdRef: { current: 17 } }, blind, () => null, () => {}, { current: () => {} }),
    error => error.code === 'ai_decision_unavailable' && error.reason === 'images_not_supported');

  // the plain ai:decide path never forwards images, even if an app adds them
  const plainCalls = [];
  await run({ ...payload }, { userIdRef: { current: 17 } }, { callBuildRuntimeAiDecisionRef: { current: async input => { plainCalls.push(input); return ok; } } }, () => null, () => {}, { current: () => {} });
  assert.equal(plainCalls[0].images, undefined);
});

test('image payloads are bounded before any request', async () => {
  const { serializeBuildDecisionImages } = loadImagesHelper();
  const big = new Blob([new Uint8Array(3 * 1024 * 1024 + 1)], { type: 'image/png' });
  await assert.rejects(serializeBuildDecisionImages({ a: { kind: 'snapshot', blob: big } }), /at most 3 MB/);
  await assert.rejects(serializeBuildDecisionImages({ a: { kind: 'snapshot', blob: new Blob(['x'], { type: 'image/gif' }) } }), /PNG, JPEG or WebP/);
  await assert.rejects(serializeBuildDecisionImages({ Bad: { kind: 'upload', url: 'x' } }), /lowercase/);
  await assert.rejects(serializeBuildDecisionImages({}), /1 to 4/);
  const five = Object.fromEntries(['a', 'b', 'c', 'd', 'e'].map(name => [name, { kind: 'upload', url: 'u' }]));
  await assert.rejects(serializeBuildDecisionImages(five), /1 to 4/);
  const two = new Blob([new Uint8Array(Math.floor(2.6 * 1024 * 1024))], { type: 'image/jpeg' });
  await assert.rejects(serializeBuildDecisionImages({ a: { kind: 'snapshot', blob: two }, b: { kind: 'snapshot', blob: two } }), /total at most 5 MB/);
  await assert.rejects(serializeBuildDecisionImages({ a: { kind: 'snapshot', blob: 'not a blob' } }), /upload URL from this app or a picture snapshot/);
});

test('image decisions are paid mutating requests like ai:decide', () => {
  const source = fs.readFileSync('src/containers/Build/PreviewPanel/helpers/previewRequestPolicy.ts', 'utf8');
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports });
  assert.equal(exports.isMutatingPreviewRequestType('ai:decide-images'), true);
});
