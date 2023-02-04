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
import { useKeyContext } from '~/contexts';

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
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
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
    if (selectedOption === 'give') {
      return 'Give';
    }
    return 'Show';
  }, [selectedOption]);
  const doneButtonDisabled = useMemo(() => {
    if (selectedOption === 'want') {
      return (
        (!coinAmountObj.want && !selectedCardIdsObj.want.length) ||
        (!coinAmountObj.offer && !selectedCardIdsObj.offer.length)
      );
    }
    return !coinAmountObj.offer && !selectedCardIdsObj.offer.length;
  }, [
    coinAmountObj.offer,
    coinAmountObj.want,
    selectedCardIdsObj.offer.length,
    selectedCardIdsObj.want.length,
    selectedOption
  ]);

  const title = useMemo(() => {
    if (selectedOption === 'offer') {
      return 'Show';
    }
    if (selectedOption === 'give') {
      return 'Give';
    }
    return 'Trade';
  }, [selectedOption]);

  return (
    <ErrorBoundary componentPath="Chat/Modals/TradeModal">
      <Modal onHide={isAICardModalShown ? null : onHide}>
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
            onHide={isAICardModalShown ? null : () => setAICardModalType(null)}
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
            selectedCardIdsObj={selectedCardIdsObj}
            selectedOption={selectedOption}
            onSetAICardModalCardId={onSetAICardModalCardId}
            partnerName={partner?.username}
          />
        )}
      </Modal>
    </ErrorBoundary>
  );

  async function handleConfirm() {
    console.log('confirm');
  }
}
