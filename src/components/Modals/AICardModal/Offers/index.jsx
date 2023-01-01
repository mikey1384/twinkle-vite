import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import OfferPriceListItem from './OfferPriceListItem';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

Offers.propTypes = {
  cardId: PropTypes.number.isRequired,
  onUserMenuShown: PropTypes.func.isRequired,
  loadMoreButtonColor: PropTypes.string,
  ownerId: PropTypes.number.isRequired,
  usermenuShown: PropTypes.bool
};

export default function Offers({
  cardId,
  onUserMenuShown,
  loadMoreButtonColor,
  ownerId,
  usermenuShown
}) {
  const { userId } = useKeyContext((v) => v.myState);
  const [offers, setOffers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadMoreShown, setLoadMoreShown] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const getOffersForCard = useAppContext(
    (v) => v.requestHelpers.getOffersForCard
  );
  useEffect(() => {
    init();
    async function init() {
      const { offers: loadedOffers, loadMoreShown } = await getOffersForCard({
        cardId
      });
      setOffers(loadedOffers);
      setLoaded(true);
      setLoadMoreShown(loadMoreShown);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="components/Modals/AICardModal/UnlistedMenu/OwnerMenu/Offers">
      <div
        className={css`
          height: 37vh;
          border: 1px solid ${Color.borderGray()};
          @media (max-width: ${mobileMaxWidth}) {
            height: 20vh;
          }
        `}
        style={{
          width: '100%',
          overflow: 'scroll'
        }}
      >
        {loaded && offers.length === 0 && (
          <div
            className={css`
              font-size: 1.6rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.1rem;
              }
            `}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            There is no offer for this card yet
          </div>
        )}
        {offers.map((offer) => {
          let offerers = offer.users;
          const myOffer = offerers.find((offerer) => offerer.id === userId);
          if (myOffer) {
            offerers = [myOffer].concat(
              offerers.filter((offerer) => offerer.id !== userId)
            );
          }
          return (
            <OfferPriceListItem
              key={offer.price}
              cardId={cardId}
              offer={offer}
              offerers={offerers}
              onUserMenuShown={onUserMenuShown}
              ownerId={ownerId}
              userId={userId}
              usermenuShown={usermenuShown}
            />
          );
        })}
        {loadMoreShown && (
          <LoadMoreButton
            filled
            color={loadMoreButtonColor}
            loading={loadingMore}
            onClick={handleLoadMore}
            style={{
              width: '100%',
              borderRadius: 0,
              border: 0
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );

  async function handleLoadMore() {
    setLoadingMore(true);
    const lastId = offers[offers.length - 1].id;
    const { offers: loadedOffers, loadMoreShown } = await getOffersForCard({
      cardId,
      lastId
    });
    setOffers((prevOffers) => [...prevOffers, ...loadedOffers]);
    setLoadMoreShown(loadMoreShown);
  }
}
