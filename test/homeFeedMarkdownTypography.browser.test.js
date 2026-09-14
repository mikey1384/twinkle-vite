import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const {
  chromium,
  webkit
} = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const repo = fileURLToPath(new URL('..', import.meta.url));
const fixture = `
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import RichText from './src/components/Texts/RichText';
import { bodyClass } from './src/containers/Home/Stories/FeedCard/Body/styles';
import { getFeedCardSizing } from './src/containers/Home/Stories/FeedCard/helpers/sizing';
import { homeFeedMarkdownPreviewClass, HOME_FEED_MARKDOWN_LINE_HEIGHT } from './src/containers/Home/Stories/FeedCard/helpers/typography';

const excerpt = "Maren woke before dawn, as she always did, and lay still for a moment listening to the house. Iven's breathing beside her — slow, deep, the particular rhythm of a man who slept without guilt. The creak of the shop sign downstairs, swinging in the early wind.";
const table = '| First column | Middle column | Last column |\\n| --- | --- | --- |\\n| A long descriptive label for the first column | More details about what happens next | The last column stays reachable too |';
const samples = {
  story: '# Two Coppers\\n\\n' + excerpt + '\\n\\n' + excerpt,
  headings: '# First heading\\n\\nParagraph.\\n\\n## Second heading\\n\\nParagraph.\\n\\n### Third heading\\n\\nParagraph.\\n\\n#### Fourth heading\\n\\n##### Fifth heading\\n\\n###### Sixth heading',
  nested: '> ## Quoted heading\\n> Quoted paragraph.\\n\\n* ### List heading\\n  List paragraph.',
  long: '# ' + 'A very long chapter title with many words '.repeat(6) + '\\n\\n' + excerpt,
  unbroken: '# ' + 'LongChapterTitle'.repeat(12) + '\\n\\n' + excerpt,
  embed: '# Preview heading\\n\\n![Embedded card](/subjects/1)\\n\\nAnother paragraph.',
  breaks: 'one\\n\\n\\ntwo\\nthree',
  table,
  nestedTable: '- Step one\\n\\n' + table.split('\\n').map(row => '  ' + row).join('\\n'),
  list: Array.from({length: 12}, (_, i) => '- Step ' + (i + 1) + ': ' + excerpt).join('\\n')
};
function Fixture() {
  const [state, setState] = useState({ sample: 'story', enabled: true, full: false });
  window.configure = setState;
  const text = samples[state.sample];
  const sizing = getFeedCardSizing({ content: { contentType: 'comment', content: text }, userId: 1 });
  const longPreview = ['story', 'long', 'unbroken', 'list', 'table', 'nestedTable'].includes(state.sample);
  return <MemoryRouter><main className="fixture-card">
    <header><b>mikey answered: My first book: The Color Held</b><small>Typography preview</small></header>
    <div className={state.full ? 'full-post' : bodyClass}>
      <section className={!state.full && longPreview ? sizing.main.className : ''}>
        <div className="home-feed-card__text-preview"><div className="home-feed-card__text-copy">
          <RichText className={'home-feed-card__primary-preview-text ' + (state.enabled && !state.full ? homeFeedMarkdownPreviewClass : '')}
            contentId="typography-fixture" contentType="comment" section="content" hideDictation isAudioButtonShown={false}
            isPreview={!state.full} isAIMessage={['nested', 'list', 'table', 'nestedTable'].includes(state.sample)}
            maxLines={longPreview ? sizing.main.textMaxLines : state.sample === 'breaks' ? 3 : 40}
            mobileMaxLines={longPreview ? sizing.main.mobileTextMaxLines : state.sample === 'breaks' ? 3 : 40}
            lineHeight={HOME_FEED_MARKDOWN_LINE_HEIGHT} style={{lineHeight: HOME_FEED_MARKDOWN_LINE_HEIGHT}}>
            {text}
          </RichText>
        </div></div>
      </section>
    </div>
    <footer><span>Like · Comment</span><button id="show-more" onClick={() => setState({...state, full: !state.full})}>{state.full ? 'Back to preview' : 'Show More →'}</button></footer>
  </main></MemoryRouter>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
`;

