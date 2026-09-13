import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatShare,
  getMonthlyScale,
  getSourceBreakdown
} from '../src/containers/Profile/Body/Home/Activities/XPAnalysis/helpers/data';

test('Lumine XP is labeled and the old undefined category stays counted', () => {
  const data = getSourceBreakdown([
    { name: 'lumine apps', value: 1200 },
    { name: 'writing', value: 2400 },
    { name: 'undefined', value: 400 },
    { name: 'future source', value: 1000 }
  ]);
  assert.deepEqual(
    data.map((row) => ({ ...row, share: formatShare(row.share) })),
    [
      { name: 'writing', label: 'Writing', value: 2400, share: '48%' },
      { name: 'other', label: 'Other', value: 1400, share: '28%' },
      { name: 'lumine apps', label: 'Lumine apps', value: 1200, share: '24%' }
    ]
  );
});

test('small sources remain visible and revoked XP is preserved without negative shares', () => {
  const data = getSourceBreakdown([
    { name: 'writing', value: -200 },
    { name: 'grammar', value: 99999 },
    { name: 'lumine apps', value: 1 }
  ]);
  assert.equal(data[1].value, 1);
  assert.equal(formatShare(data[1].share), '<0.1%');
  assert.equal(data[2].value, -200);
  assert.equal(data[2].share, 0);
  assert.deepEqual(getSourceBreakdown([{ name: 'writing', value: 0 }]), [
    { name: 'writing', label: 'Writing', value: 0, share: 0 }
  ]);
});

test('monthly bars include negative net XP and a stable zero baseline', () => {
  const months = (values: number[]) =>
    values.map((value, id) => ({ id, label: String(id), value }));
  assert.deepEqual(getMonthlyScale(months([300, -100, 0])), {
    min: -100,
    max: 300,
    range: 400,
    zero: 75
  });
  assert.deepEqual(getMonthlyScale(months([-300, -100])), {
    min: -300,
    max: 0,
    range: 300,
    zero: 0
  });
  for (const values of [[], [0, 0, 0]]) {
    assert.deepEqual(getMonthlyScale(months(values)), {
      min: 0,
      max: 0,
      range: 1,
      zero: 0
    });
  }
});
