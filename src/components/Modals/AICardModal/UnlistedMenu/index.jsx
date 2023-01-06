import PropTypes from 'prop-types';
import OwnerMenu from './OwnerMenu';
import NonOwnerMenu from './NonOwnerMenu';
import { useMemo } from 'react';
import { mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { returnCardBurnXP } from '~/constants/defaultValues';
import { css } from '@emotion/css';

UnlistedMenu.propTypes = {
  cardId: PropTypes.number.isRequired,
  cardLevel: PropTypes.number.isRequired,
  cardQuality: PropTypes.string.isRequired,
  myId: PropTypes.number,
  myOffer: PropTypes.object,
  onSetSellModalShown: PropTypes.func.isRequired,
  owner: PropTypes.object.isRequired,
  userIsOwner: PropTypes.bool.isRequired,
  onSetWithdrawOfferModalShown: PropTypes.func.isRequired,
  onSetOfferModalShown: PropTypes.func.isRequired
};

export default function UnlistedMenu({
  cardId,
  onSetSellModalShown,
  cardLevel,
  cardQuality,
  myId,
  myOffer,
  owner,
  userIsOwner,
  onSetWithdrawOfferModalShown,
  onSetOfferModalShown
}) {
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
  const burnAICard = useAppContext((v) => v.requestHelpers.burnAICard);
  const burnXP = useMemo(() => {
    return returnCardBurnXP({ cardLevel, cardQuality });
  }, [cardLevel, cardQuality]);

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
          onBurnConfirm={() => burnAICard(cardId)}
        />
      ) : (
        <NonOwnerMenu
          owner={owner}
          burnXP={burnXP}
          xpNumberColor={xpNumberColor}
          myOffer={myOffer}
          myId={myId}
          onSetWithdrawOfferModalShown={onSetWithdrawOfferModalShown}
          onSetOfferModalShown={onSetOfferModalShown}
        />
      )}
    </div>
  );
}