let bundle;
async function compileFixture() {
  if (bundle) return bundle;
  const stubs = {
    '~/components/Link': 'export { Link as default } from "react-router-dom";',
    '~/components/Button':
      'import React from "react"; export default function Button({children,onClick,style}) {return <button onClick={onClick} style={style}>{children}</button>}',
    '~/components/Icon': 'export default function Icon() {return null}',
    '~/components/ErrorBoundary':
      'export default function ErrorBoundary({children}) {return children}',
    '~/theme/hooks/useRoleColor':
      'export const useRoleColor = () => ({color:"#126bb5",colorKey:"logoBlue",themeName:"logoBlue"});',
    './AIAudioButton': 'export default function AIAudioButton() {return null}',
    './ChatMessageTools':
      'export default function ChatMessageTools() {return null}',
    './EmbeddedComponent': `import React from 'react'; export default function Embed() {return <div className="rich-text-embedded-component"><div className="fixture-embed"><h3>Embedded card title</h3><p>Embedded card description</p></div></div>}`,
    './LazyCodeBlockWrapper':
      'import React from "react"; export default function Code({children}) {return <pre>{children}</pre>}'
  };
  const result = await build({
    stdin: { contents: fixture, resolveDir: repo, loader: 'tsx' },
    absWorkingDir: repo,
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
        setup(b) {
          b.onResolve({ filter: /.*/ }, (args) =>
            stubs[args.path]
              ? { path: args.path, namespace: 'fixture-stub' }
              : undefined
          );
          b.onLoad({ filter: /.*/, namespace: 'fixture-stub' }, (args) => ({
            contents: stubs[args.path],
            loader: 'jsx',
            resolveDir: repo
          }));
        }
      }
    ]
  });
  bundle = result.outputFiles[0].text;
  return bundle;
}

