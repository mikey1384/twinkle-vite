import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));

// Mikey 10-10: members kept pressing Accept on "Wants to help build" because
// nothing showed it was working. The tapped answer must spin, both answers
// must lock, and repeated taps must send one request.
const contexts = `
import {useSyncExternalStore} from 'react';
const listeners=new Set();
const emit=()=>listeners.forEach(fn=>fn());
window.calls={accept:0,reject:0,acceptInvite:0,declineInvite:0};
const pending={};
const hold=name=>new Promise(resolve=>{pending[name]=resolve});
window.finish=name=>pending[name]&&pending[name]();
const chat={state:{
  buildContributionMembershipByKey:{'41:9':{active:false,__eventTime:0},'42:7':{active:false,__eventTime:0}},
  buildCollaborationRequestsById:{},buildCollaborationRequestMembershipByKey:{},buildContributionInvitesById:{},buildContributionInviteMembershipByKey:{},channelsObj:{}
},actions:{
  onUpdateBuildCollaborationState:()=>{},onUpdateBuildContributionMembership:()=>{}
}};
const app={requestHelpers:{
  acceptBuildCollaborationRequest:()=>{window.calls.accept++;return hold('accept').then(()=>({success:false}))},
  rejectBuildCollaborationRequest:()=>{window.calls.reject++;return hold('reject').then(()=>({success:false}))},
  acceptBuildContributorInvite:()=>{window.calls.acceptInvite++;return hold('acceptInvite').then(()=>({success:false}))},
  declineBuildContributorInvite:()=>{window.calls.declineInvite++;return hold('declineInvite').then(()=>({success:false}))},
  loadBuildContributionMembership:async()=>({active:false})
}};
const build={state:{},actions:{onInvalidateBuildStudioBrowseTab:()=>{},onInvalidateBuildStudioCollaboratingBuilds:()=>{}}};
function useSelected(bag,select){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn)},()=>select(bag))}
export const useChatContext=fn=>useSelected(chat,fn);
export const useAppContext=fn=>useSelected(app,fn);
export const useBuildContext=fn=>useSelected(build,fn);
export const useKeyContext=fn=>fn({myState:{userId:7}});
window.rerender=emit;
`;
const fixture = `
import React from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faSpinner,faCheck,faUsers,faExternalLinkAlt,faCodeBranch} from '@fortawesome/pro-solid-svg-icons';
import BuildCollaborationRequest from './src/containers/Chat/Message/MessageBody/BuildCollaborationRequest';
import BuildContributionInvite from './src/containers/Chat/Message/MessageBody/BuildContributionInvite';
library.add(faSpinner,faCheck,faUsers,faExternalLinkAlt,faCodeBranch);
const root=createRoot(document.getElementById('root'));
root.render(<MemoryRouter>
  <div data-testid="request"><BuildCollaborationRequest content="" myId={7}
    sender={{id:9,username:'LG_Twins'}}
    request={{type:'build_collaboration_request',buildId:41,requestId:5,requesterUserId:9,ownerUserId:7,title:'Twinkle Newspaper',status:'pending'}}/></div>
  <div data-testid="invite"><BuildContributionInvite __INVITE_PROPS__/></div>
</MemoryRouter>);
`;

async function compileFixture(inviteProps) {
  return build({
    stdin: { contents: fixture.replace('__INVITE_PROPS__', inviteProps), resolveDir: repo, loader: 'tsx' },
    bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'transform',
    define: { 'process.env.NODE_ENV': '"development"', 'import.meta.env': '{}' },
    plugins: [{
      name: 'isolated-build-cards',
      setup(builder) {
        const stubs = { '~/contexts': contexts, '~/helpers/analytics': 'export function trackEvent(){}' };
        builder.onResolve({ filter: /.*/ }, args => {
          if (args.path in stubs) return { path: args.path, namespace: 'fixture' };
          if (args.path.startsWith('~/')) return builder.resolve(path.join(repo, 'src', args.path.slice(2)), { resolveDir: repo, kind: args.kind });
        });
        builder.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: stubs[args.path], loader: 'jsx', resolveDir: repo }));
      }
    }]
  });
}

async function inviteProps() {
  // a pending invite to member 7 from the project owner
  return `channelId={0} content="" myId={7} sender={{id:9,username:'LG_Twins'}}
    invite={{type:'build_contributor_invite',buildId:42,inviteId:8,userId:7,invitedByUserId:9,title:'Twinkle Newspaper',status:'pending'}}`;
}

test('build join request and invite cards spin, lock and send one answer per tap burst', { timeout: 60000 }, async () => {
  const result = await compileFixture(await inviteProps());
  let browser;
  const errors = [];
  try {
    browser = await chromium.launch({ headless: true, timeout: 10000 });
    const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
    page.setDefaultTimeout(4000);
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => route.abort());
    await page.setContent('<div id="root"></div>');
    await page.addStyleTag({ content: '*{box-sizing:border-box}html{font-size:10px}body{margin:0;font-family:Arial}' });
    await page.addScriptTag({ content: result.outputFiles[0].text });

    for (const [card, accept, other, acceptKey] of [
      ['request', 'Accept', 'Decline', 'accept'],
      ['invite', 'Accept', 'Decline', 'acceptInvite']
    ]) {
      const scope = page.getByTestId(card);
      const acceptButton = scope.getByRole('button', { name: accept, exact: true });
      const otherButton = scope.getByRole('button', { name: other, exact: true });
      await acceptButton.waitFor();
      assert.equal(await acceptButton.isEnabled(), true);
      // three quick taps: the first locks the card before React re-renders
      await acceptButton.evaluate(el => { el.click(); el.click(); el.click(); });
      await page.waitForFunction(k => window.calls[k] === 1, acceptKey);
      assert.equal(await acceptButton.getAttribute('aria-busy'), 'true', `${card}: tapped answer shows it is working`);
      assert.equal(await acceptButton.isDisabled(), true);
      assert.equal(await otherButton.isDisabled(), true, `${card}: the other answer locks too`);
      await otherButton.click({ force: true }).catch(() => {});
      assert.equal(await page.evaluate(k => window.calls[k], acceptKey), 1, `${card}: one request for the burst`);
      // the server answers: both buttons come back for a retry
      await page.evaluate(k => window.finish(k), acceptKey);
      await page.waitForFunction(sel => !document.querySelector(sel)?.getAttribute('aria-busy'), `[data-testid="${card}"] button[aria-busy]`);
      assert.equal(await acceptButton.isEnabled(), true, `${card}: unlocks after the reply`);
      assert.equal(await otherButton.isEnabled(), true);
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
  }
});
