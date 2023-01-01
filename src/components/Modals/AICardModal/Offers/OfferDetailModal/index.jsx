import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import OfferListItem from './OfferListItem';
import RoundList from '~/components/RoundList';
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
  onUserMenuShown: PropTypes.func.isRequired,
  userLinkColor: PropTypes.string.isRequired,
  usermenuShown: PropTypes.bool,
  userId: PropTypes.number.isRequired
};

export default function OfferDetailModal({
  onHide,
  cardId,
  onUserMenuShown,
  ownerId,
  price,
  userLinkColor,
  usermenuShown,
  userId
}) {
  const {
    loadMoreButton: { color: loadMoreButtonColor }
  } = useKeyContext((v) => v.theme);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreShown, setLoadMoreShown] = useState(false);
  const getOffersForCardByPrice = useAppContext(
    (v) => v.requestHelpers.getOffersForCardByPrice
  );
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
      medium
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
                userLinkColor={userLinkColor}
                onUserMenuShown={onUserMenuShown}
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
    </Modal>
  );

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
