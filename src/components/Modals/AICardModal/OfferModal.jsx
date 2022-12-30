import { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { borderRadius, Color } from '~/constants/css';

OfferModal.propTypes = {
  cardId: PropTypes.number.isRequired,
  onHide: PropTypes.func.isRequired,
  twinkleCoins: PropTypes.number.isRequired
};

export default function OfferModal({ cardId, onHide, twinkleCoins }) {
  const [amount, setAmount] = useState(0);
  const postAICardOffer = useAppContext(
    (v) => v.requestHelpers.postAICardOffer
  );

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
          <div
            style={{
              fontSize: '1.7rem',
              fontWeight: 'bold',
              color: Color.darkerGray(),
              display: 'flex',
              alignItems: 'center'
            }}
          >
            Set price (
            <Icon
              style={{ color: Color.brownOrange() }}
              icon={['far', 'badge-dollar']}
            />
            )
          </div>
          <Input
            onChange={handleAmountChange}
            placeholder="Amount"
            value={amount}
            style={{
              fontSize: '1.7rem',
              padding: '0.5rem',
              borderRadius,
              lineHeight: 1.5,
              marginTop: '1rem'
            }}
          />
          <Button
            filled
            color="oceanBlue"
            onClick={handlePostOffer}
            disabled={!amount}
            style={{
              fontSize: '1.4rem',
              marginTop: '2rem'
            }}
          >
            Make Offer
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

  function handleAmountChange(amount) {
    const newAmount = Number(
      amount.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
    );
    setAmount(Math.min(Number(newAmount), twinkleCoins));
  }

  async function handlePostOffer() {
    await postAICardOffer({ cardId, price: amount });
    onHide();
  }
}
