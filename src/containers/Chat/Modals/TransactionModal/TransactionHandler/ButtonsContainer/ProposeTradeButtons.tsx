import React, { useMemo } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';

export default function ProposeTradeButtons({
  style,
  isShowOfferValid,
  isTradeOfferValid,
  onCounterPropose,
  onCloseTransaction,
  partner,
  type,
  withdrawing
}: {
  style: React.CSSProperties;
  isShowOfferValid: boolean;
  isTradeOfferValid: boolean;
  onCounterPropose: (v: any) => any;
  onCloseTransaction: (v: any) => any;
  partner: any;
  type: string;
  withdrawing: boolean;
}) {
  const promptText = useMemo(() => {
    if (type === 'trade') {
      return `Do you want to see what ${partner.username} owns?`;
    }
    return `Do you want to trade with ${partner.username}?`;
  }, [partner.username, type]);

  const yesText = useMemo(() => {
    if (type === 'trade') {
      return 'Yes, I want to see them';
    }
    return 'Yes, I want to trade';
  }, [type]);

  const isButtonsShown = useMemo(() => {
    if (type === 'show') {
      return isShowOfferValid;
    }
    if (type === 'trade') {
      return isTradeOfferValid;
    }
    return true;
  }, [isTradeOfferValid, isShowOfferValid, type]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        ...style
      }}
    >
      {isButtonsShown && (
        <div style={{ marginTop: '1rem', width: '100%', textAlign: 'center' }}>
          {promptText}
        </div>
      )}
      {isButtonsShown && (
        <div
          style={{
            marginTop: '2.5rem',
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <Button
            loading={withdrawing}
            onClick={onCloseTransaction}
            color="darkGray"
            filled
          >
            <Icon icon="xmark" />
            <span style={{ marginLeft: '0.7rem' }}>No</span>
          </Button>
          <Button
            style={{ marginLeft: '1rem' }}
            onClick={onCounterPropose}
            color="green"
            filled
          >
            <Icon icon="check" />
            <span style={{ marginLeft: '0.7rem' }}>{yesText}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
