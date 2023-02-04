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
  selectedCardsObj: PropTypes.object.isRequired,
  coinAmountObj: PropTypes.object.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  partnerName: PropTypes.string.isRequired
};

export default function ConfirmTradeModal({
  isAICardModalShown,
  onHide,
  onConfirm,
  selectedOption,
  selectedCardsObj,
  coinAmountObj,
  onSetAICardModalCardId,
  partnerName
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  const [submitting, setSubmitting] = useState(false);
  const title = useMemo(() => {
    const coinToGive = coinAmountObj.offer;
    const cardsToGive = selectedCardsObj.offer;
    if (selectedOption === 'want') {
      return 'Propose Trade';
    }
    return `${selectedOption === 'offer' ? 'Show' : 'Give'}${
      coinToGive === 0
        ? ''
        : ` ${coinToGive} coin${coinToGive === 1 ? '' : 's'} ${
            cardsToGive.length === 0 ? '' : 'and'
          }`
    }${
      cardsToGive.length === 0
        ? ''
        : ` ${cardsToGive.length} card${cardsToGive.length === 1 ? '' : 's'}`
    }`;
  }, [coinAmountObj.offer, selectedCardsObj.offer, selectedOption]);

  return (
    <Modal modalOverModal onHide={onHide}>
      <header>{title}</header>
      <main>
        <Details
          isAICardModalShown={isAICardModalShown}
          selectedOption={selectedOption}
          cardsOffered={selectedCardsObj.offer}
          cardsWanted={selectedCardsObj.want}
          coinOffered={coinAmountObj.offer}
          coinWanted={coinAmountObj.want}
          partnerName={partnerName}
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
