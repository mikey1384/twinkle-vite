import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import OfferListItem from './OfferListItem';
import RoundList from '~/components/RoundList';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import { Color } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';

OfferDetailModal.propTypes = {
  cardId: PropTypes.number.isRequired,
  onHide: PropTypes.func.isRequired,
  ownerId: PropTypes.number.isRequired,
  price: PropTypes.number.isRequired,
  onUserMenuShownChange: PropTypes.func.isRequired,
  userLinkColor: PropTypes.string.isRequired,
  usermenuShown: PropTypes.bool,
  userId: PropTypes.number
};

export default function OfferDetailModal({
  onHide,
  cardId,
  onUserMenuShownChange,
  ownerId,
  price,
  userLinkColor,
  usermenuShown,
  userId
}) {
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useKeyContext((v) => v.theme);
  const [offerAcceptModalObj, setOfferAcceptModalObj] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreShown, setLoadMoreShown] = useState(false);
  const getOffersForCardByPrice = useAppContext(
    (v) => v.requestHelpers.getOffersForCardByPrice
  );
  const sellAICard = useAppContext((v) => v.requestHelpers.sellAICard);
  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      const { offers, loadMoreShown } = await getOffersForCardByPrice({
        cardId,
        price
      });
      setOffers(offers);
      setLoadMoreShown(loadMoreShown);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal
      modalOverModal
      closeWhenClickedOutside={!usermenuShown}
      onHide={onHide}
    >
      <header>
        <div>
          <Icon
            style={{ color: Color.brownOrange() }}
            icon={['far', 'badge-dollar']}
          />{' '}
          {addCommasToNumber(price)} Offers
        </div>
      </header>
      <main>
        <RoundList>
          {loading ? (
            <Loading />
          ) : (
            offers.map((offer) => (
              <OfferListItem
                key={offer.id}
                ownerId={ownerId}
                offer={offer}
                onAcceptClick={(offer) => setOfferAcceptModalObj(offer)}
                userLinkColor={userLinkColor}
                onUserMenuShownChange={onUserMenuShownChange}
                userId={userId}
              />
            ))
          )}
        </RoundList>
        {!loading && loadMoreShown && (
          <LoadMoreButton
            style={{ marginTop: '1rem' }}
            loading={loadingMore}
            filled
            color={loadMoreButtonColor}
            onClick={handleLoadMoreoffers}
          />
        )}
      </main>
      <footer>
        <Button transparent onClick={onHide}>
          Close
        </Button>
      </footer>
      {!!offerAcceptModalObj && (
        <ConfirmModal
          modalOverModal
          onHide={() => setOfferAcceptModalObj(null)}
          title={<div>Accept offer for card #{cardId}</div>}
          description={
            <div>
              Accept{' '}
              <Icon
                style={{ color: Color.brownOrange() }}
                icon={['far', 'badge-dollar']}
              />
              <b style={{ color: Color.darkerGray(), marginLeft: '2px' }}>
                {addCommasToNumber(price)}
              </b>{' '}
              offer for <b>Card #{cardId}</b> from{' '}
              <b>{offerAcceptModalObj.username}</b>?
            </div>
          }
          descriptionFontSize="1.7rem"
          onConfirm={handleConfirmAcceptOffer}
        />
      )}
    </Modal>
  );

  async function handleConfirmAcceptOffer() {
    const coins = await sellAICard({
      offerId: offerAcceptModalObj.id,
      cardId,
      price: offerAcceptModalObj.price,
      offererId: offerAcceptModalObj.userId
    });
    console.log(coins);
    setOfferAcceptModalObj(null);
    onHide();
  }

  async function handleLoadMoreoffers() {
    setLoadingMore(true);
    const { offers: loadedOffers, loadMoreShown } =
      await getOffersForCardByPrice({
        cardId,
        price,
        lastTimeStamp: offers[offers.length - 1].timeStamp
      });
    setOffers((v) => [...v, ...loadedOffers]);
    setLoadMoreShown(loadMoreShown);
    setLoadingMore(false);
  }
}
