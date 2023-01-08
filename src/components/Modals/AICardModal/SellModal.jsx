import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import Icon from '~/components/Icon';
import { useAppContext, useChatContext } from '~/contexts';
import { borderRadius, Color } from '~/constants/css';

SellModal.propTypes = {
  card: PropTypes.object.isRequired,
  offerPrice: PropTypes.number.isRequired,
  offers: PropTypes.array.isRequired,
  offersLoaded: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired
};

export default function SellModal({
  card,
  offerPrice,
  offers,
  offersLoaded,
  onHide
}) {
  const [posting, setPosting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const listAICard = useAppContext((v) => v.requestHelpers.listAICard);
  const onListAICard = useChatContext((v) => v.actions.onListAICard);
  const [amount, setAmount] = useState(0);
  const offerers = useMemo(() => {
    if (!offers || !offers.length) return [];
    return offers[0].users;
  }, [offers]);

  return (
    <Modal modalOverModal onHide={onHide}>
      <header>List for Sale</header>
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
              maxWidth: '25rem',
              fontSize: '1.7rem',
              padding: '0.5rem',
              borderRadius,
              lineHeight: 1.5,
              marginTop: '1rem'
            }}
          />
          {errorMessage && (
            <div
              style={{
                color: Color.red(),
                fontSize: '1.4rem',
                marginTop: '0.5rem'
              }}
            >
              {errorMessage}
            </div>
          )}
          <Button
            filled
            color="oceanBlue"
            onClick={handleCompleteListing}
            loading={posting}
            disabled={!amount || !offersLoaded}
            style={{
              fontSize: '1.4rem',
              marginTop: '2rem'
            }}
          >
            List for Sale
          </Button>
          {offerers.length > 0 && (
            <div
              style={{
                width: '50%',
                fontSize: '1.4rem',
                marginTop: '2rem',
                color: Color.darkerGray()
              }}
            >
              {offerers.length} user{offerers.length === 1 ? '' : 's'} made
              offer for this card at {offerPrice} Twinkle Coins. You can either
              accept their offer or list it for sale at a higher price.
            </div>
          )}
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
    setErrorMessage('');
    const newAmount = Number(amount.replace(/[^0-9]/g, ''));
    setAmount(Math.min(newAmount, 999_999_999));
  }

  async function handleCompleteListing() {
    if (amount < offerPrice + 1) {
      setErrorMessage(`The minimum price is ${offerPrice + 1}`);
      return;
    }
    setPosting(true);
    const success = await listAICard({ cardId: card.id, price: amount });
    if (success) {
      onListAICard({
        card,
        price: amount
      });
      onHide();
    }
  }
}
