import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

function source(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

test('Wordle shows canonical today-only skip protection before close', () => {
  const wordleModal = source(
    'src/containers/Chat/Modals/WordleModal/index.tsx'
  );
  const game = source(
    'src/containers/Chat/Modals/WordleModal/Game/index.tsx'
  );
  const checklist = source(
    'src/containers/Chat/Modals/WordleModal/SkipShieldChecklist.tsx'
  );

  assert.match(
    wordleModal,
    /builtWithLumineToday:[\s\S]*?builtWithLumineToday[\s\S]*?hasWorkingBuild/
  );
  assert.match(wordleModal, /void refreshSkipShieldStatus\(\)/);
  assert.match(wordleModal, /window\.addEventListener\('focus'/);
  assert.match(wordleModal, /skipShieldChecklist=\{skipShieldChecklist\}/);
  assert.match(
    wordleModal,
    /status\?\.todayDodgePending &&[\s\S]*?!status\?\.todayCovered[\s\S]*?setSkipShieldModalShown\(true\)/
  );
  assert.match(
    game,
    /skipShieldChecklist &&[\s\S]*?<SkipShieldChecklist checklist=\{skipShieldChecklist\} compact/
  );
  assert.match(checklist, /Built with Lumine today/);
  assert.match(checklist, /new projects and updates both count/);
  assert.match(checklist, /improve one you already have/);
  assert.match(checklist, /first build chat works even with an empty battery/);
  assert.match(checklist, /Tried a member's app today/);
  assert.match(checklist, /You're protected if you leave today's word unfinished/);
});
