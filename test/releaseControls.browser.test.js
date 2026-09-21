import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require(
  process.env.PLAYWRIGHT_MODULE ||
    '/Users/mikey/.npm-packages/lib/node_modules/playwright'
);
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = process.env.RELEASE_CONTROLS_ARTIFACTS;
const fixture = `
import React,{useState,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import PinsProvider from './src/containers/Chat/Pins';
import PinsButton from './src/containers/Chat/Pins/PinsButton';
import AppReferencePicker from './src/containers/Build/Editor/ChatPanel/AppReferencePicker';
import CommentFeedbackQuotes from './src/containers/Build/Editor/ChatPanel/CommentFeedbackQuotes';
window.viewer=1;window.pinRevision=1;window.pinVisible=true;
window.pinSnapshot=()=>({channelId:20,subchannelId:0,topicId:0,revision:window.pinRevision,canManage:true,
 pins:window.pinVisible?[{id:1,messageId:101,content:'Remember our study plan',username:'Turtle',pinnedByUsername:'Turtle',timeStamp:1789970000}]:[],
 pinnedMessageIds:window.pinVisible?[101]:[],total:window.pinVisible?1:0,nextCursor:null});
window.requests={
 loadChatPins:async()=>window.pinSnapshot(),
 updateChatPin:async()=>new Promise(resolve=>{window.finishUnpin=()=>{window.pinVisible=false;window.pinRevision++;resolve(window.pinSnapshot());};}),
 loadBuildChatReferenceApps:async()=>({apps:[{id:2460,title:'Math Lab',relationship:'own'},{id:100,title:'Team garden',relationship:'team',username:'programmer'}],cursor:null})
};
function Fixture(){const [revision,setRevision]=useState(0),[picker,setPicker]=useState(false),[selected,setSelected]=useState([]);const anchor=useRef(null);
 window.changeViewer=()=>{window.viewer++;setRevision(v=>v+1);};
 return <main data-revision={revision}><PinsProvider channelId={20} subchannelId={0} topicId={0}><PinsButton/></PinsProvider>
 <section style={{marginTop:70}}><CommentFeedbackQuotes feedback={[{buildId:10,buildTitle:'My garden',comment:{id:77,username:'programmer',content:'Could the flowers remember their colors?'}}]} disabled={false} onRemove={()=>{}}/>
 <button ref={anchor} onClick={()=>setPicker(true)}>Reference an app</button><output>{selected.map(a=>a.title).join(', ')}</output>
 {picker&&<AppReferencePicker buildId={10} anchorRef={anchor} selectedApps={selected} onClose={()=>setPicker(false)} onSelect={app=>{setSelected(old=>[...old,app]);setPicker(false);}}/>}</section></main>;
}createRoot(document.getElementById('root')).render(<Fixture/>);
`;

let compiled;
async function bundle() {
  if (compiled) return compiled;
  const stubs = {
    '~/contexts':
      'export const useAppContext=select=>select({requestHelpers:window.requests});export const useKeyContext=select=>select({myState:{userId:window.viewer}});',
    '~/contexts/Toast': 'export const useToast=()=>()=>{};',
    '~/constants/sockets/api': 'export const socket={on(){},off(){}};',
    '~/components/Icon':
      'import React from "react";export default ({icon})=><span aria-hidden="true">{String(icon)}</span>;',
    '~/components/Button':
      'import React from "react";export default ({children,variant,...props})=><button {...props}>{children}</button>;',
    '~/components/Loading': 'export default ()=>"Loading…";',
    '~/components/Buttons/LoadMoreButton':
      'import React from "react";export default ({onClick})=><button onClick={onClick}>Load more</button>;',
    '~/components/Modal':
      'import React from "react";export default ({children,title,onClose,className})=><section role="dialog" aria-label={title} className={className} style={{background:"white",padding:24,maxWidth:600,margin:"16px auto"}}><h2>{title}</h2><button onClick={onClose}>Close pins</button>{children}</section>;'
  };
  const result = await build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    alias: { '~': path.join(repo, 'src') },
    define: {
      'import.meta.env': '{}',
      'process.env.NODE_ENV': '"development"'
    },
    plugins: [
      {
        name: 'release-controls',
        setup(builder) {
          builder.onResolve({ filter: /.*/ }, ({ path }) =>
            stubs[path] ? { path, namespace: 'fixture' } : undefined
          );
          builder.onLoad(
            { filter: /.*/, namespace: 'fixture' },
            ({ path }) => ({
              contents: stubs[path],
              loader: 'jsx',
              resolveDir: repo
            })
          );
        }
      }
    ]
  });
  compiled = result.outputFiles[0].text;
  return compiled;
}
for (const [engine, browserType] of Object.entries({ chromium, webkit })) {
  test(
    `pins and reference controls keep canonical state and work on narrow screens (${engine})`,
    { timeout: 30000 },
    async () => {
      const script = await bundle();
      const browser = await browserType.launch();
      try {
        const page = await browser.newPage({
          viewport: { width: 1280, height: 850 }
        });
        page.setDefaultTimeout(5000);
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.setContent(
          `<style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}main{padding:20px;max-width:700px;margin:auto}</style><div id="root"></div>`
        );
        await page.addScriptTag({ content: script });
        await page
          .getByRole('button', { name: 'Pinned messages (1)', exact: true })
          .click();
        await page
          .getByText('Remember our study plan', { exact: true })
          .waitFor();
        if (artifacts) {
          mkdirSync(artifacts, { recursive: true });
          await page.screenshot({
            path: path.join(artifacts, `${engine}-pins.png`)
          });
        }
        await page.getByRole('button', { name: 'Unpin', exact: true }).click();
        await page.waitForFunction(
          () => typeof window.finishUnpin === 'function'
        );
        assert.equal(
          await page
            .getByText('Remember our study plan', { exact: true })
            .count(),
          1,
          'pending writes must not optimistically remove a pin'
        );
        await page.evaluate(() => window.finishUnpin());
        await page
          .getByText('No pinned messages yet', { exact: true })
          .waitFor();
        await page.getByRole('button', { name: 'Close pins' }).click();
        await page.evaluate(() => {
          window.requests.loadChatPins = async () => {
            throw new Error('different account');
          };
          window.changeViewer();
        });
        await page
          .getByRole('button', { name: 'Pinned messages', exact: true })
          .click();
        await page
          .getByText('Couldn’t load pinned messages. Please try again.', {
            exact: true
          })
          .waitFor();
        assert.equal(
          await page
            .getByText('Remember our study plan', { exact: true })
            .count(),
          0
        );
        await page.getByRole('button', { name: 'Close pins' }).click();
        for (const width of [1280, 390]) {
          await page.setViewportSize({ width, height: 850 });
          await page.getByRole('button', { name: 'Reference an app' }).click();
          await page
            .getByRole('button', { name: 'Math Lab, your app', exact: true })
            .waitFor();
          const bounds = await page.locator('dialog').boundingBox();
          assert.ok(bounds.x >= -1 && bounds.x + bounds.width <= width + 1);
          if (artifacts)
            await page.screenshot({
              path: path.join(artifacts, `${engine}-${width}-references.png`)
            });
          await page.keyboard.press('Escape');
        }
        await page.getByRole('button', { name: 'Reference an app' }).click();
        await page
          .getByRole('button', { name: 'Math Lab, your app', exact: true })
          .click();
        assert.equal(await page.locator('output').textContent(), 'Math Lab');
        assert.deepEqual(errors, []);
      } finally {
        await browser.close();
      }
    }
  );
}
