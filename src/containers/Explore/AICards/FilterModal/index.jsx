import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import OwnerFilter from './OwnerFilter';
import ColorFilter from './ColorFilter';
import QualityFilter from './QualityFilter';
import PriceFilter from './PriceFilter';
import CardIdFilter from './CardIdFilter';
import WordFilter from './WordFilter';

FilterModal.propTypes = {
  onHide: PropTypes.func.isRequired,
  filters: PropTypes.object,
  selectedFilter: PropTypes.string.isRequired
};

export default function FilterModal({ filters, selectedFilter, onHide }) {
  const [dropdownShown, setDropdownShown] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(filters.owner);
  const [selectedColor, setSelectedColor] = useState(filters.color || 'blue');
  const [selectedQuality, setSelectedQuality] = useState(
    filters.quality || 'common'
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
    <Modal large onHide={handleHide}>
      <header>Search Cards</header>
      <main>
        {filterComponents.map((component) => {
          if (component === 'owner') {
            return (
              <OwnerFilter
                selectedOwner={selectedOwner}
                onSelectOwner={(owner) => setSelectedOwner(owner)}
                key={component}
              />
            );
          }
          if (component === 'color') {
            return (
              <ColorFilter
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
                selectedQuality={selectedQuality}
                onDropdownShown={setDropdownShown}
                onSelectQuality={setSelectedQuality}
                key={component}
              />
            );
          }
          if (component === 'price') {
            return <PriceFilter key={component} />;
          }
          if (component === 'cardId') {
            return <CardIdFilter key={component} />;
          }
          if (component === 'word') {
            return <WordFilter key={component} />;
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
