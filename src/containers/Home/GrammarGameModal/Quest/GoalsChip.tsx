import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { css, cx } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';
import { useNotiContext } from '~/contexts';
import Icon from '~/components/Icon';
import DailyGoals from '../DailyGoals';
import { GOLD, INK, PLATE, PIXEL_FONT, frame } from './pixelUi';

// The map's status chip for today's Grammarbles goals (Basic ✓, Excellence ★,
// lit when met through Classic or Quest); tap it for the board.
export default function GoalsChip() {
  const status = useNotiContext(
    (v) => v.state.todayStats?.dailyTaskStatus?.grammarbles
  );
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(e: Event) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (boardRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', close, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', close, true);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  if (!status) return null;
  return (
    <>
      <button
        ref={buttonRef}
        className={chipCls}
        aria-label="Today's Grammarbles goals"
        aria-expanded={open}
        onClick={() => {
          const r = buttonRef.current?.getBoundingClientRect();
          if (r)
            setAt({
              top: r.bottom + 8,
              right: Math.max(8, window.innerWidth - r.right)
            });
          setOpen((o) => !o);
        }}
      >
        <span className={labelCls}>Goals</span>
        <span className={cx(dotCls, status.basicQualified && dotOnCls)}>
          <Icon icon="check" />
        </span>
        <span className={cx(dotCls, status.excellenceQualified && dotOnCls)}>
          <Icon icon="star" />
        </span>
      </button>
      {open &&
        at &&
        createPortal(
          <div
            ref={boardRef}
            className={popCls}
            style={{ top: at.top, right: at.right }}
          >
            <DailyGoals look="quest" status={status} />
          </div>,
          document.body
        )}
    </>
  );
}

const chipCls = css`
  ${frame(PLATE, 2)}
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 4.4rem;
  padding: 0 0.8rem;
  color: #fff3d0;
  white-space: nowrap;
  cursor: pointer;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0 0.6rem;
  }
  @media (max-height: 520px) and (orientation: landscape) {
    min-height: 3.4rem;
    min-width: 3.4rem;
  }
`;
const labelCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 1rem;
`;
const dotCls = css`
  ${frame(PLATE, 1)}
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: #a79f8a;
`;
const dotOnCls = css`
  ${frame(GOLD, 1)}
  color: ${INK};
`;
const popCls = css`
  position: fixed;
  z-index: 2147482500;
  width: min(46rem, calc(100vw - 16px));
  filter: drop-shadow(0 6px 0 rgba(26, 20, 38, 0.35));
`;
