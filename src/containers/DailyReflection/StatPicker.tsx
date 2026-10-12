import React, { useEffect, useState } from 'react';
import { css } from '@emotion/css';
import ReflectionStatShape, {
  REFLECTION_STAT_AXES,
  REFLECTION_STAT_LABELS,
  type ReflectionStatAxis,
  type ReflectionStatAxisShape
} from '~/components/ReflectionStatShape';
import { useAppContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { PAGE } from './theme';

// Training: pick the stat today's question trains (Mikey 2026-10-12). Free;
// locked in for the day once the question is written.
const STAT_LINES: Record<ReflectionStatAxis, string> = {
  building: 'Making things, and making them better.',
  adapting: 'Trying new tools and new ways of doing things.',
  thinking: 'Working through hard problems instead of giving up.',
  connecting: 'Helping, explaining, and teaming up with people.',
  self_awareness: 'Seeing yourself from the outside, and choosing what to grow.'
};

export default function StatPicker({
  onPick
}: {
  onPick: (axis: ReflectionStatAxis) => void;
}) {
  const loadReflectionStats = useAppContext(
    (v) => v.requestHelpers.loadReflectionStats
  );
  const [shape, setShape] = useState<ReflectionStatAxisShape[] | null>(null);
  const [highlighted, setHighlighted] = useState<ReflectionStatAxis | null>(
    null
  );

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
    <div className={stageCls}>
      <div className={wrapCls}>
        <div className={shapeColCls}>
          {shape && (
            <ReflectionStatShape
              shape={shape}
              grownAxis={highlighted}
              maxWidth={440}
            />
          )}
          <p className={captionCls}>
            {highlighted ? (
              <>
                <b>{REFLECTION_STAT_LABELS[highlighted]}:</b>{' '}
                {STAT_LINES[highlighted].toLowerCase()}
              </>
            ) : (
              'Your shape grows with every reflection. Point at a stat to see where.'
            )}
          </p>
        </div>
        <div className={listColCls}>
          <h1>What do you want to level up today?</h1>
          <p className={noteCls}>
            Today’s question will be written for the stat you pick. Your pick is
            locked in for today.
          </p>
          <div className={listCls}>
            {REFLECTION_STAT_AXES.map((axis) => (
              <button
                key={axis}
                type="button"
                className={statCls}
                onMouseEnter={() => setHighlighted(axis)}
                onMouseLeave={() => setHighlighted(null)}
                onFocus={() => setHighlighted(axis)}
                onBlur={() => setHighlighted(null)}
                onClick={() => onPick(axis)}
              >
                <span className={statNameCls}>
                  {REFLECTION_STAT_LABELS[axis]}
                </span>
                <span className={statLineCls}>{STAT_LINES[axis]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className={footerCls}>
        One Training reflection a day, alongside Classic. Either one keeps your
        streak going.
      </p>
    </div>
  );
}

const stageCls = css`
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 1.6rem;
  }
`;

const wrapCls = css`
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  align-items: stretch;
  gap: 2.4rem;
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const shapeColCls = css`
  background: ${PAGE.paper};
  border: 1px solid ${PAGE.line};
  border-radius: 18px;
  padding: 2rem 1.6rem 1.8rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.2rem;
  @media (max-width: ${mobileMaxWidth}) {
    order: 2;
    min-height: 0;
    padding: 1rem 0.5rem;
  }
`;

const listColCls = css`
  h1 {
    margin: 0;
    font-size: 2.4rem;
    font-weight: 800;
    color: ${PAGE.ink};
    line-height: 1.25;
  }
  @media (max-width: ${mobileMaxWidth}) {
    h1 {
      font-size: 2rem;
    }
  }
`;

const noteCls = css`
  margin: 0.6rem 0 1.2rem;
  font-size: 1.35rem;
  color: ${PAGE.inkSoft};
  line-height: 1.5;
`;

const listCls = css`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const statCls = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  text-align: left;
  border: 1px solid ${PAGE.line};
  border-radius: 14px;
  background: ${PAGE.paper};
  padding: 1rem 1.3rem;
  cursor: pointer;
  transition:
    border-color 0.15s,
    transform 0.15s;
  &:hover,
  &:focus-visible {
    border-color: ${PAGE.accent};
    transform: translateX(3px);
    outline: none;
  }
`;

const statNameCls = css`
  font-size: 1.6rem;
  font-weight: 800;
  color: ${PAGE.ink};
`;

const statLineCls = css`
  font-size: 1.3rem;
  color: ${PAGE.inkSoft};
`;

const captionCls = css`
  margin: 0;
  max-width: 380px;
  min-height: 4.6rem;
  font-family: ${PAGE.serif};
  font-size: 1.6rem;
  line-height: 1.45;
  text-align: center;
  color: ${PAGE.inkSoft};
  b {
    color: ${PAGE.ink};
  }
`;

const footerCls = css`
  margin: 0;
  text-align: center;
  font-size: 1.3rem;
  color: ${PAGE.inkFaint};
`;
