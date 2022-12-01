import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';

AICardModal.propTypes = {
  card: PropTypes.object.isRequired,
  onHide: PropTypes.func.isRequired
};

export default function AICardModal({ card, onHide }) {
  return (
    <Modal modalOverModal onHide={onHide}>
      <header>#{card.id}</header>
      <main>this is ai card modal</main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
