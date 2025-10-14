import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import { Color, wideBorderRadius } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
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
  const barColor = useKeyContext((v) => v.theme[`level${rewardLevel}`]?.color);
  const themedBg = useMemo(
    () => (Color[barColor as keyof typeof Color]
      ? Color[barColor as keyof typeof Color](0.12)
      : Color.logoBlue(0.12)),
    [barColor]
  );
  const themedBorder = useMemo(
    () => (Color[barColor as keyof typeof Color]
      ? Color[barColor as keyof typeof Color](0.28)
      : Color.logoBlue(0.28)),
    [barColor]
  );
  const themedStrong = useMemo(
    () => (Color[barColor as keyof typeof Color]
      ? Color[barColor as keyof typeof Color]()
      : Color.logoBlue()),
    [barColor]
  );
  const stars = useMemo(() => {
    return Array.from({ length: rewardLevel }, (_, i) => (
      <Icon
        key={i}
        icon="star"
        style={{ marginLeft: '0.2rem', color: themedStrong }}
      />
    ));
  }, [rewardLevel]);

  const earnUpToLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return `최대 ${addCommasToNumber(rewardLevel * 2000)}XP 까지 획득가능`;
    }
    return `Earn up to ${addCommasToNumber(rewardLevel * 2000)} XP`;
  }, [rewardLevel]);

  return (
    <div
      className={`${className || ''} ${css`
        background: ${themedBg};
        color: ${Color.darkBlueGray()};
        padding: 0.6rem 1rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border: 1px solid ${themedBorder};
        border-radius: ${wideBorderRadius};
        font-weight: 600;
        width: auto;
        max-width: 100%;
      `}`}
      style={style}
    >
      <div>
        {rewardLevelLabel}: {stars}
      </div>
      <div>{earnUpToLabel}</div>
    </div>
  );
}
