import React, { useMemo, useState } from 'react';
import Button from '~/components/Button';
import StartScreen from './StartScreen';
import SelectFromArchive from './SelectFromArchive';
import Modal from '~/components/Modal';
import { useRoleColor } from '~/theme/useRoleColor';
import { Color } from '~/constants/css';

export default function AddPictureModal({
  currentPictures,
  maxNumSelectable,
  onConfirm,
  onHide,
  profileId
}: {
  currentPictures: any[];
  maxNumSelectable: number;
  onConfirm: (arg0: any) => any;
  onHide: () => any;
  profileId: number;
}) {
  const doneRole = useRoleColor('done', { fallback: 'blue' });
  const doneColor = useMemo(
    () => doneRole.getColor() || Color.blue(),
    [doneRole]
  );
  const [section, setSection] = useState('start');
  const [selectedPictureIds, setSelectedPictureIds] = useState([]);

  return (
    <Modal
      modalKey="AddPictureModal"
      isOpen={true}
      onClose={onHide}
      title={`Add Picture${section === 'archive' ? `s from Archive` : ''}`}
      size="lg"
      closeOnBackdropClick={false}
      modalLevel={0}
      footer={
        <>
          <Button
            variant="ghost"
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
        </>
      }
    >
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
    </Modal>
  );
}
