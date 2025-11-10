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
import { useThemedCardVars } from '~/theme/useThemedCardVars';

export default function FilterPanel({
  filters,
  onDropdownShown,
  onSetFilters
}: {
  filters: any;
  onDropdownShown: () => void;
  onSetFilters: (filters: any) => void;
}) {
  const { cardVars } = useThemedCardVars({ role: 'filter' });

  return (
    <div style={cardVars} className={panelClass}>
      <div className={filtersGridClass}>
        <ColorFilter
          selectedColor={filters.color}
          onSelectColor={handleSelectColor}
          onDropdownShown={onDropdownShown}
        />
        <StyleFilter
          selectedStyle={filters.style}
          onSelectStyle={handleSelectStyle}
        />
        <WordFilter
          selectedWord={filters.word}
          onSelectWord={handleSelectWord}
        />
        <CardIdFilter
          selectedNumber={filters.cardId}
          onSelectNumber={handleSelectNumber}
        />
        <QualityFilter
          selectedQuality={filters.quality}
          onSelectQuality={handleSelectQuality}
          onDropdownShown={onDropdownShown}
        />
      </div>
      <div className={switchRowClass}>
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
            { label: 'image-1', onClick: () => handleSelectEngine('image-1') }
          ]}
        />
      </div>
    </div>
  );

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

  function handleSelectEngine(engine: 'DALL-E 2' | 'DALL-E 3' | 'image-1') {
    onSetFilters((prevFilters: any) => ({
      ...prevFilters,
      engine
    }));
  }

  function handleClearEngine() {
    onSetFilters((prevFilters: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { engine, ...rest } = prevFilters;
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

const filtersGridClass = css`
  width: 100%;
  display: grid;
  gap: 1.2rem;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  align-items: start;
  @media (max-width: ${mobileMaxWidth}) {
    gap: 1rem;
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
