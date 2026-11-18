import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { cache } from '@emotion/css';
import { writeFileSync } from 'node:fs';
import ProfileActionPreview from '../src/containers/Chat/Message/MessageBody/ProfileActionPreview';

const preview = {
  kind: 'profile_action' as const,
  title: 'Profile section order',
  before: [
    '1. Daily Reflection Stats',
    '2. Intro',
    '3. Pictures',
    '4. Builds',
    '5. AI Cards',
    '6. Featured',
    '7. Notable Activities',
    '8. XP Analysis',
    '9. Mission Progress'
  ],
  after: [
    '1. Builds',
    '2. Pictures',
    '3. Intro',
    '4. Daily Reflection Stats',
    '5. AI Cards',
    '6. Featured',
    '7. Notable Activities',
    '8. XP Analysis',
    '9. Mission Progress'
  ]
};
const rendered = renderToStaticMarkup(
  <ProfileActionPreview preview={preview} />
);
const css = Object.values(cache.inserted)
  .filter((value) => typeof value === 'string')
  .join('\n');
const buttons =
  '<div class="buttons"><button>Yes, go ahead!</button><button>No thanks</button></div>';
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Profile action approval — before and after</title><style>
*{box-sizing:border-box}body{margin:0;color:#2f3747;background:#fff;font:17px/1.5 system-ui}main{padding:16px;max-width:1000px;margin:auto}h1{font-size:1.4rem}h2{font-size:1.2rem;margin:1.5rem 0 0.6rem}.card{background:#f8fafc;border:1px solid #cbd5e1;padding:12px;border-radius:12px;margin-bottom:16px}.buttons{display:flex;gap:10px;flex-wrap:wrap}button{font:inherit;font-size:1rem;white-space:normal;min-height:44px;padding:8px 12px;border:1px solid #64748b;border-radius:8px;background:white;color:#243248}button:first-child{background:#e7f3ff}p{overflow-wrap:anywhere}#qa{font-size:1rem;white-space:pre-wrap}${css}</style><main>
<h1>Profile action approval</h1><h2>Before this change</h2><div class="card"><p>Move Builds and Pictures above Intro?</p>${buttons}</div>
<h2>After this change</h2><div class="card">${rendered}<p>Move Builds and Pictures above Intro?</p>${buttons}</div><pre id="qa"></pre></main>
<script>window.addEventListener('load',()=>{const nodes=[...document.querySelectorAll('h1,h2,h4,strong,p,button')];const hidden=nodes.filter(node=>{const rect=node.getBoundingClientRect(),style=getComputedStyle(node);return !rect.width||!rect.height||style.visibility==='hidden'||style.display==='none'||rect.left<0||rect.right>innerWidth+1;}).map(n=>n.textContent);const result={width:innerWidth,visibleTextNodes:nodes.length,hidden,overflow:document.documentElement.scrollWidth>innerWidth};document.getElementById('qa').textContent=JSON.stringify(result);document.documentElement.dataset.qa=hidden.length||result.overflow?'fail':'pass';});</script></html>`;
writeFileSync(new URL('../../preview.html', import.meta.url), html);
