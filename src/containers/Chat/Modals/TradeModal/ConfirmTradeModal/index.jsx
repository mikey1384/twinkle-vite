import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import Details from './Details';
import { useKeyContext } from '~/contexts';

const cancelLabel = localize('cancel');
const confirmLabel = localize('confirm');

ConfirmTradeModal.propTypes = {
  isAICardModalShown: PropTypes.bool,
  onHide: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  selectedOption: PropTypes.string.isRequired,
  selectedCardIdsObj: PropTypes.object.isRequired,
  coinAmountObj: PropTypes.object.isRequired,
  offeredCardIds: PropTypes.array.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  partner: PropTypes.object.isRequired,
  wantedCardIds: PropTypes.array.isRequired
};

export default function ConfirmTradeModal({
  isAICardModalShown,
  onHide,
  onConfirm,
  selectedOption,
  selectedCardIdsObj,
  coinAmountObj,
  onSetAICardModalCardId,
  offeredCardIds,
  wantedCardIds,
  partner
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  const [submitting, setSubmitting] = useState(false);
  const coinOffered = coinAmountObj.offer;
  const coinWanted = coinAmountObj.want;
  const title = useMemo(() => {
    const coinToSend = coinAmountObj.offer;
    const cardIdsToSend = selectedCardIdsObj.offer;
    if (selectedOption === 'want') {
      return 'Propose Trade';
    }
    return `${selectedOption === 'offer' ? 'Show' : 'Send'}${
      coinToSend === 0
        ? ''
        : ` ${coinToSend} coin${coinToSend === 1 ? '' : 's'} ${
            cardIdsToSend.length === 0 ? '' : 'and'
          }`
    }${
      cardIdsToSend.length === 0
        ? ''
        : ` ${cardIdsToSend.length} card${
            cardIdsToSend.length === 1 ? '' : 's'
          }`
    }`;
  }, [coinAmountObj.offer, selectedCardIdsObj.offer, selectedOption]);
  const effectiveCoinOffered = useMemo(() => {
    if (selectedOption === 'want') {
      return Math.max(coinOffered - coinWanted, 0);
    }
    return coinOffered;
  }, [coinOffered, coinWanted, selectedOption]);

  const effectiveCoinWanted = useMemo(() => {
    if (selectedOption === 'want') {
      return Math.max(coinWanted - coinOffered, 0);
    }
    return coinWanted;
  }, [coinOffered, coinWanted, selectedOption]);

  return (
    <Modal modalOverModal onHide={onHide}>
      <header>{title}</header>
      <main>
        <Details
          coinsOffered={effectiveCoinOffered}
          coinsWanted={effectiveCoinWanted}
          cardIdsOffered={offeredCardIds}
          cardIdsWanted={wantedCardIds}
          isAICardModalShown={isAICardModalShown}
          selectedOption={selectedOption}
          partner={partner}
          onSetAICardModalCardId={onSetAICardModalCardId}
        />
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          {cancelLabel}
        </Button>
        <Button loading={submitting} color={doneColor} onClick={handleConfirm}>
          {confirmLabel}
        </Button>
      </footer>
    </Modal>
  );

  function handleConfirm() {
    setSubmitting(true);
    onConfirm();
  }
}
