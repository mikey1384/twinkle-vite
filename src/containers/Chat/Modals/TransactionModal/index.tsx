import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SelectAICardModal from './SelectAICardModal';
import SelectGroupsModal from './SelectGroupsModal';
import ConfirmTransactionModal from './ConfirmTransactionModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import TransactionInitiator from './TransactionInitiator';
import Loading from '~/components/Loading';
import TransactionHandler from './TransactionHandler';
import { useNavigate } from 'react-router-dom';
import { socket } from '~/constants/sockets/api';

export default function TransactionModal({
  currentTransactionId,
  channelId,
  isAICardModalShown,
  groupObjs,
  onHide,
  onSetAICardModalCardId,
  onSetGroupObjs,
  partner
}: {
  currentTransactionId: number;
  channelId: number;
  isAICardModalShown: boolean;
  groupObjs: Record<number, any>;
  onHide: () => any;
  onSetAICardModalCardId: (v: any) => any;
  onSetGroupObjs: (v: any) => any;
  partner: {
    username: string;
    id: number;
  };
}) {
  const navigate = useNavigate();
  const ModalRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [isCounterPropose, setIsCounterPropose] = useState(false);
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
    let attempts = 0;
    const maxAttempts = 3;
    const cooldown = 1000;

    setLoading(true);
    loadWithRetry(channelId);

    async function loadWithRetry(channelId: number) {
      try {
        const { transaction } = await loadPendingTransaction(channelId);
        setPendingTransaction(transaction);
        setLoading(false);
        return;
      } catch (error) {
        if (++attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, cooldown));
          return loadWithRetry(channelId);
        } else {
          console.error('Max attempts reached. Unable to load transaction.');
          setLoading(false);
        }
      } finally {
        if (attempts === maxAttempts) {
          setLoading(false);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTransactionId]);

  const [dropdownShown, setDropdownShown] = useState(false);
  const [aiCardModalType, setAICardModalType] = useState<
    'offer' | 'want' | null
  >(null);
  const [groupModalType, setGroupModalType] = useState<'want' | 'offer' | null>(
    null
  );
  const [selectedOption, setSelectedOption] = useState('');
  const [coinAmountObj, setCoinAmountObj] = useState({
    offer: 0,
    want: 0
  });
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [selectedCardIdsObj, setSelectedCardIdsObj] = useState<
    Record<'offer' | 'want', number[]>
  >({
    offer: [],
    want: []
  });
  const [selectedGroupIdsObj, setSelectedGroupIdsObj] = useState<
    Record<'offer' | 'want', number[]>
  >({
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
    return selectedCardIdsObj.want.filter((cardId) => {
      return (
        !cardObj[cardId]?.word ||
        (!cardObj[cardId]?.isBurned && cardObj[cardId]?.ownerId === partner?.id)
      );
    });
  }, [cardObj, partner?.id, selectedCardIdsObj.want]);
  const validSelectedOfferCardIds = useMemo(() => {
    return selectedCardIdsObj.offer.filter(
      (cardId) =>
        !cardObj[cardId]?.word ||
        (!cardObj[cardId]?.isBurned && cardObj[cardId]?.ownerId === myId)
    );
  }, [cardObj, myId, selectedCardIdsObj.offer]);
  const doneButtonDisabled = useMemo(() => {
    if (selectedOption === 'want') {
      return (
        (!coinAmountObj.want || coinAmountObj.want === coinAmountObj.offer) &&
        !validSelectedWantCardIds.length &&
        !selectedGroupIdsObj.want.length
      );
    }
    return (
      !coinAmountObj.offer &&
      !validSelectedOfferCardIds.length &&
      !selectedGroupIdsObj.offer.length
    );
  }, [
    coinAmountObj.offer,
    coinAmountObj.want,
    selectedOption,
    validSelectedOfferCardIds.length,
    validSelectedWantCardIds.length,
    selectedGroupIdsObj.want.length,
    selectedGroupIdsObj.offer.length
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
        wrapped
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
              groupObjs={groupObjs}
              onSetAICardModalCardId={onSetAICardModalCardId}
              onSetGroupObjs={onSetGroupObjs}
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
              isCounterPropose={isCounterPropose}
              onSetAICardModalType={setAICardModalType}
              onSetGroupModalType={setGroupModalType}
              onSetCoinAmountObj={setCoinAmountObj}
              onSetSelectedOption={setSelectedOption}
              onSetSelectedCardIdsObj={setSelectedCardIdsObj}
              onSetSelectedGroupIdsObj={setSelectedGroupIdsObj}
              onSetAICardModalCardId={onSetAICardModalCardId}
              isSelectAICardModalShown={!!aiCardModalType}
              ModalRef={ModalRef}
              partner={partner}
              selectedCardIdsObj={selectedCardIdsObj}
              selectedGroupIdsObj={selectedGroupIdsObj}
              selectedOption={selectedOption}
              validSelectedWantCardIds={validSelectedWantCardIds}
              groupObjs={groupObjs}
            />
          )}
        </main>
        <footer>
          <Button
            transparent
            style={{ marginRight: '0.7rem' }}
            onClick={isAICardModalShown ? () => null : onHide}
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
            onSelectDone={handleCardSelection}
            onHide={
              isAICardModalShown || dropdownShown
                ? () => null
                : () => setAICardModalType(null)
            }
          />
        )}
        {!!groupModalType && (
          <SelectGroupsModal
            onHide={() => setGroupModalType(null)}
            onSelectDone={handleGroupSelection}
            currentlySelectedGroupIds={selectedGroupIdsObj[groupModalType]}
            type={groupModalType}
            partner={partner}
            groupObjs={groupObjs}
            onSetGroupObjs={onSetGroupObjs}
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
            offeredGroupIds={selectedGroupIdsObj.offer || []}
            wantedGroupIds={selectedGroupIdsObj.want || []}
            selectedOption={selectedOption}
            onSetAICardModalCardId={onSetAICardModalCardId}
            partner={partner}
            groupObjs={groupObjs}
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
    setSelectedGroupIdsObj({
      offer: pendingTransaction.want?.groupIds || [],
      want: pendingTransaction.offer?.groupIds || []
    });
    setPendingTransaction(null);
    setIsCounterPropose(true);
    setSelectedOption('want');
  }

  async function handleConfirm({
    coinsWanted,
    coinsOffered,
    offeredCardIds,
    wantedCardIds,
    offeredGroupIds,
    wantedGroupIds
  }: {
    coinsWanted: number;
    coinsOffered: number;
    offeredCardIds: number[];
    wantedCardIds: number[];
    offeredGroupIds: number[];
    wantedGroupIds: number[];
  }) {
    const { isNewChannel, newChannelId, pathId } = await postTradeRequest({
      type: selectedOption,
      wanted: {
        coins: coinsWanted,
        cardIds: wantedCardIds,
        groupIds: wantedGroupIds
      },
      offered: {
        coins: coinsOffered,
        cardIds: offeredCardIds,
        groupIds: offeredGroupIds
      },
      targetId: partner.id
    });
    if (isNewChannel) {
      socket.emit('join_chat_group', newChannelId);
      navigate(`/chat/${pathId}`);
    }
    onHide();
  }

  function handleCardSelection(cardIds: number[]) {
    setSelectedCardIdsObj((prevCardsObj) => {
      return {
        ...prevCardsObj,
        [aiCardModalType as string]: cardIds
      };
    });
    setAICardModalType(null);
  }

  function handleGroupSelection(selectedGroupIds: number[]) {
    setSelectedGroupIdsObj((prev) => ({
      ...prev,
      [groupModalType as string]: selectedGroupIds
    }));
    setGroupModalType(null);
  }
}
