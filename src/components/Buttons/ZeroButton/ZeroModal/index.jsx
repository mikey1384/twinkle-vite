import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Greeting from './Greeting';
import Menu from './Menu';
import { useContentState } from '~/helpers/hooks';
import { useKeyContext } from '~/contexts';

ZeroModal.propTypes = {
  contentId: PropTypes.number,
  contentType: PropTypes.string,
  onHide: PropTypes.func.isRequired,
  modalOverModal: PropTypes.bool
};
export default function ZeroModal({
  contentId,
  contentType,
  onHide,
  modalOverModal
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const { content } = useContentState({ contentId, contentType });

  return (
    <Modal modalOverModal={modalOverModal} onHide={onHide}>
      <header>Zero</header>
      <main>
        <Greeting />
        <Menu />
        <div>{content}</div>
      </main>
      <footer>
        <Button color={doneColor} onClick={onHide}>
          OK
        </Button>
      </footer>
    </Modal>
  );
}
