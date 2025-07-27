import React from 'react';
import { Color } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { css, keyframes } from '@emotion/css';

const shimmerAnimation = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export default function Marble({
  letterGrade,
  style,
  isAllS
}: {
  letterGrade?: string;
  style?: React.CSSProperties;
  isAllS?: boolean;
}) {
  const color = useKeyContext(
    (v) => v.theme[`grammarGameScore${letterGrade}`]?.color
  );
  const colorS = useKeyContext((v) => v.theme[`grammarGameScoreS`]?.color);

  return (
    <div
      style={{
        display: 'inline-block',
        width: '3rem',
        height: '3rem',
        ...style
      }}
    >
      <div
        className={css`
          border-radius: 100%;
          border: ${letterGrade ? '0' : `1px solid ${Color.borderGray()}`};
          display: flex;
          justify-content: center;
          align-items: center;
          background: ${letterGrade ? Color[color]() : '#fff'};
          color: #fff;
          font-weight: bold;
          width: 100%;
          height: 100%;
          ${isAllS &&
          letterGrade === 'S' &&
          `
            background: linear-gradient(
              90deg,
              ${Color[colorS]()},
              #ffec8b,
              ${Color[colorS]()}
            );
            background-size: 200% auto;
            animation: ${shimmerAnimation} 3s linear infinite;
          `}
        `}
      >
        <span style={{ opacity: letterGrade ? 1 : 0 }}>
          {letterGrade || 'N'}
        </span>
      </div>
    </div>
  );
}
