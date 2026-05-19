import React from 'react';
import ColorFilter from './ColorFilter';
import QualityFilter from './QualityFilter';
import StyleFilter from './StyleFilter';
import WordFilter from './WordFilter';
import CardIdFilter from './CardIdFilter';
import DropdownButton from '~/components/Buttons/DropdownButton';
import { css } from '@emotion/css';
import {
  Color,
  mobileMaxWidth,
  borderRadius,
  desktopMinWidth
} from '~/constants/css';
import { useThemedCardVars } from '~/theme/hooks/useThemedCardVars';

const tabletPickerMaxWidth = '1100px';
const stackedFilterControlWidth = '24rem';

export default function FilterPanel({
  filters,
  onDropdownShown,
  onSetFilters,
  variant = 'default'
}: {
  filters: any;
  onDropdownShown: (isShown?: boolean) => void;
  onSetFilters: (filters: any) => void;
  variant?: 'default' | 'explore';
}) {
  const { cardVars } = useThemedCardVars({ role: 'filter' });
  const isExploreVariant = variant === 'explore';

  return (
    <div style={cardVars} className={panelClass}>
      {isExploreVariant ? renderExploreFilters() : renderDefaultFilters()}
    </div>
  );

  function renderExploreFilters() {
    return (
      <>
        <div className={exploreFiltersGridClass}>
          {renderColorFilter()}
          {renderStyleFilter(true)}
          {renderWordFilter(true)}
          {renderCardIdFilter(true)}
          {renderQualityFilter()}
        </div>
        <div className={switchRowClass}>{renderModelFilter()}</div>
      </>
    );
  }

  function renderDefaultFilters() {
    return (
      <div className={defaultFiltersLayoutClass}>
        <div className={defaultCompactFilterRowClass}>
          {renderColorFilter()}
          {renderQualityFilter()}
        </div>
        <div className={defaultPairedFilterRowClass}>
          {renderStyleFilter(false)}
          {renderWordFilter(false)}
          {renderCardIdFilter(false)}
        </div>
        <div className={defaultCenteredFilterRowClass}>
          <div className={switchRowClass}>{renderModelFilter()}</div>
        </div>
      </div>
    );
  }

  function renderColorFilter() {
    return (
      <ColorFilter
        selectedColor={filters.color}
        onSelectColor={handleSelectColor}
        onDropdownShown={onDropdownShown}
      />
    );
  }

  function renderQualityFilter() {
    return (
      <QualityFilter
        selectedQuality={filters.quality}
        onSelectQuality={handleSelectQuality}
        onDropdownShown={onDropdownShown}
      />
    );
  }

  function renderStyleFilter(fullWidthSearchInput: boolean) {
    return (
      <StyleFilter
        selectedStyle={filters.style}
        onSelectStyle={handleSelectStyle}
        fullWidthSearchInput={fullWidthSearchInput}
        hasStackingContext={!fullWidthSearchInput}
      />
    );
  }

  function renderWordFilter(fullWidthSearchInput: boolean) {
    return (
      <WordFilter
        selectedWord={filters.word}
        onSelectWord={handleSelectWord}
        fullWidthSearchInput={fullWidthSearchInput}
        hasStackingContext={!fullWidthSearchInput}
      />
    );
  }

  function renderCardIdFilter(fullWidthSearchInput: boolean) {
    return (
      <CardIdFilter
        selectedNumber={filters.cardId}
        onSelectNumber={handleSelectNumber}
        fullWidthSearchInput={fullWidthSearchInput}
      />
    );
  }

  function renderModelFilter() {
    return (
      <DropdownButton
        color={filters.engine ? 'logoBlue' : 'darkerGray'}
        variant={filters.engine ? 'soft' : 'solid'}
        tone="raised"
        icon="caret-down"
        text={filters.engine ? filters.engine : 'Model'}
        onDropdownShown={onDropdownShown}
        menuProps={[
          { label: 'Any', onClick: handleClearEngine },
          {
            label: 'DALL-E 2',
            onClick: () => handleSelectEngine('DALL-E 2')
          },
          {
            label: 'DALL-E 3',
            onClick: () => handleSelectEngine('DALL-E 3')
          },
          { label: 'image-1', onClick: () => handleSelectEngine('image-1') },
          {
            label: 'image-1.5',
            onClick: () => handleSelectEngine('image-1.5')
          },
          {
            label: 'image-2',
            onClick: () => handleSelectEngine('image-2')
          },
          {
            label: 'Nano Banana',
            onClick: () => handleSelectEngine('Nano Banana')
          }
        ]}
      />
    );
  }

  function handleSelectColor(color: string) {
    onSetFilters((prevFilters: any) => ({
      ...prevFilters,
      color
    }));
  }

  function handleSelectQuality(quality: string) {
    onSetFilters((prevFilters: any) => ({
      ...prevFilters,
      quality
    }));
  }

  function handleSelectNumber(number: number) {
    onSetFilters((prevFilters: any) => ({
      ...prevFilters,
      cardId: number
    }));
  }

  function handleSelectStyle(style: string) {
    onSetFilters((prevFilters: any) => ({
      ...prevFilters,
      style
    }));
  }

  function handleSelectWord(word: string) {
    onSetFilters((prevFilters: any) => ({
      ...prevFilters,
      word
    }));
  }

  function handleSelectEngine(
    engine:
      | 'DALL-E 2'
      | 'DALL-E 3'
      | 'image-1'
      | 'image-1.5'
      | 'image-2'
      | 'Nano Banana'
  ) {
    onSetFilters((prevFilters: any) => ({
      ...prevFilters,
      engine
    }));
  }

  function handleClearEngine() {
    onSetFilters((prevFilters: any) => {
      const { engine: _unusedEngine, ...rest } = prevFilters;
      return rest;
    });
  }
}

