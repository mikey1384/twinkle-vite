import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import {
  Color,
  mobileMaxWidth,
  tabletMaxWidth,
  wideBorderRadius
} from '~/constants/css';
import Button from '~/components/Button';
import Checkbox from '~/components/Checkbox';
import Icon from '~/components/Icon';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Input from '~/components/Texts/Input';
import { useKeyContext } from '~/contexts';
import { isMobile } from '~/helpers';
import ScopedTheme from '~/theme/ScopedTheme';
import { useHomePanelVars } from '~/theme/useHomePanelVars';

const deviceIsMobile = isMobile(navigator);

const panelClass = css`
  width: 100%;
  font-size: 1.6rem;
  padding: 1.6rem 2rem;
  border-radius: ${wideBorderRadius};
  background: var(--search-panel-bg, #ffffff);
  border: 1px solid var(--search-panel-border, var(--ui-border));
  box-shadow: var(--search-panel-shadow, none);
  color: ${Color.darkerGray()};
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 1.2rem 1.4rem;
    font-size: 1.4rem;
    border-radius: 14px;
  }
`;

const controlsGridClass = css`
  display: grid;
  width: 100%;
  gap: 1.6rem 2rem;
  grid-template-columns: 1fr;
  grid-template-areas:
    'owner'
    'filters'
    'search'
    'switches'
    'embed';
  @media (min-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-areas:
      'owner filters'
      'search switches'
      'embed embed';
  }
  @media (min-width: 1260px) {
    grid-template-columns: 1.1fr 1.4fr 1.1fr 0.9fr 0.8fr;
    grid-template-areas: 'owner filters search switches embed';
    align-items: center;
  }
  @media (max-width: ${mobileMaxWidth}) {
    gap: 1.2rem;
  }
`;

const ownerSectionClass = css`
  grid-area: owner;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  text-align: center;
  @media (min-width: 821px) {
    align-items: flex-start;
    text-align: left;
  }
`;

const checkboxClass = css`
  justify-content: center;
  gap: 0.6rem;
  > p {
    font-family: 'Roboto', sans-serif;
    font-weight: 700;
    font-size: 1.2rem;
    letter-spacing: 0.04em;
    color: var(--role-search-color, ${Color.darkerGray()});
    @media (max-width: ${mobileMaxWidth}) {
      font-size: 1rem;
    }
  }
  @media (min-width: 821px) {
    justify-content: flex-start;
  }
`;

const filtersGroupClass = css`
  grid-area: filters;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  @media (max-width: ${tabletMaxWidth}) {
    justify-content: flex-start;
  }
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.6rem;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }
`;

const filterButtonClass = css`
  min-width: 10.5rem;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  @media (max-width: ${mobileMaxWidth}) {
    width: auto;
    min-width: 8.6rem;
  }
`;

const buttonContentClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 1.4rem;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.1rem;
  }
`;

const searchSectionClass = css`
  grid-area: search;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
  justify-content: center;
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.6rem;
  }
`;

const fieldLabelClass = css`
  font-family: 'Roboto', sans-serif;
  font-weight: 700;
  font-size: 1.3rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--role-search-color, ${Color.darkerGray()});
  white-space: nowrap;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.1rem;
  }
`;

const baseInputClass = css`
  min-width: 7rem;
  border-radius: ${wideBorderRadius};
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--search-panel-border, var(--ui-border));
  text-align: left;
  font-size: 1.4rem;
  color: ${Color.darkerGray()};
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  &:focus-visible {
    outline: none;
    border-color: var(--search-panel-accent, ${Color.logoBlue()});
    box-shadow: 0 0 0 3px var(--search-panel-focus, ${Color.logoBlue(0.25)});
  }
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.2rem;
    min-width: 6rem;
  }
`;

const wordInputClass = css`
  width: 9rem;
  @media (max-width: ${mobileMaxWidth}) {
    width: 5.4rem;
  }
`;

const cardInputClass = css`
  width: 8.5rem;
  letter-spacing: 0.04em;
  @media (max-width: ${mobileMaxWidth}) {
    width: 5.8rem;
  }
`;

const inlineFieldRowClass = css`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.6rem;
    justify-content: center;
  }
`;

const cardInputRowClass = css`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: nowrap;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 0.6rem;
    width: 100%;
    flex-wrap: wrap;
  }
`;

const switchesSectionClass = css`
  grid-area: switches;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  align-items: center;
  justify-content: flex-end;
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: row;
    justify-content: center;
    flex-wrap: wrap;
  }
`;

const embedClass = css`
  grid-area: embed;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.8rem;
  cursor: pointer;
  font-family: 'Roboto', sans-serif;
  font-size: 1.3rem;
  color: var(--role-search-color, ${Color.darkerGray()});
  transition: color 0.15s ease, transform 0.15s ease;
  justify-self: flex-end;
  align-self: center;
  width: max-content;
  &:hover {
    color: var(--search-panel-accent, ${Color.logoBlue()});
    transform: translateY(-1px);
  }
  @media (max-width: ${mobileMaxWidth}) {
    justify-content: center;
    justify-self: center;
  }
  @media (min-width: 900px) and (max-width: 1259px) {
    justify-self: center;
  }
