import PropTypes from 'prop-types';
import OwnerMenu from './OwnerMenu';
import NonOwnerMenu from './NonOwnerMenu';
import { mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';

UnlistedMenu.propTypes = {
  burnXP: PropTypes.number.isRequired,
  cardId: PropTypes.number.isRequired,
  cardLevel: PropTypes.number.isRequired,
  cardQuality: PropTypes.string.isRequired,
  myId: PropTypes.number,
  myOffer: PropTypes.object,
  onSetSellModalShown: PropTypes.func.isRequired,
  onUserMenuShownChange: PropTypes.func.isRequired,
  owner: PropTypes.object.isRequired,
  userIsOwner: PropTypes.bool.isRequired,
  onSetWithdrawOfferModalShown: PropTypes.func.isRequired,
  onSetOfferModalShown: PropTypes.func.isRequired
};

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
}) {
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
  const { userId } = useKeyContext((v) => v.myState);
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
          onBurnConfirm={async () => {
            const newXp = await burnAICard(cardId);
            onSetUserState({
              userId,
              newState: { twinkleXP: newXp }
            });
            return Promise.resolve();
          }}
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
}
