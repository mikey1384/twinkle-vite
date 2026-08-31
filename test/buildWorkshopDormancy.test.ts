import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const panelSource = readFileSync(
  new URL(
    '../src/containers/Chat/RightMenu/ChatInfo/AIChatMenu/BuildWorkshopPanel.tsx',
    import.meta.url
  ),
  'utf8'
);
const menuSource = readFileSync(
  new URL(
    '../src/containers/Chat/RightMenu/ChatInfo/AIChatMenu/index.tsx',
    import.meta.url
  ),
  'utf8'
);
const defaultsSource = readFileSync(
  new URL('../src/constants/defaultValues.ts', import.meta.url),
  'utf8'
);

test('Build Workshop contributes no right-menu DOM until the server enables it', () => {
  const dormantGate = panelSource.indexOf(
    'if (!status?.featureVisible) return null;'
  );
  const firstRenderedElement = panelSource.indexOf('<section');
  assert(dormantGate > -1, 'missing the canonical dormant UI gate');
  assert(
    firstRenderedElement > dormantGate,
    'Workshop DOM can render before canonical visibility is confirmed'
  );
  assert.match(menuSource, /<BuildWorkshopPanel[\s\S]*channelId=\{channelId\}/);
  assert.doesNotMatch(menuSource, /sponsorGuidePath|How sponsorship/);
  assert.match(panelSource, /<Icon icon="hammer" \/>/);
  assert.match(panelSource, /<span>Build Workshop<\/span>/);
  assert.match(panelSource, /to=\{status\.sponsorGuidePath \|\| '\/sponsor'\}/);
  assert.doesNotMatch(
    panelSource,
    /pendingRelays|createBuildWorkshopJob|cancelBuildWorkshopJob|<button|<input|<details|Before you say go/
  );
  assert.doesNotMatch(panelSource, /overflow-y|max-height/);
});

test('only controlled preview accounts mount the Workshop status poller', () => {
  assert.match(
    defaultsSource,
    /BUILD_WORKSHOP_PREVIEW_USER_IDS = new Set\(\[554, 263, 5\]\)/
  );
  assert.match(menuSource, /BUILD_WORKSHOP_PREVIEW_USER_IDS\.has/);
  assert.match(
    menuSource,
    /isBuildWorkshopPreviewAccount \? \([\s\S]*?<BuildWorkshopPanel/
  );
  assert.match(
    menuSource,
    /lazyWithRetry\(\(\) => import\('\.\/BuildWorkshopPanel'\)\)/
  );
});

test('the shared worker indicator does not impersonate either assistant or human presence', () => {
  const indicatorColors = ['#8d369f', '#4c55b5', '#626b7b'];
  for (const color of indicatorColors) {
    assert.match(panelSource, new RegExp(color));
    assert(
      contrastAgainstWhite(color) >= 4.5,
      `${color} must preserve readable text contrast`
    );
  }
  assert.doesNotMatch(
    panelSource,
    /(?:green|orange|#(?:00ff00|ff0000|ffa500))/i
  );
  assert.match(panelSource, /return 'Open'/);
  assert.match(panelSource, /return 'Busy'/);
  assert.match(panelSource, /return 'Closed'/);
  assert.doesNotMatch(panelSource, /\{status\.statusLabel\}/);
  assert.match(panelSource, /const STATUS_REFRESH_MS = 5_000/);
  assert.match(panelSource, /setStatus\(canonicalStatus\)/);
  assert.doesNotMatch(panelSource, /setStatus\(\(current|optimistic/i);
});

function contrastAgainstWhite(hex: string) {
  const channels = [1, 3, 5].map((offset) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16)
  );
  const [red, green, blue] = channels.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  return 1.05 / (luminance + 0.05);
}
