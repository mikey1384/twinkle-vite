import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Textarea from '~/components/Texts/Textarea';
import RichText from '~/components/Texts/RichText';
import Button from '~/components/Button';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { edit } from '~/constants/placeholders';
import { useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const cancelLabel = localize('cancel');
const doneLabel = localize('done');
const noDescriptionLabel = localize('noDescription');

Description.propTypes = {
  description: PropTypes.string.isRequired,
  descriptionExceedsCharLimit: PropTypes.func.isRequired,
  determineEditButtonDoneStatus: PropTypes.func.isRequired,
  editedDescription: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onKeyUp: PropTypes.func.isRequired,
  onEdit: PropTypes.bool.isRequired,
  onEditCancel: PropTypes.func.isRequired,
  onEditFinish: PropTypes.func.isRequired
};

export default function Description({
  description,
  descriptionExceedsCharLimit,
  determineEditButtonDoneStatus,
  editedDescription,
  onChange,
  onKeyUp,
  onEdit,
  onEditCancel,
  onEditFinish
}: {
  description: string;
  descriptionExceedsCharLimit: (v: string) => any;
  determineEditButtonDoneStatus: () => boolean;
  editedDescription: string;
  onChange: (v: any) => void;
  onKeyUp: (v: any) => void;
  onEdit: boolean;
  onEditCancel: () => void;
  onEditFinish: () => void;
}) {
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const [isEditing, setIsEditing] = useState(false);
  return (
    <div style={{ width: '100%', fontSize: '1.6rem' }}>
      {onEdit ? (
        <>
          <Textarea
            minRows={5}
            placeholder={edit.description}
            value={editedDescription}
            onChange={onChange}
            onKeyUp={onKeyUp}
            hasError={!!descriptionExceedsCharLimit(editedDescription)}
            style={{
              width: '100%',
              marginTop: '1rem'
            }}
          />
          {descriptionExceedsCharLimit(editedDescription) && (
            <small style={{ color: 'red' }}>
              {descriptionExceedsCharLimit(editedDescription)?.message}
            </small>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '1rem'
            }}
          >
            <Button
              transparent
              style={{ fontSize: '1.7rem', marginRight: '1rem' }}
              onClick={onEditCancel}
            >
              {cancelLabel}
            </Button>
            <Button
              color={doneColor}
              loading={isEditing}
              disabled={determineEditButtonDoneStatus()}
              onClick={handleEditFinish}
              style={{ fontSize: '1.7rem' }}
            >
              {doneLabel}
            </Button>
          </div>
        </>
      ) : (
        <RichText
          style={{
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            padding: '1rem 0',
            lineHeight: '2.3rem'
          }}
        >
          {stringIsEmpty(description) ? noDescriptionLabel : description}
        </RichText>
      )}
    </div>
  );

  async function handleEditFinish() {
    try {
      setIsEditing(true);
      await onEditFinish();
    } catch (error) {
      console.error(error);
    } finally {
      setIsEditing(false);
    }
  }
}
