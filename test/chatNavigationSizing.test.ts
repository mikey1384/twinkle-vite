import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_WIDTHS,
  MIN_WIDTHS,
  MAX_WIDTHS,
  RESIZE_HANDLE_WIDTH,
  fitNavigationWidths,
  getPanelMaximum,
  readNavigationWidths
} from '../src/containers/Chat/LeftMenu/helpers/navigationSizing';

test('narrowing the workspace fits both lists without losing saved desktop widths', () => {
  const preferred = { channels: 330, context: 300 };
  for (const available of [680, 540, 392, 300, 248]) {
    const fitted = fitNavigationWidths(preferred, available, true);
    assert.ok(fitted.channels >= MIN_WIDTHS.channels);
    assert.ok(fitted.context >= MIN_WIDTHS.context);
    assert.ok(fitted.channels + fitted.context + RESIZE_HANDLE_WIDTH <= available);
  }
  assert.deepEqual(preferred, { channels: 330, context: 300 });
  assert.deepEqual(fitNavigationWidths(preferred, 700, true), preferred);
});

test('a stacked tablet or a chat without context only reserves the channels column', () => {
  const preferred = { channels: 330, context: 300 };
  assert.deepEqual(fitNavigationWidths(preferred, 270, false), {
    channels: 270,
    context: 300
  });
  assert.equal(getPanelMaximum('channels', preferred, 270, false), 270);
  assert.deepEqual(fitNavigationWidths(preferred, 700, true), preferred);
});

test('each drag limit reserves the other column and the conversation space', () => {
  const available = 420;
  const widths = fitNavigationWidths(DEFAULT_WIDTHS, available, true);
  for (const panel of ['channels', 'context'] as const) {
    const other = panel === 'channels' ? 'context' : 'channels';
    const maximum = getPanelMaximum(panel, widths, available, true);
    assert.ok(maximum <= MAX_WIDTHS[panel]);
    assert.equal(maximum + widths[other] + RESIZE_HANDLE_WIDTH, available);
    const next = { ...widths, [panel]: maximum };
    assert.deepEqual(fitNavigationWidths(next, available, true), next);
  }
});

test('invalid or obsolete stored preferences cannot collapse or explode the layout', () => {
  for (const stored of ['', '{', 'null', '[]', '{"channels":"220","context":null}']) {
    assert.deepEqual(readNavigationWidths(stored), DEFAULT_WIDTHS);
  }
  assert.deepEqual(readNavigationWidths('{"channels":-50,"context":100000}'), {
    channels: MIN_WIDTHS.channels,
    context: MAX_WIDTHS.context
  });
  assert.deepEqual(readNavigationWidths('{"channels":234,"context":178}'), {
    channels: 234,
    context: 178
  });
});
