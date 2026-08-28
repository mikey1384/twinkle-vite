import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const hookSource = readFileSync(
  new URL('../src/helpers/hooks/useWorkshopEngineerMode.ts', import.meta.url),
  'utf8'
);
const quickAccessAvatarSource = readFileSync(
  new URL(
    '../src/containers/Chat/LeftMenu/QuickAccess/Avatar.tsx',
    import.meta.url
  ),
  'utf8'
);
const zeroButtonSource = readFileSync(
  new URL(
    '../src/containers/Home/TopMenu/InputPanel/ZeroButton.tsx',
    import.meta.url
  ),
  'utf8'
);
const cielButtonSource = readFileSync(
  new URL(
    '../src/containers/Home/TopMenu/InputPanel/CielButton.tsx',
    import.meta.url
  ),
  'utf8'
);

test('Workshop engineer mode performs one canonical shared-duty read per refresh', () => {
  assert.match(
    hookSource,
    /const SHARED_DUTY_STATUS_PERSONA: WorkshopPersona = 'zero'/
  );
  assert.match(
    hookSource,
    /loadStatus\(\{\s*persona: SHARED_DUTY_STATUS_PERSONA\s*\}\)/
  );
  assert.doesNotMatch(hookSource, /Promise\.all|PERSONAS\.map/);
});

test('Workshop engineer mode keeps its source scoped to the current account', () => {
  assert.match(
    hookSource,
    /loadStatus !== fetchStatus \|\| requestUserId !== statusUserId/
  );
  assert.match(
    hookSource,
    /statusUserId !== canonicalUserId[\s\S]*fetchStatus !== loadBuildWorkshopStatus/
  );
  assert.match(
    hookSource,
    /statusUserId === canonicalUserId[\s\S]*getSnapshot\(\)/
  );
  assert.match(
    hookSource,
    /fetchStatus = null;[\s\S]*statusUserId = null;[\s\S]*dutyLive = false;/
  );
});

test('the status loader is installed before the external store subscribes', () => {
  const installEffect = hookSource.indexOf('useEffect(() => {');
  const externalStore = hookSource.indexOf('return useSyncExternalStore(');
  assert(installEffect > -1, 'missing canonical status loader effect');
  assert(
    externalStore > installEffect,
    'the store can subscribe before its canonical loader is installed'
  );
});

test('non-Workshop quick-access avatars do not keep the status poll alive', () => {
  assert.match(hookSource, /enabled = true/);
  assert.match(
    hookSource,
    /const shouldSubscribe =[\s\S]*enabled && BUILD_WORKSHOP_PREVIEW_USER_IDS/
  );
  assert.match(
    quickAccessAvatarSource,
    /enabled: partner\.isAi && isWorkshopPersona/
  );
});

test('home Workshop portraits preserve an accessible button name', () => {
  assert.match(zeroButtonSource, /aria-label="Chat with Zero"/);
  assert.match(cielButtonSource, /aria-label="Chat with Ciel"/);
  assert.match(zeroButtonSource, /alt=""[\s\S]*aria-hidden="true"/);
  assert.match(cielButtonSource, /alt=""[\s\S]*aria-hidden="true"/);
});
