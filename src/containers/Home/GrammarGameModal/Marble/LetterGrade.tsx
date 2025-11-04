import React from 'react';
import { Color } from '~/constants/css';
import { css, keyframes } from '@emotion/css';
import { useRoleColor } from '~/theme/useRoleColor';

const shimmerAnimation = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export default function LetterGrade({
  letter,
  size = 48,
  isAllS
}: {
  letter?: 'S' | 'A' | 'B' | 'C' | 'D' | 'F' | string;
  size?: number;
  isAllS?: boolean;
}) {
  const roleS = useRoleColor('grammarGameScoreS', { fallback: 'gold' });
  const roleA = useRoleColor('grammarGameScoreA', { fallback: 'magenta' });
  const roleB = useRoleColor('grammarGameScoreB', { fallback: 'orange' });
  const roleC = useRoleColor('grammarGameScoreC', { fallback: 'pink' });
  const roleD = useRoleColor('grammarGameScoreD', { fallback: 'logoBlue' });
  const roleF = useRoleColor('grammarGameScoreF', { fallback: 'gray' });

  const letterRoles: Record<string, ReturnType<typeof useRoleColor>> = {
    S: roleS,
    A: roleA,
    B: roleB,
    C: roleC,
    D: roleD,
    F: roleF
  };

  const selectedRole = letter ? letterRoles[letter] : undefined;
  const letterColor = selectedRole?.getColor() || Color.lightGray();
  const shimmerColor = roleS.getColor() || Color.gold();

  return (
    <div style={{ display: 'inline-block', width: size, height: size }}>
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
          ${
            letter
              ? `
            background: ${letterColor};
            box-shadow: inset 0 2px 0 rgba(255,255,255,0.2), 0 2px 0 rgba(0,0,0,0.25);
          `
              : `
            background: radial-gradient(circle at 35% 35%, #ffffff 0%, #f5f5f5 35%, #e9eef5 100%);
            border: 2px dashed ${Color.lightGray()};
            color: ${Color.darkGray()};
            text-shadow: 0 1px 0 #ffffff;
          `
          }
          ${isAllS &&
          letter === 'S' &&
          `
            background: linear-gradient(
              90deg,
              ${shimmerColor},
              #ffec8b,
              ${shimmerColor}
            );
            background-size: 200% auto;
            animation: ${shimmerAnimation} 3s linear infinite;
          `}
        `}
      >
        <span style={{ opacity: letter ? 1 : 0.9 }}>{letter || '?'}</span>
      </div>
    </div>
  );
}
