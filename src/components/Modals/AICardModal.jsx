import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';

AICardModal.propTypes = {
  onHide: PropTypes.func.isRequired
};

export default function AICardModal({ onHide }) {
  return (
    <Modal modalOverModal onHide={onHide}>
      <header>#123</header>
      <main>this is ai card modal</main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
