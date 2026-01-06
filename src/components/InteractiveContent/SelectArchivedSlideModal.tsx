import React, { useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import LegacyModalLayout from '~/components/Modal/LegacyModalLayout';
import Button from '~/components/Button';
import SlideListItem from './SlideListItem';
import { useRoleColor } from '~/theme/useRoleColor';
import { Color } from '~/constants/css';

export default function SelectArchivedSlideModal({
  interactiveId,
  onDone,
  onHide,
  archivedSlides
}: {
  interactiveId: number;
  onDone: (slideId: number | null) => any;
  onHide: () => void;
  archivedSlides: any[];
}) {
  const doneRole = useRoleColor('done', { fallback: 'blue' });
  const doneColor = useMemo(
    () => doneRole.getColor() || Color.blue(),
    [doneRole]
  );
  const [selectedSlideId, setSelectedSlideId] = useState<number | null>(null);

  return (
    <Modal modalKey="SelectArchivedSlideModal" isOpen onClose={onHide} hasHeader={false} bodyPadding={0}>
      <LegacyModalLayout>
        <header>Select a Slide</header>
        <main>
          {archivedSlides.map((slide, index) => (
            <SlideListItem
              key={slide.id}
              selectedSlideId={selectedSlideId}
              interactiveId={interactiveId}
              slide={slide}
              onClick={(slideId) => setSelectedSlideId(slideId)}
              style={{ marginTop: index === 0 ? 0 : '1rem' }}
            />
          ))}
        </main>
        <footer>
          <Button
            variant="ghost"
            onClick={onHide}
            style={{ marginRight: '0.7rem' }}
          >
            Cancel
          </Button>
          <Button
            disabled={!selectedSlideId}
            color={doneColor}
            onClick={() => onDone(selectedSlideId)}
          >
            Done
          </Button>
        </footer>
      </LegacyModalLayout>
    </Modal>
  );
}
