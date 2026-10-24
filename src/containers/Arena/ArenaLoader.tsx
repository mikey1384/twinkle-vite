import React from 'react';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';
import { ARENA } from './theme';

// Arena's waiting card (Mikey 10-24): a paper card with a chunky ink
// progress bar, used while AI Story writes a story or its questions.
// `progress` is 0-100; without it the bar runs as a stripe. A spinner always
// turns beside the text, so a stalled bar never looks frozen.
export default function ArenaLoader({
  text,
  progress
}: {
  text: string;
  progress?: number;
}) {
  const known = typeof progress === 'number';
  return (
    <div className={cardCls} role="status" aria-live="polite">
      <span className={textCls}>
        <Icon icon="spinner" pulse />
        {text}
      </span>
      <span className={trackCls}>
        <span
          className={known ? fillCls : stripeCls}
          style={
            known ? { width: `${Math.max(4, Math.min(100, progress))}%` } : {}
          }
        />
      </span>
      {known && <span className={pctCls}>{Math.round(progress)}%</span>}
    </div>
  );
}

const cardCls = css`
  width: 100%;
  max-width: 44rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1.2rem;
  padding: 2.4rem 2.4rem 2rem;
  background: ${ARENA.paper};
  border: 3px solid ${ARENA.line};
  border-radius: 12px;
  box-shadow: 4px 4px 0 ${ARENA.line};
  color: ${ARENA.ink};
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.8rem 1.4rem 1.4rem;
  }
`;

const textCls = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 1.9rem;
  font-weight: 900;
  text-align: center;
`;

const trackCls = css`
  position: relative;
  height: 2.2rem;
  border: 3px solid ${ARENA.line};
  border-radius: 999px;
  background: #fff;
  overflow: hidden;
`;

const fillCls = css`
  display: block;
  height: 100%;
  background: ${ARENA.train};
  border-right: 3px solid ${ARENA.line};
  transition: width 0.45s ease-out;
`;

const stripeCls = css`
  display: block;
  height: 100%;
  width: 200%;
  background: repeating-linear-gradient(
    -45deg,
    ${ARENA.train} 0 1.2rem,
    #6cc48f 1.2rem 2.4rem
  );
  animation: arena-stripe 1.2s linear infinite;
  @keyframes arena-stripe {
    from {
      transform: translateX(-2.4rem);
    }
    to {
      transform: translateX(0);
    }
  }
`;

const pctCls = css`
  font-size: 1.3rem;
  font-weight: 800;
  text-align: right;
  color: ${ARENA.inkSoft};
`;
