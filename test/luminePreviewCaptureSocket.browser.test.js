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
const restrictedToken = [
  Buffer.from('{"alg":"HS256"}').toString('base64url'),
  Buffer.from('{"sub":900001,"capture":"lumine-preview","buildId":900001}').toString('base64url'),
  'synthetic-signature'
].join('.');
const normalToken = 'synthetic-normal-thumbnail-token';

async function until(predicate, message, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    assert.ok(Date.now() < deadline, message);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

async function runCapture({ restricted, published = false }) {
  let connections = 0;
  const activeConnections = new Set();
  let rejectedHandshakes = 0;
  let rejectedBinds = 0;
  let acceptedBinds = 0;
  let sessionRequests = 0;
  let buildRequests = 0;
  let previewRequests = 0;
  let sdkTokenRequests = 0;
  let sdkUserRequests = 0;
  const errors = [];
  const fixtureUser = { id: 900001, userId: 900001, username: 'capture-fixture', state: {} };
  const code = `<html><body><h1>Local capture fixture visible</h1><div id="sdk">waiting</div>
    <script>
      const bridgeLoadId = new URLSearchParams(location.search).get('twinkleBridgeLoadId');
      document.body.dataset.bridgeLoad = bridgeLoadId || 'none';
      const prefix = 'twinkle-build-preview:';
      let nonce = window.name.startsWith(prefix) ? window.name.slice(prefix.length) : '';
      document.body.dataset.bridgeNonce = nonce ? 'window-name' : 'missing';
      let completed = false;
      window.addEventListener('message', (event) => {
        const data = event.data || {};
        if (data.source !== 'twinkle-parent') return;
        if (data.type === 'bridge:nonce' && !nonce) {
          nonce = data.previewNonce;
          document.body.dataset.bridgeNonce = nonce ? 'received' : 'missing';
        } else if (data.id === 'fixture-read') {
          completed = true;
          document.getElementById('sdk').textContent = JSON.stringify(data.payload || data.error);
        }
      });
      const timer = setInterval(() => {
        if (completed) return clearInterval(timer);
        if (nonce) parent.postMessage({ source: 'twinkle-build', type: 'api:get-user',
          id: 'fixture-read', previewNonce: nonce, payload: { userId: 900001 } }, '*');
        else parent.postMessage({ source: 'twinkle-build', type: 'bridge:request-nonce',
          payload: { bridgeLoadId } }, '*');
      }, 200);
    </script></body></html>`;
  const fixtureBuild = {
    build: { id: 900001, userId: 900001, title: 'Capture socket fixture',
      code, isPublic: false, currentArtifactVersionId: 1 },
    projectFiles: [{ path: '/index.html', content: code }]
  };
  const api = createHttpServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204).end(); return; }
    const pathname = new URL(req.url, 'http://fixture.invalid').pathname;
    let body = {};
    if (pathname === '/management/achievements') {
      body = { fixture: { id: 1, name: 'Fixture' } };
    } else if (pathname === '/user/session') {
      sessionRequests += 1;
      body = fixtureUser;
    } else if (pathname === '/build/900001') {
      buildRequests += 1;
      body = fixtureBuild;
    } else if (pathname === '/build/900001/api/token') {
      sdkTokenRequests += 1;
      if (req.headers.authorization !== (restricted ? restrictedToken : normalToken)) {
        res.writeHead(403).end();
        return;
      }
      body = { token: 'synthetic-build-api-token', scopes: ['user:read'], expiresAt: 4102444800 };
    } else if (pathname === '/build/900001/api/user') {
      sdkUserRequests += 1;
      if (req.headers['x-build-api-token'] !== 'synthetic-build-api-token') {
        res.writeHead(403).end();
        return;
      }
      body = { user: { id: 900001, username: 'read-only-fixture' } };
    } else if (pathname.startsWith('/build/preview/')) {
      previewRequests += 1;
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
  io.on('connection', (socket) => {
    connections += 1;
    activeConnections.add(socket.id);
    socket.on('disconnect', () => activeConnections.delete(socket.id));
    if (socket.handshake.auth?.token === restrictedToken) rejectedHandshakes += 1;
    socket.on('bind_uid_to_socket', (payload, acknowledge) => {
      if (payload?.token === restrictedToken) {
        rejectedBinds += 1;
        // Cap the positive-control loop so a regression cannot spin forever.
        if (rejectedBinds <= 3) {
          acknowledge?.({ authError: true });
          socket.disconnect(true);
        }
      } else if (payload?.token === normalToken) {
        acceptedBinds += 1;
        acknowledge?.({});
      }
    });
  });
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
      server: { host: 'localhost', port: 3000, strictPort: true,
        proxy: {
          '/build/preview': { target: apiOrigin },
          '/build/vendor': { target: apiOrigin }
        }
      }
    });
    await vite.listen();
    const appOrigin = 'http://localhost:3000';
    browser = await chromium.launch({ headless: true, timeout: 10_000 });
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    page.on('pageerror', (error) => errors.push(error.message));
    // Actual App + capture host + preview; synthetic API and socket only.
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== appOrigin && url.origin !== apiOrigin) {
        await route.abort();
        return;
      }
      await route.continue();
    });
    if (published) {
      await page.addInitScript((token) => {
        if (window.top !== window) return;
        localStorage.setItem('token', token);
        localStorage.setItem('userId', '900001');
        localStorage.setItem('username', 'capture-fixture');
      }, normalToken);
      await page.goto(`${appOrigin}/app/900001`, { waitUntil: 'domcontentloaded' });
      await until(() => acceptedBinds > 0,
        'published Build runtime must still bind its interactive session');
      assert.ok(connections > 0);
      assert.equal(rejectedBinds, 0);
      console.log(JSON.stringify({ published, connections, acceptedBinds }));
      return;
    }
    const captureUrl = new URL('/app-capture/900001', appOrigin);
    captureUrl.searchParams.set('previewPath', '/build/preview/build/900001/version/1/index.html');
    if (restricted) {
      captureUrl.searchParams.set('lumineCaptureId', '1234567890abcdef1234567890abcdef');
      captureUrl.searchParams.set('captureViewport', 'phone');
    }
    captureUrl.hash = new URLSearchParams({
      authToken: restricted ? restrictedToken : normalToken,
      viewerId: '900001', viewerUsername: 'capture-fixture'
    }).toString();
    await page.goto(captureUrl.toString(), { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__TWINKLE_CAPTURE_READY__ === true,
      undefined, { timeout: 20_000 });
    await page.frameLocator('iframe').getByRole('heading', { name: 'Local capture fixture visible' })
      .waitFor({ timeout: 10_000 });
    try {
      await page.frameLocator('iframe').locator('#sdk:has-text("read-only-fixture")')
        .waitFor({ timeout: 6_000 });
    } catch (error) {
      console.log(JSON.stringify({ restricted, errors, sdkTokenRequests, sdkUserRequests,
        frame: await page.frameLocator('iframe').locator('body').evaluate((body) => ({
          bridgeLoad: body.dataset.bridgeLoad, bridgeNonce: body.dataset.bridgeNonce,
          sdk: body.querySelector('#sdk')?.textContent
        })) }));
      throw error;
    }
    assert.ok(sessionRequests > 0, 'canonical HTTP identity must initialize');
    assert.ok(buildRequests > 0 && previewRequests > 0, 'actual preview must load');
    assert.ok(sdkTokenRequests > 0 && sdkUserRequests > 0, 'SDK read must pass through the host bridge');
    if (restricted && process.env.PREVIEW_SOCKET_BASELINE === '1') {
      await until(() => rejectedBinds >= 3, 'baseline did not reproduce repeated restricted-token bind rejections');
      assert.ok(rejectedHandshakes >= 1, 'reconnect handshake must carry the restricted credential');
    } else if (restricted) {
      // Exercise the App's focus/online recovery paths after identity loads.
      await page.evaluate(() => {
        window.dispatchEvent(new Event('focus'));
        window.dispatchEvent(new Event('online'));
        document.dispatchEvent(new Event('visibilitychange'));
      });
      await page.waitForTimeout(1_500);
      assert.equal(connections, 0, 'restricted preview must not open the member socket');
      assert.equal(rejectedHandshakes, 0);
      assert.equal(rejectedBinds, 0);
      await page.evaluate(() => {
        history.pushState({}, '', '/app/900001');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await page.waitForTimeout(1_000);
      assert.equal(connections, 0,
        'leaving the capture route with its restricted credential must not reconnect');
    } else {
      await until(() => acceptedBinds > 0, 'normal thumbnail must bind its interactive session');
      assert.ok(connections > 0);
      assert.equal(rejectedBinds, 0);
      const bindsBeforeNavigation = acceptedBinds;
      await page.evaluate(() => {
        const url = new URL(location.href);
        url.searchParams.set('lumineCaptureId', '1234567890abcdef1234567890abcdef');
        history.pushState({}, '', url);
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await until(() => activeConnections.size === 0,
        'entering a restricted capture must stop an existing socket');
      await page.evaluate(() => {
        const url = new URL(location.href);
        url.searchParams.delete('lumineCaptureId');
        history.pushState({}, '', url);
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await until(() => acceptedBinds > bindsBeforeNavigation && activeConnections.size > 0,
        'returning to an interactive thumbnail must reconnect its session');
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ restricted, connections, rejectedHandshakes,
      rejectedBinds, acceptedBinds, sessionRequests, buildRequests, previewRequests,
      sdkTokenRequests, sdkUserRequests }));
  } finally {
    await browser?.close();
    await vite?.close();
    await new Promise((resolve) => io.close(resolve));
    api.closeAllConnections();
    await new Promise((resolve) => api.close(resolve));
  }
}

test('Lumine restricted preview preserves HTTP rendering without socket retries',
  { timeout: 120_000 }, async () => runCapture({ restricted: true }));

test('normal thumbnail still initializes and binds its interactive socket',
  { timeout: 120_000 }, async () => runCapture({ restricted: false }));

test('published Build runtime still binds its interactive socket',
  { timeout: 120_000 }, async () => runCapture({ restricted: false, published: true }));
