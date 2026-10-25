import React, { memo } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import ArenaButton from '~/containers/Arena/ArenaButton';
import ArenaRewards from '~/containers/Arena/Rewards';
import { arenaMediaURL } from '~/containers/Arena/media';
import { ARENA } from '~/containers/Arena/theme';

// A won Arena battle shared as a post (Mikey 10-24): the member showing off a
// win ("im just showing off my achievement"). The post itself is a normal
// one (score-aware achievement heading, likes, comments,
// recommends); this is its body on Home and on /arena-challenges/:id, the
// Arena look only inside the panel, with a Challenge! button for anyone who
// wants to sit the same paper. Never any wrong answers (the own-misses ruling).
export interface ArenaChallengePreview {
  id: number;
  examKey: string;
  examName: string;
  code: string;
  codeLabel: string | null;
  gradeLabels: string[] | null;
  length: 'short' | 'medium' | 'full';
  difficulty: 'easy' | 'normal' | 'hard';
  sharer: { id: number; username: string; profilePicUrl: string | null };
  raw: number;
  max: number;
  xpEarned?: number;
  coinsEarned?: number;
  scoreBonusXpEarned?: number;
  scoreBonusCoinsEarned?: number;
  rewardPending?: boolean;
  markingPending?: boolean;
  hunterRank: { grade: number; low: number; high: number } | null;
  createdAt: number;
  takers: number;
  bestTaker: number | null;
}

// 수우미양가 (Mikey 10-24: a teacher's stamp for the old-school feel), the
// classic school lines on the paper's score: 수 90%+, 우 80%+, 미 70%+,
// 양 60%+, 가 below
const MARKS = [
  { min: 0.9, mark: '수', file: 'su' },
  { min: 0.8, mark: '우', file: 'u' },
  { min: 0.7, mark: '미', file: 'mi' },
  { min: 0.6, mark: '양', file: 'yang' },
  { min: 0, mark: '가', file: 'ga' }
];
export function gradeMark(raw: number, max: number) {
  const ratio = max > 0 ? raw / max : 0;
  return MARKS.find((m) => ratio >= m.min)!;
}

const LENGTH: Record<string, string> = {
  short: 'Short',
  medium: 'Medium',
  full: 'Full exam'
};
const MODE: Record<string, string> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard'
};

function ArenaChallengePanel({
  challenge
}: {
  challenge: ArenaChallengePreview;
}) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  if (!challenge?.examKey) return null;
  const mark = gradeMark(challenge.raw, challenge.max);
  const grade = (g: number) => challenge.gradeLabels?.[g - 1] || `${g}등급`;
  // the sharer can't take their own paper again (the API refuses it)
  const isMine = !!userId && userId === challenge.sharer?.id;
  return (
    <div className={resultCls}>
      <img
        className={stampCls}
        src={arenaMediaURL(`img/stamps/${mark.file}.png`)}
        alt={mark.mark}
      />
      <img
        className={eraserCls}
        src={arenaMediaURL(`img/bosses/${challenge.examKey}.jpg`)}
        alt={challenge.examName}
      />
      <div className={resultTextCls}>
        <span className={codeCls}>
          BOSS {challenge.code}
          {challenge.codeLabel ? ` · ${challenge.codeLabel}` : ''}
        </span>
        <strong className={titleCls}>{challenge.examName}</strong>
        <span className={modeCls}>
          {LENGTH[challenge.length]} · {MODE[challenge.difficulty]}
        </span>
        <span className={scoreCls}>
          <small>Score</small> {challenge.raw} <span>/ {challenge.max}</span>
        </span>
        {challenge.hunterRank && (
          <span className={rankCls}>
            Hunter Rank about {grade(challenge.hunterRank.grade)}
          </span>
        )}
      </div>
      <div className={awardCls}>
        <ArenaRewards
          xp={challenge.xpEarned}
          coins={challenge.coinsEarned}
          scoreBonusXp={challenge.scoreBonusXpEarned}
          scoreBonusCoins={challenge.scoreBonusCoinsEarned}
          rewardPending={challenge.rewardPending}
          markingPending={challenge.markingPending}
          emptyNote="Daily exam reward limit reached"
          label="Awarded"
          highlight
        />
      </div>
      <div className={footCls}>
        <span className={metaCls}>
          {challenge.takers
            ? `${challenge.takers} tried the same paper${
                challenge.bestTaker != null
                  ? ` · best ${challenge.bestTaker}`
                  : ''
              }`
            : 'Same paper, same clock'}
        </span>
        {!isMine && (
          <ArenaButton
            tone="red"
            size="md"
            onClick={(event) => {
              // the feed card opens the post on a click; this opens the battle
              event.stopPropagation();
              navigate(`/arena?mode=arena&challenge=${challenge.id}`);
            }}
          >
            Challenge!
          </ArenaButton>
        )}
      </div>
    </div>
  );
}

export default memo(ArenaChallengePanel);

// the Arena look, inside the post's default frame
const resultCls = css`
  position: relative;
  box-sizing: border-box;
  /* room for the hard shadow inside the feed card's clipped body */
  width: calc(100% - 3px);
  /* fills the feed card's fixed preview slot; on the content page the
     slot has no set height, so this is a no-op there */
  min-height: calc(100% - 4px);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-content: center;
  align-items: center;
  gap: 1rem 1.6rem;
  padding: 1.2rem 1.4rem;
  background: ${ARENA.paper};
  color: ${ARENA.ink};
  border: 2px solid ${ARENA.line};
  border-radius: 10px;
  box-shadow: 3px 3px 0 ${ARENA.line};
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.9rem 1rem;
    padding: 1rem;
  }
`;

// stamped inside the panel's corner, a little crooked like a real one (inside,
// so the feed card's clipped body never cuts it)
const stampCls = css`
  position: absolute;
  top: 0.4rem;
  right: 0.8rem;
  width: 5.6rem;
  height: 5.6rem;
  transform: rotate(-12deg);
  pointer-events: none;
  @media (max-width: ${mobileMaxWidth}) {
    width: 4.6rem;
    height: 4.6rem;
    right: 0.4rem;
  }
`;

const eraserCls = css`
  height: 11rem;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border: 2px solid ${ARENA.line};
  border-radius: 4px;
  box-shadow: 3px 4px 0 ${ARENA.line};
  transform: rotate(-4deg);
  flex: none;
  @media (max-width: ${mobileMaxWidth}) {
    height: 10rem;
  }
`;

const resultTextCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
  padding-right: 3.6rem;
`;

const codeCls = css`
  align-self: flex-start;
  padding: 0.1rem 0.6rem;
  border-radius: 4px;
  background: ${ARENA.ink};
  color: #fff;
  font-size: 1.1rem;
  font-weight: 900;
  letter-spacing: 0.06em;
`;

const titleCls = css`
  font-size: 1.6rem;
  font-weight: 900;
`;

const modeCls = css`
  font-size: 1.2rem;
  color: ${ARENA.inkSoft};
`;

const scoreCls = css`
  font-size: 2.2rem;
  font-weight: 900;
  color: ${ARENA.train};
  small { font-size: 1.1rem; font-weight: 700; color: ${ARENA.inkSoft}; }
  > span { font-size: 1.5rem; }
`;

const rankCls = css`
  font-size: 1.3rem;
  font-weight: 700;
  color: ${ARENA.inkSoft};
`;

const footCls = css`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const awardCls = css`
  grid-column: 1 / -1;
  min-width: 0;
`;

const metaCls = css`
  font-size: 1.3rem;
  color: ${Color.gray()};
`;
