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
  // "Build Workshop" is the Builds page's own workshop; this sponsor-powered
  // panel is the Lumine Workshop.
  assert.match(panelSource, /<span>Lumine Workshop<\/span>/);
  assert.doesNotMatch(panelSource, /<span>Build Workshop<\/span>/);
  assert.match(panelSource, /to=\{status\.sponsorGuidePath \|\| '\/sponsor'\}/);
  // Consent, staging, and job control live in the chat thread now; the panel
  // keeps only the persona's invitation, sponsor credit, and queue peek.
  assert.doesNotMatch(
    panelSource,
    /pendingRelays|createBuildWorkshopJob|cancelBuildWorkshopJob|<button|<input|Before you say go|consent/
  );
  assert.match(panelSource, /wearing a builder cap/);
  assert.match(panelSource, /Ask me to help build something/);
  assert.match(panelSource, /is sharing their AI to power the workshop/);
  assert.match(panelSource, /Who's in the workshop/);
  assert.match(panelSource, /state === 'build_available'\) return '#1e7f24'/);
  assert.match(panelSource, /You're powering the workshop with your own AI/);
  // One Workshop seat per user: when the other assistant already has this
  // user's job, the bubble says so instead of claiming the workshop is full,
  // and someone else's job only means a short wait, never a closed door.
  assert.match(panelSource, /You're already building with \$\{otherAssistant\} right now/);
  assert.match(panelSource, /Lumine is busy with someone else's project right now, but tell me what you need/);
  assert.match(panelSource, /Lumine has used up today's builds/);
  assert.match(panelSource, /The workshop's queue is full right now/);
  assert.doesNotMatch(panelSource, /The workshop is full right now/);
  // The peek counts everyone listed, not only the people still waiting.
  assert.match(panelSource, /Who's in the workshop \(\{queuePeople\.length\}\)/);
  // Only the queue list may scroll; the section itself never becomes a
  // scroll container that squats over the bookmarks below it.
  const sectionStyle = panelSource.slice(
    panelSource.indexOf('<section'),
    panelSource.indexOf('</header>')
  );
  assert.doesNotMatch(sectionStyle, /overflow-y|max-height/);
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
  // Open is the confirmed 5db43526a hue (darkened for label contrast), not
  // the neutral navy the staging refactor briefly reintroduced. Busy matches
  // the chat status circle's red on the dot (Color.red()) and uses a darker
  // red for the 1rem label so it stays readable.
  assert.match(panelSource, /state === 'build_working'\) return Color\.red\(\)/);
  assert.match(panelSource, /state === 'build_working'\) return '#c62d1f'/);
  assert.match(panelSource, /color: \$\{stateLabelColor\}/);
  const indicatorColors = ['#c62d1f', '#1e7f24', '#626b7b'];
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
