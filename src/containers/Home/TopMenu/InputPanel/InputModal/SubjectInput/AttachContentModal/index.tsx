import React, { useState } from 'react';
import NewModal from '~/components/NewModal';
import Button from '~/components/Button';
import StartScreen from './StartScreen';
import SelectAttachmentScreen from './SelectAttachmentScreen';
import localize from '~/constants/localize';
import { useKeyContext } from '~/contexts';

const attachContentToSubjectLabel = localize('attachContentToSubject');
const backLabel = localize('back');
const cancelLabel = localize('cancel');
const confirmLabel = localize('confirm');
const selectVideoLabel = localize('selectVideo');
const selectWebpageLabel = localize('selectWebpage');

const sectionObj: Record<string, any> = {
  start: {
    title: attachContentToSubjectLabel
  },
  selectVideo: {
    title: selectVideoLabel
  },
  selectLink: {
    title: selectWebpageLabel
  }
};

export default function AttachContentModal({
  isOpen,
  onConfirm,
  onHide
}: {
  isOpen: boolean;
  onConfirm: (arg0?: Record<string, any>) => void;
  onHide: () => void;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [section, setSection] = useState('start');
  const [selected, setSelected] = useState<Record<string, any>>();
  
  const handleClose = () => {
    if (section === 'selectVideo' || section === 'selectLink') {
      setSection('start');
      setSelected(undefined);
    } else {
      onHide();
    }
  };

  return (
    <NewModal
      isOpen={isOpen}
      onClose={handleClose}
      title={sectionObj[section].title}
      size={section === 'selectVideo' || section === 'selectLink' ? 'xl' : 'lg'}
      modalLevel={1}
      footer={
        <>
          <Button transparent onClick={handleClose}>
            {section === 'start' ? cancelLabel : backLabel}
          </Button>
          {section !== 'start' && (
            <Button
              disabled={!selected}
              color={doneColor}
              style={{ marginLeft: '0.7rem' }}
              onClick={() => onConfirm(selected)}
            >
              {confirmLabel}
            </Button>
          )}
        </>
      }
    >
      {section === 'start' && (
        <StartScreen navigateTo={setSection} onHide={onHide} />
      )}
      {section === 'selectVideo' && (
        <SelectAttachmentScreen
          contentType="video"
          onSelect={(video: { id: number; title: string }) =>
            setSelected({
              contentType: 'video',
              id: video.id,
              title: video?.title
            })
          }
          onDeselect={() => setSelected(undefined)}
        />
      )}
      {section === 'selectLink' && (
        <SelectAttachmentScreen
          contentType="url"
          onSelect={(link: { id: number; title: string }) =>
            setSelected({
              contentType: 'url',
              id: link.id,
              title: link?.title
            })
          }
          onDeselect={() => setSelected(undefined)}
        />
      )}
    </NewModal>
  );
}
