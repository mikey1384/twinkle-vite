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
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          color: #fff;
          font-weight: 800;
          ${letterGrade
            ? `
            background: ${Color[color]()};
            box-shadow: inset 0 2px 0 rgba(255,255,255,0.2), 0 2px 0 rgba(0,0,0,0.25);
          `
            : `
            background: radial-gradient(circle at 35% 35%, #ffffff 0%, #f5f5f5 35%, #e9eef5 100%);
            border: 2px dashed ${Color.lightGray()};
            color: ${Color.darkGray()};
            text-shadow: 0 1px 0 #ffffff;
          `}
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
        <span style={{ opacity: letterGrade ? 1 : 0.9 }}>
          {letterGrade || '?'}
        </span>
      </div>
    </div>
  );
}
