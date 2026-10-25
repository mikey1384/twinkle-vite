import React, { useEffect, useState } from 'react';
import { css, cx } from '@emotion/css';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { isPerfectArenaScore } from '~/helpers/arenaChallengeCopy';
import ArenaButton from './ArenaButton';
import { arenaMediaURL } from './media';
import { ARENA } from './theme';

// A shared challenge (Mikey 10-24): who shared it and how they did, "Take
// this same test" (the exact frozen paper, once), and the board of everyone
// who took it. Scores and times only; nobody's wrong answers.
interface ChallengeView {
  challenge: {
    id: number;
    examKey: string;
    examName: string;
    examNameEn: string;
    code: string;
    codeLabel: string | null;
    // essay or spoken answers: the scores include AI-estimated marks
    aiMarked?: boolean;
    length: 'short' | 'medium' | 'full';
    difficulty: 'easy' | 'normal' | 'hard';
    sharer: { id: number; username: string; profilePicUrl: string | null };
  };
  board: {
    rank: number;
    raw: number;
    max: number;
    seconds: number;
    sharer: boolean;
    me: boolean;
    user: { id: number; username: string; profilePicUrl: string | null } | null;
  }[];
  myBattle: { id: number; status: string } | null;
  canTake: boolean;
  isSharer: boolean;
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

export default function Challenge({
  challengeId,
  onOpenBattle
}: {
  challengeId: number;
  onOpenBattle: (battleId: number) => void;
}) {
  const loadArenaChallenge = useAppContext(
    (v) => v.requestHelpers.loadArenaChallenge
  );
  const startArenaChallenge = useAppContext(
    (v) => v.requestHelpers.startArenaChallenge
  );
  const [view, setView] = useState<ChallengeView | null>(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let alive = true;
    loadArenaChallenge(challengeId)
      .then((data: ChallengeView) => alive && setView(data))
      .catch(() => alive && setError('This challenge is no longer here.'));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- context request helpers stay out of effect dependencies
  }, [challengeId]);

