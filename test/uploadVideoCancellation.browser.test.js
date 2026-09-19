import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const { chromium } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));

// Mount the real two upload owners. The converter deliberately finishes late,
// even after abort, so stale callbacks and interference with a new job surface.
const fixture = `
import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import UploadModal from './src/components/Modals/UploadModal';
import SecretMessageInput from './src/components/Forms/SecretMessageInput';
window.jobs=[]; window.imageJobs=[]; window.selected=[];
function Fixture(){
  const [open,setOpen]=useState(true);
  const [mounted,setMounted]=useState(true);
  const [mode,setMode]=useState('modal');
  const [attachment,setAttachment]=useState(null);
  window.controls={setOpen,setMounted,setMode};
  return !mounted ? null : mode==='modal' ?
    <UploadModal isOpen={open} onHide={()=>setOpen(false)}
      onFileSelect={file=>window.selected.push(file.name)}
      onFilesSelect={files=>window.selected.push(...files.map(file=>file.name))} multiple/> :
    <SecretMessageInput secretAnswer="" onSetSecretAnswer={()=>{}}
      secretAttachment={attachment} onThumbnailLoad={()=>{}}
      onSetSecretAttachment={value=>{setAttachment(value);window.selected.push(value?.file.name ?? null)}}/>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><Fixture/></React.StrictMode>);
`;

