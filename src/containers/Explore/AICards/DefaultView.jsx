import PropTypes from 'prop-types';
import AICard from '~/components/AICard';
import Loading from '~/components/Loading';

DefaultView.propTypes = {
  cards: PropTypes.object.isRequired,
  cardObj: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
  navigate: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired
};

export default function DefaultView({
  cards,
  cardObj,
  loading,
  navigate,
  search
}) {
  return (
    <div
      style={{
        marginTop: '3rem',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}
    >
      {loading ? (
        <Loading />
      ) : (
        cards.map((card) => (
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
