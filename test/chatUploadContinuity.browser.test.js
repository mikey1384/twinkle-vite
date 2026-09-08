import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const {
  chromium
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));

// Actual chat button hierarchy, UploadModal, FileUploadOption and shared Modal.
// Unrelated app state and the paid generator are isolated. Its text draft makes
// accidental unmounts observable without an AI request or a production account.
const fixture = `
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import RightButtons from './src/containers/Chat/Body/MessagesContainer/MessageInput/RightButtons';
function Fixture() {
  const [messageId,setMessageId]=useState(0);
  window.setStreaming=setMessageId;
  return <RightButtons buttonColor="logoBlue" currentTransactionId={0} inputText=""
    currentlyStreamingAIMsgId={messageId} isChatBanned={false} isLoading={false}
    isRestrictedChannel={false} isTradeButtonShown={false} isTwoPeopleChannel
    isCielChannel={false} isZeroChannel maxSize={100} myId={1}
    onSetAlertModalShown={()=>{}} onSetFileObj={file=>window.selectedFile=file.name}
    onSetTransactionModalShown={()=>{}} onSetUploadModalShown={()=>{}}
    onSelectVideoButtonClick={()=>{}} selectedChannelId={2} socketConnected />;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
`;

test(
  'chat upload dialog and image draft survive an incoming AI stream',
  { timeout: 45_000 },
  async () => {
    const stubs = {
      '~/contexts':
        'export function useAppContext(selector){return selector({requestHelpers:{loadPendingTransaction:async()=>({transaction:null}),cancelAIMessage:async()=>({})}})}',
      '~/theme/hooks/useRoleColor':
        'export function useRoleColor(){return {colorKey:"logoBlue",themeName:"blue"}}',
      '~/components/Button':
        'import React from "react"; export default function Button({children,onClick,disabled,style,...props}){return <button type="button" onClick={onClick} disabled={disabled} style={style} aria-label={props["aria-label"]}>{children}</button>}',
      '~/components/Icon':
        'import React from "react"; export default function Icon({icon}){return <span>{icon}</span>}',
      '~/components/Loading': 'export default function Loading(){return null}',
      '~/components/ErrorBoundary':
        'export default function Boundary({children}){return children}',
      '~/helpers':
        'export function isMobile(){return window.innerWidth<500} export function isTablet(){return false}',
      './ImageGenerator':
        'import React,{useState} from "react";export default function Generator(){const [text,setText]=useState("");return <textarea aria-label="Image description" value={text} onChange={e=>setText(e.target.value)}/>}'
    };
    const bundle = await build({
      stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
      bundle: true,
      write: false,
      format: 'iife',
      platform: 'browser',
      jsx: 'transform',
      define: {
        'process.env.NODE_ENV': '"development"',
        'import.meta.env': '{}'
      },
      plugins: [
        {
          name: 'chat-upload-fixture',
          setup(builder) {
            builder.onResolve({ filter: /.*/ }, (args) => {
              if (Object.hasOwn(stubs, args.path))
                return { path: args.path, namespace: 'stub' };
              if (args.path.startsWith('~/'))
                return builder.resolve(
                  path.join(repo, 'src', args.path.slice(2)),
                  { resolveDir: repo, kind: args.kind }
                );
            });
            builder.onLoad({ filter: /.*/, namespace: 'stub' }, (args) => ({
              contents: stubs[args.path],
              loader: 'jsx',
              resolveDir: repo
            }));
          }
        }
      ]
    });
    let browser;
    const errors = [];
    try {
      browser = await chromium.launch({ headless: true, timeout: 10_000 });
      for (const width of [1000, 390]) {
        const page = await browser.newPage({
          viewport: { width, height: 800 }
        });
        page.setDefaultTimeout(3000);
        page.on('pageerror', (error) => errors.push(error.message));
        await page.route('**/*', (route) => route.abort());
        await page.setContent('<div id="root"></div><div id="modal"></div>');
        await page.addStyleTag({
          content:
            '*{box-sizing:border-box}html{font-size:10px}body{font-family:Arial;padding:20px}button,textarea{font-size:1.4rem}#root{display:flex}'
        });
        await page.addScriptTag({ content: bundle.outputFiles[0].text });
        await page
          .getByRole('button', { name: 'Upload file', exact: true })
          .click();
        await page.getByRole('button', { name: /Make Images/ }).click();
        await page
          .getByRole('textbox', { name: 'Image description' })
          .fill('A floating castle');
        await page.evaluate(() => {
          window.originalDialog = document.querySelector('[role=dialog]');
          window.setStreaming(88);
        });
        await page.waitForFunction(() =>
          document.querySelector('#root').textContent.includes('stop')
        );
        assert.equal(
          await page
            .getByRole('textbox', { name: 'Image description' })
            .count(),
          1,
          'incoming stream unmounted the upload dialog'
        );
        assert.equal(
          await page
            .getByRole('textbox', { name: 'Image description' })
            .inputValue(),
          'A floating castle'
        );
        assert.equal(
          await page.evaluate(
            () =>
              document.querySelector('[role=dialog]') === window.originalDialog
          ),
          true
        );
        if (process.env.CHAT_UPLOAD_SCREENSHOTS) {
          mkdirSync(process.env.CHAT_UPLOAD_SCREENSHOTS, { recursive: true });
          await page.screenshot({
            path: path.join(
              process.env.CHAT_UPLOAD_SCREENSHOTS,
              `upload-${width}.png`
            )
          });
        }
        await page.evaluate(() => window.setStreaming(0));
        await page.getByRole('button', { name: 'Back', exact: true }).click();
        await page.getByRole('button', { name: /Upload from Device/ }).click();
        const fileInput = page.locator('input[type=file]').last();
        await fileInput.setInputFiles({
          name: 'drawing.txt',
          mimeType: 'text/plain',
          buffer: Buffer.from('fixture')
        });
        await page.waitForFunction(() => window.selectedFile === 'drawing.txt');
        await page.waitForFunction(
          () => !document.querySelector('[role=dialog]')
        );
        await page
          .getByRole('button', { name: 'Upload file', exact: true })
          .click();
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
        await page.waitForFunction(
          () => !document.querySelector('[role=dialog]')
        );
        await page.close();
      }
      assert.deepEqual(errors, []);
    } finally {
      await browser?.close();
    }
  }
);
