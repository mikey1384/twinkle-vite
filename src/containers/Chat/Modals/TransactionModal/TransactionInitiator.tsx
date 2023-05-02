import React, { useEffect, useMemo } from 'react';
import MyWant from './MyWant';
import MyOffer from './MyOffer';
import Options from './Options';

export default function TransactionInitiator({
  coinAmountObj,
  isSelectAICardModalShown,
  onSetCoinAmountObj,
  onSetSelectedOption,
  onSetAICardModalType,
  onSetSelectedCardIdsObj,
  onSetAICardModalCardId,
  ModalRef,
  partner,
  selectedCardIdsObj,
  selectedOption,
  validSelectedWantCardIds
}: {
  coinAmountObj: {
    want: number;
    offer: number;
  };
  isSelectAICardModalShown: boolean;
  onSetCoinAmountObj: (v: any) => any;
  onSetSelectedOption: (v: any) => any;
  onSetAICardModalType: (v: any) => any;
  onSetAICardModalCardId: (v: any) => any;
  onSetSelectedCardIdsObj: (v: any) => any;
  ModalRef: React.RefObject<any>;
  partner: any;
  selectedCardIdsObj: any;
  selectedOption: string;
  validSelectedWantCardIds: any[];
}) {
  const offerMenuShown = useMemo(() => {
    if (selectedOption === 'offer' || selectedOption === 'send') {
      return true;
    }
    return coinAmountObj.want || validSelectedWantCardIds.length;
  }, [coinAmountObj.want, selectedOption, validSelectedWantCardIds.length]);

  useEffect(() => {
    if (coinAmountObj.want === coinAmountObj.offer && coinAmountObj.want > 0) {
      onSetCoinAmountObj({
        want: 0,
        offer: 0
      });
    }
  }, [coinAmountObj.offer, coinAmountObj.want, onSetCoinAmountObj]);

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: selectedOption ? 0 : '2rem'
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
            onSetCoinAmountObj((prevState: any) => ({
              ...prevState,
              want: amount
            }))
          }
          selectedCardIds={selectedCardIdsObj.want}
          onSetAICardModalCardId={onSetAICardModalCardId}
          onShowAICardSelector={() => onSetAICardModalType('want')}
          onDeselect={(cardId) =>
            onSetSelectedCardIdsObj((prevState: any) => ({
              ...prevState,
              want: prevState.want.filter((id: number) => id !== cardId)
            }))
          }
          partnerId={partner.id}
        />
      ) : null}
      {!!offerMenuShown && (
        <MyOffer
          focusOnMount={selectedOption === 'want'}
          isSelectAICardModalShown={isSelectAICardModalShown}
          ModalRef={ModalRef}
          coinAmount={coinAmountObj.offer}
          selectedCardIds={selectedCardIdsObj.offer}
          selectedOption={selectedOption}
          style={{ marginTop: '3rem' }}
          onSetAICardModalCardId={onSetAICardModalCardId}
          onSetCoinAmount={(amount) =>
            onSetCoinAmountObj((prevState: any) => ({
              ...prevState,
              offer: amount
            }))
          }
          onShowAICardSelector={() => onSetAICardModalType('offer')}
          onDeselect={(cardId) =>
            onSetSelectedCardIdsObj((prevState: any) => ({
              ...prevState,
              offer: prevState.offer.filter((id: number) => id !== cardId)
            }))
          }
        />
      )}
    </div>
  );
}
