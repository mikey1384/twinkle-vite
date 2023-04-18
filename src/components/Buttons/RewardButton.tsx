import React from 'react';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import Icon from '~/components/Icon';
import { useTheme } from '~/helpers/hooks';
import { useContentContext, useKeyContext } from '~/contexts';

const rewardLabel = localize('reward');

interface Props {
  className?: string;
  contentId: number;
  contentType: string;
  disableReason?: string | false;
  skeuomorphic?: boolean;
  style?: any;
  theme?: any;
}
export default function RewardButton({
  className,
  contentId,
  contentType,
  disableReason,
  skeuomorphic,
  style,
  theme
}: Props) {
  const { profileTheme } = useKeyContext((v) => v.myState);
  const onSetXpRewardInterfaceShown = useContentContext(
    (v) => v.actions.onSetXpRewardInterfaceShown
  );
  const {
    reward: { color: rewardColor }
  } = useTheme(theme || profileTheme);

  return (
    <Button
      skeuomorphic={skeuomorphic}
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
