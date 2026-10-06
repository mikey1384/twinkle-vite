import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { unified } from 'unified';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

// Lumine's question is posted into a member's chat as Zero/Ciel's message.
// The API (twinkle-api helpers/build/sponsorship/dialogue.ts
// neutralizeChatMarkup) puts a zero-width space after "]", "<", "@" and
// inside "://" and "www."; its test pins these exact outputs. Here the
// chat renderer's own markdown pipeline (the AI-message path of RichText
// Markdown) must turn them into inert text: no link, image, app embed, HTML
// or @mention.
const Z = '\u200B';
const NEUTRALIZED_PAYLOADS = [
  `[click me]${Z}(https:${Z}//evil.example/x)`,
  `![]${Z}(https:${Z}//evil.example/a.png)`,
  `![]${Z}(https:${Z}//www${Z}.twin-kle.com/app/123)`,
  `<${Z}img src=x onerror=alert(1)><${Z}script>alert(1)<${Z}/script>`,
  `see https:${Z}//evil.example and www${Z}.evil.example`,
  `ask @${Z}mikey or mail a@${Z}b.com`,
  `[a]${Z}: https:${Z}//evil.example\n[x]${Z}[a]${Z}`
];

function renderAsChat(text: string) {
  const message = `Lumine has a question for you:\n\n${text
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n')}`;
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex)
    .use(rehypeStringify)
    .processSync(message)
    .toString();
}

// handleMentions (Markdown helpers) links any "@name" it finds with this
// pattern (it needs a DOM, so the pattern is checked here instead).
const MENTION_PATTERN = /@[A-Za-z0-9_%]{3,}/;

test('a neutralized Lumine question renders with no links, images, embeds or HTML', () => {
  const helpersSource = readFileSync(
    new URL(
      '../src/components/Texts/RichText/Markdown/helpers/index.ts',
      import.meta.url
    ),
    'utf8'
  );
  assert.ok(
    helpersSource.includes('const mentionTestRegex = /@[A-Za-z0-9_%]{3,}/;'),
    'the mention pattern this test relies on changed'
  );
  for (const payload of NEUTRALIZED_PAYLOADS) {
    const html = renderAsChat(payload);
    assert.doesNotMatch(html, /<a\b/i, html);
    assert.doesNotMatch(html, /<img\b/i, html);
    assert.doesNotMatch(html, /<script\b/i, html);
    assert.doesNotMatch(html, MENTION_PATTERN, html);
  }
});

test('the same payloads without neutralizing would render (the check is real)', () => {
  const raw = NEUTRALIZED_PAYLOADS.map((payload) =>
    payload.replaceAll(Z, '')
  );
  assert.match(renderAsChat(raw[0]), /<a href="https:\/\/evil\.example\/x"/);
  assert.match(renderAsChat(raw[1]), /<img src="https:\/\/evil\.example\/a\.png"/);
  assert.match(renderAsChat(raw[4]), /<a href="https:\/\/evil\.example"/);
  assert.match(renderAsChat(raw[5]), /<a href="mailto:a@b\.com"/);
});
