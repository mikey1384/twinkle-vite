import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { borderRadius, Color } from '~/constants/css';

export default function OfferModal({
  askPrice,
  cardId,
  onHide,
  myId,
  myUsername,
  onSetOffers,
  twinkleCoins
}: {
  askPrice: number;
  cardId: number;
  onHide: () => void;
  myId: number;
  myUsername: string;
  onSetOffers: (arg: any) => void;
  twinkleCoins: number;
}) {
  const [posting, setPosting] = useState(false);
  const [amount, setAmount] = useState(0);
  const postAICardOffer = useAppContext(
    (v) => v.requestHelpers.postAICardOffer
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const askPriceIsLargerThanOne = askPrice > 1;

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
            loading={posting}
            onClick={handlePostOffer}
            disabled={!(amount || myId)}
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

  function handleAmountChange(amount: string) {
    const newAmount = Number(amount.replace(/[^0-9]/g, ''));
    const amounts = [newAmount, twinkleCoins];
    if (askPriceIsLargerThanOne) {
      amounts.push(askPrice - 1);
    }
    setAmount(Math.min(...amounts));
  }

  async function handlePostOffer() {
    setPosting(true);
    const coins = await postAICardOffer({ cardId, price: amount });
    onSetOffers((prevOffers: any[]) => {
      const result = [];
      let found = false;
      for (let offer of prevOffers) {
        const newOffer = { ...offer };
        if (offer.price === amount) {
          found = true;
          newOffer.users = [...offer.users, { id: myId, username: myUsername }];
        }
        result.push(newOffer);
      }
      if (!found) {
        result.unshift({
          price: amount,
          users: [{ id: myId, username: myUsername }]
        });
      }
      return result;
    });
    onSetUserState({ userId: myId, newState: { twinkleCoins: coins } });
    onHide();
  }
}
