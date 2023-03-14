import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Greeting from './Greeting';
import Menu from './Menu';
import { useKeyContext } from '~/contexts';

ZeroModal.propTypes = {
  onHide: PropTypes.func.isRequired,
  modalOverModal: PropTypes.bool
};
export default function ZeroModal({ onHide, modalOverModal }) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  return (
    <Modal modalOverModal={modalOverModal} onHide={onHide}>
      <header>Zero</header>
      <main>
        <Greeting />
        <Menu />
      </main>
      <footer>
        <Button color={doneColor} onClick={onHide}>
          OK
        </Button>
      </footer>
    </Modal>
  );
}
