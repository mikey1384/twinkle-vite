import PropTypes from 'prop-types';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import Icon from '~/components/Icon';
import { useTheme } from '~/helpers/hooks';
import { useContentContext, useKeyContext } from '~/contexts';

RewardButton.propTypes = {
  className: PropTypes.string,
  contentId: PropTypes.number.isRequired,
  contentType: PropTypes.string.isRequired,
  disableReason: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  style: PropTypes.object,
  theme: PropTypes.string
};

const rewardLabel = localize('reward');

export default function RewardButton({
  className,
  contentId,
  contentType,
  disableReason,
  style,
  theme
}) {
  const { profileTheme } = useKeyContext((v) => v.myState);
  const onSetXpRewardInterfaceShown = useContentContext(
    (v) => v.actions.onSetXpRewardInterfaceShown
  );
  const {
    reward: { color: rewardColor }
  } = useTheme(theme || profileTheme);

  return (
    <Button
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
