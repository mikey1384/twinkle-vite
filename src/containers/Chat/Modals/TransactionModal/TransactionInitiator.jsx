import { useMemo } from 'react';
import PropTypes from 'prop-types';
import MyWant from './MyWant';
import MyOffer from './MyOffer';
import Options from './Options';

TransactionInitiator.propTypes = {
  coinAmountObj: PropTypes.object.isRequired,
  onSetCoinAmountObj: PropTypes.func.isRequired,
  onSetSelectedOption: PropTypes.func.isRequired,
  onSetAICardModalType: PropTypes.func.isRequired,
  onSetSelectedCardIdsObj: PropTypes.func.isRequired,
  partner: PropTypes.object.isRequired,
  selectedCardIdsObj: PropTypes.object.isRequired,
  selectedOption: PropTypes.string,
  validSelectedWantCardIds: PropTypes.array.isRequired
};

export default function TransactionInitiator({
  coinAmountObj,
  onSetCoinAmountObj,
  onSetSelectedOption,
  onSetAICardModalType,
  onSetSelectedCardIdsObj,
  partner,
  selectedCardIdsObj,
  selectedOption,
  validSelectedWantCardIds
}) {
  const offerMenuShown = useMemo(() => {
    if (selectedOption === 'offer' || selectedOption === 'send') {
      return true;
    }
    return coinAmountObj.want || validSelectedWantCardIds.length;
  }, [coinAmountObj.want, selectedOption, validSelectedWantCardIds.length]);

  return (
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
        onSelectOption={onSetSelectedOption}
        partnerName={partner?.username}
        selectedOption={selectedOption}
      />
      {selectedOption === 'want' ? (
        <MyWant
          style={{ marginTop: '3rem' }}
          coinAmount={coinAmountObj.want}
          onSetCoinAmount={(amount) =>
            onSetCoinAmountObj((prevState) => ({
              ...prevState,
              want: amount
            }))
          }
          selectedCardIds={selectedCardIdsObj.want}
          onShowAICardSelector={() => onSetAICardModalType('want')}
          onDeselect={(cardId) =>
            onSetSelectedCardIdsObj((prevState) => ({
              ...prevState,
              want: prevState.want.filter((id) => id !== cardId)
            }))
          }
          partnerId={partner.id}
        />
      ) : null}
      {!!offerMenuShown && (
        <MyOffer
          coinAmount={coinAmountObj.offer}
          selectedCardIds={selectedCardIdsObj.offer}
          selectedOption={selectedOption}
          style={{ marginTop: '3rem' }}
          onSetCoinAmount={(amount) =>
            onSetCoinAmountObj((prevState) => ({
              ...prevState,
              offer: amount
            }))
          }
          onShowAICardSelector={() => onSetAICardModalType('offer')}
          onDeselect={(cardId) =>
            onSetSelectedCardIdsObj((prevState) => ({
              ...prevState,
              offer: prevState.offer.filter((id) => id !== cardId)
            }))
          }
        />
      )}
    </div>
  );
}
