import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';

FilterModal.propTypes = {
  onHide: PropTypes.func.isRequired,
  selectedFilter: PropTypes.string.isRequired
};

export default function FilterModal({ selectedFilter, onHide }) {
  return (
    <Modal large onHide={onHide}>
      <header>header goes here</header>
      <main>{selectedFilter}</main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
