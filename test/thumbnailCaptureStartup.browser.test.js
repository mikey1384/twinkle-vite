import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

const require = createRequire(import.meta.url);
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const { chromium } = require('/Users/mikey/.npm-packages/lib/node_modules/playwright');
const { Server: SocketServer } = require(
  require.resolve('socket.io', {
    paths: [fileURLToPath(new URL('../../twinkle-api', import.meta.url))]
  })
);

function gate() {
  let release;
  const promise = new Promise((resolve) => { release = resolve; });
  return { promise, release };
}

async function until(predicate, message, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    assert.ok(Date.now() < deadline, message);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

test('capture starts a canonical session even after guest socket startup',
  { timeout: 120_000 }, async () => {
    const captureModule = gate();
    const achievements = gate();
    const session = gate();
    let captureModuleRequested = false;
    let achievementsRequested = false;
    let connections = 0;
    let sessionRequests = 0;
    let buildRequests = 0;
    const errors = [];
    const fixtureUser = { id: 900001, userId: 900001, username: 'capture-fixture', state: {} };
    const code = '<html><body><h1>Canonical capture session ready</h1></body></html>';
    const fixtureBuild = {
      build: { id: 900001, userId: 900001, title: 'Capture startup fixture',
        code, isPublic: false, currentArtifactVersionId: 1 },
      projectFiles: [{ path: '/index.html', content: code }]
    };
    const api = createHttpServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
      const pathname = new URL(req.url, 'http://fixture.invalid').pathname;
      let body = {};
      if (pathname === '/management/achievements') {
        achievementsRequested = true;
        await achievements.promise;
        body = { fixture: { id: 1, name: 'Fixture' } };
      } else if (pathname === '/user/session') {
        sessionRequests += 1;
        await session.promise;
        body = fixtureUser;
      } else if (pathname === '/build/900001') {
        buildRequests += 1;
        body = fixtureBuild;
      } else if (pathname.startsWith('/build/preview/')) {
        res.setHeader('Content-Type', 'text/html');
        res.end(code);
        return;
      } else if (pathname === '/notification/version') {
        body = { match: true, version };
      }
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(body));
    });
    const io = new SocketServer(api, { cors: { origin: '*' } });
    io.on('connection', () => { connections += 1; });
    let vite;
    let browser;
    try {
      await new Promise((resolve) => api.listen(0, '127.0.0.1', resolve));
      const apiOrigin = `http://127.0.0.1:${api.address().port}`;
      vite = await createViteServer({
        root: fileURLToPath(new URL('..', import.meta.url)),
        logLevel: 'error',
        define: {
          'import.meta.env.VITE_URL': JSON.stringify(apiOrigin),
          'import.meta.env.VITE_BUILD_PREVIEW_ORIGIN': '""',
          'import.meta.env.VITE_BUILD_PREVIEW_ORIGIN_TEMPLATE': '""'
        },
        server: { host: '127.0.0.1', port: 0, strictPort: true,
          proxy: {
            '/build/preview': { target: apiOrigin },
            '/build/vendor': { target: apiOrigin }
          }
        }
      });
      await vite.listen();
      const appOrigin = `http://127.0.0.1:${vite.httpServer.address().port}`;
      browser = await chromium.launch({ headless: true, timeout: 10_000 });
      const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
      page.on('pageerror', (error) => errors.push(error.message));
      // Use the real App, contexts, capture component and preview iframe. Only
      // the server is synthetic; no request may reach a production service.
      await page.route('**/*', async (route) => {
        const url = new URL(route.request().url());
        if (url.origin !== appOrigin && url.origin !== apiOrigin) {
          await route.abort();
          return;
        }
        if (url.pathname.endsWith('/Build/ThumbnailCaptureHost.tsx')) {
          captureModuleRequested = true;
          await captureModule.promise;
        }
        await route.continue();
      });
      const previewPath = '/build/preview/build/900001/version/1/index.html';
      const captureUrl = new URL('/app-capture/900001', appOrigin);
      captureUrl.searchParams.set('previewPath', previewPath);
      captureUrl.hash = new URLSearchParams({ authToken: 'synthetic-capture-credential',
        viewerId: '900001', viewerUsername: 'capture-fixture' }).toString();
      await page.goto(captureUrl.toString(), { waitUntil: 'domcontentloaded' });
      await until(() => captureModuleRequested && achievementsRequested && connections > 0,
        'guest App and socket must start before the lazy capture module');
      captureModule.release();
      await until(() => buildRequests > 0 || sessionRequests > 0,
        'capture bootstrap must begin');
      // This unrelated App update exposes the token to the canonical-session
      // gate after its initial guest startup. It must not strand the capture.
      achievements.release();
      await until(() => sessionRequests > 0,
        'capture credential was saved without starting canonical session initialization', 3_000);
      assert.equal(await page.evaluate(() => window.__TWINKLE_CAPTURE_READY__ === true), false,
        'capture must wait for canonical identity');
      session.release();
      await page.waitForFunction(() => window.__TWINKLE_CAPTURE_READY__ === true,
        undefined, { timeout: 10_000 });
      assert.equal(sessionRequests, 1, 'capture joins the existing session single-flight');
      assert.ok(buildRequests > 0);
      assert.deepEqual(errors, []);
    } finally {
      captureModule.release();
      achievements.release();
      session.release();
      await browser?.close();
      await vite?.close();
      await new Promise((resolve) => io.close(resolve));
      api.closeAllConnections();
      await new Promise((resolve) => api.close(resolve));
    }
  });
