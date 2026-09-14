import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const {
  chromium
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const out = '/private/tmp/twinkle-admin-card-regeneration-20260914';

test(
  'admin sees the intended model before generating, cannot change requests in flight, and sees the recorded engine afterward',
  { timeout: 30000 },
  async () => {
    const stubs = {
      '~/contexts': `
      import {ADMIN_USER_ID} from './src/constants/defaultValues';
      const state = {myState:{userId:ADMIN_USER_ID},requestHelpers:{
        loadAICardForImageRegeneration: async id => ({card:{id,word:'grape',prompt:'A sunlit grape on the vine.',imagePath:'',level:2,style:'pixel art',engine:'',isMystery:1,isBurned:0,ownerId:14940,ownerUsername:'OverClassified'},
          generation:{model:'gpt-image-2.5-flare',engine:'image-2.5',quality:'xhigh',legacyFallback:false}}),
        regenerateAICardImage: args => new Promise(resolve => {window.sent=args;window.complete=resolve;})
      }};
      export const useKeyContext=fn=>fn(state); export const useAppContext=fn=>fn(state);`,
      '~/components/Button': `import React from 'react';export default function Button({children,loading,disabled,onClick}){return <button disabled={disabled||loading} onClick={onClick}>{children}</button>}`,
      '~/components/Icon': `export default function Icon(){return null}`,
      '~/components/InvalidPage': `import React from 'react';export default function InvalidPage(){return <p>Unauthorized</p>}`
    };
    const bundle = await build({
      stdin: {
        contents: `import React from 'react';import{createRoot}from'react-dom/client';import AiCards from './src/containers/Management/AiCards';createRoot(document.getElementById('root')).render(<AiCards/>);`,
        resolveDir: repo,
        loader: 'tsx'
      },
      bundle: true,
      write: false,
      format: 'iife',
      platform: 'browser',
      alias: { '~': path.join(repo, 'src') },
      define: {
        'import.meta.env': '{"VITE_ADMIN_USER_ID":"5"}',
        'process.env.NODE_ENV': '"development"'
      },
      plugins: [
        {
          name: 'admin-fixture',
          setup(b) {
            b.onResolve({ filter: /.*/ }, ({ path }) =>
              stubs[path] ? { path, namespace: 'fixture' } : undefined
            );
            b.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({
              contents: stubs[path],
              loader: 'jsx',
              resolveDir: repo
            }));
          }
        }
      ]
    });
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage({
        viewport: { width: 1100, height: 850 }
      });
      page.setDefaultTimeout(5000);
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.setContent(
        `<style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}body{padding:24px;background:#fffbee}</style><div id="root"></div>`
      );
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve))
          )
      );
      assert.deepEqual(errors, []);
      await page.getByLabel('Card ID', { exact: true }).fill('77681');
      await page.getByRole('button', { name: 'Load', exact: true }).click();
      await page.getByText('Not recorded', { exact: false }).waitFor();
      await page.getByText('gpt-image-2.5-flare', { exact: false }).waitFor();
      assert.match(await page.locator('body').innerText(), /xhigh quality/);
      const prompt = page.getByLabel('Example sentence (image prompt)');
      await prompt.fill('The same grape catches the sunrise.');
      await page.getByRole('button', { name: 'Regenerate image' }).click();
      assert.equal(await prompt.isDisabled(), true);
      assert.equal(
        await page
          .getByRole('button', { name: 'Reset', exact: true })
          .isDisabled(),
        true
      );
      assert.equal(
        await page.getByLabel('Card ID', { exact: true }).isDisabled(),
        true
      );
      assert.equal(
        await page
          .getByRole('button', { name: 'Load', exact: true })
          .isDisabled(),
        true
      );
      assert.deepEqual(await page.evaluate(() => window.sent), {
        cardId: 77681,
        prompt: 'The same grape catches the sunrise.'
      });
      mkdirSync(out, { recursive: true });
      await page.screenshot({
        path: path.join(out, 'pending.png'),
        fullPage: true
      });
      await page.evaluate(() =>
        window.complete({
          imagePath:
            'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="240" height="320"%3E%3Crect width="240" height="320" fill="%2384ab47"/%3E%3C/svg%3E',
          prompt: 'Canonical returned sentence.',
          promptWasEdited: true,
          engine: 'image-2.5',
          generation: {
            model: 'gpt-image-2.5-flare',
            engine: 'image-2.5',
            quality: 'xhigh',
            legacyFallback: false
          }
        })
      );
      await page
        .getByText('New image generated and the edited sentence saved.')
        .waitFor();
      assert.equal(await prompt.inputValue(), 'Canonical returned sentence.');
      assert.match(await page.locator('body').innerText(), /Engine: image-2.5/);
      assert.equal(
        await page.getByRole('img', { name: 'Card 77681' }).count(),
        1
      );
      await page.screenshot({
        path: path.join(out, 'complete-desktop.png'),
        fullPage: true
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({
        path: path.join(out, 'complete-mobile.png'),
        fullPage: true
      });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        ),
        true
      );
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  }
);
