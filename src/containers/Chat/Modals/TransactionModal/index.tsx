import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SelectAICardModal from './SelectAICardModal';
import ConfirmTransactionModal from './ConfirmTransactionModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import TransactionInitiator from './TransactionInitiator';
import Loading from '~/components/Loading';
import TransactionHandler from './TransactionHandler';

export default function TransactionModal({
  currentTransactionId,
  channelId,
  isAICardModalShown,
  onHide,
  onSetAICardModalCardId,
  partner
}: {
  currentTransactionId: number;
  channelId: number;
  isAICardModalShown: boolean;
  onHide: () => any;
  onSetAICardModalCardId: (v: any) => any;
  partner: any;
}) {
  const ModalRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);
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
  }, [currentTransactionId]);

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
        cardObj[cardId].ownerId === partner?.id
    );
  }, [cardObj, partner?.id, selectedCardIdsObj.want]);
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
      return (
        (!coinAmountObj.want || coinAmountObj.want === coinAmountObj.offer) &&
        !validSelectedWantCardIds.length
      );
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
    if (selectedOption === 'want') {
      return 'Trade';
    }
    return 'Transaction';
  }, [selectedOption]);

  const isTransactionHandlerShown = useMemo(() => {
    if (pendingTransaction) {
      if (
        pendingTransaction.type === 'send' &&
        pendingTransaction.from === myId
      ) {
        return false;
      }
      return true;
    }
    return false;
  }, [myId, pendingTransaction]);

  return (
    <ErrorBoundary componentPath="Chat/Modals/TransactionModal">
      <Modal
        innerRef={ModalRef}
        onHide={isAICardModalShown || dropdownShown ? undefined : onHide}
      >
        <header>{title}</header>
        <main>
          {loading ? (
            <Loading />
          ) : isTransactionHandlerShown ? (
            <TransactionHandler
              currentTransactionId={currentTransactionId}
              isAICardModalShown={isAICardModalShown}
              myId={myId}
              onSetAICardModalCardId={onSetAICardModalCardId}
              onSetPendingTransaction={setPendingTransaction}
              onAcceptTrade={onHide}
              onCounterPropose={handleCounterPropose}
              partner={partner}
              transactionDetails={pendingTransaction}
              channelId={channelId}
            />
          ) : (
            <TransactionInitiator
              coinAmountObj={coinAmountObj}
              onSetAICardModalType={setAICardModalType}
              onSetCoinAmountObj={setCoinAmountObj}
              onSetSelectedOption={setSelectedOption}
              onSetSelectedCardIdsObj={setSelectedCardIdsObj}
              onSetAICardModalCardId={onSetAICardModalCardId}
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
            onClick={isAICardModalShown ? undefined : onHide}
          >
            {pendingTransaction ? 'Close' : 'Cancel'}
          </Button>
          {!isTransactionHandlerShown && (
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
                ? undefined
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

  function handleCounterPropose() {
    setCoinAmountObj({
      offer: pendingTransaction.want?.coins || 0,
      want: pendingTransaction.offer?.coins || 0
    });
    setSelectedCardIdsObj({
      offer: pendingTransaction.want?.cardIds || [],
      want: pendingTransaction.offer?.cardIds || []
    });
    setPendingTransaction(null);
    setSelectedOption('want');
  }

  async function handleConfirm({
    coinsWanted,
    coinsOffered,
    offeredCardIds,
    wantedCardIds
  }: {
    coinsWanted: number;
    coinsOffered: number;
    offeredCardIds: number[];
    wantedCardIds: number[];
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
