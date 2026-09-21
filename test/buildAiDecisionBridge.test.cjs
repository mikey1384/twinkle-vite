const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

function decisionBridge() {
  const source = fs.readFileSync('src/containers/Build/PreviewPanel/hooks/useHostBridge.ts', 'utf8');
  const ast = ts.createSourceFile('bridge.ts', source, ts.ScriptTarget.Latest, true);
  let clause;
  function visit(node) {
    if (ts.isCaseClause(node) && ts.isStringLiteral(node.expression) && node.expression.text === 'ai:decide') clause = node.getText(ast);
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.ok(clause);
  const code = `(async function(payload, previewAuth, requestRefs, getActiveAppMcpInvocation, triggerGuestRestriction, onAiUsagePolicyUpdateRef) {
    const activeBuild = { id: 91 }; const sourceWindow = {}; let response;
    switch ('ai:decide') { ${clause} }
    return response;
  })`;
  return vm.runInNewContext(ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText);
}

const run = decisionBridge();

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
});
