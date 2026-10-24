import React, { memo } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import ProfilePic from '~/components/ProfilePic';
import { mobileMaxWidth } from '~/constants/css';
import ArenaButton from '~/containers/Arena/ArenaButton';
import { arenaMediaURL } from '~/containers/Arena/media';
import { ARENA } from '~/containers/Arena/theme';

// An Arena challenge on Home (Mikey 10-24: sharing lets a member show off
// and gives everyone else an easy way into the same test). Shows the boss,
// the sharer's score and Hunter Rank, how many took it on, and "Take this
// same test". Never any wrong answers (the own-misses ruling).
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
  hunterRank: { grade: number; low: number; high: number } | null;
  takers: number;
  bestTaker: number | null;
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

function ArenaChallengeCard({
  challenge
}: {
  challenge: ArenaChallengePreview;
}) {
  const navigate = useNavigate();
  const grade = (g: number) => challenge.gradeLabels?.[g - 1] || `${g}등급`;
  return (
    <article className={cardCls}>
      <img
        className={eraserCls}
        src={arenaMediaURL(`img/bosses/${challenge.examKey}.jpg`)}
        alt={challenge.examName}
      />
      <div className={bodyCls}>
        <div className={whoCls}>
          <span className={picCls}>
            <ProfilePic
              style={{ width: '100%' }}
              userId={challenge.sharer.id}
              profilePicUrl={challenge.sharer.profilePicUrl || ''}
            />
          </span>
          <b>{challenge.sharer.username}</b> took on a boss and dares you
        </div>
        <span className={codeCls}>
          BOSS {challenge.code}
          {challenge.codeLabel ? ` · ${challenge.codeLabel}` : ''}
        </span>
        <strong className={titleCls}>
          {challenge.examName} · {LENGTH[challenge.length]} ·{' '}
          {MODE[challenge.difficulty]}
        </strong>
        <span className={scoreCls}>
          {challenge.raw} / {challenge.max}
          {challenge.hunterRank &&
            ` · Hunter Rank about ${grade(challenge.hunterRank.grade)}`}
        </span>
        <span className={metaCls}>
          {challenge.takers
            ? `${challenge.takers} took it on${
                challenge.bestTaker != null
                  ? ` · best ${challenge.bestTaker}`
                  : ''
              }`
            : 'Be the first to take it on'}
        </span>
        <ArenaButton
          tone="red"
          size="md"
          style={{ alignSelf: 'flex-start', marginTop: '0.6rem' }}
          onClick={() =>
            navigate(`/arena?mode=arena&challenge=${challenge.id}`)
          }
        >
          Take this same test
        </ArenaButton>
      </div>
    </article>
  );
}

export default memo(ArenaChallengeCard);

const cardCls = css`
  display: flex;
  gap: 1.6rem;
  align-items: center;
  padding: 1.4rem 1.6rem;
  background: ${ARENA.paper};
  color: ${ARENA.ink};
  border: 3px solid ${ARENA.line};
  border-radius: 12px;
  box-shadow: 4px 4px 0 ${ARENA.line};
  @media (max-width: ${mobileMaxWidth}) {
    gap: 1rem;
    padding: 1rem;
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    box-shadow: none;
  }
`;

const eraserCls = css`
  height: 14rem;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border: 2px solid ${ARENA.line};
  border-radius: 4px;
  box-shadow: 4px 5px 0 ${ARENA.line};
  transform: rotate(-4deg);
  flex: none;
  @media (max-width: ${mobileMaxWidth}) {
    height: 10rem;
  }
`;

const bodyCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
`;

const whoCls = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.35rem;
  color: ${ARENA.inkSoft};
  b {
    color: ${ARENA.ink};
  }
`;

const picCls = css`
  width: 2.4rem;
  display: inline-flex;
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
  font-size: 1.7rem;
  font-weight: 900;
`;

const scoreCls = css`
  font-size: 1.6rem;
  font-weight: 800;
  color: ${ARENA.train};
`;

const metaCls = css`
  font-size: 1.25rem;
  color: ${ARENA.inkSoft};
`;
