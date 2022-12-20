import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import {
  returnCardBurnXP,
  qualityProps,
  cardLevelHash
} from '~/constants/defaultValues';
import { addCommasToNumber } from '~/helpers/stringHelpers';

UnlistedMenu.propTypes = {
  cardLevel: PropTypes.number.isRequired,
  cardQuality: PropTypes.string.isRequired,
  onSetSellModalShown: PropTypes.func.isRequired,
  onSetIsBurned: PropTypes.func.isRequired
};

export default function UnlistedMenu({
  onSetSellModalShown,
  onSetIsBurned,
  cardLevel,
  cardQuality
}) {
  const {
    xpNumber: { color: xpNumberColor }
  } = useKeyContext((v) => v.theme);
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
          <span style={{ marginLeft: '0.7rem' }}>Sell</span>
        </Button>
      </div>
      <div
        style={{
          marginTop: '5rem',
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
        <Button onClick={() => onSetIsBurned(true)} color="redOrange" filled>
          <Icon icon="fire" />
          <span style={{ marginLeft: '0.7rem' }}>Burn</span>
        </Button>
      </div>
    </div>
  );
}
