import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { useNotiContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { ARENA } from './theme';

// The two Arena sides as painted covers in the early-90s "I ♥ TEACHER"
// eraser style (Codex imagegen, Mikey 2026-10-24): Train on the left, Arena
// on the right, each with today's status. The titles are painted in.
export default function ModeChooser({
  onPick
}: {
  onPick: (mode: 'train' | 'arena') => void;
}) {
  const aiStoryTask = useNotiContext(
    (v) => v.state.todayStats?.dailyTaskStatus?.aiStory
  );
  // each side's own progress today (the A goal itself takes any route)
  const arena = aiStoryTask?.arena;
  const train = arena?.train;
  const trainStatus =
    train?.answered > 0
      ? `${train.right} of ${train.answered} right today`
      : (aiStoryTask?.storyPassed ?? aiStoryTask?.isPassed)
        ? 'AI Story cleared today'
        : 'Not started today';
  const arenaStatus =
    arena?.excellenceVia === 'battle'
      ? 'Boss beaten today'
      : arena?.basicVia === 'battle'
        ? 'Battle cleared today'
        : 'Bosses ready';

  const CARDS = [
    {
      mode: 'train' as const,
      title: 'Train',
      cover: '/img/arena/cover-train.jpg',
      line: 'AI Story, reviews of your battles, and practice before each boss.',
      status: trainStatus
    },
    {
      mode: 'arena' as const,
      title: 'Arena',
      cover: '/img/arena/cover-arena.jpg',
      line: 'Real exams, real conditions. Beat each boss to climb the ladder.',
      status: arenaStatus
    }
  ];

  return (
    <div className={wrapCls}>
      <header className={headerCls}>
        <h1>Arena</h1>
        <p>Train for it. Then battle the real thing.</p>
      </header>
      <div className={cardsCls}>
        {CARDS.map((card) => (
          <button
            key={card.mode}
            type="button"
            className={cardCls}
            onClick={() => onPick(card.mode)}
            aria-label={`Open ${card.title}`}
          >
            <div className={coverCls}>
              <img src={card.cover} alt={card.title} loading="eager" />
            </div>
            <div className={cardBodyCls}>
              <div className={cardLineCls}>{card.line}</div>
              <div className={statusRowCls}>
                <span className={statusCls}>{card.status}</span>
                <span className={openCls}>
                  Open
                  <Icon icon="chevron-right" />
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const wrapCls = css`
  max-width: 1100px;
  margin: 0 auto;
`;

const headerCls = css`
  text-align: center;
  margin-bottom: 1.8rem;
  h1 {
    margin: 0;
    font-size: 3rem;
    font-weight: 800;
    color: ${ARENA.ink};
  }
  p {
    margin: 0.4rem 0 0;
    font-size: 1.5rem;
    color: ${ARENA.inkSoft};
  }
  @media (max-width: ${mobileMaxWidth}) {
    margin-bottom: 1.2rem;
    h1 {
      font-size: 2.3rem;
    }
    p {
      font-size: 1.3rem;
    }
  }
`;

const cardsCls = css`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    gap: 1.2rem;
  }
`;

const cardCls = css`
  display: flex;
  flex-direction: column;
  padding: 0;
  text-align: left;
  border: 3px solid ${ARENA.line};
  border-radius: 14px;
  overflow: hidden;
  background: ${ARENA.paper};
  cursor: pointer;
  box-shadow: 4px 4px 0 ${ARENA.line};
  transition: transform 0.15s;
  &:hover {
    transform: translate(-2px, -2px);
  }
`;

const coverCls = css`
  aspect-ratio: 16 / 10;
  width: 100%;
  background: ${ARENA.background};
  border-bottom: 3px solid ${ARENA.line};
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const cardBodyCls = css`
  padding: 1.1rem 1.4rem 1.3rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

const cardLineCls = css`
  font-size: 1.4rem;
  line-height: 1.5;
  color: ${ARENA.ink};
`;

const statusRowCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 1.25rem;
`;

const statusCls = css`
  color: ${ARENA.inkSoft};
  font-weight: 600;
`;

const openCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 800;
  color: ${ARENA.ink};
`;