const panelClass = css`
  font-size: 1.6rem;
  width: 100%;
  max-width: 960px;
  padding: 1.6rem 1.8rem;
  background: #fff;
  border: 1px solid var(--ui-border);
  border-radius: ${borderRadius};
  margin: 0 auto 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  .label {
    font-family: 'Inter', 'Roboto', sans-serif;
    font-weight: 600;
    font-size: 1.35rem;
    color: ${Color.darkerGray()};
    letter-spacing: 0.02em;
  }
  @media (min-width: ${desktopMinWidth}) {
    font-size: 1.7rem;
  }
  @media (max-width: ${mobileMaxWidth}) {
    margin-bottom: 1.2rem;
    padding: 1.2rem;
    font-size: 1.45rem;
    gap: 1.4rem;
  }
`;

const defaultFiltersLayoutClass = css`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.4rem;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 1rem;
  }
`;

const defaultPairedFilterRowClass = css`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, ${stackedFilterControlWidth}));
  justify-content: center;
  align-items: start;
  gap: 1.6rem;
  > * {
    width: 100%;
    max-width: ${stackedFilterControlWidth};
  }
  > * > div:first-child {
    justify-content: center;
    text-align: center;
  }
  > * > div:nth-child(2) {
    margin-left: auto;
    margin-right: auto;
  }
  @media (min-width: ${desktopMinWidth}) and (max-width: ${tabletPickerMaxWidth}) {
    grid-template-columns: repeat(2, minmax(0, ${stackedFilterControlWidth}));
    > :nth-child(3) {
      grid-column: 1 / -1;
      justify-self: center;
    }
  }
  @media (max-width: ${mobileMaxWidth}) {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    width: 100%;
    > * {
      width: 100%;
      max-width: ${stackedFilterControlWidth};
    }
    > * > div:first-child {
      justify-content: center;
      text-align: center;
    }
    > * > div:nth-child(2) {
      margin-left: auto;
      margin-right: auto;
    }
  }
`;

const defaultCompactFilterRowClass = css`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 2rem;
  > * {
    width: auto;
    min-width: 8.8rem;
  }
  > * > div:first-child {
    justify-content: center;
    text-align: center;
  }
  @media (min-width: ${desktopMinWidth}) and (max-width: ${tabletPickerMaxWidth}) {
    gap: 2rem;
  }
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: row;
    gap: 2rem;
  }
`;

const defaultCenteredFilterRowClass = css`
  width: 100%;
  max-width: ${stackedFilterControlWidth};
  display: flex;
  justify-content: center;
  align-items: flex-start;
  @media (min-width: ${desktopMinWidth}) and (max-width: ${tabletPickerMaxWidth}) {
    max-width: ${stackedFilterControlWidth};
  }
  @media (max-width: ${mobileMaxWidth}) {
    > * {
      width: 100%;
      max-width: ${stackedFilterControlWidth};
    }
    > * > div:first-child {
      justify-content: center;
      text-align: center;
    }
    > * > div:nth-child(2) {
      margin-left: auto;
      margin-right: auto;
    }
  }
`;

const exploreFiltersGridClass = css`
  width: 100%;
  display: grid;
  gap: 1.2rem;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  align-items: end;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
`;

const switchRowClass = css`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 0.4rem;
  @media (max-width: ${mobileMaxWidth}) {
    justify-content: center;
    padding-top: 0.2rem;
  }
`;
