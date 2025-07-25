import React from 'react';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useKeyContext } from '~/contexts';
import UsernameText from '~/components/Texts/UsernameText';
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
  burnXP: number;
  xpNumberColor: string;
  owner: any;
  onSetWithdrawOfferModalShown: (v: boolean) => void;
  onSetOfferModalShown: (v: boolean) => void;
  onUserMenuShownChange: (v: boolean) => void;
  myId: number;
  myOffer: any;
}) {
  const userLinkColor = useKeyContext((v) => v.theme.userLink.color);

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
      <div style={{ width: '100%', textAlign: 'center' }}>
        <b style={{ color: Color.redOrange() }}>Burn</b> value
        <div style={{ marginTop: '0.5rem' }}>
          <b style={{ color: Color[xpNumberColor]() }}>
            {addCommasToNumber(burnXP)}
          </b>{' '}
          <b style={{ color: Color.gold() }}>XP</b>
        </div>
        <p
          className={css`
            margin-top: 0.5rem;
            font-size: 1.1rem;
            @media (max-width: ${mobileMaxWidth}) {
              margin-top: 0.3rem;
              font-size: 0.8rem;
            }
          `}
        >
          (Burning this card yields{' '}
          <b style={{ color: Color[xpNumberColor]() }}>
            {addCommasToNumber(burnXP)}
          </b>{' '}
          <b style={{ color: Color.gold() }}>XP</b>)
        </p>
      </div>
      <div style={{ width: '100%', marginTop: '3rem', textAlign: 'center' }}>
        <div>
          Owned by
          <div>
            <UsernameText
              onMenuShownChange={onUserMenuShownChange}
              color={Color[userLinkColor]()}
              user={{
                username: owner.username,
                id: owner.id
              }}
            />
          </div>
        </div>
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