`;

const iconButtonClass = css`
  padding: 0.5rem;
  line-height: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.6rem;
  height: 3.6rem;
  border-radius: ${wideBorderRadius};
  @media (max-width: ${mobileMaxWidth}) {
    width: 3.2rem;
    height: 3.2rem;
  }
`;

const searchIconClass = css`
  font-size: 1.5rem;
  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.2rem;
  }
`;

export default function CardSearchPanel({
  filters,
  onBuyNowSwitchClick,
  onDALLE3SwitchClick,
  onSetSelectedFilter,
  onCardNumberSearch
}: {
  filters: any;
  onBuyNowSwitchClick: () => any;
  onDALLE3SwitchClick: () => any;
  onSetSelectedFilter: (filter: string) => any;
  onCardNumberSearch: (cardNumber: string | number) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const [copied, setCopied] = useState(false);
  const [cardNumber, setCardNumber] = useState<string | number>('');
  const { themeName, themeRoles, accentColor } = useHomePanelVars();
  // Use the standard UI border to avoid overly faint appearance
  const borderColor = 'var(--ui-border)';
  const panelVars = useMemo(() => {
    const searchRole = themeRoles.search || {};
    const searchColorKey =
      typeof searchRole.color === 'string' ? searchRole.color : undefined;
    const fallbackColorFn =
      (typeof Color[themeName as keyof typeof Color] === 'function'
        ? (Color[themeName as keyof typeof Color] as (
            opacity?: number
          ) => string)
        : undefined) || (accentColor ? () => accentColor : Color.logoBlue);
    const colorFn =
      (searchColorKey &&
        typeof Color[searchColorKey as keyof typeof Color] === 'function' &&
        (Color[searchColorKey as keyof typeof Color] as (
          opacity?: number
        ) => string)) ||
      fallbackColorFn ||
      (() => accentColor || Color.logoBlue());
    const rawShadow =
      typeof searchRole.shadow === 'string' ? searchRole.shadow : undefined;
    const shadowColor =
      rawShadow && rawShadow.trim().length
        ? typeof Color[rawShadow as keyof typeof Color] === 'function'
          ? Color[rawShadow as keyof typeof Color](0.35)
          : rawShadow
        : undefined;
    return {
      ['--search-panel-border' as const]: borderColor,
      ['--search-panel-bg' as const]: '#ffffff',
      ['--search-panel-accent' as const]: colorFn(),
      ['--search-panel-focus' as const]: colorFn(0.25),
      ['--search-panel-shadow' as const]: shadowColor || 'none'
    } as React.CSSProperties;
  }, [accentColor, borderColor, themeName, themeRoles]);
  const successColor = useMemo<string>(() => {
    const successKey = themeRoles.success?.color as
      | keyof typeof Color
      | undefined;
    if (successKey && successKey in Color) {
      return successKey as string;
    }
    return 'green';
  }, [themeRoles.success?.color]);
  const ownerFilterLabel =
    typeof filters.owner === 'string' ? filters.owner : '';
  const ownerButtonColor = filters.owner ? 'logoBlue' : 'darkerGray';
  const ownerButtonVariant =
    ownerButtonColor === 'darkerGray' ? 'solid' : 'soft';
  const colorFilterKey =
    typeof filters.color === 'string' ? filters.color : undefined;
  const qualityFilterKey =
    typeof filters.quality === 'string' ? filters.quality : undefined;
  const styleFilterLabel =
    typeof filters.style === 'string' ? filters.style : '';
  const wordFilterValue = typeof filters.word === 'string' ? filters.word : '';

  const colorButtonColor = colorFilterKey
    ? colorFilterKey === 'blue'
      ? 'logoBlue'
      : colorFilterKey
    : 'darkerGray';
  const colorButtonVariant =
    colorButtonColor === 'darkerGray' ? 'solid' : 'soft';
  const qualityButtonColor = qualityFilterKey
    ? qualityFilterKey === 'superior'
      ? 'green'
      : qualityFilterKey === 'rare'
      ? 'purple'
      : qualityFilterKey === 'elite'
      ? 'redOrange'
      : qualityFilterKey === 'legendary'
      ? 'gold'
      : 'darkerGray'
    : 'darkerGray';
  const qualityButtonVariant =
    qualityButtonColor === 'darkerGray' ? 'solid' : 'soft';

  return (
    <ScopedTheme
      theme={themeName}
      roles={['search', 'switch', 'success']}
      className={panelClass}
      style={panelVars}
    >
      <div className={controlsGridClass}>
        <div className={ownerSectionClass}>
          {userId && (
            <Checkbox
              label="My Cards"
              onClick={handleMyCardsClick}
              style={{ marginBottom: '0.5rem' }}
              className={checkboxClass}
              checked={filters.owner === username}
            />
          )}
          <Button
            className={filterButtonClass}
            mobilePadding="0.5rem 1rem"
            color={ownerButtonColor}
            variant={ownerButtonVariant}
            tone="raised"
            onClick={() => onSetSelectedFilter('owner')}
          >
            <span className={buttonContentClass}>
              <Icon icon="caret-down" />
              <span>{ownerFilterLabel || 'Owner'}</span>
            </span>
          </Button>
        </div>
        <div className={filtersGroupClass}>
          <Button
            className={filterButtonClass}
            mobilePadding="0.5rem 1rem"
            color="darkerGray"
            variant="solid"
            tone="raised"
            onClick={() => onSetSelectedFilter('style')}
          >
            <span className={buttonContentClass}>
              <Icon icon="caret-down" />
              <span>{styleFilterLabel || 'Style'}</span>
            </span>
          </Button>
          <Button
            className={filterButtonClass}
            mobilePadding="0.5rem 1rem"
            color={colorButtonColor}
            variant={colorButtonVariant}
            tone="raised"
            onClick={() => onSetSelectedFilter('color')}
          >
            <span className={buttonContentClass}>
              <Icon icon="caret-down" />
              <span>{colorFilterKey || 'Color'}</span>
            </span>
          </Button>
          <Button
            className={filterButtonClass}
            mobilePadding="0.5rem 1rem"
            color={qualityButtonColor}
            variant={qualityButtonVariant}
            tone="raised"
            onClick={() => onSetSelectedFilter('quality')}
          >
            <span className={buttonContentClass}>
              <Icon icon="caret-down" />
              <span>{qualityFilterKey || 'Quality'}</span>
            </span>
          </Button>
        </div>
        <div className={searchSectionClass}>
          <div className={inlineFieldRowClass}>
            <span className={fieldLabelClass}>Word</span>
            <Input
              onFocus={(event: any) => {
                event.currentTarget.blur();
                onSetSelectedFilter('word');
              }}
              onChange={() => null}
              placeholder="Word"
              value={wordFilterValue}
              className={`${baseInputClass} ${wordInputClass}`}
            />
          </div>
          <div className={inlineFieldRowClass}>
            <span className={fieldLabelClass}>Card #</span>
            <div className={cardInputRowClass}>
              <Input
                onChange={handleSetCardNumber}
                placeholder="Card #"
                value={cardNumber || ''}
                className={`${baseInputClass} ${cardInputClass}`}
                onKeyPress={(event: any) => {
                  if (!!cardNumber && event.key === 'Enter') {
                    onCardNumberSearch(cardNumber);
                  }
                }}
              />
              {!!cardNumber && (
                <Button
                  className={iconButtonClass}
                  color={successColor}
                  variant="solid"
                  tone="raised"
                  size="sm"
                  onClick={() => onCardNumberSearch(cardNumber)}
                >
                  <Icon
                    className={searchIconClass}
                    icon="magnifying-glass"
                    size="lg"
                  />
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className={switchesSectionClass}>
          <SwitchButton
            small={deviceIsMobile}
            checked={!!filters.isBuyNow}
            label="Buy Now"
            onChange={onBuyNowSwitchClick}
          />
          <SwitchButton
            small={deviceIsMobile}
            checked={!!filters.isDalle3}
            label="DALL-E 3"
            onChange={onDALLE3SwitchClick}
          />
        </div>
        {location.search && (
          <div
            className={embedClass}
            onClick={() => {
              setCopied(true);
              handleCopyToClipboard();
              setTimeout(() => setCopied(false), 1000);
            }}
          >
            {copied ? <Icon icon="check" /> : <Icon icon="copy" />}
            <span className="desktop">{copied ? 'Copied!' : 'Embed'}</span>
          </div>
        )}
      </div>
    </ScopedTheme>
  );

  async function handleCopyToClipboard() {
    const contentUrl = `![](https://www.twin-kle.com${location.pathname}${location.search})`;
    try {
      await navigator.clipboard.writeText(contentUrl);
    } catch (err) {
      console.error(err);
    }
  }

  function handleMyCardsClick() {
    const searchParams = new URLSearchParams(location.search);
    const obj = { ...filters };

    if (filters.owner === username) {
      searchParams.delete('search[owner]');
      delete obj.owner;
    } else {
      searchParams.set('search[owner]', username);
      obj.owner = username;
    }

    const minPrice = searchParams.get('search[minPrice]');
    const maxPrice = searchParams.get('search[maxPrice]');
    if (minPrice) searchParams.set('search[minPrice]', minPrice);
    if (maxPrice) searchParams.set('search[maxPrice]', maxPrice);

    if (obj.isBuyNow) searchParams.set('search[isBuyNow]', 'true');
    if (obj.isDalle3) searchParams.set('search[isDalle3]', 'true');

    Object.entries(obj).forEach(([key, value]) => {
      if (value && key !== 'isBuyNow' && key !== 'isDalle3') {
        searchParams.set(`search[${key}]`, value as string);
      }
    });

    const queryString = searchParams.toString();
    const newPath = queryString ? `/ai-cards/?${queryString}` : '/ai-cards';

    navigate(newPath);
  }

  function handleSetCardNumber(text: string) {
    const cardNumberInput = Number(text.replace(/[^0-9]/g, ''));
    setCardNumber(cardNumberInput);
  }
}
