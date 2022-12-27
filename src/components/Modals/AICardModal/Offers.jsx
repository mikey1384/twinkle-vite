import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import UsernameText from '~/components/Texts/UsernameText';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { useAppContext, useKeyContext } from '~/contexts';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

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
  const [offers, setOffers] = useState([]);
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
      setLoadMoreShown(loadMoreShown);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="components/Modals/AICardModal/UnlistedMenu/OwnerMenu/Offers">
      <div>
        {offers.map((offer) => {
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
                  font-size: 1.1rem;
                }
              `}
              key={offer.price}
            >
              <Icon
                style={{ color: Color.brownOrange() }}
                icon={['far', 'badge-dollar']}
              />
              <span style={{ marginLeft: '0.2rem' }}>
                <b style={{ color: Color.darkerGray() }}>{offer.price}</b> offer
                from
              </span>
              <UsernameText
                onMenuShownChange={onUserMenuShown}
                style={{ marginLeft: '0.5rem' }}
                color={Color[userLinkColor]()}
                user={{
                  username: offer.users[0].username,
                  id: offer.users[0].id
                }}
              />
              {offer.users.length > 1 ? (
                <span style={{ marginLeft: '0.5rem' }}>
                  and {offer.users.length - 1} others
                </span>
              ) : null}
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
