import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const rewardLevelLabel = localize('rewardLevel');

export default function RewardLevelBar({
  className,
  rewardLevel,
  style
}: {
  className?: string;
  rewardLevel: number;
  style?: React.CSSProperties;
}) {
  const theme = useKeyContext((v) => v.theme);
  const stars = useMemo(() => {
    return Array.from({ length: rewardLevel }, (_, i) => (
      <Icon key={i} icon="star" style={{ marginLeft: '0.2rem' }} />
    ));
  }, [rewardLevel]);

  const earnUpToLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `최대 ${addCommasToNumber(rewardLevel * 2000)}XP 까지 획득가능`;
    }
    return `Earn up to ${addCommasToNumber(rewardLevel * 2000)} XP`;
  }, [rewardLevel]);

  const barColor = useMemo(
    () => theme[`level${rewardLevel}`]?.color,
    [rewardLevel, theme]
  );

  return (
    <div
      className={className}
      style={{
        background: Color[barColor](),
        color: '#fff',
        padding: '0.5rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...style
      }}
    >
      <div>
        {rewardLevelLabel}: {stars}
      </div>
      <div>{earnUpToLabel}</div>
    </div>
  );
}