  if (error) return <p className={noteCls}>{error}</p>;
  if (!view) {
    return (
      <p className={noteCls}>
        <Icon icon="spinner" pulse /> Loading the challenge
      </p>
    );
  }
  const { challenge, board } = view;
  const sharerRow = board.find((row) => row.sharer);
  const perfectScore = isPerfectArenaScore(sharerRow);
  return (
    <section className={cardCls}>
      <header className={headCls}>
        <img
          className={eraserCls}
          src={arenaMediaURL(`img/bosses/${challenge.examKey}.jpg`)}
          alt={challenge.examName}
        />
        <div className={headTextCls}>
          <span className={codeCls}>
            BOSS {challenge.code}
            {challenge.codeLabel ? ` · ${challenge.codeLabel}` : ''}
          </span>
          <strong>
            {view.isSharer ? 'You' : challenge.sharer.username}{' '}
            {perfectScore
              ? 'got a perfect score!'
              : 'took on this boss and won'}
          </strong>
          <span>
            {challenge.examName} · {LENGTH[challenge.length]} ·{' '}
            {MODE[challenge.difficulty]}
          </span>
          {sharerRow && (
            <span className={scoreCls}>
              {view.isSharer ? 'Your score' : 'Their score'}: {sharerRow.raw} /{' '}
              {sharerRow.max}
              {challenge.aiMarked && ' (includes AI estimates)'}
            </span>
          )}
        </div>
      </header>

      <div className={actionsCls}>
        {view.canTake ? (
          <ArenaButton tone="red" loading={starting} onClick={handleTake}>
            Challenge!
          </ArenaButton>
        ) : view.myBattle ? (
          <ArenaButton
            tone="ink"
            onClick={() => onOpenBattle(view.myBattle!.id)}
          >
            {view.myBattle.status === 'finished'
              ? 'See my result'
              : 'Resume my battle'}
          </ArenaButton>
        ) : view.isSharer ? (
          <p className={noteCls}>
            Others can sit the same paper once and land on this board.
          </p>
        ) : null}
        {view.canTake && (
          <p className={noteCls}>
            {perfectScore ? 'Can you match it?' : 'Can you do better?'}{' '}
            The exact same paper, timed like the real exam. One attempt counts.
          </p>
        )}
      </div>

      <ol className={boardCls}>
        {board.map((row) => (
          <li key={row.rank} className={cx(rowCls, row.me && meCls)}>
            <span className={rankCls}>{row.rank}</span>
            <span className={picCls}>
              {row.user ? (
                <ProfilePic
                  style={{ width: '100%' }}
                  userId={row.user.id}
                  profilePicUrl={row.user.profilePicUrl || ''}
                />
              ) : (
                <span className={hiddenPicCls}>
                  <Icon icon="user-secret" />
                </span>
              )}
            </span>
            <span className={nameCls}>
              {row.user ? row.user.username || 'Hunter' : 'Hidden hunter'}
              {row.sharer && <em className={tagCls}>sharer</em>}
              {row.me && ' (you)'}
            </span>
            <span className={pointsCls}>
              {row.raw} / {row.max}
              <small> · {clock(row.seconds)}</small>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );

  async function handleTake() {
    setStarting(true);
    try {
      const data = await startArenaChallenge(challengeId);
      onOpenBattle(data.battle.id);
    } catch {
      setError('The battle could not start. Please try again.');
    } finally {
      setStarting(false);
    }
  }
}

function clock(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const cardCls = css`
  width: 100%;
  max-width: 72rem;
  margin: 0 auto;
  background: ${ARENA.paper};
  color: ${ARENA.ink};
  border: 3px solid ${ARENA.line};
  border-radius: 12px;
  box-shadow: 4px 4px 0 ${ARENA.line};
  overflow: hidden;
`;

const headCls = css`
  display: flex;
  gap: 1.6rem;
  align-items: center;
  padding: 1.4rem 1.6rem;
  background: ${ARENA.violet};
  border-bottom: 3px solid ${ARENA.line};
  color: #fff;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 1rem;
    padding: 1rem;
  }
`;

const eraserCls = css`
  height: 13rem;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  border: 2px solid ${ARENA.line};
  border-radius: 4px;
  box-shadow: 4px 5px 0 ${ARENA.line};
  transform: rotate(-4deg);
  @media (max-width: ${mobileMaxWidth}) {
    height: 10rem;
  }
`;

const headTextCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  text-shadow: 1px 1px 0 ${ARENA.line};
  strong {
    font-size: 2.1rem;
    font-weight: 900;
  }
  span {
    font-size: 1.4rem;
    font-weight: 700;
  }
`;

const codeCls = css`
  align-self: flex-start;
  padding: 0.1rem 0.6rem;
  border-radius: 4px;
  background: ${ARENA.ink};
  font-size: 1.15rem !important;
  font-weight: 900 !important;
  letter-spacing: 0.06em;
  text-shadow: none;
`;

const scoreCls = css`
  font-size: 1.7rem !important;
  font-weight: 900 !important;
`;

const actionsCls = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 1.6rem 1.6rem 1rem;
`;

const noteCls = css`
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  font-size: 1.35rem;
  color: ${ARENA.inkSoft};
  text-align: center;
`;

const boardCls = css`
  list-style: none;
  margin: 0;
  padding: 0.6rem 1.2rem 1.4rem;
  border-top: 2px dashed ${ARENA.inkSoft};
`;

const rowCls = css`
  display: grid;
  grid-template-columns: 3rem 3rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.9rem;
  padding: 0.5rem 0.6rem;
  border-radius: 8px;
`;

const meCls = css`
  background: #fff1b8;
  box-shadow: inset 0 0 0 2px ${ARENA.line};
  font-weight: 800;
`;

const rankCls = css`
  width: 2.8rem;
  height: 2.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${ARENA.line};
  border-radius: 50%;
  background: #fff;
  font-size: 1.25rem;
  font-weight: 900;
`;

const picCls = css`
  width: 3rem;
  display: inline-flex;
`;

const hiddenPicCls = css`
  width: 3rem;
  height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: ${ARENA.background};
  color: ${ARENA.inkSoft};
`;

const nameCls = css`
  min-width: 0;
  font-size: 1.45rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const tagCls = css`
  margin-left: 0.6rem;
  padding: 0 0.5rem;
  border: 2px solid ${ARENA.line};
  border-radius: 999px;
  font-size: 1rem;
  font-style: normal;
  font-weight: 900;
  text-transform: uppercase;
`;

const pointsCls = css`
  font-size: 1.45rem;
  font-weight: 900;
  white-space: nowrap;
  small {
    font-size: 1.15rem;
    color: ${ARENA.inkSoft};
  }
`;
