import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium, webkit } = require(process.env.PLAYWRIGHT_MODULE || '/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = process.env.PROFILE_COVER_MANAGEMENT_ARTIFACTS;

async function compileFixture() {
  const stubs = {
    '~/contexts': `import React,{createContext,useContext} from 'react'; const C=createContext(null);
      export const FixtureProvider=C.Provider; export const useAppContext=fn=>fn(useContext(C));
      export const useKeyContext=fn=>fn({myState:useContext(C).myState});
      export const useChatContext=fn=>fn({state:{chatStatus:{}}});`,
    '~/helpers': `export const isMobile=()=>window.innerWidth<768; export const isTablet=()=>false;`,
    '~/helpers/hooks': `export const useOutsideClick=()=>{}; export function useSearch({onSearch,onClear,onSetSearchText}) {
      return {searching:false,handleSearch(text){onSetSearchText(text);onClear?.();if(text)void onSearch(text);}}; }`,
    '~/helpers/stringHelpers': `export const renderText=x=>x; export const addEmoji=x=>x; export const stringIsEmpty=x=>!String(x||'').trim();`,
    '~/helpers/scrollAnchorRestorationCoordinator': 'export const releaseScrollAnchorTopPin=()=>{};',
    '~/helpers/profileCanonicalState': 'export const getCanonicalProfilePictureUrl=()=>null;',
    '~/helpers/userDataHelpers': 'export const getStoredItem=()=>null; export const setStoredItem=()=>{};',
    '~/theme/ScopedTheme': `import React from 'react'; export default ({children})=><>{children}</>;`,
    '~/theme/hooks/useThemeTokens': `export const useThemeTokens=()=>({themeName:'platinum',themeRoles:{cover:{color:'logoBlue'},coverText:{color:'white'},done:{color:'blue'}}});`,
    '~/theme/hooks/useRoleColor': `export const useRoleColor=(_,o)=>({colorKey:o?.fallback||'blue',getColor:()=> '#418ceb'});`,
    '~/theme/hooks/useSectionPanelVars': `export const useSectionPanelVars=()=>({themeName:'logoBlue',accentColorKey:'logoBlue',headerTextColor:'#1e293b',headerTextShadow:'none',successColor:'green',styleVars:{'--section-panel-border-color':'#ccd8e5','--section-panel-bg':'#fff','--section-panel-body-bg':'#fff','--section-panel-header-bg':'#f0f6fb'}});`,
    '~/components/ErrorBoundary': `import React from 'react'; export default ({children,innerRef,...p})=><div ref={innerRef} className={p.className} style={p.style}>{children}</div>;`,
    '~/components/Icon': `import React from 'react'; export default ({icon})=><span aria-hidden="true">{icon==='flag'?'⚑':icon==='search'?'⌕':''}</span>;`,
    '~/components/ProfilePic': `import React from 'react'; export default ({style})=><span style={{display:'inline-block',width:24,height:24,borderRadius:'50%',background:'#f2c650',...style}}/>;`,
    '~/components/ColorSelector': 'export default ()=>null;',
    '~/components/Modals/AlertModal': 'export default ()=>null;',
    '~/components/Modals/ImageModal': 'export default ()=>null;',
    '~/components/Modals/ImageEditModal': 'export default ()=>null;',
    '~/components/Modals/ProfilePicModal': 'export default ()=>null;',
    '~/components/Modals/UsernameHistoryModal': 'export default ()=>null;',
    '~/components/Buttons/ShareButton': `import React from 'react'; export default ()=> <span>Share</span>;`,
    '~/components/Texts/UserTitle': 'export default ()=>null;',
    '~/components/AchievementBadges': 'export default ()=>null;',
    '~/components/ChessLevelBadge': 'export default ()=>null;',
    '~/components/BroughtFriendsBadge': 'export default ()=>null;',
    '~/components/BroughtFriendsBadge/tiers': `export const BROUGHT_FRIENDS_ANCHOR_ID='friends'; export const readReferrals=x=>x;`,
    '~/components/ThemeCoverBackdrop': `import React from 'react'; export default ({cover})=><div style={{position:'absolute',inset:0,background:'#7397b4'}} data-cover-image={cover.photoUrl||''}/>;`,
    '~/components/PlatinumSurface/styles': `export const platinumCoverInk=()=>({color:'#fff',shadow:'none'});`,
    '~/components/ChatSafety/ReportMessageModal': `import React from 'react'; export default ({coverKey,onHide})=><div data-cover-report>{coverKey}<button onClick={onHide}>Close report</button></div>;`,
    '~/components/Loading': `import React from 'react'; export default ()=> <span>Loading...</span>;`,
    '~/components/Buttons/LoadMoreButton': 'export default ()=>null;',
    './usePlatinumCover': `export default ()=>({saving:false,uploading:false,uploadProgress:0,error:'',removeCover:()=>{},saveSettings:()=>{},uploadCover:()=>{}});`
  };
  const result = await build({
    stdin: { contents: readFileSync(path.join(repo, 'test/fixtures/profileCoverManagement.tsx'), 'utf8'), resolveDir: repo, loader: 'tsx' },
    bundle: true, write: false, format: 'iife', platform: 'browser', alias: { '~': path.join(repo, 'src') },
    define: { 'import.meta.env': JSON.stringify({ VITE_CLOUDFRONT_KEY: 'fixture' }), 'process.env.NODE_ENV': '"development"' },
    loader: { '.png': 'dataurl', '.webp': 'dataurl', '.jpg': 'dataurl', '.svg': 'dataurl' },
    plugins: [{ name: 'cover-fixture-services', setup(builder) {
      builder.onResolve({ filter: /.*/ }, ({ path: specifier }) => stubs[specifier] ? { path: specifier, namespace: 'fixture' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path: specifier }) => ({ contents: stubs[specifier], loader: 'jsx', resolveDir: repo }));
    }}]
  });
  return result.outputFiles[0].text;
}

