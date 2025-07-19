import React, { useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import OfferPriceListItem from './OfferPriceListItem';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import { useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

export default function Offers({
  cardId,
  getOffersForCard,
  offers,
  onSetOffers,
  onSetLoadMoreShown,
  onUserMenuShownChange,
  loaded,
  loadMoreShown,
  onSetActiveTab,
  onSetOfferModalShown,
  ownerId,
  usermenuShown
}: {
  cardId: number;
  getOffersForCard: any;
  offers: any[];
  onSetOffers: (v: any) => void;
  onSetLoadMoreShown: (v: boolean) => void;
  onUserMenuShownChange: (v: boolean) => void;
  loaded: boolean;
  loadMoreShown: boolean;
  onSetActiveTab: (v: string) => void;
  onSetOfferModalShown: (v: boolean) => void;
  ownerId: number;
  usermenuShown: boolean;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
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
        {loaded ? (
          offers.length === 0 ? (
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
              {ownerId !== userId && (
                <Button
                  style={{ marginTop: '2rem' }}
                  className={css`
                    @media (max-width: ${mobileMaxWidth}) {
                      padding: 0.7rem !important;
                    }
                  `}
                  onClick={() => onSetOfferModalShown(true)}
                  color="green"
                  disabled={!userId}
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
              )}
            </div>
          ) : (
            offers.map((offer) => {
              let offerers = offer.users;
              const myOffer = offerers.find(
                (offerer: { id: number }) => offerer.id === userId
              );
              if (myOffer) {
                offerers = [myOffer].concat(
                  offerers.filter(
                    (offerer: { id: number }) => offerer.id !== userId
                  )
                );
              }
              return (
                <OfferPriceListItem
                  key={offer.price}
                  cardId={cardId}
                  offer={offer}
                  offerers={offerers}
                  onSetActiveTab={onSetActiveTab}
                  onUserMenuShownChange={onUserMenuShownChange}
                  ownerId={ownerId}
                  userId={userId}
                  usermenuShown={usermenuShown}
                />
              );
            })
          )
        ) : (
          <Loading style={{ height: 'CALC(100% - 3rem)' }} />
        )}
        {loadMoreShown && (
          <LoadMoreButton
            filled
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
    onSetOffers((prevOffers: any[]) => [...prevOffers, ...loadedOffers]);
    onSetLoadMoreShown(loadMoreShown);
  }
}
