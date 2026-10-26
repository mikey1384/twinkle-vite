import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = process.env.PROFILE_THEME_ARTIFACTS;
let bundle;

async function compileFixture() {
  if (bundle) return bundle;
  const stubs = {
    '~/contexts': `const noop=()=>{};
      export const useAppContext=fn=>fn({requestHelpers:{auth:noop}});
      export const useContentContext=fn=>fn({actions:{onReloadContent:noop}});
      export const useInputContext=fn=>fn({state:{},actions:{onSetEditedStatusColor:noop,onSetEditedStatusMsg:noop}});
      export const useProfileContext=fn=>fn({actions:{onResetProfile:noop}});
      export const useKeyContext=fn=>fn({myState:{profileTheme:window.viewerTheme}});`,
    '~/components/Link': `import React from 'react';export default ({to,children,...props})=><a href={to} {...props}>{children}</a>;`,
    '~/components/Texts/UserTitle': `import React from 'react';export default ({className})=><span className={className}>Member</span>;`,
    '~/components/Texts/Bio': 'export default ()=>null;',
    './StatusInput': 'export default ()=>null;',
    './StatusMsg': 'export default ()=>null;',
    '~/components/Modals/ConfirmModal': 'export default ()=>null;',
    '~/components/ErrorBoundary': `import React from 'react';export default class Boundary extends React.Component {
      state={error:false};static getDerivedStateFromError(){return {error:true};}
      componentDidCatch(error){window.renderErrors.push(error.message);}
      render(){return this.state.error?<p role="alert">Profile failed</p>:<div style={this.props.style}>{this.props.children}</div>;}
    }`,
    '~/helpers/stringHelpers': 'export const addEmoji=x=>x;export const finalizeEmoji=x=>x;export const renderText=x=>x;export const replaceFakeAtSymbol=x=>x;',
    axios: 'export default {delete(){throw Error("Unexpected request");},put(){throw Error("Unexpected request");}};'
  };
  const fixture = `
    import React,{useState} from 'react';
    import {createRoot} from 'react-dom/client';
    import {library} from '@fortawesome/fontawesome-svg-core';
    import {faUserEdit} from '@fortawesome/pro-solid-svg-icons';
    import UserDetails from './src/components/UserDetails';
    import GoToBottomButton from './src/components/Buttons/GoToBottomButton';
    import Boundary from '~/components/ErrorBoundary';
    import {Color} from './src/constants/css';
    import {PROFILE_THEME_LADDER} from './src/constants/profileThemes';
    library.add(faUserEdit);
    window.renderErrors=[];window.bottomClicks=0;window.bioClicks=0;
    window.knownThemes=PROFILE_THEME_LADDER.map(item=>item.theme);
    window.expectedColor=(key,opacity=1)=>{const el=document.createElement('span');el.style.color=Color[key](opacity);return el.style.color;};
    function Fixture(){
      const [entry,setEntry]=useState({label:'initial',theme:'logoBlue',owner:false});
      window.setTheme=next=>{window.viewerTheme=next.theme;setEntry(next);};
      const profile={id:2,username:'ThemeMember',profileTheme:entry.theme};
      return <main data-case={entry.label}><Boundary key={entry.label}>
        <UserDetails profile={profile} userId={entry.owner?2:1} unEditable={!entry.owner} onSetBioEditModalShown={()=>window.bioClicks++}/>
        <GoToBottomButton theme={entry.buttonTheme??''} onClick={()=>window.bottomClicks++}/>
      </Boundary></main>;
    }
    createRoot(document.getElementById('root')).render(<Fixture/>);
  `;
  const result = await build({
    stdin: { contents: fixture, loader: 'tsx', resolveDir: repo },
    bundle: true, write: false, format: 'iife', platform: 'browser',
    alias: { '~': path.join(repo, 'src') },
    define: { 'import.meta.env': '{}', 'process.env.NODE_ENV': '"development"' },
    plugins: [{ name: 'profile-theme-services', setup(builder) {
      builder.onResolve({ filter: /.*/ }, ({ path: name }) => stubs[name] ? { path: name, namespace: 'fixture' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path: name }) => ({ contents: stubs[name], loader: 'jsx', resolveDir: repo }));
    } }]
  });
  bundle = result.outputFiles[0].text;
  return bundle;
}

