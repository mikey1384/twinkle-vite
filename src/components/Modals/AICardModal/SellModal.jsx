import { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import Icon from '~/components/Icon';
import { useAppContext, useChatContext } from '~/contexts';
import { borderRadius, Color } from '~/constants/css';

SellModal.propTypes = {
  card: PropTypes.object.isRequired,
  onHide: PropTypes.func.isRequired
};

export default function SellModal({ card, onHide }) {
  const listAICard = useAppContext((v) => v.requestHelpers.listAICard);
  const onListAICard = useChatContext((v) => v.actions.onListAICard);
  const [amount, setAmount] = useState(0);

  return (
    <Modal large modalOverModal onHide={onHide}>
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
            Set the price (
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
            onClick={handleCompleteListing}
            disabled={!amount}
            style={{
              fontSize: '1.4rem',
              marginTop: '2rem'
            }}
          >
            List for Sale
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
    setAmount(newAmount);
  }

  async function handleCompleteListing() {
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
