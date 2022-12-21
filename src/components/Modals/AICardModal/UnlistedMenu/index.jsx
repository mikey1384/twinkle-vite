import PropTypes from 'prop-types';
import OwnerMenu from './OwnerMenu';
import NonOwnerMenu from './NonOwnerMenu';
import { useMemo } from 'react';
import { mobileMaxWidth } from '~/constants/css';
import { useChatContext, useKeyContext } from '~/contexts';
import { returnCardBurnXP } from '~/constants/defaultValues';
import { css } from '@emotion/css';

UnlistedMenu.propTypes = {
  cardId: PropTypes.number.isRequired,
  cardLevel: PropTypes.number.isRequired,
  cardQuality: PropTypes.string.isRequired,
  onSetSellModalShown: PropTypes.func.isRequired,
  onSetIsBurning: PropTypes.func.isRequired,
  owner: PropTypes.object.isRequired,
  userIsOwner: PropTypes.bool.isRequired
};

export default function UnlistedMenu({
  cardId,
  onSetSellModalShown,
  onSetIsBurning,
  cardLevel,
  cardQuality,
  owner,
  userIsOwner
}) {
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const burnXP = useMemo(() => {
    return returnCardBurnXP({ cardLevel, cardQuality });
  }, [cardLevel, cardQuality]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
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
          onSetIsBurning={onSetIsBurning}
          onSetSellModalShown={onSetSellModalShown}
          onBurnConfirm={handleBurnConfirm}
        />
      ) : (
        <NonOwnerMenu
          owner={owner}
          burnXP={burnXP}
          xpNumberColor={xpNumberColor}
        />
      )}
    </div>
  );

  async function handleBurnConfirm() {
    onSetIsBurning(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    onUpdateAICard({
      cardId,
      newState: {
        isBurned: true
      }
    });
  }
}
