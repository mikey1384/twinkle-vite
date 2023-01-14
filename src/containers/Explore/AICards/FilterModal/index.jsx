import { useMemo } from 'react';
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
    <Modal large onHide={onHide}>
      <header>Search Cards</header>
      <main>
        {filterComponents.map((component) => {
          if (component === 'owner') {
            return (
              <OwnerFilter selectedOwner={filters.owner} key={component} />
            );
          }
          if (component === 'color') {
            return <ColorFilter key={component} />;
          }
          if (component === 'quality') {
            return <QualityFilter key={component} />;
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
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
