const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function bridge() {
  const source = fs.readFileSync('src/containers/Build/PreviewPanel/hooks/useHostBridge.ts', 'utf8');
  const ast = ts.createSourceFile('bridge.ts', source, ts.ScriptTarget.Latest, true);
  const names = new Set(['shared-db:get-topics', 'shared-db:get-entries', 'shared-db:get-entries-by-ids', 'shared-db:create-topic', 'private-db:get']);
  const clauses = [];
  function visit(node) {
    if (ts.isCaseClause(node) && ts.isStringLiteral(node.expression) && names.has(node.expression.text)) clauses.push(node.getText(ast));
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.equal(clauses.length, names.size);
  return vm.runInNewContext(ts.transpileModule(`(async function(type, payload, previewAuth, requestRefs, ensureBuildApiToken, isGuestViewerActive) { const activeBuild={id:2206}; let response; switch(type){${clauses.join('\n')}} return response; })`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText);
}
const run = bridge();
for (const guest of [true, false]) test(`shared reads route ${guest ? 'guests publicly without minting a token' : 'members through scoped authentication'}`, async () => {
  let tokenCalls = 0;
  const calls=[];
  const refs=Object.fromEntries(['getSharedDbTopicsRef','getSharedDbEntriesRef','getSharedDbEntriesByIdsRef'].map(name=>[name,{current:async args=>{calls.push(args);return {canonical:name}}}]));
  const token = async scopes => {tokenCalls++; assert.deepEqual(Array.from(scopes),['sharedDb:read']);return 'fixture-scope-token'};
  for (const type of ['shared-db:get-topics','shared-db:get-entries','shared-db:get-entries-by-ids']) await run(type,{topicName:'songs',entryIds:[2,4],cursor:{id:9}}, {}, refs, token, ()=>guest);
  assert.equal(tokenCalls,guest?0:3);
  for (const call of calls) { assert.equal(call.publicRead,guest); assert.equal(call.token,guest?undefined:'fixture-scope-token');assert.equal(call.buildId,2206); }
  assert.equal(calls[1].topicName,'songs');assert.deepEqual(Array.from(calls[2].entryIds),[2,4]);
});
test('guest public reads do not authorize writes or private storage',async()=>{
  for (const type of ['shared-db:create-topic','private-db:get']) {
    await assert.rejects(run(type,{}, {}, {},async()=>{throw new Error('guest_restricted')},()=>true),/guest_restricted/);
  }
});
test('request helpers use the public endpoint only for explicitly public reads',async()=>{
  const source=fs.readFileSync('src/contexts/requestHelpers/build.ts','utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const calls=[];const exported={};
  vm.runInNewContext(compiled,{exports:exported,require(name){if(name==='./axiosInstance')return {post:async(...args)=>{calls.push(args);return{data:{entries:[]}}}};if(name==='~/constants/URL')return 'https://fixture.invalid';return {}},console});
  const helpers=exported.default({auth:()=>({headers:{}}),handleError:error=>Promise.reject(error)});
  for (const [method,suffix] of [['getSharedDbTopics','topics'],['getSharedDbEntries','entries'],['getSharedDbEntriesByIds','entries/by-ids']]) {
    await helpers[method]({buildId:2206,topicName:'songs',entryIds:[1],publicRead:true});
    assert.equal(calls.at(-1)[0],`https://fixture.invalid/build/2206/public-shared-db/${suffix}`);
    await helpers[method]({buildId:2206,token:'fixture'});
    assert.equal(calls.at(-1)[0],`https://fixture.invalid/build/2206/api/shared-db/${suffix}`);
    assert.equal(calls.at(-1)[2].headers['x-build-api-token'],'fixture');
  }
});
