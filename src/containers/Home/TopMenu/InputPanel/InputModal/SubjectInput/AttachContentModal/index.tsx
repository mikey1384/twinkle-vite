import React, { useState } from 'react';
import Modal from '~/components/Modal';
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
  onConfirm,
  onHide
}: {
  onConfirm: (arg0?: Record<string, any>) => void;
  onHide: () => void;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [section, setSection] = useState('start');
  const [selected, setSelected] = useState<Record<string, any>>();
  return (
    <Modal
      modalOverModal
      large={section === 'selectVideo' || section === 'selectLink'}
      onHide={
        section === 'selectVideo' || section === 'selectLink'
          ? () => setSection('start')
          : onHide
      }
    >
      <header>{sectionObj[section].title}</header>
      <main>
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
      </main>
      <footer>
        <Button
          transparent
          onClick={
            section === 'start'
              ? onHide
              : () => {
                  setSection('start');
                  setSelected(undefined);
                }
          }
        >
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
      </footer>
    </Modal>
  );
}