for (const engine of ['chromium', 'webkit']) {
  test(
    `Home Markdown typography wraps and clamps without changing reader/embed styles (${engine})`,
    { timeout: 60000 },
    async () => {
      const script = await compileFixture();
      const browser = await { chromium, webkit }[engine].launch();
      try {
        const page = await browser.newPage({
          viewport: { width: 390, height: 844 },
          hasTouch: true
        });
        page.setDefaultTimeout(5000);
        const errors = [];
        page.on('pageerror', (error) => {
          errors.push(error.message);
        });
        await page.setContent(`<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><style>${readFileSync(path.join(repo, 'src/styles.css'), 'utf8')}
        body{background:#f4f6f8} .fixture-card{width:100%;max-width:660px;margin:20px auto;background:white;border:1px solid #d8dde5;padding:8px}
        header{font-size:15px;padding:8px} header small{display:block;color:#888;font-size:12px;margin-top:4px}
        footer{font-size:13px;border-top:1px solid #ddd;display:flex;justify-content:space-between;align-items:center;padding:8px}
        footer button{border:0;border-radius:8px;background:#418ceb;color:white;padding:8px 12px;font:inherit;font-weight:700}
        .full-post{font-size:19px}.fixture-embed{font-size:14px}.fixture-embed h3{font-size:20px;line-height:1.3}.fixture-embed p{font-size:14px;line-height:1.4}
        </style><div id="root"></div>`);
        await page.addScriptTag({ content: script });
        await page.locator('[data-rich-text-body] h1').waitFor();
        const configure = async (sample, enabled = true) => {
          await page.evaluate((state) => window.configure(state), {
            sample,
            enabled,
            full: false
          });
          await page.locator('[data-rich-text-body]').waitFor();
          await page.evaluate(
            () =>
              new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve))
              )
          );
        };
        const font = (selector) =>
          page
            .locator(selector)
            .first()
            .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
        for (const width of [320, 390, 767, 768, 820, 1280]) {
          await page.setViewportSize({ width, height: 900 });
          await configure('story');
          const bodySize = width <= 767 ? 17 : 18;
          assert.equal(await font('[data-rich-text-body]'), bodySize);
          assert.equal(await font('[data-rich-text-body] h1'), bodySize * 1.25);
          const gap = await page
            .locator('[data-rich-text-body]')
            .evaluate((el) => {
              const heading = el.querySelector('h1'),
                paragraph = el.querySelector('p');
              const textRange = document.createRange();
              textRange.selectNodeContents(paragraph);
              return {
                topMargin: parseFloat(getComputedStyle(heading).marginTop),
                gap:
                  Array.from(textRange.getClientRects()).find(
                    (rect) => rect.width > 0
                  ).top - heading.getBoundingClientRect().bottom
              };
            });
          assert.equal(gap.topMargin, 0);
          assert.ok(gap.gap >= 0 && gap.gap <= 14, JSON.stringify(gap));
          for (const sample of [
            'headings',
            'nested',
            'long',
            'unbroken',
            'breaks',
            'table',
            'nestedTable',
            'list'
          ]) {
            await configure(sample);
            assert.equal(
              await page.evaluate(
                () =>
                  document.documentElement.scrollWidth >
                  document.documentElement.clientWidth
              ),
              false,
              `${sample} overflows at ${width}px`
            );
            const metrics = await page
              .locator('[data-rich-text-body]')
              .evaluate((el) => ({
                height: el.getBoundingClientRect().height,
                maxHeight: parseFloat(getComputedStyle(el).maxHeight),
                headings: Array.from(
                  el.querySelectorAll('h1,h2,h3,h4,h5,h6')
                ).map((h) => ({
                  size: parseFloat(getComputedStyle(h).fontSize),
                  display: getComputedStyle(h).display,
                  clamp: getComputedStyle(h).webkitLineClamp
                }))
              }));
            if (Number.isFinite(metrics.maxHeight))
              assert.ok(metrics.height <= metrics.maxHeight + 1);
            for (const heading of metrics.headings) {
              assert.ok(
                heading.size >= bodySize && heading.size <= bodySize * 1.25
              );
              assert.equal(heading.display, 'block');
              assert.equal(heading.clamp, 'none');
            }
            if (sample === 'table' || sample === 'nestedTable') {
              const tableMetrics = await page
                .locator('[data-rich-text-table]')
                .evaluate((scroll) => {
                  const table = scroll.querySelector('table');
                  const first = table.rows[0].cells[0];
                  const last = table.rows[0].cells[2];
                  scroll.scrollLeft = 0;
                  const start = first.getBoundingClientRect().left;
                  scroll.scrollLeft = scroll.scrollWidth;
                  return {
                    overflow: getComputedStyle(scroll).overflowX,
                    left: scroll.getBoundingClientRect().left,
                    right: scroll.getBoundingClientRect().right,
                    start,
                    end: last.getBoundingClientRect().right,
                    scrollWidth: scroll.scrollWidth,
                    width: scroll.clientWidth
                  };
                });
              assert.equal(tableMetrics.overflow, 'auto');
              assert.ok(tableMetrics.scrollWidth > tableMetrics.width);
              assert.ok(tableMetrics.start >= tableMetrics.left - 1);
              assert.ok(tableMetrics.end <= tableMetrics.right + 1);
            }
            if (sample === 'list') {
              const clippedLines = await page
                .locator('[data-rich-text-body]')
                .evaluate((root) => {
                  const bottom = root.getBoundingClientRect().bottom;
                  const walker = document.createTreeWalker(
                    root,
                    NodeFilter.SHOW_TEXT
                  );
                  const clipped = [];
                  let text;
                  while ((text = walker.nextNode())) {
                    if (!text.textContent.trim()) continue;
                    const range = document.createRange();
                    range.selectNodeContents(text);
                    for (const rect of range.getClientRects()) {
                      if (
                        rect.width &&
                        rect.top < bottom - 1 &&
                        rect.bottom > bottom + 1
                      )
                        clipped.push({
                          top: rect.top,
                          bottom: rect.bottom,
                          clip: bottom
                        });
                    }
                  }
                  return clipped;
                });
              assert.deepEqual(
                clippedLines,
                [],
                `A list line is cut off at ${width}px`
              );
            }
          }
        }
        await page.setViewportSize({ width: 390, height: 844 });
        await configure('embed', false);
        await page.locator('.fixture-embed h3').waitFor();
        const oldEmbed = [
          await font('.fixture-embed h3'),
          await font('.fixture-embed p')
        ];
        await configure('embed');
        assert.deepEqual(
          [await font('.fixture-embed h3'), await font('.fixture-embed p')],
          oldEmbed
        );
        await configure('story');
        await page.locator('#show-more').click();
        await page.locator('.full-post [data-rich-text-body] > h1').waitFor();
        assert.equal(await font('.full-post [data-rich-text-body] > h1'), 38);
        assert.equal(
          await page
            .locator('.full-post [data-rich-text-body]')
            .evaluate((el) => getComputedStyle(el).webkitLineClamp),
          'none'
        );
        if (process.env.FEED_TYPOGRAPHY_SCREENSHOTS) {
          mkdirSync(process.env.FEED_TYPOGRAPHY_SCREENSHOTS, {
            recursive: true
          });
          for (const width of [390, 820, 1280]) {
            await page.setViewportSize({ width, height: 900 });
            for (const enabled of [false, true]) {
              await configure('story', enabled);
              await page.screenshot({
                path: path.join(
                  process.env.FEED_TYPOGRAPHY_SCREENSHOTS,
                  engine +
                    '-' +
                    width +
                    '-' +
                    (enabled ? 'after' : 'before') +
                    '.png'
                ),
                fullPage: true
              });
            }
          }
        }
        const settledHeights = await page
          .locator('[data-rich-text-body]')
          .evaluate(async (el) => {
            const heights = [];
            for (let i = 0; i < 4; i++) {
              await new Promise((resolve) => requestAnimationFrame(resolve));
              heights.push(el.getBoundingClientRect().height);
            }
            return heights;
          });
        assert.ok(
          settledHeights.every((height) => height === settledHeights[0]),
          'clamp layout settles after viewport/content changes'
        );
        assert.deepEqual(errors, []);
      } finally {
        await browser.close();
      }
    }
  );
}
