import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';

BalanceModal.propTypes = {
  onHide: PropTypes.func.isRequired
};

export default function BalanceModal({ onHide }) {
  return (
    <Modal onHide={onHide}>
      <header>Your Twinkle Coins</header>
      <main>balance goes here</main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
