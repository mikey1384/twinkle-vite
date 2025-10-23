import React from 'react';
import ColorFilter from './ColorFilter';
import QualityFilter from './QualityFilter';
import StyleFilter from './StyleFilter';
import WordFilter from './WordFilter';
import CardIdFilter from './CardIdFilter';
import SwitchButton from '~/components/Buttons/SwitchButton';
import { css } from '@emotion/css';
import {
  Color,
  mobileMaxWidth,
  wideBorderRadius,
  desktopMinWidth
} from '~/constants/css';
import { useThemedCardVars } from '~/theme/useThemedCardVars';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

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
        <SwitchButton
          checked={!!filters.isDalle3}
          label="DALL-E 3"
          onChange={handleDALLE3SwitchClick}
          small={deviceIsMobile}
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

  function handleDALLE3SwitchClick() {
    onSetFilters((prevFilters: any) => ({
      ...prevFilters,
      isDalle3: !prevFilters.isDalle3
    }));
  }
}

const panelClass = css`
  font-size: 1.6rem;
  width: 100%;
  max-width: 960px;
  padding: 1.6rem 1.8rem;
  background: #fff;
  border: 1px solid var(--ui-border);
  border-radius: ${wideBorderRadius};
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
