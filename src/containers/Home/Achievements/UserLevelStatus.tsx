import React, { useMemo } from 'react';
import ProgressBar from '~/components/ProgressBar';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useKeyContext } from '~/contexts';
import { useMyLevel } from '~/helpers/hooks';
import { addCommasToNumber } from '~/helpers/stringHelpers';

export default function UserLevelStatus({
  style
}: {
  style?: React.CSSProperties;
}) {
  const achievementPoints = useKeyContext((v) => v.myState.achievementPoints);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const { ap, level, nextLevelAp } = useMyLevel();
  const displayedAP = useMemo(
    () => addCommasToNumber(achievementPoints),
    [achievementPoints]
  );

  const startAP = useMemo(() => `${addCommasToNumber(ap || 0)} AP`, [ap]);
  const targetAP = useMemo(
    () => `${addCommasToNumber(nextLevelAp || 0)} AP`,
    [nextLevelAp]
  );

  const progress = useMemo(() => {
    if (!nextLevelAp) {
      return 0;
    }
    return Math.min(
      Math.floor(
        (Math.max(achievementPoints - ap, 0) * 100) / (nextLevelAp - ap)
      ),
      100
    );
  }, [achievementPoints, ap, nextLevelAp]);

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
        Your User Level: {level} ({displayedAP} AP)
      </p>
      <ProgressBar
        theme={profileTheme}
        progress={progress}
        startLabel={startAP}
        endLabel={targetAP}
      />
    </div>
  );
}
