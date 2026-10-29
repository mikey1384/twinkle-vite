import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { useAppContext, useNotiContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { ARENA } from './theme';
import type { ArenaBattleSummary, ArenaState } from './types';
import { TodayArenaGoals } from './AIStory/Game/ArenaGoals';
import AskAgentButton from '~/components/Buttons/AskAgentButton';

// Train is AI Story and preparation for Arena: reviews and focused practice.
export default function Train({
  onPlayAIStory,
  onOpenDeck,
  onOpenSkills,
  onOpenBattle,
  onOpenPaper
}: {
  onPlayAIStory: () => void;
  onOpenDeck: () => void;
  onOpenSkills: () => void;
  onOpenBattle: (battleId: number) => void;
  onOpenPaper: () => void;
}) {
  const aiStoryTask = useNotiContext(
    (v) => v.state.todayStats?.dailyTaskStatus?.aiStory
  );
  const loadArenaState = useAppContext((v) => v.requestHelpers.loadArenaState);
  const loadArenaDeck = useAppContext((v) => v.requestHelpers.loadArenaDeck);
  const [state, setState] = useState<ArenaState | null>(null);
  const [deckCounts, setDeckCounts] = useState<{
    open: number;
    untagged: number;
    due: number;
    retired: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadArenaState()
      .then((data: ArenaState) => !cancelled && setState(data))
      .catch(() => null);
    loadArenaDeck()
      .then((deck: any) => !cancelled && setDeckCounts(deck?.counts || null))
      .catch(() => null);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishedBattles = (state?.recent || []).filter(
    (battle) => battle.status === 'finished'
  );
  const examName = (key: string) =>
    state?.exams.find((exam) => exam.key === key)?.name || key;

  return (
    <div className={wrapCls}>
      {/* Zero or Ciel, to go through the Arena together (Mikey 10-25) */}
      <div className={askBarCls}>
        <AskAgentButton
          label="Help me here"
          context={{
            kind: 'page',
            label: 'Arena Train',
            path: '/arena?mode=train',
            excerpt: 'Train is AI Story and preparation for Arena: review completed battles, practise missed questions and weak areas, and share real papers.'
          }}
        />
      </div>
      <TodayArenaGoals />
      <button type="button" className={rowCls} onClick={onPlayAIStory}>
        <span className={badgeCls} style={{ background: ARENA.sky }}>
          <Icon icon="book-open" />
        </span>
        <span className={textCls}>
          <strong>AI Story</strong>
          <span>
            Read or listen to a story at your level, then answer its questions.
          </span>
        </span>
        <span className={statusCls}>
          {(aiStoryTask?.storyPassed ?? aiStoryTask?.isPassed) ? (
            <>
              <Icon icon="check" /> Cleared today
            </>
          ) : (
            'Play'
          )}
          <Icon icon="chevron-right" />
        </span>
      </button>

      <button type="button" className={rowCls} onClick={onOpenDeck}>
        <span className={badgeCls} style={{ background: ARENA.coral }}>
          <Icon icon="layer-group" />
        </span>
        <span className={textCls}>
          <strong>Missed-question deck</strong>
          <span>
            Every question you miss in a battle comes back here, spaced out
            until you have it for good.
          </span>
        </span>
        <span className={statusCls}>
          {deckCounts?.untagged
            ? `${deckCounts.untagged} to sort`
            : deckCounts?.due
              ? `${deckCounts.due} due`
              : deckCounts?.open
                ? 'All caught up'
                : 'Open'}
          <Icon icon="chevron-right" />
        </span>
      </button>

      <button type="button" className={rowCls} onClick={onOpenSkills}>
        <span className={badgeCls} style={{ background: ARENA.train }}>
          <Icon icon="chart-line" />
        </span>
        <span className={textCls}>
          <strong>Exam skills and drills</strong>
          <span>
            Where your battles lose points: pace, blanks, changed answers and
            your weakest question types, each with a drill.
          </span>
        </span>
        <span className={statusCls}>
          Open
          <Icon icon="chevron-right" />
        </span>
      </button>

      {/* SPEC §10-11: real papers, rewarded once a reviewer checks them
          (Reports.tsx) */}
      <button type="button" className={rowCls} onClick={onOpenPaper}>
        <span className={badgeCls} style={{ background: ARENA.accent }}>
          <Icon icon="upload" />
        </span>
        <span className={textCls}>
          <strong>Send a real paper</strong>
          <span>
            Share a test paper from your school or academy. It stays private and
            helps make Arena’s exams feel real.
          </span>
        </span>
        <span className={statusCls}>
          Up to 20,000 XP
          <Icon icon="chevron-right" />
        </span>
      </button>

      <div
        className={rowCls}
        aria-disabled={finishedBattles.length ? undefined : 'true'}
      >
        <span className={badgeCls} style={{ background: ARENA.violet }}>
          <Icon icon="redo" />
        </span>
        <span className={textCls}>
          <strong>Review your battles</strong>
          <span>
            Every battle you finish in the Arena shows up here, question by
            question. Completed papers are for review; your next battle uses a different paper.
          </span>
        </span>
        {!finishedBattles.length && (
          <span className={mutedCls}>No battles yet</span>
        )}
      </div>
      {finishedBattles.map((battle) => (
        <div key={battle.id} className={battleRowCls}>
          <span className={battleTextCls}>
            <strong>{examName(battle.examKey)}</strong>
            <span>{describeBattle(battle)}</span>
          </span>
          <button
            type="button"
            className={smallButtonCls}
            onClick={() => onOpenBattle(battle.id)}
          >
            Review
          </button>

        </div>
      ))}
    </div>
  );


}

function describeBattle(battle: ArenaBattleSummary) {
  const kind =
    battle.mode === 'untimed'
      ? 'Untimed retake'
      : battle.length === 'full'
        ? 'Full exam'
        : battle.length === 'medium'
          ? 'Medium'
          : 'Short';
  const when = battle.finishedAt
    ? new Date(battle.finishedAt * 1000).toLocaleDateString()
    : '';
  return [
    kind,
    `${battle.rawPoints}/${battle.maxPoints}`,
    // essay and spoken marks are AI estimates, and may still be coming
    battle.aiMarked
      ? battle.marking && battle.marking.marked < battle.marking.total
        ? 'marking…'
        : 'AI estimate'
      : '',
    battle.grade ? `${battle.grade}등급` : '',
    when
  ]
    .filter(Boolean)
    .join(' · ');
}

const wrapCls = css`
  max-width: 820px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

const rowCls = css`
  display: flex;
  align-items: center;
  gap: 1.4rem;
  width: 100%;
  padding: 1.2rem 1.4rem;
  text-align: left;
  background: ${ARENA.paper};
  border: 3px solid ${ARENA.line};
  border-radius: 12px;
  box-shadow: 3px 3px 0 ${ARENA.line};
  color: ${ARENA.ink};
  font: inherit;
  &:is(button) {
    cursor: pointer;
  }
  &:is(button):hover {
    transform: translate(-1px, -1px);
  }
  &[aria-disabled='true'] {
    box-shadow: none;
    border-style: dashed;
  }
  @media (max-width: ${mobileMaxWidth}) {
    flex-wrap: wrap;
    gap: 1rem;
  }
`;

const badgeCls = css`
  flex-shrink: 0;
  width: 4.6rem;
  height: 4.6rem;
  border: 3px solid ${ARENA.line};
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 2rem;
`;

const textCls = css`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  strong {
    font-size: 1.7rem;
    font-weight: 800;
  }
  span {
    font-size: 1.35rem;
    line-height: 1.45;
    color: ${ARENA.inkSoft};
  }
`;

const statusCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.35rem;
  font-weight: 800;
  white-space: nowrap;
`;

const mutedCls = css`
  font-size: 1.3rem;
  font-weight: 600;
  color: ${ARENA.inkSoft};
  white-space: nowrap;
`;

const battleRowCls = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.8rem 1.2rem;
  margin-left: 3rem;
  background: ${ARENA.paper};
  border: 2px solid ${ARENA.line};
  border-radius: 10px;
  @media (max-width: ${mobileMaxWidth}) {
    margin-left: 0;
    flex-wrap: wrap;
  }
`;

const battleTextCls = css`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  strong {
    font-size: 1.45rem;
  }
  span {
    font-size: 1.25rem;
    color: ${ARENA.inkSoft};
  }
`;

const smallButtonCls = css`
  padding: 0.5rem 1rem;
  border: 2px solid ${ARENA.line};
  border-radius: 8px;
  background: #fff;
  font: inherit;
  font-size: 1.25rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  &:disabled {
    opacity: 0.6;
  }
`;

const askBarCls = css`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
`;
