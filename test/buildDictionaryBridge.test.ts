import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isMutatingPreviewRequestType } from '../src/containers/Build/PreviewPanel/helpers/previewRequestPolicy';

// Execute the real SDK methods and host switch together. Reads must be free
// of mutation gates; status recovery can finish an existing Battery charge.
const sdkSource = readFileSync(new URL('../../twinkle-api/helpers/build/preview/sdk/apiDataScript.ts', import.meta.url),'utf8');
const sdk = new Function('sendRequest','window',`return {${sdkSource.slice(sdkSource.indexOf('    wordMaster: {'),sdkSource.indexOf('    grammarbles: {'))}}.wordMaster;`);
const source = readFileSync(new URL('../src/containers/Build/PreviewPanel/hooks/useHostBridge.ts', import.meta.url),'utf8');
const block = source.slice(source.indexOf("          case 'content:word-master:words':"),source.indexOf("          case 'content:grammarbles:questions':"));
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
const host = new AsyncFunction('type','payload','ensureBuildApiToken','requestRefs','onAiUsagePolicyUpdateRef',`
  const activeBuild={id:1696},previewAuth={},runtimeOnly=false;
  const appMcpControlsThisTab=()=>false;
  const sanitizeBuildAppAiUsagePolicyPayload=value=>{const {aiUsagePolicy,...publicValue}=value;return publicValue};
  let response; switch(type){${block}} return response;
`);
test('dictionary methods route exact payloads, enforce Battery recovery scope, and sanitize policy', async () => {
  for (const [name,operation,write] of [
    ['lookupWord','dictionary',false],
    ['generateKoreanDefinition','korean-definition',true],
    ['getKoreanDefinition','korean-definition-status',true]
  ] as const) {
    const calls:any[]=[],policies:any[]=[];
    const api = sdk((type:string,payload:any)=>{
      assert.equal(isMutatingPreviewRequestType(type),write);
      return host(type,payload,async(scopes:string[])=>{calls.push(scopes);return 'token';},
        {requestBuildWordMasterRef:{current:async(args:any)=>{calls.push(args);return {word:{id:100},aiUsagePolicy:{privateIdentity:'hidden'}};}}},
        {current:(policy:any)=>policies.push(policy)});
    },{});
    const payload={wordId:100,requestId:'stable-dictionary-request',useAiBattery:true};
    assert.deepEqual(await api[name](payload),{word:{id:100}});
    assert.deepEqual(calls[0],[write?'content:write':'content:read']);
    assert.deepEqual(calls[1],{buildId:1696,operation,token:'token',payload:{...payload,mode:'preview'}});
    assert.equal(policies.length,1);
  }
});
