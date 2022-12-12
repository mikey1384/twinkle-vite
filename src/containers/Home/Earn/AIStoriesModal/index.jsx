import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';

AIStoriesModal.propTypes = {
  onHide: PropTypes.func.isRequired
};

export default function AIStoriesModal({ onHide }) {
  return (
    <Modal large closeWhenClickedOutside={false} onHide={onHide}>
      <header style={{ height: '3rem', padding: 0 }}>AI Stories</header>
      <main>main goes here</main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
