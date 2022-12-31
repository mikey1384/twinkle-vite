import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import UsernameText from '~/components/Texts/UsernameText';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import OfferDetailModal from './OfferDetailModal';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { isMobile } from '~/helpers';
import { Color, mobileMaxWidth } from '~/constants/css';

const deviceIsMobile = isMobile(navigator);

Offers.propTypes = {
  cardId: PropTypes.number.isRequired,
  onUserMenuShown: PropTypes.func.isRequired,
  loadMoreButtonColor: PropTypes.string
};

export default function Offers({
  cardId,
  onUserMenuShown,
  loadMoreButtonColor
}) {
  const {
    userLink: { color: userLinkColor }
  } = useKeyContext((v) => v.theme);
  const { userId } = useKeyContext((v) => v.myState);
  const [offerDetailModalShown, setOfferDetailModalShown] = useState(false);
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
            <nav
              className={css`
                height: 7rem;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 1.6rem;
                cursor: pointer;
                border-bottom: 1px solid ${Color.borderGray()};
                &:hover {
                  background-color: ${Color.highlightGray()};
                }
                @media (max-width: ${mobileMaxWidth}) {
                  height: 3rem;
                  font-size: 0.8rem;
                }
              `}
              key={offer.price}
              onClick={() => setOfferDetailModalShown(true)}
            >
              <div>
                <Icon
                  style={{ color: Color.brownOrange() }}
                  icon={['far', 'badge-dollar']}
                />
                <span style={{ marginLeft: '0.2rem' }}>
                  <b style={{ color: Color.darkerGray() }}>{offer.price}</b>
                  {deviceIsMobile ? '' : <span> offer </span>} from{' '}
                </span>
                <UsernameText
                  onMenuShownChange={onUserMenuShown}
                  color={Color[userLinkColor]()}
                  displayedName={
                    offerers[0].id === userId ? 'you' : offerers[0].username
                  }
                  user={{
                    username: offerers[0].username,
                    id: offerers[0].id
                  }}
                />
                {offerers.length > 1 ? (
                  <span>
                    {' '}
                    and {offerers.length - 1} other
                    {offerers.length - 1 > 1 ? 's' : ''}
                  </span>
                ) : null}
              </div>
            </nav>
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
      {offerDetailModalShown && (
        <OfferDetailModal onHide={() => setOfferDetailModalShown(false)} />
      )}
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
