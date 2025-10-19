import React, { useMemo } from 'react';
import ProgressBar from '~/components/ProgressBar';
import { css, cx } from '@emotion/css';
import { useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import { useMyLevel } from '~/helpers/hooks';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { homePanelClass } from '~/theme/homePanels';
import { useHomePanelVars } from '~/theme/useHomePanelVars';

export default function UserLevelStatus({
  style
}: {
  style?: React.CSSProperties;
}) {
  const achievementPoints = useKeyContext((v) => v.myState.achievementPoints);
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const { panelVars } = useHomePanelVars();
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
      className={cx(
        homePanelClass,
        css`
          padding: 1.6rem 2rem;
        `
      )}
      style={{
        ...panelVars,
        // Force neutral text colors regardless of theme
        ['--home-panel-color' as any]: Color.darkerGray(),
        ['--home-panel-heading' as any]: Color.black(),
        ...style
      }}
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
