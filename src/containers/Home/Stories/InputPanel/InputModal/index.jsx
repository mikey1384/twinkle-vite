import PropTypes from 'prop-types';
import ContentInput from './ContentInput';
import SubjectInput from './SubjectInput';
import ErrorBoundary from '~/components/ErrorBoundary';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';

InputModal.propTypes = {
  onHide: PropTypes.func.isRequired
};

export default function InputModal({ onHide }) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);

  return (
    <ErrorBoundary componentPath="Home/Stories/InputPanel/InputModal">
      <Modal onHide={onHide}>
        <SubjectInput />
        <ContentInput />
        <footer>
          <Button color={doneColor} onClick={onHide}>
            OK
          </Button>
        </footer>
      </Modal>
    </ErrorBoundary>
  );
}
