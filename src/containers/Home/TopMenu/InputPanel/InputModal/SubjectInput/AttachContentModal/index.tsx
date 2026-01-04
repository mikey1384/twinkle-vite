import React, { useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import StartScreen from './StartScreen';
import SelectAttachmentScreen from './SelectAttachmentScreen';
import { useRoleColor } from '~/theme/useRoleColor';

const attachContentToSubjectLabel = 'Attach a content to your subject';
const backLabel = 'Back';
const cancelLabel = 'Cancel';
const confirmLabel = 'Confirm';
const selectVideoLabel = 'Select a video';
const selectWebpageLabel = 'Select a webpage';

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
  const doneRole = useRoleColor('done', { fallback: 'blue' });
  const doneColorKey = doneRole.colorKey;
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={sectionObj[section].title}
      size={section === 'selectVideo' || section === 'selectLink' ? 'xl' : 'lg'}
      modalLevel={1}
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            {section === 'start' ? cancelLabel : backLabel}
          </Button>
          {section !== 'start' && (
            <Button
              disabled={!selected}
              color={doneColorKey}
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
    </Modal>
  );
}
