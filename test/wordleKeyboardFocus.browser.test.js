import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build, stop } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = path.resolve(repo, '../work/wordle-keyboard-hang-20261026');
const contexts = `
import React from 'react';
import chatRequestHelpers from '~/contexts/requestHelpers/chat';
const helpers=chatRequestHelpers({auth:()=>({}),handleError:error=>Promise.reject(error)});
const app={user:{actions:{onToggleWordleStrictMode: v=>window.setStrict(v)}},requestHelpers:{...helpers,
  toggleWordleStrictMode:async v=>{window.strictCalls.push(v);return {wordleStrictMode:v}}
}};
export const useAppContext=s=>s(app);
export const useChatContext=s=>s({actions:{onSetChannelState:({newState})=>window.setCanonical(newState)}});
export const useNotiContext=s=>s({state:{todayStats:{nextDayTimeStamp:1793059200}},actions:{onApplyTodayStatsProgress(){}}});
export const useKeyContext=s=>s({myState:{userId:5,profileTheme:'logoBlue',wordleStrictMode:window.strictMode},theme:{done:{color:'logoBlue'}}});
`;
const entry = `
import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import WordleModal from './src/containers/Chat/Modals/WordleModal';
window.strictCalls=[];window.strictMode=false;
function Fixture(){
 const [canonical,setCanonical]=useState({wordleGuesses:['ROATE'],wordleAttemptState:{},wordleStats:{}});
 const [,setStrict]=useState(false);
 window.setCanonical=setCanonical;window.setStrict=v=>{window.strictMode=v;setStrict(v)};
 return <MemoryRouter><WordleModal channelId={157435485} channelName="General" solution="GHOST"
  attemptState={canonical.wordleAttemptState} guesses={canonical.wordleGuesses} wordLevel={2}
  wordleStats={canonical.wordleStats} theme="logoBlue" onHide={()=>{window.closed=true}}/></MemoryRouter>
}
createRoot(document.getElementById('root')).render(<Fixture/>);
`;

let script;
async function compile() {
  if (script) return script;
  const stubs = {
    '~/contexts': contexts,
    '~/helpers': 'export const isMobile=()=>false,isTablet=()=>false,buildTodayStatsPatchFromDailyTaskStatus=x=>x,getDailyRewardPreviewStreak=()=>221,emitAdminTelemetry=()=>{},attemptUpload=()=>{};',
    '~/components/Icon': 'export default function Icon(){return null}',
    '~/components/ErrorBoundary': 'export default function Boundary({children}){return children}',
    '~/helpers/websiteAgentScreenState': 'export const useAgentScreenState=()=>{};',
    '~/helpers/analytics': 'export const trackEvent=()=>{},trackCoinSpend=()=>{};',
    '~/helpers/hooks/useUserActivity': 'export default function useUserActivity(){}',
    '~/helpers/ownerTrace': 'export const isOwnerTraceActive=()=>false,traceOwnerRequest=()=>{};',
    '~/helpers/websiteAgentAction': 'export const WEBSITE_AGENT_ACTION_HEADER="x-test-agent",isWebsiteAgentActionActive=()=>false;',
    '~/helpers/aiImageStatus': 'export const pollCanonicalRequestStatus=()=>{};',
    '~/constants/URL': 'export default "http://localhost:3000";',
    '~/components/LumineRescueEntry': 'export default function Rescue(){return null}',
    '~/components/NextDayCountdown': 'export default function Countdown(){return "11:23:21"}',
    './OverviewModal': `import React from 'react';import Modal from '~/components/Modal';export default function Overview({onHide}){return <Modal isOpen title="Stats" onClose={onHide} modalLevel={1}><label>Fixture text input<input aria-label="Fixture text input"/></label><button autoFocus onClick={onHide}>Back to Wordle</button></Modal>}`,
    './Rankings': 'export default function Rankings(){return null}',
    './Streaks': 'export default function Streaks(){return null}',
    '~/theme/hooks/useRoleColor': 'export const useRoleColor=()=>({color:"#438cf2",colorKey:"logoBlue",getColor:()=>"#438cf2"});',
    '~/theme/hooks/useSectionPanelVars': 'export const useSectionPanelVars=()=>({themeName:"logoBlue",accentColor:"#438cf2",headerTextColor:"#333",headerTextShadow:"none",styleVars:{}});',
    '~/theme/ScopedTheme': 'export default function Theme({children}){return children}'
  };
  try {
    const result = await build({
      stdin: { contents: entry, resolveDir: repo, loader: 'tsx' },
      bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'transform',
      define: {'process.env.NODE_ENV':'"development"','import.meta.env':'{"DEV":false}'},
      plugins: [{ name: 'wordle-focus-fixture', setup(b) {
        b.onResolve({filter:/.*/},a=>Object.hasOwn(stubs,a.path)?{path:a.path,namespace:'fixture'}:undefined);
        b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:stubs[a.path],loader:'jsx',resolveDir:repo}));
      }}]
    });
    script = result.outputFiles[0].text;
    return script;
  } finally { stop(); }
}

