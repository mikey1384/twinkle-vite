import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import Icon from '~/components/Icon';
import { returnTheme } from '~/helpers';
import { useContentContext, useKeyContext } from '~/contexts';

const rewardLabel = localize('reward');

RewardButton.propTypes = {
  className: PropTypes.string,
  contentId: PropTypes.number.isRequired,
  contentType: PropTypes.string.isRequired,
  disableReason: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  skeuomorphic: PropTypes.bool,
  style: PropTypes.object,
  theme: PropTypes.string
};
export default function RewardButton({
  className,
  contentId,
  contentType,
  disableReason,
  skeuomorphic,
  style,
  theme
}: {
  className?: string;
  contentId: number;
  contentType: string;
  disableReason?: string | boolean;
  skeuomorphic?: boolean;
  style?: React.CSSProperties;
  theme?: string;
}) {
  const { profileTheme } = useKeyContext((v) => v.myState);
  const onSetXpRewardInterfaceShown = useContentContext(
    (v) => v.actions.onSetXpRewardInterfaceShown
  );
  const {
    reward: { color: rewardColor }
  } = useMemo(() => returnTheme(theme || profileTheme), [profileTheme, theme]);

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
