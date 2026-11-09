import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProjectFileLineDiagnostics } from '../src/containers/Build/PreviewPanel/helpers/codeWorkspaceSearch';

const over = Array.from({ length: 501 }, () => 'x').join('\n');

test('an over-limit file unchanged from the saved version does not block saving; a changed one does', () => {
  const saved = new Map([['/old.js', over]]);
  const unchanged = buildProjectFileLineDiagnostics([{ path: '/old.js', content: over }] as any, 500, saved);
  assert.equal(unchanged[0].severity, 'warning');
  assert.equal(unchanged[0].unchangedOverLimit, true);
  const grown = buildProjectFileLineDiagnostics([{ path: '/old.js', content: `${over}\nx` }] as any, 500, saved);
  assert.equal(grown[0].severity, 'error');
  // Same rule as the server: saved content counts at any path (a rename).
  const renamed = buildProjectFileLineDiagnostics([{ path: '/renamed.js', content: over }] as any, 500, saved);
  assert.equal(renamed[0].severity, 'warning');
  const newFile = buildProjectFileLineDiagnostics([{ path: '/new.js', content: `${over}\ny` }] as any, 500, saved);
  assert.equal(newFile[0].severity, 'error');
});
