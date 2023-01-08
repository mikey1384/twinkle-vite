import PropTypes from 'prop-types';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useKeyContext, useChatContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';

OwnerMenu.propTypes = {
  burnXP: PropTypes.number.isRequired,
  cardId: PropTypes.number.isRequired,
  style: PropTypes.object
};

export default function OwnerMenu({ burnXP, cardId, style }) {
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
  const delistAICard = useAppContext((v) => v.requestHelpers.delistAICard);
  const onDelistAICard = useChatContext((v) => v.actions.onDelistAICard);

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        alignItems: 'center',
        ...style
      }}
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
      <Button
        className={css`
          margin-top: 2rem;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 0.7rem !important;
          }
        `}
        onClick={handleCancelListing}
        color="rose"
        filled
      >
        <Icon
          className={css`
            font-size: 1.6rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1rem;
            }
          `}
          icon="redo"
        />
        <span
          className={css`
            font-size: 1.6rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1rem;
            }
          `}
          style={{ marginLeft: '0.7rem' }}
        >
          Cancel Listing
        </span>
      </Button>
    </div>
  );

  async function handleCancelListing() {
    const success = await delistAICard(cardId);
    if (success) {
      onDelistAICard(cardId);
    }
  }
}
