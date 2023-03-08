import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import OwnerFilter from './OwnerFilter';
import ColorFilter from './ColorFilter';
import QualityFilter from './QualityFilter';
import WordFilter from './WordFilter';
import { useKeyContext } from '~/contexts';

FilterModal.propTypes = {
  onHide: PropTypes.func.isRequired,
  filters: PropTypes.object,
  selectedFilter: PropTypes.string.isRequired,
  onApply: PropTypes.func.isRequired
};

export default function FilterModal({
  filters,
  selectedFilter,
  onHide,
  onApply
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [dropdownShown, setDropdownShown] = useState(false);
  const [selectedWord, setSelectedWord] = useState(filters.word || '');
  const [selectedOwner, setSelectedOwner] = useState(filters.owner);
  const [selectedColor, setSelectedColor] = useState(filters.color || 'any');
  const [selectedQuality, setSelectedQuality] = useState(
    filters.quality || 'any'
  );
  const filterComponents = useMemo(() => {
    const defaultFilters = [
      'owner',
      'color',
      'quality',
      'price',
      'cardId',
      'word'
    ];
    const result = [selectedFilter].concat(
      defaultFilters.filter((f) => f !== selectedFilter)
    );
    return result;
  }, [selectedFilter]);

  return (
    <Modal modalStyle={{ marginTop: 'CALC(50vh - 25rem)' }} onHide={handleHide}>
      <header>Search Cards</header>
      <main>
        {filterComponents.map((component, index) => {
          const style =
            index < filterComponents.length - 1 ? { marginBottom: '2rem' } : {};
          if (component === 'owner') {
            return (
              <OwnerFilter
                style={style}
                selectedFilter={selectedFilter}
                selectedOwner={selectedOwner}
                onSelectOwner={setSelectedOwner}
                key={component}
              />
            );
          }
          if (component === 'color') {
            return (
              <ColorFilter
                style={style}
                selectedColor={selectedColor}
                onDropdownShown={setDropdownShown}
                onSelectColor={setSelectedColor}
                selectedFilter={selectedFilter}
                key={component}
              />
            );
          }
          if (component === 'quality') {
            return (
              <QualityFilter
                style={style}
                selectedQuality={selectedQuality}
                onDropdownShown={setDropdownShown}
                onSelectQuality={setSelectedQuality}
                selectedFilter={selectedFilter}
                key={component}
              />
            );
          }
          if (component === 'word') {
            return (
              <WordFilter
                style={style}
                selectedFilter={selectedFilter}
                selectedWord={selectedWord}
                onSelectWord={setSelectedWord}
                key={component}
              />
            );
          }
          return null;
        })}
      </main>
      <footer>
        <Button
          style={{ marginRight: '0.7rem' }}
          transparent
          onClick={handleHide}
        >
          Close
        </Button>
        <Button color={doneColor} onClick={handleApply}>
          Apply
        </Button>
      </footer>
    </Modal>
  );

  function handleApply() {
    const obj = {};
    if (selectedOwner) {
      obj.owner = selectedOwner;
    }
    if (selectedColor !== 'any') {
      obj.color = selectedColor;
    }
    if (selectedQuality !== 'any') {
      obj.quality = selectedQuality;
    }
    let queryString =
      Object.keys(obj).length > 0
        ? `/ai-cards/?${Object.entries(obj)
            .map(([key, value]) => `search[${key}]=${value}`)
            .join('&')}`
        : '/ai-cards';
    onApply(queryString);
  }

  function handleHide() {
    if (!dropdownShown) onHide();
  }
}
