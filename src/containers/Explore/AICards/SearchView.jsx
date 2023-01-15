import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Loading from '~/components/Loading';
import AICard from '~/components/AICard';
import { useAppContext, useExploreContext } from '~/contexts';

SearchView.propTypes = {
  cardObj: PropTypes.object.isRequired,
  filters: PropTypes.object.isRequired,
  navigate: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired
};

export default function SearchView({ cardObj, filters, navigate, search }) {
  const loadedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const loadFilteredAICards = useAppContext(
    (v) => v.requestHelpers.loadFilteredAICards
  );
  const filteredLoaded = useExploreContext(
    (v) => v.state.aiCards.filteredLoaded
  );
  const filteredCards = useExploreContext((v) => v.state.aiCards.filteredCards);
  const onLoadFilteredAICards = useExploreContext(
    (v) => v.actions.onLoadFilteredAICards
  );

  useEffect(() => {
    init();
    async function init() {
      if (!filteredLoaded || loadedRef.current) {
        setLoading(true);
      }
      const { cards, loadMoreShown } = await loadFilteredAICards({ filters });
      onLoadFilteredAICards({ cards, loadMoreShown });
      setLoading(false);
      loadedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.owner, filters?.quality, filters?.color]);

  return (
    <div
      style={{
        marginTop: '3rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}
    >
      {loading || !filteredLoaded ? (
        <Loading />
      ) : (
        filteredCards.map((card) => (
          <div key={card.id} style={{ margin: '1rem' }}>
            <AICard
              card={cardObj[card.id] ? cardObj[card.id] : card}
              onClick={() => {
                const searchParams = new URLSearchParams(search);
                searchParams.append('cardId', card.id);
                const decodedURL = decodeURIComponent(searchParams.toString());
                navigate(`./?${decodedURL}`);
              }}
              detailShown
            />
          </div>
        ))
      )}
    </div>
  );
}