test('closing, hiding, unmounting and replacing an upload cancel its conversion without stale attachment callbacks',
  { timeout: 45_000 }, async () => {
    const stubs = {
      '~/helpers/videoUploadConversion': `
export const needsVideoUploadConversion=file=>file.name.endsWith('.mkv');
export function convertVideoForUpload({file,signal,onProgress}){
  return new Promise(resolve=>window.jobs.push({file,signal,finish(){
    onProgress?.(0.5);
    resolve({file:signal.aborted ? file : new File(['converted'],file.name.replace('.mkv','.mp4'))});
  }}));
}`,
      '~/components/Modal': 'import React from "react";export default function Modal({isOpen,onClose,children,footer}){return isOpen ? <section role="dialog"><button onClick={onClose}>Close upload</button>{children}{footer}</section> : null}',
      './Content': 'import React from "react";export default function Content({onFileSelect,onFilesSelect}){return <input type="file" multiple onChange={event=>event.target.files.length>1 ? onFilesSelect([...event.target.files]) : onFileSelect(event.target.files[0])}/>}',
      '~/components/Button': 'import React from "react";export default function Button({children,onClick,disabled}){return <button onClick={onClick} disabled={disabled}>{children}</button>}',
      '~/components/ProgressBar': 'import React from "react";export default function Progress({progress}){return <progress max="100" value={progress}/>}',
      '~/components/Modals/ConfirmModal': 'export default function Confirm(){return null}',
      '~/components/Modals/AlertModal': 'export default function Alert(){return null}',
      '~/components/Texts/FullTextReveal': 'export default function Reveal(){return null}',
      '~/components/Texts/Textarea': 'import React from "react";export default function Textarea(){return <textarea/>}',
      '~/components/Icon': 'import React from "react";export default function Icon(){return <span>Upload</span>}',
      '~/components/Attachment': 'import React from "react";export default function Attachment({attachment,onClose}){return <div>{attachment.file.name}<button onClick={onClose}>Remove attachment</button></div>}',
      '~/constants/css': 'export const Color=new Proxy({},{get:()=>()=>"black"})',
      '~/constants/defaultValues': 'export const FILE_UPLOAD_XP_REQUIREMENT=1,mb=1000000;export const returnMaxUploadSize=()=>100',
      '~/contexts': 'export const useKeyContext=selector=>selector({myState:{fileUploadLvl:1,level:1,twinkleXP:10,userId:1}})',
      '~/theme/hooks/useRoleColor': 'export const useRoleColor=()=>({colorKey:"logoBlue",getColor:()=>"black"})',
      '~/helpers/hooks/useEmbedFileUpload': 'export default function useEmbed(){return {uploadForEmbed:async()=>null,uploading:false,uploadErrorType:null}}',
      '~/helpers/stringHelpers': 'export const addEmoji=x=>x,exceedsCharLimit=()=>false,addCommasToNumber=String,getFileInfoFromFileName=()=>({fileType:"video"}),stringIsEmpty=x=>!x',
      '~/helpers/imageHelpers': `
export const needsImageConversion=name=>name.endsWith('.heic');
export const convertToWebFriendlyFormat=file=>new Promise(resolve=>window.imageJobs.push({
  finish(){ resolve({converted:true,file:new File(['image'],file.name.replace('.heic','.jpg')),dataUrl:'data:image/jpeg;base64,AA=='}) }
}));`,
      '~/helpers': 'export const returnImageFileFromUrl=()=>null'
    };
    const bundle = await build({
      stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
      bundle: true, write: false, format: 'iife', platform: 'browser', jsx: 'transform',
      define: { 'process.env.NODE_ENV': '"development"' },
      plugins: [{
        name: 'upload-cancellation-fixture',
        setup(builder) {
          builder.onResolve({ filter: /.*/ }, (args) => {
            if (Object.hasOwn(stubs, args.path)) return { path: args.path, namespace: 'stub' };
            if (args.path.startsWith('~/')) return builder.resolve(path.join(repo, 'src', args.path.slice(2)), { resolveDir: repo, kind: args.kind });
          });
          builder.onLoad({ filter: /.*/, namespace: 'stub' }, (args) => ({ contents: stubs[args.path], loader: 'jsx', resolveDir: repo }));
        }
      }]
    });
    let browser;
    const errors = [];
    try {
      browser = await chromium.launch({ headless: true, timeout: 10_000 });
      const page = await browser.newPage();
      page.setDefaultTimeout(3000);
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', route => route.abort());
      await page.setContent('<div id="root"></div>');
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      const pick = async name => page.locator('input[type=file]').setInputFiles({ name, mimeType: 'video/x-matroska', buffer: Buffer.from('fixture') });
      const finish = async index => page.evaluate(async index => {
        window.jobs[index].finish();
        await new Promise(resolve => setTimeout(resolve, 0));
      }, index);
      const isAborted = index => page.evaluate(index => window.jobs[index].signal.aborted, index);

      await pick('closed.mkv');
      await page.getByRole('button', { name: 'Close upload' }).click();
      assert.equal(await isAborted(0), true);
      await page.evaluate(() => window.controls.setOpen(true));
      await pick('current.mkv');
      await finish(0);
      assert.deepEqual(await page.evaluate(() => window.selected), []);
      assert.match(await page.getByRole('dialog').innerText(), /current.mkv/);
      await page.getByRole('button', { name: 'Upload the original instead' }).click();
      assert.equal(await isAborted(1), true);
      await finish(1);
      assert.deepEqual(await page.evaluate(() => window.selected), ['current.mkv']);

      await page.evaluate(() => window.controls.setOpen(true));
      await pick('hidden.mkv');
      await page.evaluate(() => window.controls.setOpen(false));
      await page.waitForFunction(() => window.jobs[2].signal.aborted);
      await finish(2);
      await page.evaluate(() => window.controls.setOpen(true));
      await pick('unmounted.mkv');
      await page.evaluate(() => window.controls.setMounted(false));
      await page.waitForFunction(() => window.jobs[3].signal.aborted);
      await finish(3);
      assert.deepEqual(await page.evaluate(() => window.selected), ['current.mkv']);

      await page.evaluate(() => {
        window.controls.setMode('secret');
        window.controls.setMounted(true);
        window.selected=[];
      });
      await pick('replaced.mkv');
      await pick('replacement.mp4');
      assert.equal(await isAborted(4), true);
      await finish(4);
      assert.deepEqual(await page.evaluate(() => window.selected), ['replacement.mp4']);
      await page.getByRole('button', { name: 'Remove attachment' }).click();
      await pick('secret-unmounted.mkv');
      await page.evaluate(() => window.controls.setMounted(false));
      await page.waitForFunction(() => window.jobs[5].signal.aborted);
      await finish(5);
      assert.deepEqual(await page.evaluate(() => window.selected), ['replacement.mp4', null]);

      await page.evaluate(() => window.controls.setMounted(true));
      await pick('old-image.heic');
      await pick('new-video.mp4');
      await page.evaluate(async () => { window.imageJobs[0].finish(); await new Promise(resolve=>setTimeout(resolve,0)); });
      assert.deepEqual(await page.evaluate(() => window.selected), ['replacement.mp4', null, 'new-video.mp4']);
      await page.getByRole('button', { name: 'Remove attachment' }).click();
      await pick('unmounted-image.heic');
      await page.evaluate(() => window.controls.setMounted(false));
      await page.evaluate(async () => { window.imageJobs[1].finish(); await new Promise(resolve=>setTimeout(resolve,0)); });
      assert.deepEqual(await page.evaluate(() => window.selected), ['replacement.mp4', null, 'new-video.mp4', null]);
      assert.deepEqual(errors, []);
    } finally {
      await browser?.close();
    }
  });
