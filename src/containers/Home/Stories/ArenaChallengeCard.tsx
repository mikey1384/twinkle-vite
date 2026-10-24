import React, { memo } from 'react';
import { css } from '@emotion/css';
import { useNavigate } from 'react-router-dom';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { timeSince } from '~/helpers/timeStampHelpers';
import ArenaButton from '~/containers/Arena/ArenaButton';
import { arenaMediaURL } from '~/containers/Arena/media';
import { ARENA } from '~/containers/Arena/theme';

// A won Arena battle shared on Home (Mikey 10-24): the member showing off a
// win ("im just showing off my achievement"), "took on a boss and won. Can
// you do better?" in the feed's default card frame, the Arena look only
// inside the result panel, and a Challenge! button for anyone who wants to
// sit the same paper. Never any wrong answers (the own-misses ruling).
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

function ArenaChallengeCard({
  challenge
}: {
  challenge: ArenaChallengePreview;
}) {
  const navigate = useNavigate();
  const grade = (g: number) => challenge.gradeLabels?.[g - 1] || `${g}등급`;
  return (
    <article className={cardCls}>
      <header className={headCls}>
        <span className={picCls}>
          <ProfilePic
            style={{ width: '100%' }}
            userId={challenge.sharer.id}
            profilePicUrl={challenge.sharer.profilePicUrl || ''}
          />
        </span>
        <div className={headTextCls}>
          <div>
            <UsernameText
              user={{
                id: challenge.sharer.id,
                username: challenge.sharer.username
              }}
              color={Color.logoBlue()}
            />{' '}
            <span className={actionCls}>
              took on a boss and won. Can you do better?
            </span>
          </div>
          {challenge.createdAt > 0 && (
            <span className={timeCls}>{timeSince(challenge.createdAt)}</span>
          )}
        </div>
      </header>

      <div className={resultCls}>
        <img
          className={stampCls}
          src={arenaMediaURL(
            `img/stamps/${gradeMark(challenge.raw, challenge.max).file}.png`
          )}
          alt={gradeMark(challenge.raw, challenge.max).mark}
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
          <strong className={titleCls}>
            {challenge.examName} · {LENGTH[challenge.length]} ·{' '}
            {MODE[challenge.difficulty]}
          </strong>
          <span className={scoreCls}>
            {challenge.raw} / {challenge.max}
          </span>
          {challenge.hunterRank && (
            <span className={rankCls}>
              Hunter Rank about {grade(challenge.hunterRank.grade)}
            </span>
          )}
        </div>
      </div>

      <footer className={footCls}>
        <span className={metaCls}>
          {challenge.takers
            ? `${challenge.takers} tried the same paper${
                challenge.bestTaker != null
                  ? ` · best ${challenge.bestTaker}`
                  : ''
              }`
            : 'Same paper, same clock'}
        </span>
        <ArenaButton
          tone="red"
          size="md"
          onClick={() =>
            navigate(`/arena?mode=arena&challenge=${challenge.id}`)
          }
        >
          Challenge!
        </ArenaButton>
      </footer>
    </article>
  );
}

export default memo(ArenaChallengeCard);

// the feed's default card frame (as the reward digest card)
const cardCls = css`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  width: 100%;
  padding: 1.6rem;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  background: #fff;
  color: ${Color.darkerGray()};
  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    padding: 1.2rem;
  }
`;

const headCls = css`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const picCls = css`
  width: 4.2rem;
  display: inline-flex;
  flex: none;
`;

const headTextCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  font-size: 1.6rem;
  font-weight: 700;
`;

const actionCls = css`
  color: ${Color.darkerGray()};
  font-weight: 600;
`;

const timeCls = css`
  font-size: 1.2rem;
  font-weight: 400;
  color: ${Color.gray()};
`;

// the Arena look, inside the default frame
const resultCls = css`
  position: relative;
  display: flex;
  align-items: center;
  gap: 1.6rem;
  padding: 1.2rem 1.4rem;
  background: ${ARENA.paper};
  color: ${ARENA.ink};
  border: 2px solid ${ARENA.line};
  border-radius: 10px;
  box-shadow: 3px 3px 0 ${ARENA.line};
  @media (max-width: ${mobileMaxWidth}) {
    gap: 1rem;
    padding: 1rem;
  }
`;

// stamped over the panel's corner, a little crooked like a real one
const stampCls = css`
  position: absolute;
  top: -1.2rem;
  right: 1.2rem;
  width: 8.4rem;
  height: 8.4rem;
  transform: rotate(-12deg);
  pointer-events: none;
  @media (max-width: ${mobileMaxWidth}) {
    width: 6.4rem;
    height: 6.4rem;
    right: 0.6rem;
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
    height: 9rem;
  }
`;

const resultTextCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
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

const scoreCls = css`
  font-size: 2.2rem;
  font-weight: 900;
  color: ${ARENA.train};
`;

const rankCls = css`
  font-size: 1.3rem;
  font-weight: 700;
  color: ${ARENA.inkSoft};
`;

const footCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const metaCls = css`
  font-size: 1.3rem;
  color: ${Color.gray()};
`;
