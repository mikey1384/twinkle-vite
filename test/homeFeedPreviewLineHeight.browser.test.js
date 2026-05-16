import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const BODY_SOURCE_URL = new URL(
  '../src/containers/Home/Stories/FeedCard/Body/index.tsx',
  import.meta.url
);
const CHROME_CANDIDATES = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium'
].filter(Boolean);

test('Home feed preview RichText computes the standard card line-height in a browser', async (t) => {
  const chromePath = CHROME_CANDIDATES.find((candidate) =>
    existsSync(candidate)
  );
  if (!chromePath) {
    t.skip('Chrome is not installed; set CHROME_BIN to run this browser test.');
    return;
  }

  const bodySource = readFileSync(BODY_SOURCE_URL, 'utf8');
  assert.match(
    bodySource,
    /const homeFeedPreviewRichTextStyle: React\.CSSProperties = \{\s+lineHeight: 1\.36\s+\};/
  );
  assert.equal(
    (bodySource.match(/style=\{homeFeedPreviewRichTextStyle\}/g) || []).length,
    5
  );

  const tempDir = await mkdtemp(path.join(tmpdir(), 'twinkle-line-height-'));
  t.after(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  const htmlPath = path.join(tempDir, 'fixture.html');
  await writeFile(
    htmlPath,
    `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      .home-feed-card__subject-copy,
      .home-feed-card__reflection-preview {
        font-size: 20px;
        line-height: 1.36;
      }
      .rich-text-root {
        line-height: 1.7;
      }
      .line-clamp-richtext {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        font-size: 20px;
        line-height: 1.36;
        overflow: hidden;
        width: 420px;
      }
      .line-clamp-richtext > p {
        display: inline;
        margin: 0;
      }
    </style>
  </head>
  <body>
    <div class="home-feed-card__subject-copy">
      <div
        id="subject"
        class="home-feed-card__subject-description home-feed-card__primary-preview-text rich-text-root"
        style="line-height: 1.36"
      >
        subject text
      </div>
      <div
        id="control"
        class="home-feed-card__subject-description home-feed-card__primary-preview-text rich-text-root"
      >
        control text
      </div>
    </div>
    <div class="home-feed-card__reflection-preview">
      <div
        id="reflection"
        class="home-feed-card__reflection-answer home-feed-card__primary-preview-text rich-text-root"
        style="line-height: 1.36"
      >
        reflection text
      </div>
    </div>
    <div
      id="desktop-clamp"
      style="
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 10;
        font-size: 20px;
        line-height: 1.36;
        overflow: hidden;
        width: 420px;
      "
    >one<br>two<br>three<br>four<br>five<br>six<br>seven<br>eight<br>nine<br>ten<br>eleven</div>
    <div
      id="mobile-clamp"
      style="
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 11;
        font-size: 20px;
        line-height: 1.36;
        overflow: hidden;
        width: 240px;
      "
    >one<br>two<br>three<br>four<br>five<br>six<br>seven<br>eight<br>nine<br>ten<br>eleven<br>twelve</div>
    <div
      id="blank-break-clamp"
      class="line-clamp-richtext"
      style="-webkit-line-clamp: 3;"
    ><p>one<br><br>two<br>three</p></div>
  </body>
</html>
`,
    'utf8'
  );

  const chrome = spawn(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-default-browser-check',
      '--no-first-run',
      `--remote-debugging-port=0`,
      `--user-data-dir=${path.join(tempDir, 'profile')}`,
      `file://${htmlPath}`
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] }
  );
  t.after(() => {
    chrome.kill('SIGTERM');
  });

  const port = await waitForDevToolsPort(chrome);
  const pageWebSocketUrl = await getPageWebSocketUrl(port);
  const client = await createCdpClient(pageWebSocketUrl);
  t.after(() => {
    client.close();
  });

  await client.send('Runtime.enable');
  await waitForPageComplete(client);

  const computed = await client.evaluate(`(() => {
    function inspect(id) {
      const element = document.getElementById(id);
      const style = window.getComputedStyle(element);
      const fontSize = Number.parseFloat(style.fontSize);
      const lineHeight = Number.parseFloat(style.lineHeight);
      return {
        fontSize,
        height: element.getBoundingClientRect().height,
        inlineLineHeight: element.style.lineHeight,
        lineHeight,
        ratio: lineHeight / fontSize
      };
    }
    return {
      blankBreakClamp: inspect('blank-break-clamp'),
      clamp: inspect('mobile-clamp'),
      control: inspect('control'),
      desktopClamp: inspect('desktop-clamp'),
      reflection: inspect('reflection'),
      subject: inspect('subject')
    };
  })()`);

  assertLineHeightRatio(computed.subject, 1.36);
  assertLineHeightRatio(computed.reflection, 1.36);
  assertLineHeightRatio(computed.control, 1.7);
  assert.equal(computed.desktopClamp.lineHeight, 27.2);
  assert.ok(
    Math.abs(
      computed.desktopClamp.height - 10 * computed.desktopClamp.lineHeight
    ) < 1,
    `Expected 10 clamped desktop lines, received ${computed.desktopClamp.height}`
  );
  assert.equal(computed.clamp.lineHeight, 27.2);
  assert.ok(
    Math.abs(computed.clamp.height - 11 * computed.clamp.lineHeight) < 1,
    `Expected 11 clamped mobile lines, received ${computed.clamp.height}`
  );
  assert.equal(computed.blankBreakClamp.lineHeight, 27.2);
  assert.ok(
    Math.abs(
      computed.blankBreakClamp.height - 3 * computed.blankBreakClamp.lineHeight
    ) < 1,
    `Expected blank line breaks to count as 3 clamped lines, received ${computed.blankBreakClamp.height}`
  );
});

function assertLineHeightRatio(result, expectedRatio) {
  assert.equal(result.fontSize, 20);
  assert.ok(
    Math.abs(result.ratio - expectedRatio) < 0.001,
    `Expected line-height ratio ${expectedRatio}, received ${result.ratio}`
  );
}

async function waitForDevToolsPort(chrome) {
  let stderr = '';
  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for Chrome DevTools. ${stderr}`));
    }, 10_000);

    chrome.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      const match = stderr.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//);
      if (!match) return;
      clearTimeout(timeout);
      resolve(Number(match[1]));
    });

    chrome.on('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Chrome exited before DevTools was ready: ${code}`));
    });
  });
}

async function getPageWebSocketUrl(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`);
  const targets = await response.json();
  const page = targets.find((target) => target.type === 'page');
  assert.ok(page?.webSocketDebuggerUrl, 'Missing Chrome page target');
  return page.webSocketDebuggerUrl;
}

async function createCdpClient(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let nextId = 1;
  const pending = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { reject, resolve } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) {
      reject(new Error(message.error.message));
      return;
    }
    resolve(message.result);
  });

  return {
    close() {
      socket.close();
    },
    async evaluate(expression) {
      const result = await this.send('Runtime.evaluate', {
        awaitPromise: true,
        expression,
        returnByValue: true
      });
      if (result.exceptionDetails) {
        throw new Error(
          result.exceptionDetails.exception?.description ||
            result.exceptionDetails.text
        );
      }
      return result.result.value;
    },
    send(method, params = {}) {
      const id = nextId;
      nextId += 1;
      return new Promise((resolve, reject) => {
        pending.set(id, { reject, resolve });
        socket.send(JSON.stringify({ id, method, params }));
      });
    }
  };
}

async function waitForPageComplete(client) {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const readyState = await client.evaluate('document.readyState');
    if (readyState === 'complete') return;
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  throw new Error('Timed out waiting for browser fixture to load.');
}
