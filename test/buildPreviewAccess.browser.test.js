import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
const require = createRequire(import.meta.url);
const {
  chromium
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const baseline = process.env.PREVIEW_ACCESS_BASELINE === '1';
const artifacts = process.env.PREVIEW_ACCESS_ARTIFACTS;

const fixture = `
import React,{useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {useRuntimePreviewSrc,useWorkspacePreviewSrc} from './src/containers/Build/PreviewPanel/hooks/useSource';
import PreviewStage from './src/containers/Build/PreviewPanel/PreviewStage';
window.calls=[];window.failures=[];window.defer=false;
const request=async args=>{window.calls.push(args);if(window.defer)await new Promise(r=>window.resolveRequest=r);const status=window.failures.shift();if(status)throw Object.assign(Error('fixture'),{status});return {token:'allowed-'+args.buildId,scopes:args.scopes,expiresAt:Math.floor(Date.now()/1000)+3600}};
const auth={buildRef:{current:null},userIdRef:{current:18933},isOwnerRef:{current:false},buildApiTokenRef:{current:null},getBuildApiTokenRef:{current:request}};
window.auth=auth;
function Fixture(){
 const [config,setConfig]=useState({id:1706,userId:5,isPublic:true,currentArtifactVersionId:100,canOpenContributionWorkspace:true,viewer:18933,mode:'runtime',view:'preview'});
 const [nonce,setNonce]=useState(0);const [runtimeError,setRuntimeError]=useState(null);const [workspaceError,setWorkspaceError]=useState(null);
 window.configure=changes=>setConfig(x=>({...x,...changes}));window.retry=()=>setNonce(x=>x+1);
 const app=useMemo(()=>({...config,title:'Fixture',username:'owner'}),[config]);auth.buildRef.current=app;auth.userIdRef.current=config.viewer;
 const r=useRuntimePreviewSrc({build:app,enabled:config.mode==='runtime',previewSrcOverride:null,requireSignedAccess:false,userId:config.viewer,previewAuth:auth,onAccessError:setRuntimeError,retryNonce:nonce});
 const w=useWorkspacePreviewSrc({build:app,runtimeOnly:config.mode!=='workspace',viewMode:config.view,userId:config.viewer,previewAuth:auth,onAccessError:setWorkspaceError,retryNonce:nonce});
 const src=config.mode==='runtime'?r:w;const error=config.mode==='runtime'?runtimeError:workspaceError;
 window.currentSrc=src;window.currentError=error;
 return <main>{!src&&error?<PreviewStage accessError={error} onRetryAccess={window.retry}/>:src?<iframe title="Fixture game" src={src}/>:<p>Opening game...</p>}</main>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
`;
async function bundle() {
  const stub = {
    '~/helpers/buildPreviewOriginHelpers': `export const buildPreviewFrameSrc=s=>'http://localhost:3000'+s;export const canUseSameOriginBuildPreviewSandbox=()=>true;export const buildPreviewFrameWindowName=()=>'';`,
    '~/constants/defaultValues':
      'export const ADULT_ACHIEVEMENT_ID=1,TEENAGER_ACHIEVEMENT_ID=2,cloudFrontURL="";',
    '~/helpers/buildProfilePicUrl':
      'export const toBuildProfilePicUrl=()=>null;',
    '~/helpers/userDataHelpers':
      'export const getStoredItem=()=>null,setStoredItem=()=>{};',
    '~/components/Icon': 'export default function Icon(){return null}',
    '~/components/GameProgressBar': 'export default function Bar(){return null}'
  };
  const output = await build({
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
        name: 'preview-fixture',
        setup(b) {
          b.onResolve({ filter: /.*/ }, (args) => {
            if (stub[args.path]) return { path: args.path, namespace: 'stub' };
            if (
              args.path === './useHostBridge' &&
              args.importer.endsWith('/useSource.ts')
            )
              return { path: 'auth', namespace: 'stub' };
          });
          b.onLoad({ filter: /.*/, namespace: 'stub' }, (args) => ({
            contents:
              args.path === 'auth'
                ? `export {ensureBuildApiToken} from ${JSON.stringify(path.join(repo, 'src/containers/Build/PreviewPanel/helpers/previewBridgeAuth.ts'))};`
                : stub[args.path],
            loader: 'jsx',
            resolveDir: repo
          }));
          if (baseline)
            b.onLoad({ filter: /PreviewPanel\/hooks\/useSource\.ts$/ }, () => ({
              contents: execFileSync(
                'git',
                [
                  'show',
                  'HEAD:src/containers/Build/PreviewPanel/hooks/useSource.ts'
                ],
                { cwd: repo, encoding: 'utf8' }
              ),
              loader: 'ts',
              resolveDir: path.join(
                repo,
                'src/containers/Build/PreviewPanel/hooks'
              )
            }));
        }
      }
    ]
  });
  return output.outputFiles[0].text;
}

