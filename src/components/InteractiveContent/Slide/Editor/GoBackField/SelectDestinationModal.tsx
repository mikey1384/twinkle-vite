import React, { useEffect, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import SlideListItem from '../../../SlideListItem';
import GoBackToMissionItem from './GoBackToMissionItem';
import { useKeyContext } from '~/contexts';

export default function SelectDestinationModal({
  interactiveId,
  onDone,
  onHide,
  originForkId,
  slideObj
}: {
  interactiveId: number;
  onDone: (arg: any) => void;
  onHide: () => void;
  originForkId: number;
  slideObj: any;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [forkIds, setForkIds] = useState<number[]>([]);
  const [selectedSlideId, setSelectedSlideId] = useState<number | null>(null);

  useEffect(() => {
    addForkIds(originForkId);

    function addForkIds(forkId: number) {
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
