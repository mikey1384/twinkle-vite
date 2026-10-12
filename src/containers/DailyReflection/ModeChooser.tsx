import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import ReflectionStatShape, {
  REFLECTION_STAT_LABELS,
  type ReflectionStatAxis,
  type ReflectionStatAxisShape
} from '~/components/ReflectionStatShape';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { PAGE } from './theme';
import type { DailyReflectionModes } from './index';

// The two Daily Reflection modes as painted covers (Mikey 2026-10-12), with
// today's status for each and the member's stats shape underneath.
const MODES = [
  {
    mode: 'classic' as const,
    cover: '/img/daily-reflection/cover-classic.jpg',
    title: 'Classic',
    line: 'A question written just for you, about your life and what you care about.'
  },
  {
    mode: 'training' as const,
    cover: '/img/daily-reflection/cover-training.jpg',
    title: 'Training',
    line: 'Pick a stat to level up. Today’s question is written to train it.'
  }
];

export default function ModeChooser({
  modes,
  onPick
}: {
  modes: DailyReflectionModes | null;
  onPick: (mode: 'classic' | 'training') => void;
}) {
  const loadReflectionStats = useAppContext(
    (v) => v.requestHelpers.loadReflectionStats
  );
  const [shape, setShape] = useState<ReflectionStatAxisShape[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await loadReflectionStats();
      if (!cancelled && data && !data.error && Array.isArray(data.shape)) {
        setShape(data.shape);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={wrapCls}>
      <header className={headerCls}>
        <h1>Daily Reflection</h1>
        <p>One Classic and one Training reflection, every day.</p>
      </header>

      <div className={cardsCls}>
        {MODES.map((item) => {
          const status = modes?.[item.mode];
          const trainingAxis =
            item.mode === 'training' ? modes?.training.axis : null;
          return (
            <button
              key={item.mode}
              type="button"
              className={cardCls}
              onClick={() => onPick(item.mode)}
              aria-label={`Open ${item.title}`}
            >
              <div className={coverCls}>
                <img src={item.cover} alt="" loading="eager" />
              </div>
              <div className={cardBodyCls}>
                <div className={cardLineCls}>{item.line}</div>
                <div className={statusRowCls}>
                  {status?.answered ? (
                    <span className={doneCls}>
                      <Icon icon="check" /> Done today
                    </span>
                  ) : status?.started ? (
                    <span className={pendingCls}>
                      {trainingAxis
                        ? `Training ${REFLECTION_STAT_LABELS[trainingAxis as ReflectionStatAxis] || ''} today`
                        : 'Waiting for your answer'}
                    </span>
                  ) : (
                    <span className={pendingCls}>Not started today</span>
                  )}
                  <span className={openCls}>
                    {status?.answered ? 'See it' : 'Open'}
                    <Icon icon="chevron-right" />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {shape && (
        <section className={statsCls}>
          <div className={statsShapeCls}>
            <ReflectionStatShape shape={shape} maxWidth={320} />
          </div>
          <div className={statsTextCls}>
            <h2>Your stats</h2>
            <p>
              Every reflection grows your shape. Classic grows whichever stat
              your answer used most, a little. Training grows the stat you pick,
              more, and even more when your answer is about something you really
              did on Twinkle.
            </p>
          </div>
        </section>
      )}
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
    letter-spacing: -0.01em;
    color: ${PAGE.ink};
  }
  p {
    margin: 0.4rem 0 0;
    font-size: 1.5rem;
    color: ${PAGE.inkSoft};
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
  border: 1px solid ${PAGE.line};
  border-radius: 18px;
  overflow: hidden;
  background: ${PAGE.paper};
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(80, 60, 30, 0.08);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 24px rgba(80, 60, 30, 0.16);
  }
`;

const coverCls = css`
  aspect-ratio: 16 / 10;
  width: 100%;
  background: #e9dfcf;
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
  color: ${PAGE.ink};
`;

const statusRowCls = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 1.25rem;
`;

const doneCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 700;
  color: ${PAGE.done};
`;

const pendingCls = css`
  color: ${PAGE.inkSoft};
  font-weight: 600;
`;

const openCls = css`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 700;
  color: ${PAGE.blue};
`;

const statsCls = css`
  margin-top: 2.4rem;
  display: grid;
  grid-template-columns: minmax(0, 360px) minmax(0, 1fr);
  align-items: center;
  gap: 2rem;
  background: ${PAGE.paper};
  border: 1px solid ${PAGE.line};
  border-radius: 18px;
  padding: 1.6rem 2rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    gap: 0.6rem;
    padding: 1.2rem 1rem;
  }
`;

const statsShapeCls = css`
  width: 100%;
`;

const statsTextCls = css`
  h2 {
    margin: 0 0 0.5rem;
    font-size: 1.9rem;
    font-weight: 800;
    color: ${PAGE.ink};
  }
  p {
    margin: 0;
    font-size: 1.35rem;
    line-height: 1.6;
    color: ${PAGE.inkSoft};
  }
  @media (max-width: ${mobileMaxWidth}) {
    text-align: center;
  }
`;