test(
  'preview authorization survives publication, transient failure, view changes and viewer changes',
  { timeout: 60000 },
  async () => {
    const script = await bundle();
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage({
        viewport: { width: 360, height: 740 }
      });
      const requests = [];
      await page.route('http://localhost:3000/**', async (route) => {
        const u = new URL(route.request().url());
        if (u.pathname.startsWith('/build/preview/')) {
          const signed =
            u.searchParams.get('buildApiToken') ===
            'allowed-' + u.pathname.split('/')[4];
          const published = u.pathname.includes('/version/101');
          requests.push({
            url: u.pathname,
            signed,
            status: signed || published ? 200 : 403
          });
          return route.fulfill({
            status: signed || published ? 200 : 403,
            contentType: 'text/html',
            body: signed || published ? 'Game ready' : 'Not authorized'
          });
        }
        return route.fulfill({
          contentType: 'text/html',
          body: '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>html{font-size:16px}body{margin:0;--chat-text:#253047;--ui-border:#bac3ce}main{height:100vh}iframe{width:100%;height:100%;border:0}</style><div id="root"></div>'
        });
      });
      await page.clock.install();
      await page.goto('http://localhost:3000/');
      await page.addScriptTag({ content: script });
      await page.waitForFunction(() => window.currentSrc);
      await page.waitForFunction(
        () =>
          document.querySelector('iframe')?.contentDocument?.body?.textContent
      );
      if (baseline) {
        assert.equal(requests[0].status, 403);
        assert.equal(await page.evaluate(() => window.calls.length), 0);
        console.log(
          'BASELINE reproduced: team member received unsigned old-release403'
        );
        return;
      }
      assert.equal(requests[0].status, 200);
      assert.equal(requests[0].signed, true);
      await page.clock.fastForward(3_575_000);
      await page.waitForFunction(() => window.calls.length === 2);
      assert.equal(
        await page.evaluate(() => window.currentSrc.includes('buildApiToken')),
        true,
        'scheduled refresh retains signed access'
      );
      const runningSrc = await page.evaluate(() => window.currentSrc);
      await page.evaluate(() => {
        window.failures = [503];
      });
      await page.clock.fastForward(3_575_000);
      await page.waitForFunction(() => window.calls.length === 3);
      assert.equal(
        await page.evaluate(() => window.currentSrc),
        runningSrc,
        'a failed token refresh preserves the running game'
      );
      await page.clock.fastForward(1000);
      await page.waitForFunction(() => window.calls.length === 4);
      assert.equal(await page.evaluate(() => window.currentError), null);
      await page.evaluate(() => {
        window.failures = [503, 503, 503, 503];
      });
      await page.clock.fastForward(3_575_000);
      await page.waitForFunction(() => window.calls.length === 5);
      for (const [delay, expected] of [
        [1000, 6],
        [3000, 7],
        [10_000, 8]
      ]) {
        await page.clock.fastForward(delay);
        await page.waitForFunction((n) => window.calls.length === n, expected);
      }
      await page.waitForFunction(() => Boolean(window.currentError));
      assert.equal(await page.evaluate(() => window.currentSrc), runningSrc);
      await page.clock.fastForward(60_000);
      assert.equal(
        await page.evaluate(() => window.calls.length),
        8,
        'automatic retries stop after the bounded backoff'
      );
      await page.evaluate(() => {
        document.dispatchEvent(new Event('visibilitychange'));
        window.dispatchEvent(new Event('focus'));
      });
      await page.waitForFunction(
        () => window.calls.length === 9 && !window.currentError
      );
      assert.equal(
        await page.evaluate(() => window.currentSrc),
        runningSrc,
        'returning to the app recovers exhausted retries without replacing the game'
      );
      await page.evaluate(() => {
        window.auth.buildApiTokenRef.current = null;
        window.failures = [503];
        window.configure({ mode: 'workspace', id: 1707 });
      });
      await page.waitForFunction(() =>
        window.calls.some((x) => x.buildId === 1707)
      );
      await page.clock.fastForward(1000);
      await page.waitForFunction(() =>
        window.currentSrc?.includes('allowed-1707')
      );
      assert.equal(
        requests.some((r) => r.status === 403),
        false
      );
      assert.equal(
        await page.evaluate(
          () => window.calls.filter((x) => x.buildId === 1707).length
        ),
        2
      );
      const workspaceSrc = await page.evaluate(() => window.currentSrc);
      await page.evaluate(() => window.configure({ view: 'code' }));
      await page.waitForTimeout(30);
      assert.equal(
        await page.evaluate(() => window.currentSrc),
        workspaceSrc,
        'code view retains the authorized frame source'
      );
      await page.evaluate(() => {
        window.auth.buildApiTokenRef.current = null;
        window.failures = [403];
        window.configure({ id: 1708, view: 'preview' });
      });
      await page.getByRole('alert').waitFor();
      assert.equal(await page.evaluate(() => window.currentSrc), null);
      assert.match(
        await page.getByRole('alert').innerText(),
        /no longer have access/
      );
      for (const width of [360, 960]) {
        await page.setViewportSize({ width, height: 740 });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          ),
          true
        );
        if (artifacts) {
          mkdirSync(artifacts, { recursive: true });
          await page.screenshot({
            path: path.join(artifacts, 'access-retry-' + width + '.png')
          });
        }
      }
      await page.getByRole('button', { name: 'Try again' }).click();
      await page.waitForFunction(() =>
        window.currentSrc?.includes('allowed-1708')
      );
      await page.evaluate(() => {
        window.auth.buildApiTokenRef.current = null;
        window.defer = true;
        window.configure({ id: 1709 });
      });
      await page.waitForFunction(
        () => typeof window.resolveRequest === 'function'
      );
      await page.evaluate(() => {
        window.configure({ viewer: null });
        window.resolveRequest();
      });
      await page.waitForFunction(
        () => window.currentError === 'Sign in to open this preview.'
      );
      assert.equal(
        await page.evaluate(() => window.currentSrc),
        null,
        'late token cannot cross viewer identity'
      );
      await page.evaluate(() => {
        window.defer = false;
        window.configure({
          mode: 'runtime',
          viewer: null,
          id: 1710,
          canOpenContributionWorkspace: false,
          currentArtifactVersionId: 101
        });
      });
      await page.waitForFunction(() => window.currentSrc?.includes('/1710/'));
      assert.equal(
        await page.evaluate(() => window.currentSrc.includes('buildApiToken')),
        false,
        'public guests stay unsigned'
      );
      assert.equal(
        requests.some((r) => r.status === 403),
        false
      );
    } finally {
      await browser.close();
    }
  }
);
