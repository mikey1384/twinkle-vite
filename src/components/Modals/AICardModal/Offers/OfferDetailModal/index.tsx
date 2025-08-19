import React, { useEffect, useRef, useState } from 'react';
import NewModal from '~/components/NewModal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import OfferListItem from './OfferListItem';
import RoundList from '~/components/RoundList';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Loading from '~/components/Loading';
import { Color } from '~/constants/css';
import { useAppContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';

export default function OfferDetailModal({
  onHide,
  cardId,
  onUserMenuShownChange,
  onSetActiveTab,
  ownerId,
  price,
  userLinkColor,
  usermenuShown,
  userId
}: {
  onHide: () => void;
  cardId: number;
  onUserMenuShownChange: (v: boolean) => void;
  onSetActiveTab: (v: string) => void;
  ownerId: number;
  price: number;
  userLinkColor: string;
  usermenuShown: boolean;
  userId: number;
}) {
  const isAcceptingRef = useRef(false);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const [offerAcceptModalObj, setOfferAcceptModalObj] = useState<{
    [key: string]: any;
  } | null>(null);
  const [offers, setOffers] = useState<{ [key: string]: number }[]>([]);
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
    <NewModal
      isOpen
      onClose={onHide}
      size="md"
      modalLevel={2}
      closeOnBackdropClick={!usermenuShown}
      header={
        <div>
          <Icon
            style={{ color: Color.brownOrange() }}
            icon={['far', 'badge-dollar']}
          />{' '}
          {addCommasToNumber(price)} Offers
        </div>
      }
      footer={
        <Button transparent onClick={onHide}>
          Close
        </Button>
      }
    >
      <div style={{ width: '100%' }}>
        <RoundList>
          {loading ? (
            <Loading />
          ) : (
            offers.map((offer) => (
              <OfferListItem
                key={offer.id}
                cardId={cardId}
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
            onClick={handleLoadMoreoffers}
          />
        )}
      </div>
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
    </NewModal>
  );

  async function handleConfirmAcceptOffer() {
    if (!isAcceptingRef.current) {
      isAcceptingRef.current = true;
      const coins = await sellAICard({
        offerId: offerAcceptModalObj?.id,
        cardId,
        price: offerAcceptModalObj?.price,
        offererId: offerAcceptModalObj?.userId
      });
      onSetUserState({ userId, newState: { twinkleCoins: coins } });
      setOfferAcceptModalObj(null);
      onSetActiveTab('myMenu');
      onHide();
      isAcceptingRef.current = false;
    }
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
