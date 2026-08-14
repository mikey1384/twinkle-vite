import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

test('Wordle child modals render above the level-zero game modal', () => {
  const wordleModal = source(
    'src/containers/Chat/Modals/WordleModal/index.tsx'
  );
  const skipShieldModal = source(
    'src/containers/Chat/Modals/WordleModal/SkipShieldModal.tsx'
  );
  const overviewModal = source(
    'src/containers/Chat/Modals/WordleModal/OverviewModal/index.tsx'
  );

  assert.match(wordleModal, /modalKey="WordleModal"[\s\S]*?modalLevel=\{0\}/);
  assert.match(
    skipShieldModal,
    /modalKey="WordleSkipShieldModal"[\s\S]*?modalLevel=\{1\}/
  );
  assert.match(
    overviewModal,
    /modalKey="OverviewModal"[\s\S]*?modalLevel=\{1\}/
  );
});
