import React from 'react';
import ColorFilter from './ColorFilter';
import QualityFilter from './QualityFilter';
import WordFilter from './WordFilter';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

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
        width: 50%;
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
          width: '100%'
        }}
      >
        <ColorFilter
          selectedColor={filters.color}
          onSelectColor={handleSelectColor}
          onDropdownShown={onDropdownShown}
        />
        <WordFilter
          selectedWord={filters.word}
          onSelectWord={handleSelectWord}
        />
        <QualityFilter
          selectedQuality={filters.quality}
          onSelectQuality={handleSelectQuality}
          onDropdownShown={onDropdownShown}
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

  function handleSelectWord(word: string) {
    onSetFilters((prevFilters: any) => ({
      ...prevFilters,
      word
    }));
  }
}
