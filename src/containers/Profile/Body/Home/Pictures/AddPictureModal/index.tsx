import React, { useMemo, useState } from 'react';
import Button from '~/components/Button';
import StartScreen from './StartScreen';
import SelectFromArchive from './SelectFromArchive';
import Modal from '~/components/Modal';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { Color } from '~/constants/css';

export default function AddPictureModal({
  currentPictures,
  maxNumSelectable,
  onConfirm,
  onHide
}: {
  currentPictures: any[];
  maxNumSelectable: number;
  onConfirm: (arg0: any) => Promise<boolean>;
  onHide: () => any;
}) {
  const doneRole = useRoleColor('done', { fallback: 'blue' });
  const doneColor = useMemo(
    () => doneRole.getColor() || Color.blue(),
    [doneRole]
  );
  const [section, setSection] = useState('start');
  const [selectedPictureIds, setSelectedPictureIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

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
            disabled={submitting}
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
                submitting ||
                selectedPictureIds.length === 0 ||
                selectedPictureIds.length > maxNumSelectable
              }
              loading={submitting}
              color={doneColor}
              style={{ marginLeft: '0.7rem' }}
              onClick={handleConfirm}
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
        <StartScreen navigateTo={setSection} onHide={onHide} />
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

  async function handleConfirm() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const confirmed = await onConfirm({ selectedPictureIds });
      if (confirmed) {
        onHide();
      } else {
        setSubmitting(false);
      }
    } catch (error) {
      console.error(error);
      setSubmitting(false);
    }
  }
}
