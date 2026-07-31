import React, { useState } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import Icon from '~/components/Icon';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';
import { borderRadius, Color } from '~/constants/css';

export default function OfferModal({
  askPrice,
  cardId,
  onHide,
  myId,
  onSetOffers,
  twinkleCoins
}: {
  askPrice: number;
  cardId: number;
  onHide: () => void;
  myId: number;
  onSetOffers: (arg: any) => void;
  twinkleCoins: number;
}) {
  const [posting, setPosting] = useState(false);
  const [amount, setAmount] = useState(0);
  const postAICardOffer = useAppContext(
    (v) => v.requestHelpers.postAICardOffer
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const onUpdateAICard = useChatContext((v) => v.actions.onUpdateAICard);
  const banned = useKeyContext((v) => v.myState.banned);
  const askPriceIsLargerThanOne = askPrice > 1;

  return (
    <Modal
      modalKey="OfferModal"
      isOpen
      size="xl"
      onClose={onHide}
      modalLevel={2}
      hasHeader={false}
      bodyPadding={0}
    >
      <LegacyModalLayout>
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
                icon="coins"
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
              variant="solid"
              color="oceanBlue"
              loading={posting}
              onClick={handlePostOffer}
              disabled={!amount || !myId || !!banned?.aiCards}
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
          <Button variant="ghost" onClick={onHide}>
            Close
          </Button>
        </footer>
      </LegacyModalLayout>
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
    const result = await postAICardOffer({ cardId, price: amount });
    const confirmedOffer = result.offer;
    const confirmedOfferer = {
      ...confirmedOffer.user,
      offerId: confirmedOffer.id
    };
    onSetOffers((prevOffers: any[]) => {
      const nextOffers = [];
      let found = false;
      for (const offer of prevOffers) {
        const newOffer = { ...offer };
        if (offer.price === confirmedOffer.price) {
          found = true;
          newOffer.users = offer.users.some(
            (offerer: { offerId?: number }) =>
              offerer.offerId === confirmedOffer.id
          )
            ? offer.users
            : [...offer.users, confirmedOfferer];
        }
        nextOffers.push(newOffer);
      }
      if (!found) {
        nextOffers.unshift({
          price: confirmedOffer.price,
          users: [confirmedOfferer]
        });
      }
      return nextOffers;
    });
    onSetUserState({
      userId: myId,
      newState: { twinkleCoins: result.coins }
    });
    onUpdateAICard({ cardId, newState: result.card });
    onHide();
  }
}