async function selectMember(page, text) {
  await page.getByPlaceholder('Search members...').fill(text);
  await page.locator('#outer-layer nav').filter({ hasText: text }).click();
}

for (const [name, browserType] of Object.entries({ chromium, webkit })) {
  test(`cover removal lives in Management and acts on the reviewed image (${name})`, { timeout: 300000 }, async () => {
    const script = await compileFixture();
    const browser = await browserType.launch({ timeout: 90000 });
    try {
      for (const width of [360, 1280]) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        page.setDefaultTimeout(30000);
        page.setDefaultNavigationTimeout(45000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route('**/*', route => {
          const url = route.request().url();
          if (url.startsWith('https://fixture.cloudfront.net/profile/')) return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="300"><rect width="1000" height="300" fill="#4496a7"/><circle cx="500" cy="130" r="75" fill="#ffda75"/></svg>' });
          if (url === 'http://localhost:3000/') return route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}[data-management]{max-width:780px;margin:20px auto}</style></head><body><div id="root"></div><div id="outer-layer"></div><div id="modal"></div></body></html>` });
          return route.abort();
        });
        await page.goto('http://localhost:3000/');
        await page.addScriptTag({ content: script });
        await page.waitForFunction(() => typeof window.setViewer === 'function');
        const profile = page.locator('[data-profile]');
        const management = page.locator('[data-management]');
        assert.equal(await profile.getByRole('button', { name: 'Remove cover', exact: true }).count(), 0);
        await profile.getByRole('button', { name: 'Report cover photo' }).dispatchEvent('click');
        assert.match(await page.locator('[data-cover-report]').textContent(), /profile\/42\/a.jpg/);
        await page.getByText('Close report').click();

        await page.evaluate(() => window.setViewer(6));
        await page.waitForFunction(() => window.renderedViewerId === 6);
        assert.equal(await management.getByText('Profile covers').count(), 0, 'other users cannot see the management tool');
        assert.equal(await profile.getByRole('button', { name: 'Report cover photo' }).count(), 1);
        await page.evaluate(() => window.setViewer(42));
        await page.waitForFunction(() => window.renderedViewerId === 42);
        assert.equal(await profile.getByRole('button', { name: 'Remove cover photo' }).count(), 1, 'owner retains own cover controls');
        await page.evaluate(() => window.setViewer(5));
        await page.waitForFunction(() => window.renderedViewerId === 5);

        await page.evaluate(() => { window.deferLoads = true; });
        await selectMember(page, 'PlatinumMember');
        await page.waitForFunction(() => !!window.deferredLoads[42]);
        await selectMember(page, 'AnotherMember');
        await page.waitForFunction(() => !!window.deferredLoads[43]);
        await page.evaluate(() => window.deferredLoads[43]());
        await management.getByAltText("AnotherMember's current cover photo").waitFor();
        await page.evaluate(() => window.deferredLoads[42]());
        await page.waitForTimeout(50);
        assert.equal(await management.getByAltText("AnotherMember's current cover photo").count(), 1, 'late lookup cannot replace the selected member');
        await page.evaluate(() => { window.deferLoads = false; });

        await selectMember(page, 'PlatinumMember');
        await management.getByAltText("PlatinumMember's current cover photo").waitFor();
        assert.equal(await page.evaluate(() => window.removalCalls.length), 0);
        if (artifacts) {
          mkdirSync(artifacts, { recursive: true });
          await management.scrollIntoViewIfNeeded();
          await page.screenshot({ path: path.join(artifacts, `${name}-${width}-cover-selected.png`), animations: 'disabled' });
        }
        await management.getByRole('button', { name: 'Remove cover', exact: true }).click();
        const dialog = page.getByRole('dialog');
        assert.match(await dialog.textContent(), /PlatinumMember/);
        if (artifacts) await page.screenshot({ path: path.join(artifacts, `${name}-${width}-confirmation.png`), animations: 'disabled' });
        await dialog.getByRole('button', { name: 'Cancel' }).click();
        assert.equal(await page.evaluate(() => window.removalCalls.length), 0, 'cancel does not remove');

        await management.getByRole('button', { name: 'Remove cover', exact: true }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Remove cover' }).click();
        await page.waitForFunction(() => window.removalCalls.length === 1);
        assert.deepEqual(await page.evaluate(() => window.removalCalls[0]), { id: 42, cover: '/profile/42/a.jpg' });
        assert.equal(await management.getByAltText("PlatinumMember's current cover photo").count(), 1, 'no optimistic removal');
        await page.evaluate(() => window.rejectRemoval({ message: 'Synthetic network failure' }));
        await management.getByRole('alert').filter({ hasText: 'Synthetic network failure' }).waitFor();
        assert.equal(await management.getByAltText("PlatinumMember's current cover photo").count(), 1);

        await management.getByRole('button', { name: 'Remove cover', exact: true }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Remove cover' }).click();
        await page.evaluate(() => window.rejectRemoval({ code: 'profile_cover_changed', message: 'This cover changed. Search again.' }));
        await management.getByRole('alert').filter({ hasText: 'This cover changed' }).waitFor();
        assert.equal(await management.getByAltText("PlatinumMember's current cover photo").count(), 0, 'stale cover cannot be removed again');

        await selectMember(page, 'PlatinumMember');
        await management.getByAltText("PlatinumMember's current cover photo").waitFor();
        await management.getByRole('button', { name: 'Remove cover', exact: true }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Remove cover' }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
        await page.evaluate(() => { window.fixtureProfiles[42].profileCoverUrl = '/profile/42/replacement.jpg'; });
        await selectMember(page, 'PlatinumMember');
        await management.getByAltText("PlatinumMember's current cover photo").waitFor();
        await page.evaluate(() => window.resolveRemoval({ success: true, userId: 42, profileCoverUrl: null, profileCoverPosition: null }));
        await page.waitForTimeout(50);
        assert.match(await management.getByAltText("PlatinumMember's current cover photo").getAttribute('src'), /replacement\.jpg$/, 'late removal cannot erase a newer lookup');
        assert.equal(await page.evaluate(() => window.userUpdates.length), 0, 'late removal does not overwrite newer cached state');

        await management.getByRole('button', { name: 'Remove cover', exact: true }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Remove cover' }).click();
        await page.evaluate(() => window.resolveRemoval({ success: true, userId: 42, profileCoverUrl: '/profile/42/new.jpg', profileCoverPosition: '50,50' }));
        await management.getByText('The reviewed cover was removed. PlatinumMember has since added another cover photo.').waitFor();
        assert.match(await management.getByAltText("PlatinumMember's current cover photo").getAttribute('src'), /new\.jpg$/, 'a newer canonical cover stays visible');

        await page.evaluate(() => { window.fixtureProfiles[42].profileCoverUrl = '/profile/42/a.jpg'; });
        await selectMember(page, 'PlatinumMember');
        await management.getByAltText("PlatinumMember's current cover photo").waitFor();
        await management.getByRole('button', { name: 'Remove cover', exact: true }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Remove cover' }).click();
        await page.evaluate(() => window.resolveRemoval({ success: true, userId: 42, profileCoverUrl: null, profileCoverPosition: null }));
        await management.getByText("PlatinumMember's cover photo was removed.").waitFor();
        assert.deepEqual(await page.evaluate(() => window.userUpdates.at(-1)), { userId: 42, newState: { profileCoverUrl: null, profileCoverPosition: null } });
        assert.equal(await management.getByText('This member has no cover photo.').count(), 1);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'no horizontal overflow');
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally { await browser.close(); }
  });
}
