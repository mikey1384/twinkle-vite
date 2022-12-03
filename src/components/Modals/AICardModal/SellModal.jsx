import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';

SellModal.propTypes = {
  onHide: PropTypes.func.isRequired
};

export default function SellModal({ onHide }) {
  return (
    <Modal large modalOverModal onHide={onHide}>
      <header>header</header>
      <main>sell</main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
