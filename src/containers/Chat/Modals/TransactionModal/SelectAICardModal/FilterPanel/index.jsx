import PropTypes from 'prop-types';
import ColorFilter from './ColorFilter';
import QualityFilter from './QualityFilter';
import WordFilter from './WordFilter';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

FilterPanel.propTypes = {
  filters: PropTypes.object.isRequired,
  onDropdownShown: PropTypes.func.isRequired,
  onSetFilters: PropTypes.func.isRequired
};

export default function FilterPanel({
  filters,
  onDropdownShown,
  onSetFilters
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

  function handleSelectColor(color) {
    onSetFilters((prevFilters) => ({
      ...prevFilters,
      color
    }));
  }

  function handleSelectQuality(quality) {
    onSetFilters((prevFilters) => ({
      ...prevFilters,
      quality
    }));
  }

  function handleSelectWord(word) {
    onSetFilters((prevFilters) => ({
      ...prevFilters,
      word
    }));
  }
}
