import React from 'react';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { BurnValue, CardOwner } from '~/components/AICardMarketDetails';
import MakeOffer from '../MakeOffer';
import MyOffer from '../MyOffer';

export default function NonOwnerMenu({
  burnXP,
  xpNumberColor,
  owner,
  onSetWithdrawOfferModalShown,
  onSetOfferModalShown,
  onUserMenuShownChange,
  myId,
  myOffer
}: {
  burnXP: number | string;
  xpNumberColor: string;
  owner: any;
  onSetWithdrawOfferModalShown: (v: boolean) => void;
  onSetOfferModalShown: (v: boolean) => void;
  onUserMenuShownChange: (v: boolean) => void;
  myId: number;
  myOffer: any;
}) {
  return (
    <div
      className={css`
        width: 100%;
        font-size: 1.6rem;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.1rem;
        }
      `}
    >
      <BurnValue
        burnXP={burnXP}
        xpNumberColor={xpNumberColor}
        showExplanation
      />
      <div style={{ width: '100%', marginTop: '3rem', textAlign: 'center' }}>
        <CardOwner owner={owner} onMenuShownChange={onUserMenuShownChange} />
        {myOffer ? (
          <MyOffer
            className={css`
              margin-top: 3rem;
              @media (max-width: ${mobileMaxWidth}) {
                margin-top: 1.5rem;
              }
            `}
            onSetWithdrawOfferModalShown={onSetWithdrawOfferModalShown}
            myOffer={myOffer}
          />
        ) : (
          <MakeOffer
            myId={myId}
            className={css`
              margin-top: 1.7rem;
              @media (max-width: ${mobileMaxWidth}) {
                margin-top: 1rem;
              }
            `}
            onSetOfferModalShown={onSetOfferModalShown}
          />
        )}
      </div>
    </div>
  );
}
