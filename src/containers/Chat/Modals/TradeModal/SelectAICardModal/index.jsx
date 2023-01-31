import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';

SelectAICardModal.propTypes = {
  aiCardModalType: PropTypes.string.isRequired,
  onHide: PropTypes.func.isRequired
};

export default function SelectAICardModal({ aiCardModalType, onHide }) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  return (
    <Modal modalOverModal onHide={onHide}>
      <header>Trade</header>
      <main>{aiCardModalType}</main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button disabled={true} color={doneColor} onClick={() => onHide()}>
          Propose
        </Button>
      </footer>
    </Modal>
  );
}
