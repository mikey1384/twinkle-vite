import { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import StartScreen from './StartScreen';
import SelectFromArchive from './SelectFromArchive';
import { useKeyContext } from '~/contexts';

AddPictureModal.propTypes = {
  currentPictures: PropTypes.array.isRequired,
  maxNumSelectable: PropTypes.number.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onHide: PropTypes.func.isRequired,
  profileId: PropTypes.number.isRequired
};

export default function AddPictureModal({
  currentPictures,
  maxNumSelectable,
  onConfirm,
  onHide,
  profileId
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const [section, setSection] = useState('start');
  const [selectedPictureIds, setSelectedPictureIds] = useState([]);

  return (
    <Modal large={section === 'archive'} onHide={onHide}>
      <header>
        Add Picture{section === 'archive' ? `s from Archive` : ''}
      </header>
      <main>
        {section === 'start' && (
          <StartScreen
            profileId={profileId}
            navigateTo={setSection}
            onHide={onHide}
          />
        )}
        {section === 'archive' && (
          <SelectFromArchive
            currentPictures={currentPictures}
            selectedPictureIds={selectedPictureIds}
            onSetSelectedPictureIds={setSelectedPictureIds}
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
                  setSelectedPictureIds([]);
                }
          }
        >
          {section === 'start' ? 'Cancel' : 'Back'}
        </Button>
        {section !== 'start' && (
          <Button
            disabled={
              selectedPictureIds.length === 0 ||
              selectedPictureIds.length > maxNumSelectable
            }
            color={doneColor}
            style={{ marginLeft: '0.7rem' }}
            onClick={() => onConfirm({ selectedPictureIds })}
          >
            {selectedPictureIds.length > maxNumSelectable
              ? `Cannot select more than ${maxNumSelectable}`
              : 'Confirm'}
          </Button>
        )}
      </footer>
    </Modal>
  );
}
