import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SelectAICardModal from './SelectAICardModal';
import ConfirmTransactionModal from './ConfirmTransactionModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import TransactionInitiator from './TransactionInitiator';
import Loading from '~/components/Loading';
import TransactionHandler from './TransactionHandler';

TransactionModal.propTypes = {
  channelId: PropTypes.number.isRequired,
  isAICardModalShown: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  partner: PropTypes.object.isRequired
};

export default function TransactionModal({
  channelId,
  isAICardModalShown,
  onHide,
  onSetAICardModalCardId,
  partner
}) {
  const ModalRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);
  const { userId: myId } = useKeyContext((v) => v.myState);
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const loadPendingTransaction = useAppContext(
    (v) => v.requestHelpers.loadPendingTransaction
  );
  const postTradeRequest = useAppContext(
    (v) => v.requestHelpers.postTradeRequest
  );
  const cardObj = useChatContext((v) => v.state.cardObj);

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      const { transaction } = await loadPendingTransaction(channelId);
      setPendingTransaction(transaction);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [dropdownShown, setDropdownShown] = useState(false);
  const [aiCardModalType, setAICardModalType] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [coinAmountObj, setCoinAmountObj] = useState({
    offer: 0,
    want: 0
  });
  const [selectedCardIdsObj, setSelectedCardIdsObj] = useState({
    offer: [],
    want: []
  });
  const doneLabel = useMemo(() => {
    if (selectedOption === 'want') {
      return 'Propose';
    }
    if (selectedOption === 'send') {
      return 'Send';
    }
    return 'Show';
  }, [selectedOption]);
  const validSelectedWantCardIds = useMemo(() => {
    return selectedCardIdsObj.want.filter(
      (cardId) =>
        cardObj[cardId] &&
        !cardObj[cardId].isBurned &&
        cardObj[cardId].ownerId === partner.id
    );
  }, [cardObj, partner.id, selectedCardIdsObj.want]);
  const validSelectedOfferCardIds = useMemo(() => {
    return selectedCardIdsObj.offer.filter(
      (cardId) =>
        cardObj[cardId] &&
        !cardObj[cardId].isBurned &&
        cardObj[cardId].ownerId === myId
    );
  }, [cardObj, myId, selectedCardIdsObj.offer]);
  const doneButtonDisabled = useMemo(() => {
    if (selectedOption === 'want') {
      return !coinAmountObj.want && !validSelectedWantCardIds.length;
    }
    return !coinAmountObj.offer && !validSelectedOfferCardIds.length;
  }, [
    coinAmountObj.offer,
    coinAmountObj.want,
    selectedOption,
    validSelectedOfferCardIds.length,
    validSelectedWantCardIds.length
  ]);

  const title = useMemo(() => {
    if (selectedOption === 'offer') {
      return 'Show';
    }
    if (selectedOption === 'send') {
      return 'Send';
    }
    return 'Trade';
  }, [selectedOption]);

  return (
    <ErrorBoundary componentPath="Chat/Modals/TransactionModal">
      <Modal
        innerRef={ModalRef}
        onHide={isAICardModalShown || dropdownShown ? null : onHide}
      >
        <header>{title}</header>
        <main>
          {loading ? (
            <Loading />
          ) : pendingTransaction ? (
            <TransactionHandler
              myId={myId}
              onSetAICardModalCardId={onSetAICardModalCardId}
              partner={partner}
              transactionDetails={pendingTransaction}
              onSetPendingTransaction={setPendingTransaction}
              channelId={channelId}
            />
          ) : (
            <TransactionInitiator
              coinAmountObj={coinAmountObj}
              onSetAICardModalType={setAICardModalType}
              onSetCoinAmountObj={setCoinAmountObj}
              onSetSelectedOption={setSelectedOption}
              onSetSelectedCardIdsObj={setSelectedCardIdsObj}
              isSelectAICardModalShown={!!aiCardModalType}
              ModalRef={ModalRef}
              partner={partner}
              selectedCardIdsObj={selectedCardIdsObj}
              selectedOption={selectedOption}
              validSelectedWantCardIds={validSelectedWantCardIds}
            />
          )}
        </main>
        <footer>
          <Button
            transparent
            style={{ marginRight: '0.7rem' }}
            onClick={isAICardModalShown ? null : onHide}
          >
            {pendingTransaction ? 'Close' : 'Cancel'}
          </Button>
          {!pendingTransaction && (
            <Button
              disabled={doneButtonDisabled}
              color={doneColor}
              onClick={() => setConfirmModalShown(true)}
            >
              {doneLabel}
            </Button>
          )}
        </footer>
        {!!aiCardModalType && (
          <SelectAICardModal
            aiCardModalType={aiCardModalType}
            partner={partner}
            currentlySelectedCardIds={selectedCardIdsObj[aiCardModalType]}
            onDropdownShown={setDropdownShown}
            onSetAICardModalCardId={onSetAICardModalCardId}
            onSelectDone={(cardIds) => {
              setSelectedCardIdsObj((prevCardsObj) => {
                return {
                  ...prevCardsObj,
                  [aiCardModalType]: cardIds
                };
              });
              setAICardModalType(null);
            }}
            onHide={
              isAICardModalShown || dropdownShown
                ? null
                : () => setAICardModalType(null)
            }
          />
        )}
        {confirmModalShown && (
          <ConfirmTransactionModal
            onHide={() =>
              isAICardModalShown ? null : setConfirmModalShown(false)
            }
            isAICardModalShown={isAICardModalShown}
            onConfirm={handleConfirm}
            coinAmountObj={coinAmountObj}
            offeredCardIds={validSelectedOfferCardIds}
            wantedCardIds={validSelectedWantCardIds}
            selectedOption={selectedOption}
            onSetAICardModalCardId={onSetAICardModalCardId}
            partner={partner}
          />
        )}
      </Modal>
    </ErrorBoundary>
  );

  async function handleConfirm({
    coinsWanted,
    coinsOffered,
    offeredCardIds,
    wantedCardIds
  }) {
    await postTradeRequest({
      type: selectedOption,
      wanted: {
        coins: coinsWanted,
        cardIds: wantedCardIds
      },
      offered: {
        coins: coinsOffered,
        cardIds: offeredCardIds
      },
      targetId: partner.id
    });
    onHide();
  }
}
