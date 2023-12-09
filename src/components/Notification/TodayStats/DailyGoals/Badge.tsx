import React, { useMemo } from 'react';
import { css } from '@emotion/css';

const gradientMap: {
  [key: string]: {
    achieved: string;
    notAchieved?: string;
  };
} = {
  W: {
    achieved: `linear-gradient(135deg, #ff8c00 0%, #ffc040 100%)`,
    notAchieved: `linear-gradient(135deg, rgba(255, 140, 0, 0.3) 0%, rgba(255, 192, 64, 0.3) 100%)`
  },
  G: {
    achieved: `linear-gradient(135deg, #db0076 0%, #ff4088 100%)`,
    notAchieved: `linear-gradient(135deg, rgba(219, 0, 118, 0.3) 0%, rgba(255, 64, 136, 0.3) 100%)`
  },
  A: {
    achieved: `linear-gradient(135deg, #0047ab 0%, #408cff 100%)`,
    notAchieved: `linear-gradient(135deg, rgba(0, 71, 171, 0.3) 0%, rgba(64, 140, 255, 0.3) 100%)`
  }
};

export default function Badge({
  children,
  isAchieved
}: {
  children: string;
  isAchieved: boolean;
}) {
  const background = useMemo(
    () =>
      isAchieved
        ? gradientMap[children]?.achieved
        : gradientMap[children]?.notAchieved || 'var(--color-not-achieved)',
    [children, isAchieved]
  );

  return (
    <div
      className={css`
        display: inline-flex;
        justify-content: center;
        align-items: center;
        width: 40px;
        height: 40px;
        margin: 0.5rem;
        border-radius: 50%;
        color: white;
        font-weight: bold;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition: background-color 0.3s ease, transform 0.3s ease;
        background: ${background};

        &:hover {
          transform: scale(1.1);
          background: ${isAchieved ? '' : gradientMap[children]?.notAchieved};
        }
      `}
    >
      {children}
    </div>
  );
}
