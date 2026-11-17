import assert from 'node:assert/strict';
import test from 'node:test';
import {
  openAssistantDock,
  closeAssistantDock,
  getAssistantAskContext,
  type AssistantAskContext
} from '../src/containers/App/AssistantDock/dockState';

test('the shared text/voice dock preserves practice identity across topic and companion switches', () => {
  const practice: AssistantAskContext = {
    kind: 'arenaBattleItem',
    id: 91,
    practiceId: 55,
    no: 9,
    label: 'question 2',
    path: '/arena?mode=train&practice=55',
    step: 2,
    reviewLang: 'ko'
  };
  const battle: AssistantAskContext = {
    kind: 'arenaBattleItem',
    id: 92,
    no: 4,
    label: 'question 1'
  };
  openAssistantDock('Zero', practice, 7);
  assert.deepEqual(getAssistantAskContext(), practice);
  openAssistantDock('Ciel', battle, 8);
  assert.deepEqual(getAssistantAskContext(), battle);
  openAssistantDock('Zero', undefined, 7);
  assert.deepEqual(getAssistantAskContext(), practice);
  closeAssistantDock();
  openAssistantDock('Zero', undefined, 7);
  assert.deepEqual(getAssistantAskContext(), practice);
  // Transport preserves the exact attempt rather than just the source paper.
  assert.equal(
    JSON.parse(JSON.stringify(getAssistantAskContext())).practiceId,
    55
  );
});
