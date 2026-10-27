import React from 'react';
import { css, cx } from '@emotion/css';
import AssistantFace from '~/components/AssistantFace';
import { useChatContext } from '~/contexts';
import { openAssistantDock } from '~/containers/App/AssistantDock/dockState';
import type { ArenaBattle, ArenaCompanion } from './types';
import { ARENA } from './theme';

export default function ExamCompanionChoice({ value, onChange, solo, disabled = false }: {
  value: ArenaCompanion;
  onChange: (value: ArenaCompanion) => void;
  solo: boolean;
  disabled?: boolean;
}) {
  const zeroChannel = useChatContext(v => v.state.zeroChannelId);
  const cielChannel = useChatContext(v => v.state.cielChannelId);
  if (solo) return <section className={wrapCls} aria-label="Solo mastery run">
    <strong>This is your solo mastery run.</strong>
    <p>Take this new paper on your own. Zero and Ciel can review it with you after you submit.</p>
  </section>;
  return <section className={wrapCls} aria-label="Exam companion">
    <strong>How would you like to take this exam?</strong>
    <div className={choicesCls} role="radiogroup" aria-label="Who will help you?">
      {(['Zero', 'Ciel', 'solo'] as const).map(assistant => <button key={assistant} type="button"
        role="radio" aria-checked={value === assistant}
        disabled={disabled || (assistant === 'Zero' ? !zeroChannel : assistant === 'Ciel' ? !cielChannel : false)}
        className={cx(choiceCls, value === assistant && selectedCls)} onClick={() => onChange(assistant)}>
        {assistant !== 'solo' && <AssistantFace assistant={assistant} size="2.4rem" />}
        {assistant === 'solo' ? "I'll take it on alone" : `Do this with ${assistant}`}
      </button>)}
    </div>
    <p>Same rewards whichever you choose. Zero and Ciel explain the ideas and help you work toward an answer.</p>
    {value !== 'solo' && <p>Chat uses your usual AI Energy. The exam clock keeps running while you talk.</p>}
  </section>;
}

// Opens the existing floating conversation after the server has started the
// sitting. Nothing is sent automatically and no parallel chat is created.
export function openArenaCompanion(data: ArenaBattle) {
  const companion = data.battle.companion;
  if (!companion || companion === 'solo' || data.battle.mastery?.solo || data.battle.status !== 'open') return;
  const first = data.items[0];
  openAssistantDock(companion, first ? {
    kind: 'arenaBattleItem', id: data.battle.id, no: first.no,
    label: `${data.battle.exam.nameEn} · question ${first.display || first.no}`,
    path: `/arena?mode=arena&battle=${data.battle.id}`
  } : {
    kind: 'page', label: data.battle.exam.nameEn,
    path: `/arena?mode=arena&battle=${data.battle.id}`,
    excerpt: 'We are taking this ordinary exam together. Teach the concepts and guide me through it.'
  });
}

const wrapCls = css`
  width: 100%; box-sizing: border-box; padding: 1.2rem;
  border: 2px solid ${ARENA.line}; border-radius: 8px;
  font-family: sans-serif; font-size: 1.3rem; line-height: 1.5;
  p { margin: 0.6rem 0 0; }
`;
const choicesCls = css`display: flex; flex-wrap: wrap; gap: 0.7rem; margin-top: 0.8rem;`;
const choiceCls = css`
  display: inline-flex; align-items: center; justify-content: center; gap: 0.6rem;
  flex: 1 1 14rem; min-width: 0; padding: 0.8rem;
  border: 2px solid ${ARENA.line}; border-radius: 6px;
  background: #fff; color: ${ARENA.ink}; font: inherit; font-weight: 700;
  cursor: pointer; &:disabled { opacity: 0.55; cursor: default; }
`;
const selectedCls = css`background: ${ARENA.accent}; box-shadow: 2px 2px 0 ${ARENA.line};`;
