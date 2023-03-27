import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';

SuccessModal.propTypes = {
  onHide: PropTypes.func.isRequired,
  numQuestions: PropTypes.number.isRequired
};

export default function SuccessModal({ onHide, numQuestions }) {
  return (
    <Modal closeWhenClickedOutside={false} onHide={onHide}>
      <header>Reading Cleared</header>
      <main>
        <div>
          You answered {numQuestions} out of {numQuestions} questions correctly!
        </div>
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          close
        </Button>
      </footer>
    </Modal>
  );
}
