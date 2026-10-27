import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const repo = fileURLToPath(new URL('..', import.meta.url));
export async function sharedMediaFixture() {
  const stubs = {
    '~/contexts': `export const useAppContext=s=>s({requestHelpers:window.requests}); export const useKeyContext=s=>s({myState:{userId:1}}); export const useContentContext=s=>s({actions:{onEditContent:()=>{}}});`,
    '~/contexts/Toast':
      'export const useToast=()=>event=>{window.lastToast=event;};',
    '~/constants/sockets/api':
      'export const socket={on:(name,fn)=>{if(!window.events.has(name))window.events.set(name,new Set());window.events.get(name).add(fn);},off:(name,fn)=>window.events.get(name)?.delete(fn)};',
    '~/components/ErrorBoundary': 'export default ({children})=>children;',
    '~/helpers':
      'export const isMobile=nav=>/iPhone|Android/i.test(nav.userAgent);export const isTablet=()=>false;',
    '~/helpers/stringHelpers':
      'export const stringIsEmpty=s=>!s?.trim();export const exceedsCharLimit=()=>false;export const finalizeEmoji=s=>s;export const generateFileName=()=>"fixture.png";',
    '~/helpers/imageHelpers': 'export const downloadImage=async()=>{};',
    './ImageEditModal': 'export default ()=>null;',
    './Caption': 'export default ()=>null;',
    './PinsDialog': 'export default ()=>null;'
  };
  const result = await build({
    entryPoints: [path.join(repo, 'test/fixtures/chatSharedMedia.tsx')],
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
        name: 'fixture-services',
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
  const css = readFileSync(path.join(repo, 'src/styles.css'), 'utf8');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Twinkle · shared chat media preview</title><style>${css}
  html,body,#root{height:100%;margin:0}#root{display:flex;flex-direction:column}button,textarea{font-family:inherit}button{cursor:pointer}
  .fixture-bar{display:flex;align-items:center;gap:22px;flex-wrap:wrap;min-height:76px;padding:16px 24px;background:#fff;border-bottom:1px solid #dce3ed;color:#334155;font-size:14px;flex-shrink:0}.fixture-bar strong{font-size:22px;color:#418ceb}.fixture-bar strong span{display:block;font-size:12px;font-weight:500;color:#64748b}.fixture-bar small{margin-left:auto;color:#64748b}.fixture-bar button{padding:9px 14px;border:1px solid #dce3ed;background:#fff;color:#526176;border-radius:8px;margin-right:6px}.fixture-bar button[aria-pressed=true]{color:#2868ae;background:#edf5ff;border-color:#c3d9f6}
  [data-chat-workspace]{flex:1;min-height:0}.fixture-controls{padding:12px}.fixture-controls button{width:100%;border:0;border-radius:8px;padding:12px;background:#273449;color:#fff;font-size:14px;font-weight:650}.fixture-avatars{font-size:24px;margin-top:14px}.fixture-search{padding:12px;margin:8px;border:1px solid #dce3ed;border-radius:9px;font-size:12px;color:#94a3b8;background:#fff}.fixture-chats{padding:6px;overflow:auto}.fixture-chats button{display:block;width:100%;padding:12px 8px;text-align:left;font-size:13px;border:0;border-radius:8px;background:transparent;color:#334155;font-weight:600}.fixture-chats small{display:block;font-size:11px;color:#64748b;margin-top:3px;font-weight:400}.fixture-chats .active{background:#e8eff8}.fixture-topics{flex:0 1 auto;overflow:auto;min-height:0;margin:12px 8px 0;font-size:12px}.fixture-topics h3{margin:0 5px 8px;font-size:11px;color:#64748b}.fixture-topics button{display:block;text-align:left;width:100%;padding:10px 6px;border:0;border-radius:6px;background:transparent;color:#526176;font-size:12px}.fixture-topics .active{background:#e8eff8;color:#2868ae;font-weight:600}.fixture-conversation{flex:1;min-width:300px;display:flex;flex-direction:column;background:white;overflow:hidden}.fixture-conversation header{padding:20px 24px;border-bottom:1px solid #e2e8f0}.fixture-conversation header span{display:block;color:#64748b;font-size:12px;margin-top:3px}.fixture-messages{padding:24px;flex:1;overflow:auto}.fixture-date{text-align:center;color:#94a3b8;font-size:12px;margin-bottom:24px}.fixture-messages article{margin-bottom:24px;line-height:1.6;font-size:14px}.fixture-messages article b{font-size:13px;color:#334155}.fixture-messages small{font-weight:400;color:#94a3b8;margin-left:8px}.fixture-messages p{margin:8px 0 0;padding:12px 16px;border:1px solid #e2e8f0;border-radius:2px 12px 12px;max-width:540px;background:#f8fafc;color:#334155}.fixture-messages img{width:190px;border-radius:10px;margin-top:12px}.fixture-conversation footer{padding:12px;border-top:1px solid #e2e8f0}.fixture-conversation textarea{width:100%;height:54px;border:1px solid #dce3ed;border-radius:12px;padding:14px;font-size:14px;resize:none}.fixture-members{padding:20px 16px;flex:0 0 150px;font-size:13px;color:#526176}.fixture-members p{padding-top:14px}
  @media(max-width:767px){.fixture-bar{padding:12px;gap:12px}.fixture-bar small{display:none}.fixture-conversation{flex:0 0 100vw;min-width:0}.fixture-members{flex:0 0 30vw}.fixture-topics{overflow:visible}.fixture-messages{padding:16px}.fixture-conversation header{padding:16px}.fixture-controls{padding:8px}.fixture-controls button{font-size:12px}.fixture-avatars{font-size:18px} }
  </style></head><body><div id="root"></div><script>${result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
}
