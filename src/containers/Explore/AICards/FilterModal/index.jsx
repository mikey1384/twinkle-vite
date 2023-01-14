import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import OwnerFilter from './OwnerFilter';
import ColorFilter from './ColorFilter';
import QualityFilter from './QualityFilter';

FilterModal.propTypes = {
  onHide: PropTypes.func.isRequired,
  filters: PropTypes.object,
  selectedFilter: PropTypes.string.isRequired
};

export default function FilterModal({ filters, selectedFilter, onHide }) {
  const [dropdownShown, setDropdownShown] = useState(false);
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
                selectedOwner={selectedOwner}
                onSelectOwner={(owner) => setSelectedOwner(owner)}
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
                key={component}
              />
            );
          }
          return null;
        })}
      </main>
      <footer>
        <Button transparent onClick={handleHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );

  function handleHide() {
    if (!dropdownShown) onHide();
  }
}
