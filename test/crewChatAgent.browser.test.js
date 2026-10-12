import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const {
  chromium
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
// Persistent (never /tmp): the screenshots are review evidence.
const artifacts =
  process.env.CREW_CHAT_AGENT_SHOTS || path.join(repo, '..', 'screenshots');

// The real crew path panel and Zero/Ciel card, with synthetic data. Only
// account/data services and the icon font are stubs.
const fixture = `
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import CrewTrackerPanel from './src/containers/Chat/CrewChat/CrewTrackerPanel';
import WebsiteAgentCard, { crewCallsBack } from './src/containers/Chat/Message/MessageBody/WebsiteAgentCard';
window.crewCallsBack = crewCallsBack;
import { CREW_CHAT_ASK_EVENT } from './src/containers/Chat/CrewChat/crewAsk';

function Box() {
  const [text, setText] = useState('');
  useEffect(() => {
    const handle = (event) => event.detail.channelId === 4401 && setText(event.detail.text);
    window.addEventListener(CREW_CHAT_ASK_EVENT, handle);
    return () => window.removeEventListener(CREW_CHAT_ASK_EVENT, handle);
  }, []);
  return <textarea aria-label="Message box" value={text} readOnly style={{ width: '100%', height: 70, fontSize: 14 }} />;
}

const card = { type: 'approval', id: 'c1', summary: 'Can I save this plan for the crew? Saturday 2 PM at Olympic Park, flying kites.',
  method: 'POST', path: '/user/meetup-quest/crews/77/plan', status: 'pending', requesterUserId: 501, requesterUsername: 'mia', crewId: 77 };

window.lastCard = card;
function Fixture() {
  return <MemoryRouter><main className="fixture">
    <section className="panel" data-shot="panel"><CrewTrackerPanel crewId={77} /></section>
    <section className="chat">
      <Box />
      <div className="bubble" data-shot="waiting">
        <b>Ciel</b>
        <p>Here is a plan you can all look at. Mia, tap yes if it looks right.</p>
        <WebsiteAgentCard card={card} channelId={4401} messageId={9001} assistantName="Ciel" messageText="Here is a plan" />
      </div>
      <div className="bubble" data-shot="caller">
        <b>Ciel (as mia sees it)</b>
        <WebsiteAgentCard card={{ ...card, requesterUserId: window.viewerId }} channelId={4401} messageId={9002} assistantName="Ciel" />
      </div>
    </section>
  </main></MemoryRouter>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
`;

const crewView = {
  crewId: 77,
  displayName: 'Park Pals',
  status: 'active',
  chat: { channelId: 4401, pathId: 4401 },
  progress: {
    currentStep: 'plan',
    blocking: 'Next: pick a date, a time and a place together',
    steps: [
      {
        key: 'crew',
        number: 1,
        label: 'Build your crew',
        state: 'done',
        detail: ''
      },
      {
        key: 'grownUp',
        number: 2,
        label: 'Find a grown-up',
        state: 'done',
        detail: ''
      },
      {
        key: 'plan',
        number: 3,
        label: 'Make a plan',
        state: 'current',
        detail: 'When, where and what you will do'
      },
      {
        key: 'film',
        number: 4,
        label: 'Film your meetup',
        state: 'locked',
        detail: 'A short video of the day'
      },
      {
        key: 'review',
        number: 5,
        label: 'Get it checked',
        state: 'locked',
        detail: 'Staff check your video'
      }
    ]
  },
  reviews: { crew: { status: 'none' }, grownUp: { status: 'none' } }
};

async function compileFixture() {
  const stubs = {
    '~/contexts': `
      const state = {
        myState: { userId: window.viewerId, username: 'jun', profilePicUrl: '' },
        requestHelpers: {
          loadMeetupCrew: async () => ({ crew: ${JSON.stringify(crewView)} }),
          trackMeetupQuestView: (kind) => { (window.tracked ||= []).push(kind); },
          decideWebsiteAgentCard: async ({ approved }) => { window.decided = (window.decided || 0) + 1; return { card: { ...window.lastCard, status: approved ? 'approved' : 'declined' } }; }
        },
        actions: { onUpdateMessageSettings: () => {}, onSubmitMessage: ({ message }) => { (window.sent ||= []).push(message.content); } }
      };
      export const useAppContext = select => select(state);
      export const useKeyContext = select => select(state);
      export const useChatContext = select => select(state);
    `,
    '~/containers/BridgeBuilderQuest/useMeetupRefresh':
      'export default () => {};',
    '~/helpers/assistantVoice': 'export const useUserAssistant = () => "Ciel";',
    '~/theme/hooks/useRoleColor':
      'export const useRoleColor = () => ({getColor:()=>"#126bb5", color:"#126bb5",colorKey:"logoBlue",themeName:"logoBlue"});',
    '~/components/Icon':
      'import React from "react"; export default ({style}) => <span aria-hidden="true" style={style}>●</span>;',
    './CrewReviewSummary': 'export default () => null;'
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
        name: 'crew-chat-fixture',
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
  return result.outputFiles[0].text;
}

test(
  'crew panel Ask buttons fill the message box; another member sees a waiting card',
  { timeout: 90000 },
  async () => {
    const bundle = await compileFixture();
    const browser = await chromium.launch();
    try {
      mkdirSync(artifacts, { recursive: true });
      for (const [width, label] of [
        [1280, 'desktop'],
        [390, 'phone']
      ]) {
        const page = await browser.newPage({
          viewport: { width, height: 1100 }
        });
        page.setDefaultTimeout(8000);
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.route('**/*.{png,jpg,webp}', (route) =>
          route.fulfill({
            contentType: 'image/svg+xml',
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="20" fill="#7c9cf5"/></svg>'
          })
        );
        await page.setContent(`<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}
        html{font-size:62.5%} body{background:#fff;font-family:system-ui,sans-serif}
        .fixture{display:flex;flex-wrap:wrap;gap:24px;padding:16px;max-width:1100px;margin:auto}
        .panel{width:300px;border:1px solid #e2e8f0;border-radius:8px;padding-bottom:16px}
        .chat{flex:1;min-width:300px;display:flex;flex-direction:column;gap:16px}
        .bubble{border:1px solid #e2e8f0;border-radius:8px;padding:12px;font-size:1.5rem}</style>
        <script>window.viewerId = 502;</script><div id="root"></div>`);
        await page.addScriptTag({ content: bundle });
        await page
          .getByRole('button', { name: 'Ask Ciel about this step' })
          .waitFor();

        // Ciel (the member's chosen assistant) first, then Zero
        const asks = await page
          .getByRole('button', { name: /^Ask (Zero|Ciel) about this step$/ })
          .allTextContents();
        assert.deepEqual(
          asks.map((t) => t.trim()),
          ['Ask Ciel', 'Ask Zero']
        );

        await page
          .getByRole('button', { name: 'Ask Zero about this step' })
          .click();
        const text = await page.getByLabel('Message box').inputValue();
        assert.equal(
          text,
          "@Zero We're on step 3 (Make a plan). Next up: pick a date, a time and a place together. Can you help us figure out this step? "
        );
        assert.deepEqual(await page.evaluate(() => window.tracked), [
          'crew_agent_ask'
        ]);

        // jun (502) sees mia's card as waiting, with no live buttons
        const waiting = page.locator('[data-shot="waiting"]');
        await waiting.getByText('Waiting for mia…').waitFor();
        const buttons = waiting.getByRole('button');
        for (const button of await buttons.all()) {
          assert.equal(await button.isDisabled(), true);
        }
        await buttons.first().click({ force: true });
        assert.equal(
          await page.evaluate(() => window.decided || 0),
          0,
          'a non-requester tap does nothing'
        );
        // the caller's own copy stays live
        const callerButtons = page
          .locator('[data-shot="caller"]')
          .getByRole('button');
        assert.equal(await callerButtons.first().isDisabled(), false);

        await page.locator('.fixture').screenshot({
          path: path.join(artifacts, `crew-chat-agent-${label}.png`)
        });
        // "No thanks" on a crew card ends it without calling Ciel back (no
        // new reply on the caller's Energy)
        await page
          .locator('[data-shot="caller"]')
          .getByRole('button', { name: 'No thanks' })
          .click();
        await page.waitForFunction(() => (window.sent || []).length === 1);
        assert.deepEqual(await page.evaluate(() => window.sent), ['No thanks']);
        assert.deepEqual(
          await page.evaluate(() => [
            window.crewCallsBack({ crewId: 77, status: 'approved' }, 'Ciel'),
            window.crewCallsBack(
              { crewId: 77, type: 'choice', answer: 'a' },
              'Ciel'
            ),
            window.crewCallsBack({ crewId: 77, status: 'declined' }, 'Ciel'),
            window.crewCallsBack({ status: 'approved' }, 'Ciel')
          ]),
          [true, true, false, false]
        );
        assert.deepEqual(errors, []);
        await page.close();
      }
    } finally {
      await browser.close();
    }
  }
);
