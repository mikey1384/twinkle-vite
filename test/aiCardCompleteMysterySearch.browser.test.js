import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const {
  chromium,
  webkit
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const artifacts = fileURLToPath(
  new URL('../../work/ai-card-complete-mystery', import.meta.url)
);

// Actual Explore page, search results, filter modal, picker panel, shared-link
// parser, and switch/button/input controls. Only account/data services, card
// artwork, and unrelated modals are fixtures. All data stays in this browser.
const fixture = `
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import Explore from './src/containers/Explore/AICards';
import Picker from './src/components/Modals/SelectAICardModal/FilterPanel';
import FilteredPicker from './src/components/Modals/SelectAICardModal/Filtered';
import ExplorePicker from './src/containers/Explore/AICards/SelectAICardModal';
import AICardComponent from './src/components/Texts/RichText/Markdown/EmbeddedComponent/InternalComponent/AICardComponent';
import {useAppContext,useChatContext} from '~/contexts';
function FilteredFixture({filters}) {
  const cardObj=useChatContext(v=>v.state.cardObj);
  const onUpdateAICard=useChatContext(v=>v.actions.onUpdateAICard);
  const loadFilteredAICards=useAppContext(v=>v.requestHelpers.loadFilteredAICards);
  return <FilteredPicker {...filters} aiCardModalType="offer" cardObj={cardObj} myId={1} myUsername="pilot" partnerId={8} partnerName="other" selectedCardIds={[]} onUpdateAICard={onUpdateAICard} loadFilteredAICards={loadFilteredAICards} onSetSelectedCardIds={()=>{}} onSetAICardModalCardId={()=>{}} successColor="green"/>;
}
function Fixture() {
  const location = useLocation(), navigate = useNavigate();
  const [picker, setPicker] = useState(null), [preview, setPreview] = useState(null);
  const [filteredRace,setFilteredRace]=useState(null), [explorePicker,setExplorePicker]=useState(null);
  window.currentSearch = location.search;
  window.goSearch = search => navigate('/ai-cards/?' + search);
  window.showPicker = () => setPicker({isMystery:true, quality:'rare'});
  window.showPreview = src => setPreview(src);
  window.showFilteredRace = filters => setFilteredRace(filters);
  window.showExplorePicker = () => setExplorePicker({isMystery:true,owner:'pilot'});
  window.hideExplorePicker = () => setExplorePicker(null);
  window.pickerFilters = picker;
  return <><main data-explore><Explore/></main>
    {picker && <section data-picker><Picker filters={picker} onSetFilters={setPicker} onDropdownShown={()=>{}} variant="explore"/></section>}
    {filteredRace && <section data-filtered-race><FilteredFixture filters={filteredRace}/></section>}
    {explorePicker && <section data-explore-picker><ExplorePicker filters={explorePicker} isBuy={false} onHide={()=>setExplorePicker(null)} onConfirm={()=>{}}/></section>}
    {preview && <section data-preview><AICardComponent src={preview} rootId={1} rootType="subject" isPreview/></section>}</>;
}
flushSync(() => createRoot(document.getElementById('root')).render(<MemoryRouter initialEntries={['/ai-cards/?search[quality]=rare&search[style]=watercolor&search[engine]=image-2.5&search[owner]=pilot&search[color]=black&search[isBuyNow]=true&search[minPrice]=40&search[maxPrice]=300']}><Fixture/></MemoryRouter>));
`;

let bundle;
async function compileFixture() {
  if (bundle) return bundle;
  const stubs = {
    '~/contexts': `
      import {useSyncExternalStore} from 'react';
      const listeners = new Set();
      const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
      const changed = () => listeners.forEach(fn => fn());
      const cards = [
        {id:2,quality:'rare',imagePath:'',style:'watercolor',engine:'image-2.5'},
        {id:7,quality:'???',imagePath:'',isTotalMystery:1},
        {id:5,quality:'???',imagePath:'',isTotalMystery:1},
        {id:3,quality:'???',imagePath:'',isTotalMystery:1},
        {id:4,quality:'elite',imagePath:'/revealed.png',isTotalMystery:1}
      ].map((card,i)=>({...card,ownerId:1,owner:{id:1,username:'pilot'},level:6,word:'cloud',askPrice:50+i*10,lastInteraction:100-i}));
      window.searchRequests=[];
      let explore = {loaded:true,cards, numCards:cards.length, filteredLoaded:true, filteredCards:[],prevFilters:{},numFilteredCards:0,filteredCardsTotalBv:0,filteredCardsNumHiddenBv:0};
      let chat = {cardObj:{}}, content = {cardIds:undefined};
      function update(patch){explore={...explore,...patch};changed();}
      const actions = {
        onLoadAICards: args=>update({...args,loaded:true}),
        onLoadFilteredAICards: args=>update({filteredCards:args.cards,filteredLoadMoreShown:args.loadMoreShown,filteredLoaded:true}),
        onLoadMoreFilteredAICards: args=>update({filteredCards:[...explore.filteredCards,...args.cards],filteredLoadMoreShown:args.loadMoreShown}),
        onSetNumFilteredCards: count=>update({numFilteredCards:count}),
        onSetFilteredCardsTotalBv: args=>update({filteredCardsTotalBv:args.totalBv,filteredCardsNumHiddenBv:args.numHiddenBvCards}),
        onSetPrevAICardFilters: prevFilters=>update({prevFilters}),
        onUpdateAICard: ({cardId,newState})=>{chat={cardObj:{...chat.cardObj,[cardId]:newState}};changed();},
        onSetDisplayedCardIds: ({cardIds})=>{content={cardIds};changed();}
      };
      const requestHelpers = {
        loadAICards:async()=>({cards,loadMoreShown:false,numCards:cards.length}),
        loadFilteredAICards:async args=>{
          window.searchRequests.push(JSON.parse(JSON.stringify(args)));
          const f=args.filters;
          let matching=cards.filter(card=>(!f.isTotalMystery||card.quality==='???'&&!card.imagePath)&&(!f.isMystery||!card.imagePath)&&(!f.quality||f.quality===card.quality)&&(!f.owner||f.owner===card.owner.username)&&(!f.style||f.style===card.style)&&(!f.engine||f.engine===card.engine));
          const numCards=matching.length, numHiddenBvCards=matching.filter(c=>c.quality==='???').length;
          if(args.lastInteraction) matching=matching.filter(c=>c.lastInteraction<args.lastInteraction);
          if(args.lastPrice) matching=matching.filter(c=>c.askPrice>args.lastPrice);
          const limit=args.limit||2;
          const response={cards:matching.slice(0,limit),loadMoreShown:matching.length>limit,numCards,totalBv:0,numHiddenBvCards};
          if(window.delayNextSearch){window.delayNextSearch=false;return new Promise(resolve=>{window.resolveDelayedSearch=()=>{window.resolveDelayedSearch=null;resolve(response);};});}
          return response;
        }
      };
      const account={myState:{userId:1,username:'pilot'}};
      export const useKeyContext=fn=>fn(account);
      export const useAppContext=fn=>fn({requestHelpers});
      export const useExploreContext=fn=>useSyncExternalStore(subscribe,()=>fn({state:{aiCards:explore},actions}));
      export const useChatContext=fn=>useSyncExternalStore(subscribe,()=>fn({state:chat,actions}));
      export const useContentContext=fn=>fn({actions});
      export const useFixtureContent=()=>useSyncExternalStore(subscribe,()=>content);
    `,
    '~/helpers': `export const isMobile=()=>navigator.maxTouchPoints>0; export const isTablet=()=>false;`,
    '~/helpers/hooks': `export {useFixtureContent as useContentState} from '~/contexts'; export const useOutsideClick=()=>{};`,
    '~/theme/hooks/useHomePanelVars': `export const useHomePanelVars=()=>({themeName:'logoBlue',themeRoles:{},accentColor:'#168be1'});`,
    '~/theme/hooks/useRoleColor': `export const useRoleColor=()=>({color:'#168be1',colorKey:'logoBlue',themeName:'logoBlue'});`,
    '~/theme/hooks/useScopedThemeVars': `export const useScopedThemeVars=()=>({vars:{}});`,
    '~/theme/hooks/useThemedCardVars': `export const useThemedCardVars=()=>({cardVars:{}});`,
    '~/components/ErrorBoundary': `export default ({children,style})=><div style={style}>{children}</div>;`,
    '~/components/Icon': `export default ({icon})=><span aria-hidden="true">{icon==='caret-down'?'▾':'↗'}</span>;`,
    '~/components/Buttons/ShareButton': `export default ({linkPath})=><a data-shared-link href={linkPath}>Share</a>;`,
    '~/components/AICard': `export default ({card})=><article data-card-id={card.id} style={{width:160,padding:20,border:'1px solid #ccc',borderRadius:12}}>Card #{card.id}<p>Quality: {card.quality}</p></article>;`,
    '~/components/Modals/AICardModal': `export default ()=>null;`,
    '~/components/Modal': `export default ({children})=><div role="dialog" style={{background:'white',border:'1px solid #ddd',margin:20,padding:20}}>{children}</div>;`,
    '~/components/Modal/LegacyModalLayout': `export default ({children})=><div>{children}</div>;`,
    '~/components/Loading': `export default ()=> <div>Loading…</div>;`,
    '~/components/EmptyStateMessage': `export default ({children})=><p>{children}</p>;`,
    '~/components/Buttons/LoadMoreButton': `import Button from '~/components/Button'; export default ({onClick,loading})=><Button onClick={onClick} loading={loading}>Load more</Button>;`,
    '~/helpers/reportAICardIssueEvent': `export default event=>{window.filterIssues ||= [];window.filterIssues.push(event);};`,
    './DefaultView': `export default ()=> <p>All AI cards</p>;`,
    './SelectAICardModal': `export default ()=>null;`,
    './SingleCardComponent': `export default ()=>null;`,
    '../DefaultComponent': `export default ()=>null;`,
    './CardStrip': `export default ({cardIds})=><div data-preview-ids>{cardIds.join(', ')}</div>;`,
    '~/components/AICardsPreview': `export default ()=>null;`,
    './OwnerFilter': `export default ({selectedOwner,onSelectOwner})=><label>Owner<input aria-label="Owner filter" value={selectedOwner||''} onChange={e=>onSelectOwner(e.target.value)}/></label>;`,
    './QualityFilter': `export default ({selectedQuality,onSelectQuality})=><label>Quality<select aria-label="Quality filter" value={selectedQuality||'any'} onChange={e=>onSelectQuality(e.target.value)}>{['any','common','rare','elite','legendary'].map(q=><option key={q}>{q}</option>)}</select></label>;`,
    './ColorFilter': `export default ()=>null;`,
    './StyleFilter': `export default ()=>null;`,
    './WordFilter': `export default ()=>null;`,
    './EngineFilter': `export default ()=>null;`,
    './CardIdFilter': `export default ()=>null;`,
    './CardItem': `export default ({card})=><article data-select-card={card.id}>Card #{card.id} Quality: {card.quality}</article>;`,
    './Selected': `export default ()=>null;`,
    './ConfirmSelectionModal': `export default ()=>null;`,
    '~/components/FilterBar': `export default ({children})=><div>{children}</div>;`
  };
  const result = await build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    jsx: 'automatic',
    alias: { '~': path.join(repo, 'src') },
    define: {
      'import.meta.env': '{}',
      'process.env.NODE_ENV': '"development"'
    },
    plugins: [
      {
        name: 'complete-mystery-fixture',
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
  bundle = result.outputFiles[0].text;
  return bundle;
}

for (const engine of ['chromium', 'webkit']) {
  test(
    `complete mystery filters, pagination, editing, and sharing (${engine})`,
    { timeout: 180000 },
    async () => {
      const browser = await { chromium, webkit }[engine].launch();
      try {
        const page = await browser.newPage({
          viewport: { width: 1440, height: 1000 }
        });
        page.setDefaultTimeout(10000);
        const errors = [];
        page.on('pageerror', (error) => {
          errors.push(error.message);
          process.stderr.write(`Fixture page error: ${error.message}\n`);
        });
        await page.route('**/*', (route) => route.abort());
        await page.setContent(
          `<meta name="viewport" content="width=device-width, initial-scale=1"><style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}body{background:#fffbee}main[data-explore]{padding:20px;max-width:1400px;margin:auto}</style><div id="root"></div>`,
          { waitUntil: 'domcontentloaded' }
        );
        await page.addScriptTag({ content: await compileFixture() });
        const explore = page.locator('[data-explore]');
        await explore
          .locator('[data-card-id="2"]')
          .waitFor({ state: 'attached' })
          .catch(async (error) => {
            error.message += ` Fixture: ${JSON.stringify(await page.evaluate(() => ({ requests: window.searchRequests, text: document.body.innerText })))}`;
            throw error;
          });
        assert.equal(
          await explore
            .getByRole('switch', { name: /Complete mystery/ })
            .count(),
          0
        );
        mkdirSync(artifacts, { recursive: true, mode: 0o700 });
        await page.screenshot({
          path: path.join(artifacts, `${engine}-mystery-off.png`),
          fullPage: true
        });
        await explore
          .getByRole('switch', { name: 'Enable Mystery', exact: true })
          .press('Space');
        await explore
          .getByRole('switch', { name: 'Enable Complete mystery', exact: true })
          .press('Space');
        await explore
          .locator('[data-card-id="7"]')
          .waitFor({ state: 'attached' });
        const filters = await page.evaluate(
          () => window.searchRequests.at(-1).filters
        );
        assert.equal(filters.isTotalMystery, true);
        assert.equal(filters.isMystery, true);
        assert.equal(filters.owner, 'pilot');
        assert.equal(filters.color, 'black');
        assert.equal(filters.isBuyNow, true);
        assert.equal(filters.minPrice, '40');
        assert.equal(filters.maxPrice, '300');
        assert.equal(filters.quality, undefined);
        assert.equal(filters.style, undefined);
        assert.equal(filters.engine, undefined);
        assert.equal(await explore.locator('[data-card-id="2"]').count(), 0);
        assert.equal(await explore.locator('[data-card-id="4"]').count(), 0);
        await explore.getByRole('button', { name: 'Load more' }).click();
        await explore
          .locator('[data-card-id="3"]')
          .waitFor({ state: 'attached' });
        assert.equal(
          await page.evaluate(
            () => window.searchRequests.at(-1).filters.isTotalMystery
          ),
          true
        );
        const shared = await explore
          .locator('[data-shared-link]')
          .getAttribute('href');
        assert.equal(
          new URL(shared, 'https://twinkle.local').searchParams.get(
            'search[isTotalMystery]'
          ),
          'true'
        );

        for (const width of [1440, 820, 390, 320]) {
          await page.setViewportSize({ width, height: 1000 });
          await page.evaluate(
            () =>
              new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve))
              )
          );
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth
            ),
            false,
            `no page overflow at ${width}px`
          );
          await page.screenshot({
            path: path.join(artifacts, `${engine}-${width}.png`),
            fullPage: true
          });
        }
        await page.setViewportSize({ width: 1440, height: 1000 });

        await explore
          .getByRole('switch', {
            name: 'Disable Complete mystery',
            exact: true
          })
          .press('Space');
        await explore
          .locator('[data-card-id="2"]')
          .waitFor({ state: 'attached' });
        await explore
          .getByRole('switch', { name: 'Enable Complete mystery', exact: true })
          .press('Space');
        await explore
          .locator('[data-card-id="7"]')
          .waitFor({ state: 'attached' });
        await explore
          .getByRole('switch', { name: 'Disable Mystery', exact: true })
          .press('Space');
        await explore
          .locator('[data-card-id="2"]')
          .waitFor({ state: 'attached' });
        assert.equal(
          await page.evaluate(() =>
            new URLSearchParams(window.currentSearch).has(
              'search[isTotalMystery]'
            )
          ),
          false
        );
        await explore
          .getByRole('switch', { name: /Complete mystery/ })
          .waitFor({ state: 'detached' });
        assert.equal(
          await explore
            .getByRole('switch', { name: /Complete mystery/ })
            .count(),
          0
        );
        await explore
          .getByRole('switch', { name: 'Enable Mystery', exact: true })
          .press('Space');
        await explore
          .getByRole('switch', { name: 'Enable Complete mystery', exact: true })
          .press('Space');
        await explore
          .locator('[data-card-id="7"]')
          .waitFor({ state: 'attached' });

        // Editing a public facet keeps complete mystery; choosing visible quality
        // returns to ordinary mystery without claiming that hidden quality matches.
        await explore
          .getByRole('button', { name: /Owner|pilot/i })
          .first()
          .click();
        await page.getByRole('textbox', { name: 'Owner filter' }).fill('pilot');
        await page.getByRole('button', { name: 'Apply', exact: true }).click();
        await page.waitForFunction(() =>
          window.currentSearch.includes('isTotalMystery')
        );
        await explore.getByRole('button', { name: /Quality/i }).click();
        await page
          .getByRole('combobox', { name: 'Quality filter' })
          .selectOption('rare');
        await page.getByRole('button', { name: 'Apply', exact: true }).click();
        await explore
          .locator('[data-card-id="2"]')
          .waitFor({ state: 'attached' });
        assert.equal(
          await explore
            .getByRole('switch', {
              name: 'Enable Complete mystery',
              exact: true
            })
            .isChecked(),
          false
        );

        await page.evaluate(() => window.showPicker());
        const picker = page.locator('[data-picker]');
        await picker
          .getByRole('switch', { name: 'Enable Complete mystery', exact: true })
          .press('Space');
        assert.equal(
          await page.evaluate(() => window.pickerFilters.isTotalMystery),
          true
        );
        assert.equal(
          await page.evaluate(() => window.pickerFilters.quality),
          undefined
        );
        await picker
          .getByRole('combobox', { name: 'Quality filter' })
          .selectOption('rare');
        assert.equal(
          await page.evaluate(() => window.pickerFilters.isTotalMystery),
          undefined
        );
        await picker
          .getByRole('switch', { name: 'Enable Complete mystery', exact: true })
          .press('Space');
        await picker
          .getByRole('switch', { name: 'Disable Mystery', exact: true })
          .press('Space');
        assert.equal(
          await picker
            .getByRole('switch', { name: /Complete mystery/ })
            .count(),
          0
        );
        assert.equal(
          await page.evaluate(() => window.pickerFilters.isTotalMystery),
          undefined
        );
        await picker
          .getByRole('switch', { name: 'Enable Mystery', exact: true })
          .press('Space');
        assert.equal(
          await picker
            .getByRole('switch', {
              name: 'Enable Complete mystery',
              exact: true
            })
            .isChecked(),
          false
        );

        await page.evaluate((src) => window.showPreview(src), shared);
        await page.locator('[data-preview] [data-preview-ids]').waitFor();
        assert.match(
          await page.locator('[data-preview]').innerText(),
          /complete mystery cards/
        );
        assert.equal(
          await page.evaluate(
            () => window.searchRequests.at(-1).filters.isTotalMystery
          ),
          true
        );
        assert.deepEqual(errors, []);
        assert.deepEqual(
          await page.evaluate(() => window.filterIssues || []),
          []
        );

        // An old initial response and old pagination must not replace or append
        // cards after the picker changes to complete mystery.
        await page.evaluate(() => {
          window.delayNextSearch = true;
          window.showFilteredRace({ isMystery: true });
        });
        await page.waitForFunction(() => !!window.resolveDelayedSearch);
        await page.evaluate(() =>
          window.showFilteredRace({ isMystery: true, isTotalMystery: true })
        );
        const filteredRace = page.locator('[data-filtered-race]');
        await filteredRace.locator('[data-select-card="7"]').waitFor();
        await resolveDelayedSearch(page);
        assert.equal(
          await filteredRace.locator('[data-select-card="2"]').count(),
          0
        );
        await page.evaluate(() => window.showFilteredRace({ isMystery: true }));
        await filteredRace.locator('[data-select-card="2"]').waitFor();
        await page.evaluate(() => {
          window.delayNextSearch = true;
        });
        await filteredRace.getByRole('button', { name: 'Load more' }).click();
        await page.waitForFunction(() => !!window.resolveDelayedSearch);
        await page.evaluate(() =>
          window.showFilteredRace({ isMystery: true, isTotalMystery: true })
        );
        await filteredRace.locator('[data-select-card="7"]').waitFor();
        await resolveDelayedSearch(page);
        assert.equal(
          await filteredRace.locator('[data-select-card="3"]').count(),
          0
        );

        await page.evaluate(() => {
          window.delayNextSearch = true;
          window.showExplorePicker();
        });
        await page.waitForFunction(() => !!window.resolveDelayedSearch);
        const explorePicker = page.locator('[data-explore-picker]');
        await explorePicker
          .getByRole('switch', { name: 'Enable Complete mystery', exact: true })
          .press('Space');
        await explorePicker.locator('[data-select-card="7"]').waitFor();
        await resolveDelayedSearch(page);
        assert.equal(
          await explorePicker.locator('[data-select-card="2"]').count(),
          0
        );
        await explorePicker
          .getByRole('switch', {
            name: 'Disable Complete mystery',
            exact: true
          })
          .press('Space');
        await explorePicker.locator('[data-select-card="2"]').waitFor();
        await page.evaluate(() => {
          window.delayNextSearch = true;
        });
        await explorePicker.getByRole('button', { name: 'Load more' }).click();
        await page.waitForFunction(() => !!window.resolveDelayedSearch);
        await explorePicker
          .getByRole('switch', { name: 'Enable Complete mystery', exact: true })
          .press('Space');
        await explorePicker.locator('[data-select-card="7"]').waitFor();
        await resolveDelayedSearch(page);
        assert.equal(
          await explorePicker.locator('[data-select-card="3"]').count(),
          0
        );

        await explorePicker
          .getByRole('switch', {
            name: 'Disable Complete mystery',
            exact: true
          })
          .press('Space');
        await explorePicker.locator('[data-select-card="2"]').waitFor();
        await page.evaluate(() => {
          window.delayNextSearch = true;
        });
        await explorePicker
          .getByRole('switch', { name: 'Enable Complete mystery', exact: true })
          .press('Space');
        await page.waitForFunction(() => !!window.resolveDelayedSearch);
        assert.equal(
          await explorePicker
            .getByRole('button', { name: 'Load more' })
            .count(),
          0
        );
        await resolveDelayedSearch(page);
        await explorePicker.locator('[data-select-card="7"]').waitFor();

        await page.evaluate(() => {
          window.delayNextSearch = true;
          window.showPreview(
            '//www.twin-kle.com/ai-cards/?search[isMystery]=true'
          );
        });
        await page.waitForFunction(() => !!window.resolveDelayedSearch);
        await page.evaluate((src) => window.showPreview(src), shared);
        await page.waitForFunction(
          () => window.searchRequests.at(-1).filters.isTotalMystery === true
        );
        await resolveDelayedSearch(page);
        assert.doesNotMatch(
          await page.locator('[data-preview] [data-preview-ids]').innerText(),
          /\b2\b/
        );
        assert.deepEqual(errors, []);
        await page.close();
      } finally {
        await browser.close();
      }
    }
  );
  test(
    `complete mystery touch controls and narrow layouts (${engine})`,
    { timeout: 90000 },
    async () => {
      const browser = await { chromium, webkit }[engine].launch();
      try {
        mkdirSync(artifacts, { recursive: true, mode: 0o700 });
        const mobile = await browser.newPage({
          viewport: { width: 390, height: 1000 },
          hasTouch: true,
          isMobile: true
        });
        mobile.setDefaultTimeout(10000);
        const mobileErrors = [];
        mobile.on('pageerror', (error) => mobileErrors.push(error.message));
        await mobile.route('**/*', (route) => route.abort());
        await mobile.setContent(
          `<meta name="viewport" content="width=device-width, initial-scale=1"><style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}body{background:#fffbee}main[data-explore]{padding:12px}</style><div id="root"></div>`,
          { waitUntil: 'domcontentloaded' }
        );
        await mobile.addScriptTag({ content: await compileFixture() });
        await mobile
          .locator('[data-card-id="2"]')
          .waitFor({ state: 'attached' })
          .catch(async (error) => {
            error.message += ` Mobile fixture: ${JSON.stringify({ errors: mobileErrors, ...(await mobile.evaluate(() => ({ requests: window.searchRequests, text: document.body.innerText }))) })}`;
            throw error;
          });
        assert.equal(
          await mobile
            .getByRole('switch', { name: /Complete mystery/ })
            .count(),
          0
        );
        await mobile.screenshot({
          path: path.join(artifacts, `${engine}-mobile-mystery-off.png`),
          fullPage: true
        });
        await mobile
          .getByRole('switch', { name: 'Enable Mystery', exact: true })
          .locator('..')
          .locator('span')
          .first()
          .tap();
        await mobile
          .getByRole('switch', { name: 'Enable Complete mystery', exact: true })
          .locator('..')
          .locator('span')
          .first()
          .tap();
        await mobile
          .locator('[data-card-id="7"]')
          .waitFor({ state: 'attached' });
        for (const width of [390, 320]) {
          await mobile.setViewportSize({ width, height: 1000 });
          assert.equal(
            await mobile.evaluate(
              () => document.documentElement.scrollWidth > innerWidth
            ),
            false,
            `touch page fits ${width}px`
          );
          await mobile.screenshot({
            path: path.join(artifacts, `${engine}-${width}.png`),
            fullPage: true
          });
        }
        assert.deepEqual(mobileErrors, []);
      } finally {
        await browser.close();
      }
    }
  );
}

async function resolveDelayedSearch(page) {
  await page.evaluate(async () => {
    window.resolveDelayedSearch();
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );
  });
}
