import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';

TradeModal.propTypes = {
  onHide: PropTypes.func.isRequired
};

export default function TradeModal({ onHide }) {
  return (
    <Modal onHide={onHide}>
      <header>Trade</header>
      <main>main</main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button onClick={() => onHide()}>Done</Button>
      </footer>
    </Modal>
  );
}
