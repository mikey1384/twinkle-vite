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
  assert.match(panelSource, /relay\.details\?\.requestedOutcome/);
  assert.match(panelSource, /relay\.details\?\.constraints\?\.length/);
  assert.match(panelSource, /relay\.details\?\.acceptanceCriteria\?\.length/);
});

test('only controlled preview accounts mount the Workshop status poller', () => {
  assert.match(
    menuSource,
    /BUILD_WORKSHOP_PREVIEW_USER_IDS = new Set\(\[554, 263, 5\]\)/
  );
  assert.match(
    menuSource,
    /isBuildWorkshopPreviewAccount \? \([\s\S]*?<BuildWorkshopPanel/
  );
  assert.match(
    menuSource,
    /lazyWithRetry\(\(\) => import\('\.\/BuildWorkshopPanel'\)\)/
  );
});

test('Zero and Ciel duty indicators do not reuse human presence colors', () => {
  const indicatorColors = [
    '#9c2fb2',
    '#6748c7',
    '#6e607f',
    '#1f63c5',
    '#087e98',
    '#5d7085'
  ];
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
