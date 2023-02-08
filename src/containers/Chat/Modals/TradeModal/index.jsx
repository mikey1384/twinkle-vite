import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import MyWant from './MyWant';
import MyOffer from './MyOffer';
import Options from './Options';
import SelectAICardModal from './SelectAICardModal';
import ConfirmTradeModal from './ConfirmTradeModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';

TradeModal.propTypes = {
  isAICardModalShown: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  partner: PropTypes.object.isRequired
};

export default function TradeModal({
  isAICardModalShown,
  onHide,
  onSetAICardModalCardId,
  partner
}) {
  const { userId: myId } = useKeyContext((v) => v.myState);
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const postTradeRequest = useAppContext(
    (v) => v.requestHelpers.postTradeRequest
  );
  const cardObj = useChatContext((v) => v.state.cardObj);
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
      return (
        (!coinAmountObj.want && !validSelectedWantCardIds.length) ||
        (!coinAmountObj.offer && !validSelectedOfferCardIds.length)
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
    return 'Trade';
  }, [selectedOption]);

  return (
    <ErrorBoundary componentPath="Chat/Modals/TradeModal">
      <Modal onHide={isAICardModalShown || dropdownShown ? null : onHide}>
        <header>{title}</header>
        <main>
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              paddingBottom: !!selectedOption ? 0 : '2rem'
            }}
          >
            <Options
              onSelectOption={setSelectedOption}
              partnerName={partner?.username}
              selectedOption={selectedOption}
            />
            {selectedOption === 'want' ? (
              <MyWant
                style={{ marginTop: '3rem' }}
                coinAmount={coinAmountObj.want}
                onSetCoinAmount={(amount) =>
                  setCoinAmountObj((prevState) => ({
                    ...prevState,
                    want: amount
                  }))
                }
                selectedCardIds={selectedCardIdsObj.want}
                onShowAICardSelector={() => setAICardModalType('want')}
                onDeselect={(cardId) =>
                  setSelectedCardIdsObj((prevState) => ({
                    ...prevState,
                    want: prevState.want.filter((id) => id !== cardId)
                  }))
                }
                partnerId={partner.id}
              />
            ) : null}
            {!!selectedOption && (
              <MyOffer
                coinAmount={coinAmountObj.offer}
                selectedCardIds={selectedCardIdsObj.offer}
                selectedOption={selectedOption}
                style={{ marginTop: '3rem' }}
                onSetCoinAmount={(amount) =>
                  setCoinAmountObj((prevState) => ({
                    ...prevState,
                    offer: amount
                  }))
                }
                onShowAICardSelector={() => setAICardModalType('offer')}
                onDeselect={(cardId) =>
                  setSelectedCardIdsObj((prevState) => ({
                    ...prevState,
                    offer: prevState.offer.filter((id) => id !== cardId)
                  }))
                }
              />
            )}
          </div>
        </main>
        <footer>
          <Button
            transparent
            style={{ marginRight: '0.7rem' }}
            onClick={isAICardModalShown ? null : onHide}
          >
            Cancel
          </Button>
          <Button
            disabled={doneButtonDisabled}
            color={doneColor}
            onClick={() => setConfirmModalShown(true)}
          >
            {doneLabel}
          </Button>
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
          <ConfirmTradeModal
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
    const data = await postTradeRequest({
      wanted: {
        coins: coinsWanted,
        cardIds: wantedCardIds
      },
      offered: {
        coins: coinsOffered,
        cardIds: offeredCardIds
      }
    });
    console.log(data);
  }
}
