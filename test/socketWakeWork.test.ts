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

test('a session-only refresh skips funds, chess stats and traffic', () => {
  assert.match(
    app,
    /if \(refreshOnly\) return !sessionChanged\(\);\s*try \{\s*const \{ totalFunds \} = await loadCommunityFunds\(\);/m
  );
  assert.match(app, /<SocketManager onInit=\{handleSocketInit\} \/>/);
});

test('a signed-in connect leaves the version and feed checks to the bind acknowledgement', () => {
  assert.match(
    initSocket,
    /if \(!userIdRef\.current\) \{\s*void handleCheckVersion\(\);\s*void checkFeedsOutdated\(\{ bypassThrottle: true, withFallback: true \}\);\s*\}/m
  );
  assert.match(initSocket, /onBound\(\) \{\s*void handleCheckVersion\(\);/m);
});
