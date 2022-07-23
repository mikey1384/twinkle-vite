import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';

AlertModal.propTypes = {
  onHide: PropTypes.func.isRequired,
  modalOverModal: PropTypes.bool,
  title: PropTypes.string.isRequired,
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired
};
export default function AlertModal({ onHide, modalOverModal, title, content }) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  return (
    <Modal modalOverModal={modalOverModal} onHide={onHide}>
      <header>{title}</header>
      <main>{content}</main>
      <footer>
        <Button color={doneColor} onClick={onHide}>
          OK
        </Button>
      </footer>
    </Modal>
  );
}
