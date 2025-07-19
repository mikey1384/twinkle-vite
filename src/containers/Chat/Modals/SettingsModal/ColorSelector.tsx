import React, { useState } from 'react';
import Icon from '~/components/Icon';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import { Color, mobileMaxWidth } from '~/constants/css';
import { priceTable } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';

export default function ColorSelector({
  unlocked,
  colors,
  onSetColor,
  selectedColor,
  style
}: {
  unlocked: string[];
  colors: string[];
  onSetColor: (v: string) => void;
  selectedColor: string;
  style: React.CSSProperties;
}) {
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const [hovered, setHovered] = useState('');

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
      {colors.map((color) => {
        const locked =
          color !== 'green' &&
          color !== 'logoBlue' &&
          !unlocked.includes(color);
        const cannotAfford = locked && twinkleCoins < priceTable.chatTheme;

        return (
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
                cursor: cannotAfford ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: cannotAfford ? 0.2 : 1,
                ...(selectedColor !== color
                  ? {
                      border: `0.5rem solid #fff`,
                      boxShadow: `0 0 5px #fff`
                    }
                  : {})
              }}
              onClick={() => (cannotAfford ? null : onSetColor(color))}
              onMouseEnter={() => setHovered(color)}
              onMouseLeave={() => setHovered('')}
            >
              {locked && (
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
            {locked && hovered === color && (
              <FullTextReveal
                show
                direction="left"
                style={{
                  color: '#000',
                  textAlign: 'center',
                  minWidth: '7rem'
                }}
                text={
                  <>
                    <Icon icon={['far', 'badge-dollar']} />{' '}
                    {priceTable.chatTheme}
                  </>
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
