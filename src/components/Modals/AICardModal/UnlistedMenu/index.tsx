import React from 'react';
import OwnerMenu from './OwnerMenu';
import NonOwnerMenu from './NonOwnerMenu';
import { mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

export default function UnlistedMenu({
  burnXP,
  cardId,
  onSetSellModalShown,
  cardLevel,
  cardQuality,
  myId,
  myOffer,
  owner,
  userIsOwner,
  onSetWithdrawOfferModalShown,
  onSetOfferModalShown,
  onUserMenuShownChange
}: {
  burnXP: number;
  cardId: number;
  cardLevel: number;
  cardQuality: string;
  myId: number;
  myOffer: any;
  onSetSellModalShown: (v: boolean) => void;
  onUserMenuShownChange: (v: boolean) => void;
  owner: any;
  userIsOwner: boolean;
  onSetWithdrawOfferModalShown: (v: boolean) => void;
  onSetOfferModalShown: (v: boolean) => void;
}) {
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
  const userId = useKeyContext((v) => v.myState.userId);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const burnAICard = useAppContext((v) => v.requestHelpers.burnAICard);

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
      }}
      className={css`
        font-size: 1.6rem;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.1rem;
        }
      `}
    >
      {userIsOwner ? (
        <OwnerMenu
          burnXP={burnXP}
          xpNumberColor={xpNumberColor}
          cardLevel={cardLevel}
          cardQuality={cardQuality}
          onSetSellModalShown={onSetSellModalShown}
          onBurnConfirm={handleBurn}
          twinkleCoins={twinkleCoins}
        />
      ) : (
        <NonOwnerMenu
          owner={owner}
          burnXP={burnXP}
          xpNumberColor={xpNumberColor}
          myOffer={myOffer}
          myId={myId}
          onUserMenuShownChange={onUserMenuShownChange}
          onSetWithdrawOfferModalShown={onSetWithdrawOfferModalShown}
          onSetOfferModalShown={onSetOfferModalShown}
        />
      )}
    </div>
  );

  async function handleBurn() {
    const { newXp, newCoins } = await burnAICard(cardId);
    onSetUserState({
      userId,
      newState: { twinkleXP: newXp, twinkleCoins: newCoins }
    });
    return Promise.resolve();
  }
}
