import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Input from '~/components/Texts/Input';
import { useKeyContext } from '~/contexts';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

export default function CardSearchPanel({
  filters,
  onBuyNowSwitchClick,
  onSetSelectedFilter,
  onCardNumberSearch
}: {
  filters: any;
  onBuyNowSwitchClick: () => any;
  onSetSelectedFilter: (filter: string) => any;
  onCardNumberSearch: (cardNumber: string | number) => void;
}) {
  const {
    success: { color: successColor }
  } = useKeyContext((v) => v.theme);
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const [cardNumber, setCardNumber] = useState<string | number>('');

  return (
    <div
      className={css`
        font-size: 1.7rem;
        width: 100%;
        padding: 1rem;
        background: #fff;
        border: 1px solid ${Color.borderGray()};
        .label {
          font-family: 'Roboto', sans-serif;
          font-weight: bold;
          font-size: 1.5rem;
          color: ${Color.darkerGray()};
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.1rem;
          }
        }
      `}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          width: '100%'
        }}
      >
        <Button
          mobilePadding="0.5rem 1rem"
          color={filters.owner ? 'logoBlue' : 'darkerGray'}
          skeuomorphic
          onClick={() => onSetSelectedFilter('owner')}
        >
          <Icon icon="caret-down" />
          <span>&nbsp;&nbsp;</span>
          <span
            className={css`
              font-size: 1.4rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.1rem;
              }
            `}
          >
            {filters.owner || 'Owner'}
          </span>
        </Button>
        <div
          className={css`
            display: flex;
            gap: 1rem;
            @media (max-width: ${mobileMaxWidth}) {
              gap: 0.5rem;
              flex-direction: column;
            }
          `}
        >
          <Button
            mobilePadding="0.5rem 1rem"
            color={
              filters.quality === 'superior'
                ? 'green'
                : filters.quality === 'rare'
                ? 'purple'
                : filters.quality === 'elite'
                ? 'redOrange'
                : filters.quality === 'legendary'
                ? 'gold'
                : 'darkerGray'
            }
            skeuomorphic
            onClick={() => onSetSelectedFilter('style')}
          >
            <Icon icon="caret-down" />
            <span>&nbsp;&nbsp;</span>
            <span
              className={css`
                font-size: 1.4rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.1rem;
                }
              `}
            >
              {filters.style || 'Style'}
            </span>
          </Button>
          <Button
            mobilePadding="0.5rem 1rem"
            color={
              filters.color
                ? filters.color === 'blue'
                  ? 'logoBlue'
                  : filters.color
                : 'darkerGray'
            }
            skeuomorphic
            onClick={() => onSetSelectedFilter('color')}
          >
            <Icon icon="caret-down" />
            <span>&nbsp;&nbsp;</span>
            <span
              className={css`
                font-size: 1.4rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.1rem;
                }
              `}
            >
              {filters.color || 'Color'}
            </span>
          </Button>
          <Button
            mobilePadding="0.5rem 1rem"
            color={
              filters.quality === 'superior'
                ? 'green'
                : filters.quality === 'rare'
                ? 'purple'
                : filters.quality === 'elite'
                ? 'redOrange'
                : filters.quality === 'legendary'
                ? 'gold'
                : 'darkerGray'
            }
            skeuomorphic
            onClick={() => onSetSelectedFilter('quality')}
          >
            <Icon icon="caret-down" />
            <span>&nbsp;&nbsp;</span>
            <span
              className={css`
                font-size: 1.4rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.1rem;
                }
              `}
            >
              {filters.quality || 'Quality'}
            </span>
          </Button>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div>
            <span className="label">Word</span>
            <Input
              onFocus={(event: any) => {
                event.currentTarget.blur();
                onSetSelectedFilter('word');
              }}
              onChange={() => null}
              placeholder="Word"
              value={filters.word || ''}
              style={{
                margin: 0,
                padding: '0.5rem',
                width: '7rem',
                lineHeight: 1,
                marginLeft: '1rem',
                fontSize: '1.5rem',
                height: 'auto'
              }}
              className={css`
                @media (max-width: ${mobileMaxWidth}) {
                  width: 5rem !important;
                  height: 2.5rem !important;
                  font-size: 1.1rem !important;
                }
              `}
            />
          </div>
          <div
            style={{
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <span className="label">Card #</span>
            <Input
              onChange={handleSetCardNumber}
              placeholder="Card #"
              value={cardNumber || ''}
              style={{
                margin: 0,
                padding: '0.5rem',
                width: '7rem',
                lineHeight: 1,
                marginLeft: '1rem',
                fontSize: '1.5rem',
                height: 'auto'
              }}
              onKeyPress={(event: any) => {
                if (!!cardNumber && event.key === 'Enter') {
                  onCardNumberSearch(cardNumber);
                }
              }}
              className={css`
                @media (max-width: ${mobileMaxWidth}) {
                  width: 5rem !important;
                  height: 2.5rem !important;
                  font-size: 1.1rem !important;
                }
              `}
            />
            {!!cardNumber && (
              <div>
                <Button
                  style={{
                    padding: '0.5rem',
                    lineHeight: 0
                  }}
                  className={css`
                    margin-left: 1rem;
                    @media (max-width: ${mobileMaxWidth}) {
                      margin-left: 0.5rem;
                    }
                  `}
                  filled
                  color={successColor}
                  onClick={() => onCardNumberSearch(cardNumber)}
                >
                  <Icon
                    className={css`
                      @media (max-width: ${mobileMaxWidth}) {
                        font-size: 1.1rem;
                      }
                    `}
                    icon="magnifying-glass"
                    size="lg"
                  />
                </Button>
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end'
          }}
        >
          <SwitchButton
            small={deviceIsMobile}
            checked={!!filters.isBuyNow}
            label="Buy Now"
            onChange={onBuyNowSwitchClick}
          />
        </div>
        {location.search && (
          <div
            onClick={() => {
              setCopied(true);
              handleCopyToClipboard();
              setTimeout(() => setCopied(false), 1000);
            }}
            style={{
              fontSize: '1.3rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontFamily: 'Roboto',
              color: Color.darkerGray()
            }}
          >
            {copied ? <Icon icon="check" /> : <Icon icon="copy" />}
            <span className="desktop" style={{ marginLeft: '1rem' }}>
              {copied ? 'Copied!' : 'Embed'}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  async function handleCopyToClipboard() {
    const contentUrl = `![](https://www.twin-kle.com${location.pathname}${location.search})`;
    try {
      await navigator.clipboard.writeText(contentUrl);
    } catch (err) {
      console.error(err);
    }
  }

  function handleSetCardNumber(text: string) {
    const cardNumberInput = Number(text.replace(/[^0-9]/g, ''));
    setCardNumber(cardNumberInput);
  }
}
