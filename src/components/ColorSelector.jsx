import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import Icon from '~/components/Icon';
import FullTextReveal from '~/components/Texts/FullTextReveal';

ColorSelector.propTypes = {
  colors: PropTypes.array.isRequired,
  twinkleXP: PropTypes.number.isRequired,
  setColor: PropTypes.func.isRequired,
  selectedColor: PropTypes.string,
  style: PropTypes.object
};

export default function ColorSelector({
  colors,
  setColor,
  selectedColor,
  style,
  twinkleXP
}) {
  const [hovered, setHovered] = useState();
  const requirement = {
    black: 35_000,
    rose: 70_000,
    red: 1_500_000,
    purple: 100_000,
    darkBlue: 500_000,
    vantaBlack: 1_000_000,
    gold: 10_000_000
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        ...style
      }}
    >
      {colors.map((color) => (
        <div key={color}>
          <div
            className={css`
              width: 3rem;
              height: 3rem;
              @media (max-width: ${mobileMaxWidth}) {
                width: 2.1rem;
                height: 2.1rem;
              }
            `}
            style={{
              borderRadius: '50%',
              background: Color[color](),
              cursor:
                twinkleXP >= (requirement[color] || -1) ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...(selectedColor !== color
                ? {
                    border: `0.5rem solid #fff`,
                    boxShadow: `0 0 5px #fff`
                  }
                : {})
            }}
            onClick={
              twinkleXP >= (requirement[color] || -1)
                ? () => setColor(color)
                : () => {}
            }
            onMouseEnter={() => setHovered(color)}
            onMouseLeave={() => setHovered(undefined)}
          >
            {twinkleXP < (requirement[color] || -1) && (
              <Icon
                className={css`
                  font-size: 1rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 0.6rem;
                  }
                `}
                style={{ color: '#fff' }}
                icon="lock"
              />
            )}
          </div>
          {twinkleXP < (requirement[color] || -1) && hovered === color && (
            <FullTextReveal
              show
              direction="left"
              style={{ color: '#000', fontSize: '1.3rem', textAlign: 'center' }}
              text={`Requires ${addCommasToNumber(requirement[color])} XP`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
