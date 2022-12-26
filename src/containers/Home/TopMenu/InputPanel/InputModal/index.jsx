import PropTypes from 'prop-types';
import ContentInput from './ContentInput';
import SubjectInput from './SubjectInput';
import ErrorBoundary from '~/components/ErrorBoundary';
import Modal from '~/components/Modal';
import Button from '~/components/Button';

InputModal.propTypes = {
  onHide: PropTypes.func.isRequired
};

export default function InputModal({ onHide }) {
  return (
    <ErrorBoundary componentPath="Home/Stories/InputPanel/InputModal">
      <Modal closeWhenClickedOutside={false} onHide={onHide}>
        <header>Post Something</header>
        <main>
          <div style={{ width: '100%' }}>
            <SubjectInput onModalHide={onHide} />
            <ContentInput onModalHide={onHide} />
          </div>
        </main>
        <footer>
          <Button transparent onClick={onHide}>
            Close
          </Button>
        </footer>
      </Modal>
    </ErrorBoundary>
  );
}
