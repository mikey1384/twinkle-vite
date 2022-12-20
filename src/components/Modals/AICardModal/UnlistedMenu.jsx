import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
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
  const burnXP = useMemo(() => {
    // base XP value
    let xp = 150;

    // color probabilities
    const colorProbs = {
      1: 0.5,
      2: 0.2,
      3: 0.15,
      4: 0.1,
      5: 0.05
    };

    // adjust XP based on color
    xp *= 1 / colorProbs[cardLevel];

    // quality probabilities
    const qualityProbs = {
      common: 0.5,
      superior: 0.3,
      rare: 0.13,
      elite: 0.05,
      legendary: 0.02
    };

    // adjust XP based on quality
    xp *= 1 / qualityProbs[cardQuality];

    return Math.round(xp);
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
          {`Burn this card and earn ${addCommasToNumber(
            burnXP
          )} XP. The more valuable the color and the higher the quality of a card, the more XP you earn by burning it. This action is irreversible, so use it wisely.`}
        </p>
        <Button onClick={() => onSetIsBurned(true)} color="redOrange" filled>
          <Icon icon="fire" />
          <span style={{ marginLeft: '0.7rem' }}>Burn</span>
        </Button>
      </div>
    </div>
  );
}
