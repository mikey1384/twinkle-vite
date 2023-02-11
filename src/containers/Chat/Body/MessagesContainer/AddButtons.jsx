import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useKeyContext } from '~/contexts';

AddButtons.propTypes = {
  disabled: PropTypes.bool,
  isTwoPeopleChannel: PropTypes.bool,
  onUploadButtonClick: PropTypes.func.isRequired,
  onSelectVideoButtonClick: PropTypes.func.isRequired,
  onSetTransactionModalShown: PropTypes.func.isRequired
};

export default function AddButtons({
  disabled,
  isTwoPeopleChannel,
  onUploadButtonClick,
  onSelectVideoButtonClick,
  onSetTransactionModalShown
}) {
  const {
    button: { color: buttonColor },
    buttonHovered: { color: buttonHoverColor }
  } = useKeyContext((v) => v.theme);

  return (
    <div
      style={{
        display: 'flex',
        margin: '0.2rem 0 0.2rem 0',
        alignItems: 'center'
      }}
    >
      {isTwoPeopleChannel && (
        <Button
          skeuomorphic
          disabled={disabled}
          onClick={onSetTransactionModalShown}
          color={buttonColor}
          mobilePadding="0.5rem"
          hoverColor={buttonHoverColor}
        >
          <Icon size="lg" icon={['far', 'badge-dollar']} />
        </Button>
      )}
      <Button
        skeuomorphic
        disabled={disabled}
        onClick={onUploadButtonClick}
        color={buttonColor}
        hoverColor={buttonHoverColor}
        mobilePadding={isTwoPeopleChannel ? '0.5rem' : null}
        style={{ marginLeft: isTwoPeopleChannel ? '0.5rem' : 0 }}
      >
        <Icon size="lg" icon="upload" />
      </Button>
      <Button
        skeuomorphic
        disabled={disabled}
        color={buttonColor}
        hoverColor={buttonHoverColor}
        onClick={onSelectVideoButtonClick}
        mobilePadding={isTwoPeopleChannel ? '0.5rem' : null}
        style={{ marginLeft: '0.5rem' }}
      >
        <Icon size="lg" icon="film" />
      </Button>
    </div>
  );
}
