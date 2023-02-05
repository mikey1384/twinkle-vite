import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import localize from '~/constants/localize';
import Details from './Details';
import { useChatContext, useKeyContext } from '~/contexts';

const cancelLabel = localize('cancel');
const confirmLabel = localize('confirm');

ConfirmTradeModal.propTypes = {
  isAICardModalShown: PropTypes.bool,
  onHide: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  selectedOption: PropTypes.string.isRequired,
  selectedCardIdsObj: PropTypes.object.isRequired,
  coinAmountObj: PropTypes.object.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  partner: PropTypes.object.isRequired
};

export default function ConfirmTradeModal({
  isAICardModalShown,
  onHide,
  onConfirm,
  selectedOption,
  selectedCardIdsObj,
  coinAmountObj,
  onSetAICardModalCardId,
  partner
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  const [submitting, setSubmitting] = useState(false);
  const coinOffered = coinAmountObj.offer;
  const coinWanted = coinAmountObj.want;
  const offeredCardIds = selectedCardIdsObj.offer;
  const wantedCardIds = selectedCardIdsObj.want;
  const title = useMemo(() => {
    const coinToGive = coinAmountObj.offer;
    const cardIdsToGive = selectedCardIdsObj.offer;
    if (selectedOption === 'want') {
      return 'Propose Trade';
    }
    return `${selectedOption === 'offer' ? 'Show' : 'Give'}${
      coinToGive === 0
        ? ''
        : ` ${coinToGive} coin${coinToGive === 1 ? '' : 's'} ${
            cardIdsToGive.length === 0 ? '' : 'and'
          }`
    }${
      cardIdsToGive.length === 0
        ? ''
        : ` ${cardIdsToGive.length} card${
            cardIdsToGive.length === 1 ? '' : 's'
          }`
    }`;
  }, [coinAmountObj.offer, selectedCardIdsObj.offer, selectedOption]);
  const { userId } = useKeyContext((v) => v.myState);
  const cardObj = useChatContext((v) => v.state.cardObj);
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
  const validOfferedCardIds = useMemo(() => {
    return offeredCardIds.filter(
      (cardId) =>
        cardObj[cardId] &&
        !cardObj[cardId].isBurned &&
        cardObj[cardId].ownerId === userId
    );
  }, [offeredCardIds, cardObj, userId]);
  const validWantedCardIds = useMemo(() => {
    return wantedCardIds.filter(
      (cardId) =>
        cardObj[cardId] &&
        !cardObj[cardId].isBurned &&
        cardObj[cardId].ownerId === partner.id
    );
  }, [wantedCardIds, cardObj, partner.id]);

  return (
    <Modal modalOverModal onHide={onHide}>
      <header>{title}</header>
      <main>
        <Details
          coinsOffered={effectiveCoinOffered}
          coinsWanted={effectiveCoinWanted}
          cardIdsOffered={validOfferedCardIds}
          cardIdsWanted={validWantedCardIds}
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
