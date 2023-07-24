import React, { useMemo } from 'react';
import ProgressBar from '~/components/ProgressBar';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';

export default function UserLevelStatus({
  style
}: {
  style?: React.CSSProperties;
}) {
  const { authLevel, achievementPoints, profileTheme } = useKeyContext(
    (v) => v.myState
  );
  const displayedAP = useMemo(
    () => addCommasToNumber(achievementPoints),
    [achievementPoints]
  );

  const startAP = '100 AP';
  const targetAP = '1000 AP';

  return (
    <div
      className={css`
        background: #fff;
        padding: 1rem;
        border: 1px solid ${Color.borderGray()};
        border-radius: ${borderRadius};
        @media (max-width: ${mobileMaxWidth}) {
          border-radius: 0;
          border-left: 0;
          border-right: 0;
        }
      `}
      style={style}
    >
      <p
        className={css`
          font-weight: bold;
          font-size: 2.2rem;
        `}
      >
        Your User Level: {authLevel} ({displayedAP} AP)
      </p>
      <ProgressBar
        theme={profileTheme}
        progress={10}
        startLabel={startAP}
        endLabel={targetAP}
      />
    </div>
  );
}
