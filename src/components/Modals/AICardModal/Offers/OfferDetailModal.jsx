import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';

OfferDetailModal.propTypes = {
  onHide: PropTypes.func.isRequired
};

export default function OfferDetailModal({ onHide }) {
  return (
    <Modal large modalOverModal onHide={onHide}>
      <header>Make an Offer</header>
      <main>
        <div
          style={{
            height: '30rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}
        >
          <Button
            filled
            color="oceanBlue"
            onClick={() => console.log('clicked')}
            style={{
              fontSize: '1.4rem',
              marginTop: '2rem'
            }}
          >
            Accept
          </Button>
        </div>
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
    </Modal>
  );
}
