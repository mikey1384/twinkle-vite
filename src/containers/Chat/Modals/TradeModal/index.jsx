import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';
import MyWant from './MyWant';
import MyOffer from './MyOffer';

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
          <MyWant />
          <MyOffer style={{ marginTop: '1rem' }} />
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
