import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';

CategoryModal.propTypes = {
  category: PropTypes.string,
  onHide: PropTypes.func
};

export default function CategoryModal({ category, onHide }) {
  return (
    <Modal onHide={onHide}>
      <header>
        <span style={{ textTransform: 'capitalize' }}>{category}</span>
      </header>
      <main>
        <p>Modal content</p>
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
