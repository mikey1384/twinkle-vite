import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';

TradeModal.propTypes = {
  onHide: PropTypes.func.isRequired
};

export default function TradeModal({ onHide }) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  return (
    <Modal onHide={onHide}>
      <header>Trade</header>
      <main>
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div>What you want</div>
          <div>What you offer</div>
        </div>
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button color={doneColor} onClick={() => onHide()}>
          Done
        </Button>
      </footer>
    </Modal>
  );
}
