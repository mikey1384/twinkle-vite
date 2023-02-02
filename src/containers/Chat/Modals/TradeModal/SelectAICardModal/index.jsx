import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import CardItem from './CardItem';
import Loading from '~/components/Loading';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { useAppContext, useKeyContext } from '~/contexts';

SelectAICardModal.propTypes = {
  aiCardModalType: PropTypes.string.isRequired,
  onHide: PropTypes.func,
  onSetAICardModalCardId: PropTypes.func.isRequired,
  partnerName: PropTypes.string.isRequired
};

export default function SelectAICardModal({
  aiCardModalType,
  onHide,
  onSetAICardModalCardId,
  partnerName
}) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [loadMoreShown, setLoadMoreShown] = useState(false);
  const { username } = useKeyContext((v) => v.myState);
  const {
    done: { color: doneColor },
    success: { color: successColor }
  } = useKeyContext((v) => v.theme);
  const loadFilteredAICards = useAppContext(
    (v) => v.requestHelpers.loadFilteredAICards
  );

  useEffect(() => {
    init();
    async function init() {
      setLoading(true);
      try {
        const { cards, loadMoreShown } = await loadFilteredAICards({
          filters: {
            owner: aiCardModalType === 'want' ? partnerName : username
          }
        });
        setCards(cards);
        setLoadMoreShown(loadMoreShown);
        setLoading(false);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headerLabel = useMemo(() => {
    if (aiCardModalType === 'want') {
      return `${partnerName}'s AI Cards`;
    }
    if (aiCardModalType === 'offer') {
      return `My AI Cards`;
    }
  }, [aiCardModalType, partnerName]);

  return (
    <Modal large modalOverModal onHide={onHide}>
      <header>{headerLabel}</header>
      <main>
        <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%' }}>
          {loading ? (
            <Loading />
          ) : (
            cards.map((card) => (
              <CardItem
                key={card.id}
                card={card}
                selected={selectedCardIds.includes(card.id)}
                onSelect={() =>
                  setSelectedCardIds((prevIds) => [...prevIds, card.id])
                }
                onDeselect={() =>
                  setSelectedCardIds((prevIds) =>
                    prevIds.filter((id) => id !== card.id)
                  )
                }
                successColor={successColor}
                onSetAICardModalCardId={onSetAICardModalCardId}
              />
            ))
          )}
          {loadMoreShown && (
            <LoadMoreButton
              style={{ marginTop: '1.5em' }}
              loading={loadingMore}
              filled
              onClick={() => setLoadingMore(true)}
            />
          )}
        </div>
      </main>
      <footer>
        <Button transparent style={{ marginRight: '0.7rem' }} onClick={onHide}>
          Cancel
        </Button>
        <Button disabled={true} color={doneColor} onClick={() => onHide()}>
          Propose
        </Button>
      </footer>
    </Modal>
  );
}
