import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext } from '~/contexts';

AddButtons.propTypes = {
  channelId: PropTypes.number.isRequired,
  currentTransactionId: PropTypes.number,
  disabled: PropTypes.bool,
  isTwoPeopleChannel: PropTypes.bool,
  myId: PropTypes.number.isRequired,
  onUploadButtonClick: PropTypes.func.isRequired,
  onSelectVideoButtonClick: PropTypes.func.isRequired,
  onSetTransactionModalShown: PropTypes.func.isRequired
};

export default function AddButtons({
  channelId,
  currentTransactionId,
  disabled,
  isTwoPeopleChannel,
  myId,
  onUploadButtonClick,
  onSelectVideoButtonClick,
  onSetTransactionModalShown
}) {
  const [transactionButtonIsGlowing, setTransactionButtonIsGlowing] =
    useState(false);
  const {
    alert: { color: alertColor },
    button: { color: buttonColor },
    buttonHovered: { color: buttonHoverColor }
  } = useKeyContext((v) => v.theme);
  const loadPendingTransaction = useAppContext(
    (v) => v.requestHelpers.loadPendingTransaction
  );

  useEffect(() => {
    if (isTwoPeopleChannel) {
      init();
    }
    async function init() {
      const { transaction } = await loadPendingTransaction(channelId);
      setTransactionButtonIsGlowing(transaction && transaction.from !== myId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, currentTransactionId]);

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
          filled={transactionButtonIsGlowing}
          disabled={disabled}
          onClick={onSetTransactionModalShown}
          color={transactionButtonIsGlowing ? alertColor : buttonColor}
          mobilePadding="0.5rem"
          hoverColor={transactionButtonIsGlowing ? alertColor : buttonColor}
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
