import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const initSocket = readFileSync(
  new URL(
    '../src/containers/App/Header/hooks/useAPISocket/useInitSocket.ts',
    import.meta.url
  ),
  'utf8'
);
const app = readFileSync(
  new URL('../src/containers/App/index.tsx', import.meta.url),
  'utf8'
);

// 10-20: every chat load re-ran the whole sign-in, so each cold start and each
// reconnect did it twice; a connect also sent the version and feed checks twice.
test('a chat load re-runs sign-in only while identity is unconfirmed, and refreshes the session after a gap', () => {
  assert.match(
    initSocket,
    /if \(!canonicalSessionUserIdRef\.current\) \{\s*void onInit\(\);\s*\} else if \(canonicalReadFromWriter\) \{\s*void onInit\(\{ refreshOnly: true \}\);\s*\}/m
  );
  assert.doesNotMatch(
    initSocket,
    /try \{\s*onInit\(\);\s*recordChatBootstrapEvent\('chat-bootstrap-on-init'/m
  );
});

test('a session-only refresh rereads funds but skips chess stats and traffic', () => {
  const refresh = app.slice(
    app.indexOf('if (refreshOnly) {'),
    app.indexOf('const chessStats = await loadChessStats();')
  );
  const refreshBranch = refresh.slice(
    0,
    refresh.indexOf('return !sessionChanged();')
  );
  assert.match(refreshBranch, /await loadCommunityFunds\(\);/);
  assert.doesNotMatch(refreshBranch, /loadChessStats|recordUserTraffic/);
  assert.match(app, /<SocketManager onInit=\{handleSocketInit\} \/>/);
});

test('one version check per connect (even if the bind fails); the feed check waits for the bind', () => {
  assert.match(
    initSocket,
    /void handleCheckVersion\(\);\s*if \(!userIdRef\.current\) \{\s*void checkFeedsOutdated\(\{ bypassThrottle: true, withFallback: true \}\);\s*\}/m
  );
  assert.match(initSocket, /onBound\(\) \{\s*void checkFeedsOutdated\(\{/m);
  assert.doesNotMatch(
    initSocket,
    /onBound\(\) \{\s*void handleCheckVersion\(\);/m
  );
});
