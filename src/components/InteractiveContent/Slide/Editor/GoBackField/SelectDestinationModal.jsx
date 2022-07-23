import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SlideListItem from '../../../SlideListItem';
import GoBackToMissionItem from './GoBackToMissionItem';
import { useKeyContext } from '~/contexts';

SelectDestinationModal.propTypes = {
  interactiveId: PropTypes.number.isRequired,
  onHide: PropTypes.func.isRequired,
  onDone: PropTypes.func.isRequired,
  originForkId: PropTypes.number,
  slideObj: PropTypes.object
};

export default function SelectDestinationModal({
  interactiveId,
  onDone,
  onHide,
  originForkId,
  slideObj
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [forkIds, setForkIds] = useState([]);
  const [selectedSlideId, setSelectedSlideId] = useState(null);

  useEffect(() => {
    addForkIds(originForkId);

    function addForkIds(forkId) {
      setForkIds((forkIds) =>
        forkIds.includes(forkId) ? forkIds : forkIds.concat(forkId)
      );
      if (slideObj[forkId]?.forkedFrom) {
        addForkIds(slideObj[forkId].forkedFrom);
      }
    }
  }, [originForkId, slideObj]);

  return (
    <Modal onHide={onHide}>
      <header>Select Destination</header>
      <main>
        <GoBackToMissionItem
          selectedSlideId={selectedSlideId}
          onClick={() => setSelectedSlideId(0)}
        />
        {forkIds.map((id) => (
          <SlideListItem
            key={id}
            style={{ marginTop: '1rem' }}
            slide={slideObj[id]}
            interactiveId={interactiveId}
            selectedSlideId={selectedSlideId}
            onClick={setSelectedSlideId}
          />
        ))}
      </main>
      <footer>
        <Button transparent onClick={onHide} style={{ marginRight: '0.7rem' }}>
          Cancel
        </Button>
        <Button
          disabled={selectedSlideId === null}
          color={doneColor}
          onClick={() => onDone(selectedSlideId)}
        >
          Done
        </Button>
      </footer>
    </Modal>
  );
}
