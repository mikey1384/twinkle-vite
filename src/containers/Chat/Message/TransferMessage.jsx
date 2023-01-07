import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Color } from '~/constants/css';
import UsernameText from '~/components/Texts/UsernameText';
import { addCommasToNumber } from '~/helpers/stringHelpers';

TransferMessage.propTypes = {
  myId: PropTypes.number.isRequired,
  myUsername: PropTypes.string.isRequired,
  partner: PropTypes.shape({
    id: PropTypes.number.isRequired,
    username: PropTypes.string.isRequired
  }).isRequired,
  transferDetails: PropTypes.object.isRequired
};

export default function TransferMessage({
  myId,
  myUsername,
  partner,
  transferDetails
}) {
  const [usermenuShown, setUsermenuShown] = useState(false);
  const isPurchase = useMemo(() => !!transferDetails?.askId, [transferDetails]);
  const isSale = useMemo(() => !!transferDetails?.offerId, [transferDetails]);
  const isTransaction = useMemo(
    () => isPurchase || isSale,
    [isPurchase, isSale]
  );
  const card = useMemo(() => {
    return transferDetails.card;
  }, [transferDetails]);
  const price = useMemo(() => {
    if (!isTransaction) {
      return 0;
    }
    return isPurchase
      ? transferDetails?.ask?.price
      : transferDetails?.offer?.price;
  }, [
    isPurchase,
    isTransaction,
    transferDetails?.ask?.price,
    transferDetails?.offer?.price
  ]);
  const actionDescription = useMemo(() => {
    const buyer =
      transferDetails.to === myId
        ? { id: myId, username: myUsername }
        : partner;
    const seller =
      transferDetails.from === myId
        ? { id: myId, username: myUsername }
        : partner;
    if (isPurchase) {
      return (
        <div>
          <UsernameText
            color={Color.black()}
            user={{
              id: buyer.id,
              username: buyer.username
            }}
          />{' '}
          bought{' '}
          <b
            style={{
              color: Color.black()
            }}
          >
            Card #{card.id}
          </b>{' '}
          for{' '}
          <b
            style={{
              color: Color.black()
            }}
          >
            {addCommasToNumber(price)}
          </b>{' '}
          Twinkle {price === 1 ? 'Coin' : 'Coins'} from{' '}
          <UsernameText
            color={Color.black()}
            user={{
              id: seller.id,
              username: seller.username
            }}
          />
        </div>
      );
    }
    if (isSale) {
      return (
        <div>
          <UsernameText
            onMenuShownChange={setUsermenuShown}
            color={Color.black()}
            user={{
              id: seller.id,
              username: seller.username
            }}
          />{' '}
          sold{' '}
          <b
            style={{
              color: Color.black()
            }}
          >
            Card #{card.id}
          </b>{' '}
          to{' '}
          <UsernameText
            onMenuShownChange={setUsermenuShown}
            color={Color.black()}
            user={{
              id: buyer.id,
              username: buyer.username
            }}
          />{' '}
          for{' '}
          <b
            style={{
              color: Color.black()
            }}
          >
            {addCommasToNumber(price)}
          </b>{' '}
          Twinkle {price === 1 ? 'Coin' : 'Coins'}
        </div>
      );
    }
    return '';
  }, [
    card.id,
    isPurchase,
    isSale,
    myId,
    myUsername,
    partner,
    price,
    transferDetails.from,
    transferDetails.to
  ]);

  return (
    <div onClick={() => console.log(usermenuShown)}>
      <div>{actionDescription}</div>
    </div>
  );
}
