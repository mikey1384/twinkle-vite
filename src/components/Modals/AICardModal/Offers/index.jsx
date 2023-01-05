import { useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import OfferPriceListItem from './OfferPriceListItem';
import Button from '~/components/Button';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

Offers.propTypes = {
  cardId: PropTypes.number.isRequired,
  getOffersForCard: PropTypes.func.isRequired,
  offers: PropTypes.array.isRequired,
  onUserMenuShown: PropTypes.func.isRequired,
  onSetOffers: PropTypes.func.isRequired,
  onSetLoadMoreShown: PropTypes.func.isRequired,
  loaded: PropTypes.bool.isRequired,
  loadMoreShown: PropTypes.bool.isRequired,
  loadMoreButtonColor: PropTypes.string,
  onSetOfferModalShown: PropTypes.func.isRequired,
  ownerId: PropTypes.number.isRequired,
  usermenuShown: PropTypes.bool
};

export default function Offers({
  cardId,
  getOffersForCard,
  offers,
  onSetOffers,
  onSetLoadMoreShown,
  onUserMenuShown,
  loaded,
  loadMoreShown,
  loadMoreButtonColor,
  onSetOfferModalShown,
  ownerId,
  usermenuShown
}) {
  const { userId } = useKeyContext((v) => v.myState);
  const [loadingMore, setLoadingMore] = useState(false);

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
              padding: '0 0.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            There is no offer for this card, yet
            <Button
              style={{ marginTop: '2rem' }}
              className={css`
                @media (max-width: ${mobileMaxWidth}) {
                  padding: 0.7rem !important;
                }
              `}
              onClick={() => onSetOfferModalShown(true)}
              color="green"
              filled
            >
              <span
                className={css`
                  font-size: 1.6rem;
                  @media (max-width: ${mobileMaxWidth}) {
                    font-size: 1rem;
                  }
                `}
              >
                Make offer
              </span>
            </Button>
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
    onSetOffers((prevOffers) => [...prevOffers, ...loadedOffers]);
    onSetLoadMoreShown(loadMoreShown);
  }
}
