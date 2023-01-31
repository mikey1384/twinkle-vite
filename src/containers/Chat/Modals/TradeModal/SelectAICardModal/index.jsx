import { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import { useAppContext, useKeyContext } from '~/contexts';

SelectAICardModal.propTypes = {
  aiCardModalType: PropTypes.string.isRequired,
  onHide: PropTypes.func.isRequired,
  partnerName: PropTypes.string.isRequired
};

export default function SelectAICardModal({
  aiCardModalType,
  onHide,
  partnerName
}) {
  const { username } = useKeyContext((v) => v.myState);
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const loadFilteredAICards = useAppContext(
    (v) => v.requestHelpers.loadFilteredAICards
  );

  useEffect(() => {
    init();
    async function init() {
      const { cards, loadMoreShown, numCards } = await loadFilteredAICards({
        filters: { owner: aiCardModalType === 'want' ? partnerName : username }
      });
      console.log(cards, loadMoreShown, numCards);
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
      <main>{aiCardModalType}</main>
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
