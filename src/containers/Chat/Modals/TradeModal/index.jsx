import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';
import { borderRadius, Color } from '~/constants/css';

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
          <div
            style={{
              width: '100%',
              padding: '1rem',
              border: `1px solid ${Color.borderGray()}`,
              borderRadius
            }}
          >
            What you want
          </div>
          <div
            style={{
              marginTop: '1rem',
              width: '100%',
              padding: '1rem',
              border: `1px solid ${Color.borderGray()}`,
              borderRadius
            }}
          >
            What you offer
          </div>
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
