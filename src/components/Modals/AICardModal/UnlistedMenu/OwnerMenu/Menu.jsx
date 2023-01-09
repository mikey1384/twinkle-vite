import { useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import { Color, mobileMaxWidth } from '~/constants/css';
import { cardLevelHash, qualityProps } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';

Menu.propTypes = {
  burnXP: PropTypes.number.isRequired,
  cardLevel: PropTypes.number.isRequired,
  cardQuality: PropTypes.string.isRequired,
  onBurnConfirm: PropTypes.func.isRequired,
  onSetSellModalShown: PropTypes.func.isRequired,
  xpNumberColor: PropTypes.string.isRequired
};
export default function Menu({
  burnXP,
  cardLevel,
  cardQuality,
  onBurnConfirm,
  onSetSellModalShown,
  xpNumberColor
}) {
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  return (
    <ErrorBoundary componentPath="components/Modals/AICardModal/UnlistedMenu/OwnerMenu/Menu">
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        `}
      >
        <p
          className={css`
            margin-bottom: 2rem;
            @media (max-width: ${mobileMaxWidth}) {
              margin-bottom: 1rem;
            }
          `}
        >
          {`List this card on the market so others can buy it.`}
        </p>
        <Button
          onClick={() => onSetSellModalShown(true)}
          color="oceanBlue"
          filled
        >
          <Icon icon="shopping-cart" />
          <span style={{ marginLeft: '0.7rem' }}>List for sale</span>
        </Button>
      </div>
      <div
        style={{
          marginTop: '3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}
      >
        <p
          className={css`
            margin-bottom: 2rem;
            @media (max-width: ${mobileMaxWidth}) {
              margin-bottom: 1rem;
            }
          `}
        >
          Burn this card and earn{' '}
          <b style={{ color: Color[xpNumberColor]() }}>
            {addCommasToNumber(burnXP)}
          </b>{' '}
          <b style={{ color: Color.gold() }}>XP</b>. The more valuable the{' '}
          <b style={{ color: Color[cardLevelHash[cardLevel].color]() }}>
            color
          </b>{' '}
          and the higher the{' '}
          {cardQuality === 'common' ? (
            'quality'
          ) : (
            <b style={{ color: qualityProps[cardQuality].color }}>quality</b>
          )}{' '}
          of a card, the more <b style={{ color: Color.gold() }}>XP</b> you earn
          by burning it. This action is irreversible, so use it wisely.
        </p>
        <Button
          onClick={() => setConfirmModalShown(true)}
          color="redOrange"
          filled
        >
          <Icon icon="fire" />
          <span style={{ marginLeft: '0.7rem' }}>Burn</span>
        </Button>
      </div>
      {confirmModalShown && (
        <ConfirmModal
          modalOverModal
          onHide={() => setConfirmModalShown(false)}
          title="Burn this card"
          descriptionFontSize="1.6rem"
          description={
            <span>
              Are you sure you want to burn this card? Once you do, it will be{' '}
              <b>permanently</b> destroyed and you {`won't`} be able to sell it
              or use it for collection missions. This action is irreversible, so
              make sure this is what you really want to do before proceeding
            </span>
          }
          onConfirm={async () => {
            await onBurnConfirm();
            setConfirmModalShown(false);
          }}
        />
      )}
    </ErrorBoundary>
  );
}