for (const [engine, type] of Object.entries({ chromium, webkit })) {
  test(`profile themes preserve known colors and fall back without crashing (${engine})`, { timeout: 90000 }, async () => {
    const script = await compileFixture();
    const browser = await type.launch();
    const observations = [];
    try {
      for (const width of [1280, 360]) {
        const page = await browser.newPage({ viewport: { width, height: 700 }, hasTouch: width < 768 });
        page.setDefaultTimeout(6000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', route => route.request().url() === 'http://localhost:3000/users'
          ? route.fulfill({ contentType: 'text/html', body: `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}main{max-width:500px;margin:20px auto;padding:12px;background:white}</style><div id="root"></div>` })
          : route.abort());
        await page.goto('http://localhost:3000/users');
        await page.addScriptTag({ content: script });
        await page.waitForFunction(() => typeof window.setTheme === 'function');
        const known = await page.evaluate(() => window.knownThemes);
        const cases = [
          ...known.map(theme => ({ label: theme, theme, expected: theme })),
          ...['future-theme', '__proto__', 'constructor', 'toString', 'hasOwnProperty', '', null, undefined, { future: true }]
            .map((theme, i) => ({ label: `unknown-${i}`, theme, expected: 'logoBlue' })),
          { label: 'unknown-owner', theme: 'future-theme', expected: 'logoBlue', owner: true },
          { label: 'known-owner', theme: 'platinum', expected: 'platinum', owner: true },
          { label: 'explicit-button-theme', theme: 'future-theme', expected: 'logoBlue', buttonTheme: 'gold', expectedButton: 'gold' }
        ];
        for (const entry of cases) {
          await page.mouse.move(1, 699);
          await page.evaluate(entry => window.setTheme(entry), entry);
          await page.locator(`main[data-case="${entry.label}"]`).waitFor();
          assert.deepEqual(await page.evaluate(() => window.renderErrors), [], `${width}/${entry.label}`);
          const link = page.getByRole('link', { name: 'ThemeMember', exact: true });
          await link.waitFor();
          assert.equal(await link.getAttribute('href'), '/users/ThemeMember');
          const color = await page.evaluate(key => window.expectedColor(key), entry.expected);
          const background = await page.evaluate(key => window.expectedColor(key, 0.6), entry.expectedButton || entry.expected);
          await page.waitForFunction(expected => getComputedStyle(document.querySelector('button[aria-label="Go to bottom"]')).backgroundColor === expected, background);
          if (width >= 768) {
            await link.hover();
            await page.waitForFunction(expected => getComputedStyle(document.querySelector('a')).color === expected, color);
          }
          if (entry.owner) {
            const button = page.getByRole('button', { name: 'Introduce yourself!', exact: true });
            const softBackground = await page.evaluate(key => window.expectedColor(key, 0.12), entry.expected);
            assert.equal(await button.evaluate(el => getComputedStyle(el).backgroundColor), softBackground);
            const before = await page.evaluate(() => window.bioClicks);
            await button.click();
            assert.equal(await page.evaluate(() => window.bioClicks), before + 1);
          }
          if (artifacts && ['platinum', 'unknown-0', 'unknown-owner'].includes(entry.label)) {
            mkdirSync(artifacts, { recursive: true });
            await page.screenshot({ path: path.join(artifacts, `${engine}-${width}-${entry.label}.png`), animations: 'disabled' });
          }
          observations.push({ width, case: entry.label, color, background });
        }
        const before = await page.evaluate(() => window.bottomClicks);
        await page.getByRole('button', { name: 'Go to bottom', exact: true }).click();
        assert.equal(await page.evaluate(() => window.bottomClicks), before + 1);
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally {
      await browser.close();
    }
    if (artifacts) writeFileSync(path.join(artifacts, `${engine}-results.json`), JSON.stringify(observations, null, 2) + '\n');
  });
}