for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  test(`${name}: Wordle focus, button submission, overlays and lost-response recovery`, {timeout:90000}, async()=>{
    mkdirSync(artifacts,{recursive:true});
    const js=await compile();
    const css=readFileSync(path.join(repo,'src/styles.css'),'utf8');
    const html=`<meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><div id="modal"></div><script>${js.replaceAll('</script','<\\/script')}</script>`;
    const browser=await engine.launch({headless:true});
    const page=await browser.newPage({viewport:{width:1280,height:1000}});
    const errors=[];
    const attempts=[];
    const reads=[];
    let hangSubmission=false;
    let commitHungSubmission=true;
    let failRead=false;
    let serverGuesses=['ROATE'];
    const canonical=()=>({wordleGuesses:serverGuesses,wordleSolution:'GHOST',wordleWordLevel:2,wordleStats:{},
      wordleAttemptState:{isCompleted:false,isSolved:false,isFailed:false},dailyTaskStatus:{},nextDayTimeStamp:1793059200});
    page.on('pageerror',error=>errors.push(error.message));
    page.setDefaultTimeout(5000);
    try {
      await page.route('**/*',async r=>{
        const request=r.request();
        const url=new URL(request.url());
        if(request.isNavigationRequest())return r.fulfill({contentType:'text/html',body:html});
        if(url.pathname==='/chat/wordle/skipShield/resolve')return r.fulfill({json:{shieldActive:true,todayDodgePending:true,todayCovered:false,checklist:{metLumine:true,builtWithLumineToday:false,triedPeerBuildToday:true,todayCovered:false}}});
        if(url.pathname==='/chat/wordle/attempt'){
          const body=request.postDataJSON();attempts.push(body);
          if(!hangSubmission||commitHungSubmission)serverGuesses=body.guesses;
          if(hangSubmission)return;
          return r.fulfill({json:canonical()});
        }
        if(url.pathname==='/chat/wordle'){
          reads.push(url.pathname);
          return r.fulfill(failRead?{status:503,json:{error:'Fixture offline'}}:{json:canonical()});
        }
        return r.abort();
      });
      await page.goto('http://localhost:3000/__wordle-focus');
      const shield=page.getByTitle(/^Skip protection —/);
      await shield.click();
      await page.getByRole('region',{name:'Wordle skip protection status'}).waitFor();
      // Chromium keeps pointer focus; explicitly focus in WebKit too, exercising
      // the same native keyboard-focus path for keyboard users there.
      await shield.focus();
      await page.keyboard.type('thong');
      await page.getByRole('group',{name:'Typing (not entered yet): T H O N G',exact:true}).waitFor();
      const beforeEnter=await page.evaluate(()=>({tag:document.activeElement.tagName,label:document.activeElement.getAttribute('aria-label'),title:document.activeElement.title}));
      await page.keyboard.press('Enter');
      await page.getByRole('group',{name:/^Guess: T /}).waitFor();
      const outcome={attempts:[...attempts],detailsVisible:await page.getByRole('region',{name:'Wordle skip protection status'}).isVisible()};
      writeFileSync(path.join(artifacts,`${name}-focus-evidence.json`),JSON.stringify({beforeEnter,...outcome},null,2));
      assert.equal(outcome.attempts.length,1,'Enter must submit the typed guess, not toggle the focused status button');
      assert.deepEqual(outcome.attempts[0].guesses,['ROATE','THONG']);
      assert.equal(outcome.detailsVisible,true,'Submitting must leave the status panel unchanged');
      // The normal reveal ends without requiring a remount; the next guess works.
      await page.waitForTimeout(1800);
      await page.screenshot({path:path.join(artifacts,`${name}-submission.png`)});
      await page.keyboard.type('stone');
      await page.getByRole('button',{name:'Enter',exact:true}).click();
      await page.getByRole('group',{name:/^Guess: S /}).waitFor();
      assert.equal(attempts.length,2);

      async function reset() {
        serverGuesses=['ROATE'];attempts.length=0;reads.length=0;
        hangSubmission=false;commitHungSubmission=true;failRead=false;
        await page.reload();await shield.waitFor();
      }
      // Each status entry point can retain focus; all must hand typing back.
      for(const title of [/221-day Daily Tasks streak/,/Today's Wordle/]) {
        await reset();
        const control=page.getByTitle(title);
        await control.click();await control.focus();
        await page.keyboard.type('thong');await page.keyboard.press('Enter');
        await page.getByRole('group',{name:/^Guess: T /}).waitFor();
        assert.equal(attempts.length,1);
      }
      await reset();
      const details=page.getByRole('button',{name:'Show details',exact:true});
      await details.focus();await page.keyboard.press('Enter');
      await page.getByRole('button',{name:'Hide details',exact:true}).waitFor();
      assert.equal(attempts.length,0,'Keyboard activation of a status control must not submit');
      await page.keyboard.type('thong');
      await page.getByRole('button',{name:'Hide details',exact:true}).click();
      await page.keyboard.press('Backspace');await page.keyboard.type('g');
      await page.keyboard.press('Enter');
      await page.getByRole('group',{name:/^Guess: T /}).waitFor();
      assert.equal(attempts.length,1,'Editing after closing details must resume physical submission');

      await reset();
      const strict=page.getByRole('switch',{name:'Aim for Double Bonus'});
      await strict.focus();await page.keyboard.press('Enter');
      await page.waitForFunction(()=>window.strictMode===true);
      assert.equal(attempts.length,0,'Enter on the switch only changes strict mode');
      await strict.focus();await page.keyboard.press('Enter');
      await page.waitForFunction(()=>window.strictMode===false);
      // The on-screen keyboard works even after a panel retains focus.
      await shield.click();await shield.focus();
      for(const letter of 'THONG')await page.getByRole('button',{name:letter,exact:true}).click();
      await page.getByRole('button',{name:'Enter',exact:true}).click();
      await page.getByRole('group',{name:/^Guess: T /}).waitFor();
      assert.equal(attempts.length,1);

      await reset();
      await page.getByRole('button',{name:'Stats',exact:true}).click();
      const back=page.getByRole('button',{name:'Back to Wordle',exact:true});
      await back.waitFor();
      await page.keyboard.type('thong');
      assert.equal(await page.getByRole('group',{name:'Typing (not entered yet): T H O N G',exact:true}).count(),0);
      const text=page.getByRole('textbox',{name:'Fixture text input'});
      await text.fill('thong');await text.press('Enter');
      assert.equal(attempts.length,0,'Nested dialogs must not play the board behind them');
      await back.click();
      await shield.click();await page.keyboard.type('thong');
      await page.keyboard.press('Enter');
      await page.getByRole('group',{name:/^Guess: T /}).waitFor();
      assert.equal(attempts.length,1,'Returning from Stats must release keyboard input');

      // Use the real request helper, scheduler and Axios. Only the server is
      // intercepted, including a response that never arrives after committing.
      await reset();await page.clock.install();
      hangSubmission=true;
      await page.getByRole('group',{name:'Wordle board and keyboard',exact:true}).focus();
      await page.keyboard.type('thong');await page.keyboard.press('Enter');
      await page.waitForFunction(()=>document.querySelector('button:disabled')!==null);
      assert.equal(attempts.length,1);
      await page.keyboard.press('Enter');
      await page.keyboard.press('Backspace');
      assert.match(page.url(),/\/__wordle-focus$/,'Pending input must not navigate back');
      assert.equal(attempts.length,1,'Pending guesses cannot submit twice');
      await page.clock.fastForward(21000);
      await page.getByRole('group',{name:/^Guess: T /}).waitFor();
      assert.ok(reads.length>=2,'A lost response must reconcile through the canonical reader');
      assert.equal(attempts.length,1,'Timeout must not replay the mutation');
      await page.keyboard.type('stone');
      hangSubmission=false;
      await page.getByRole('button',{name:'Enter',exact:true}).click();
      await page.getByRole('group',{name:/^Guess: S /}).waitFor();
      assert.deepEqual(attempts[1].guesses,['ROATE','THONG','STONE']);

      await reset();hangSubmission=true;commitHungSubmission=false;failRead=true;
      await page.getByRole('group',{name:'Wordle board and keyboard',exact:true}).focus();
      await page.keyboard.type('thong');await page.keyboard.press('Enter');
      await page.waitForFunction(()=>document.querySelector('button:disabled')!==null);
      await page.clock.fastForward(21000);
      await page.getByText("Couldn't load today's Wordle.",{exact:true}).waitFor();
      await page.screenshot({path:path.join(artifacts,`${name}-recovery.png`)});
      failRead=false;hangSubmission=false;
      await page.getByRole('button',{name:'Try again',exact:true}).click();
      await shield.waitFor();
      await page.getByRole('group',{name:'Wordle board and keyboard',exact:true}).focus();
      await page.keyboard.type('thong');await page.keyboard.press('Enter');
      await page.getByRole('group',{name:/^Guess: T /}).waitFor();
      assert.deepEqual(attempts[1].guesses,['ROATE','THONG']);

      await reset();
      await page.getByRole('group',{name:'Wordle board and keyboard',exact:true}).focus();
      await page.keyboard.press('Control+c');await page.keyboard.press('Meta+c');
      await page.getByRole('group',{name:'Next guess (empty)',exact:true}).waitFor();
      await page.keyboard.down('t');await page.keyboard.down('t');await page.keyboard.up('t');
      await page.getByRole('group',{name:'Typing (not entered yet): T',exact:true}).waitFor();
      await page.keyboard.down('Backspace');await page.keyboard.down('Backspace');await page.keyboard.up('Backspace');
      await page.getByRole('group',{name:'Next guess (empty)',exact:true}).waitFor();
      assert.match(page.url(),/\/__wordle-focus$/,'Held Backspace must not navigate back');
      await page.keyboard.type('thong');await page.keyboard.press('NumpadEnter');
      await page.getByRole('group',{name:/^Guess: T /}).waitFor();
      assert.equal(attempts.length,1,'Repeated keydown must not duplicate letters; keypad Enter submits');

      await page.setViewportSize({width:360,height:800});await reset();
      await shield.click();
      for(const letter of 'THONG')await page.getByRole('button',{name:letter,exact:true}).click();
      await page.getByRole('button',{name:'Enter',exact:true}).click();
      await page.getByRole('group',{name:/^Guess: T /}).waitFor();
      await page.clock.fastForward(1800);
      await page.screenshot({path:path.join(artifacts,`${name}-phone.png`)});
      assert.equal(attempts.length,1);
      assert.deepEqual(errors,[]);
    } catch (error) {
      writeFileSync(path.join(artifacts,`${name}-failure.json`),JSON.stringify({errors,body:await page.locator('body').innerText()},null,2));
      throw error;
    } finally { await browser.close(); }
  });
}
