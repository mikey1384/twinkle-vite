import { useState } from 'react';
import PropTypes from 'prop-types';
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

const sectionObj = {
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

AttachContentModal.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onHide: PropTypes.func.isRequired
};

export default function AttachContentModal({ onConfirm, onHide }) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [section, setSection] = useState('start');
  const [selected, setSelected] = useState();
  return (
    <Modal
      modalOverModal
      large={section === 'selectVideo' || section === 'selectLink'}
      onHide={onHide}
    >
      <header>{sectionObj[section].title}</header>
      <main>
        {section === 'start' && (
          <StartScreen navigateTo={setSection} onHide={onHide} />
        )}
        {section === 'selectVideo' && (
          <SelectAttachmentScreen
            contentType="video"
            onSelect={(video) =>
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
            onSelect={(link) =>
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
