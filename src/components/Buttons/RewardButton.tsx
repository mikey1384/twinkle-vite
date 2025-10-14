import React, { useMemo } from 'react';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import Icon from '~/components/Icon';
import { useContentContext, useKeyContext } from '~/contexts';
import { getThemeRoles, ThemeName } from '~/theme/themes';

const rewardLabel = localize('reward');

export default function RewardButton({
  className,
  contentId,
  contentType,
  disableReason,
  style,
  theme,
  variant = 'soft',
  tone = 'raised'
}: {
  className?: string;
  contentId: number;
  contentType: string;
  disableReason?: string | boolean;
  style?: React.CSSProperties;
  theme?: string;
  variant?: 'solid' | 'soft' | 'outline' | 'ghost';
  tone?: 'flat' | 'raised';
}) {
  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const onSetXpRewardInterfaceShown = useContentContext(
    (v) => v.actions.onSetXpRewardInterfaceShown
  );
  const themeName = useMemo<ThemeName>(
    () => ((theme || profileTheme || 'logoBlue') as ThemeName),
    [profileTheme, theme]
  );
  const rewardColor = useMemo(
    () => getThemeRoles(themeName).reward?.color || 'pink',
    [themeName]
  );

  return (
    <Button
      variant={variant}
      tone={tone}
      className={className}
      color={rewardColor}
      style={style}
      onClick={() =>
        onSetXpRewardInterfaceShown({
          contentId,
          contentType,
          shown: true
        })
      }
      disabled={!!disableReason}
    >
      <Icon icon="certificate" />
      <span style={{ marginLeft: '0.7rem' }}>
        {disableReason || rewardLabel}
      </span>
    </Button>
  );
}
