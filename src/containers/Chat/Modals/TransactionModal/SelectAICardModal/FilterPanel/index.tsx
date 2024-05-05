import React from 'react';
import ColorFilter from './ColorFilter';
import QualityFilter from './QualityFilter';
import StyleFilter from './StyleFilter';
import WordFilter from './WordFilter';
import CardIdFilter from './CardIdFilter';
import SwitchButton from '~/components/Buttons/SwitchButton';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
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
  return (
    <div
      className={css`
        font-size: 1.7rem;
        width: 70%;
        padding: 1rem;
        background: #fff;
        border: 1px solid ${Color.borderGray()};
        margin-bottom: 1rem;
        .label {
          font-family: 'Roboto', sans-serif;
          font-weight: bold;
          font-size: 1.5rem;
          color: ${Color.darkerGray()};
          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.1rem;
          }
        }
        @media (max-width: ${mobileMaxWidth}) {
          width: 100%;
        }
      `}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          width: '100%',
          padding: '1rem'
        }}
        className={css`
          @media (max-width: ${mobileMaxWidth}) {
            gap: 1rem;
            flex-direction: column;
          }
        }
        `}
      >
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
      <div
        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
        className={css`
          @media (max-width: ${mobileMaxWidth}) {
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
          }
        `}
      >
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
