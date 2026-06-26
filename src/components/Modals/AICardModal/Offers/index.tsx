import React, { useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import OfferPriceListItem from './OfferPriceListItem';
import HiddenOffersSection from './HiddenOffersSection';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import { useKeyContext } from '~/contexts';
import { getVisibleOfferGroups, getHiddenOfferEntries } from './helpers';
import { css } from '@emotion/css';
import { mobileMaxWidth } from '~/constants/css';

export default function Offers({
  cardId,
  getOffersForCard,
  offers,
  hiddenOfferIds,
  onHideOffer,
  onUnhideOffer,
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
  hiddenOfferIds: number[];
  onHideOffer: (offerId: number) => Promise<void>;
  onUnhideOffer: (offerId: number) => Promise<void>;
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
  const isOwner = ownerId === userId;

  const visibleOffers = useMemo(
    () => getVisibleOfferGroups(offers, isOwner ? hiddenOfferIds : []),
    [isOwner, offers, hiddenOfferIds]
  );
  const hiddenEntries = useMemo(
    () => (isOwner ? getHiddenOfferEntries(offers, hiddenOfferIds) : []),
    [isOwner, offers, hiddenOfferIds]
  );

  return (
    <ErrorBoundary componentPath="components/Modals/AICardModal/UnlistedMenu/OwnerMenu/Offers">
      <div
        className={css`
          height: 37vh;
          border: 1px solid var(--ui-border);
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
          visibleOffers.length === 0 && hiddenEntries.length === 0 ? (
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
                  variant="soft"
                  tone="raised"
                >
                  <span
                    className={css`
                      font-size: 1.6rem;
                      @media (max-width: ${mobileMaxWidth}) {
                        font-size: 1.1rem;
                      }
                    `}
                  >
                    Make offer
                  </span>
                </Button>
              )}
            </div>
          ) : (
            <>
              {visibleOffers.map((offer) => {
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
                    hiddenOfferIds={isOwner ? hiddenOfferIds : []}
                    onHideOffer={onHideOffer}
                    onUnhideOffer={onUnhideOffer}
                    onSetActiveTab={onSetActiveTab}
                    onUserMenuShownChange={onUserMenuShownChange}
                    ownerId={ownerId}
                    userId={userId}
                    usermenuShown={usermenuShown}
                  />
                );
              })}
              {isOwner && hiddenEntries.length > 0 && (
                <HiddenOffersSection
                  hiddenEntries={hiddenEntries}
                  onUnhideOffer={onUnhideOffer}
                  onUserMenuShownChange={onUserMenuShownChange}
                  userId={userId}
                />
              )}
            </>
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
    const lastPrice = offers[offers.length - 1].price;
    const { offers: loadedOffers, loadMoreShown } = await getOffersForCard({
      cardId,
      lastPrice
    });
    onSetOffers((prevOffers: any[]) => [...prevOffers, ...loadedOffers]);
    onSetLoadMoreShown(loadMoreShown);
    setLoadingMore(false);
  }
}
