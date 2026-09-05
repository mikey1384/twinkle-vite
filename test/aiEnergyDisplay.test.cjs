const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const sourceRoot = path.join(__dirname, '../src');
const source = readFileSync(path.join(sourceRoot, 'helpers/aiEnergyDisplay.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS }
}).outputText;
const moduleValue = { exports: {} };
vm.runInNewContext(compiled, { exports: moduleValue.exports, module: moduleValue });
const { getAiEnergyDisplay, getAiEnergyRefillTime, formatAiEnergyRefillTime } = moduleValue.exports;

test('the reported 4,553-unit remainder is visibly positive, not empty', () => {
  const policy = Object.freeze({ energyRemaining: 4553, baseEnergyUnitsPerDay: 850000, energyPercent: 0 });
  const display = getAiEnergyDisplay(policy);
  assert.equal(display.label, 'Less than 1%');
  assert.ok(Math.abs(display.percent - 0.5356470588235294) < 1e-12);
  assert.equal(policy.energyPercent, 0, 'formatting must not change the canonical snapshot');
});

test('zero, sub-1%, 1%, normal and full batteries stay distinct', () => {
  for (const [remaining, label] of [[0, '0%'], [1, 'Less than 1%'], [8499, 'Less than 1%'], [8500, '1%'], [425000, '50%'], [850000, '100%']]) {
    assert.equal(getAiEnergyDisplay({ energyRemaining: remaining, baseEnergyUnitsPerDay: 850000 }).label, label);
  }
});

test('recharges do not dilute the percentage by the cumulative daily limit', () => {
  assert.equal(getAiEnergyDisplay({ energyRemaining: 850000, energyLimit: 2550000, baseEnergyUnitsPerDay: 850000, energyPercent: 100 }).label, '100%');
  assert.equal(getAiEnergyDisplay({ energyRemaining: 5000, energyLimit: 2550000, baseEnergyUnitsPerDay: 850000, energyPercent: 0 }).label, 'Less than 1%');
});

test('legacy responses work without inventing an unknown battery balance', () => {
  assert.equal(getAiEnergyDisplay({ energyRemaining: 5, energyPercent: 0 }).label, 'Less than 1%');
  assert.equal(getAiEnergyDisplay({ energyPercent: 0 }).label, '0%');
  assert.equal(getAiEnergyDisplay(null, 40).label, '40%');
  assert.equal(getAiEnergyDisplay({ energyPercent: 0.4 }).label, 'Less than 1%');
  assert.equal(getAiEnergyDisplay(null).label, '—');
  assert.equal(getAiEnergyDisplay({ energyRemaining: 5 }).label, '—');
});

test('invalid numbers cannot leak NaN, negative or over-full percentages', () => {
  for (const value of [NaN, Infinity, -Infinity]) {
    assert.equal(getAiEnergyDisplay({ energyPercent: value }).percent, null);
    assert.equal(getAiEnergyDisplay({ energyRemaining: value, baseEnergyUnitsPerDay: 850000 }).label, '—');
  }
  assert.equal(getAiEnergyDisplay({ energyRemaining: -5, energyPercent: 40 }).label, '0%');
  assert.equal(getAiEnergyDisplay({ energyRemaining: 900000, baseEnergyUnitsPerDay: 850000 }).label, '100%');
  assert.equal(getAiEnergyDisplay({ energyRemaining: 3, baseEnergyUnitsPerDay: 0, energyPercent: 0 }).label, 'Less than 1%');
});

test('refill is the midnight UTC following the canonical quota day', () => {
  const refill = Date.parse('2026-09-06T00:00:00Z');
  assert.equal(getAiEnergyRefillTime({ dayKey: '2026-09-05' }), refill);
  const dayIndex = (Date.parse('2026-09-05T00:00:00Z') - Date.UTC(2022, 0, 1)) / 86400000;
  assert.equal(getAiEnergyRefillTime({ dayIndex }), refill);
  assert.equal(getAiEnergyRefillTime({ dayIndex: String(dayIndex) }), refill);
  assert.equal(getAiEnergyRefillTime({ dayKey: '2026-12-31' }), Date.parse('2027-01-01T00:00:00Z'));
  assert.equal(getAiEnergyRefillTime({ dayKey: '2028-02-29' }), Date.parse('2028-03-01T00:00:00Z'));
});

test('malformed canonical dates do not silently roll into another day', () => {
  for (const dayKey of ['2026-02-29', '2026-09-35', '2026-9-5', '', 'not a date']) {
    assert.equal(getAiEnergyRefillTime({ dayKey }), null);
  }
  for (const dayIndex of [NaN, Infinity, -1, 1.5, Number.MAX_SAFE_INTEGER, '', ' ', '1.5', '1e3', '-1', 'invalid']) {
    assert.equal(getAiEnergyRefillTime({ dayIndex }), null);
  }
  assert.equal(getAiEnergyRefillTime(null), null);
});

test('refill formatting uses the viewer timezone, including date and DST changes', () => {
  const refill = Date.parse('2026-09-06T00:00:00Z');
  assert.match(formatAiEnergyRefillTime(refill, 'Asia/Seoul'), /Sep 6.*9:00.*GMT\+9/);
  assert.match(formatAiEnergyRefillTime(refill, 'Asia/Bangkok'), /Sep 6.*7:00.*GMT\+7/);
  assert.match(formatAiEnergyRefillTime(refill, 'America/Los_Angeles'), /Sep 5.*5:00.*PDT/);
  assert.match(formatAiEnergyRefillTime(Date.parse('2026-11-01T00:00:00Z'), 'America/Los_Angeles'), /Oct 31.*5:00.*PDT/);
  assert.match(formatAiEnergyRefillTime(Date.parse('2026-11-02T00:00:00Z'), 'America/Los_Angeles'), /Nov 1.*4:00.*PST/);
});

test('every shared Energy card receives the canonical policy, including nested image follow-ups', () => {
  const callers = [
    'containers/Build/Editor/ChatPanel/Header.tsx',
    'containers/Build/Runtime/index.tsx',
    'components/Notification/TodayStats/index.tsx',
    'containers/Chat/Body/MessagesContainer/MessageInput/index.tsx',
    'containers/Home/AIStoriesModal/SuccessModal/index.tsx',
    'components/Modals/ImageModal/ImageEditModal.tsx',
    'components/Modals/UploadModal/ImageGenerator/index.tsx',
    'components/Modals/UploadModal/ImageGenerator/ImageArea/GeneratedImageDisplay/FollowUpInput.tsx'
  ];
  for (const caller of callers) {
    const text = readFileSync(path.join(sourceRoot, caller), 'utf8');
    const ast = ts.createSourceFile(caller, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let cards = 0;
    function visit(node) {
      if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(ast) === 'AiEnergyCard') {
        cards++;
        assert.ok(node.attributes.properties.some(prop => ts.isJsxAttribute(prop) && prop.name.getText(ast) === 'energyPolicy'), caller);
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
    assert.ok(cards > 0, caller);
  }
});

test('call countdown no longer fabricates a reset before canonical stats arrive', () => {
  const text = readFileSync(path.join(sourceRoot, 'containers/Home/Stories/Featured/CallZero.tsx'), 'utf8');
  assert.doesNotMatch(text, /buildTodayStatsForNextDay/);
  assert.match(text, /newStats: \{ nextDayTimeStamp: newNextDayTimeStamp \}/);
  assert.match(text, /todayStats: buildTodayStatsFromResponse\(todayStatsFromServer\)/);
});
