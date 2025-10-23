import React, { useRef } from 'react';
import Modal from '~/components/Modal';
import InteractiveContent from '~/components/InteractiveContent';
import Button from '~/components/Button';
import localize from '~/constants/localize';

const closeLabel = localize('close');

export default function TutorialModal({
  missionTitle,
  tutorialId,
  tutorialSlideId,
  onCurrentSlideIdChange,
  onHide
}: {
  missionTitle: string;
  tutorialId: number;
  tutorialSlideId: number;
  onCurrentSlideIdChange: (slideId: number) => void;
  onHide: () => void;
}) {
  const ModalBodyRef: React.RefObject<any> = useRef(null);
  return (
    <Modal modalStyle={{ height: 'CALC(100vh - 7rem)' }} large onHide={onHide}>
      <header>{missionTitle}</header>
      <main
        ref={ModalBodyRef}
        style={{
          height: 'CALC(100% - 10rem)',
          justifyContent: 'start',
          overflow: 'scroll'
        }}
      >
        <InteractiveContent
          isOnModal
          currentTutorialSlideId={tutorialSlideId}
          interactiveId={tutorialId}
          onGoBackToMission={onHide}
          onCurrentSlideIdChange={onCurrentSlideIdChange}
          onScrollElementTo={handleScrollElementTo}
          onScrollElementToCenter={handleScrollElementToCenter}
        />
        <div style={{ padding: '7rem 0' }} />
      </main>
      <footer>
        <Button variant="ghost" style={{ marginRight: '0.7rem' }} onClick={onHide}>
          {closeLabel}
        </Button>
      </footer>
    </Modal>
  );

  function handleScrollElementTo({
    element,
    amount
  }: {
    element: HTMLElement;
    amount: number;
  }) {
    if (!element) return;
    let offsetTop = 0;
    addAllOffsetTop(element);
    ModalBodyRef.current.scrollTop = offsetTop + amount - 350;
    function addAllOffsetTop(element: any) {
      offsetTop += element.offsetTop;
      if (element.offsetParent) {
        addAllOffsetTop(element.offsetParent);
      }
    }
  }

  function handleScrollElementToCenter(element: any, adjustment = -50) {
    if (!element) return;
    let offsetTop = 0;
    addAllOffsetTop(element);
    ModalBodyRef.current.scrollTop =
      offsetTop +
      adjustment -
      (ModalBodyRef.current.clientHeight - element.clientHeight) / 2;
    function addAllOffsetTop(element: any) {
      offsetTop += element.offsetTop;
      if (element.offsetParent) {
        addAllOffsetTop(element.offsetParent);
      }
    }
  }
}
