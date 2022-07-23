import PropTypes from 'prop-types';
import Textarea from '~/components/Texts/Textarea';
import LongText from '~/components/Texts/LongText';
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
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  return (
    <div style={{ width: '100%' }}>
      {onEdit ? (
        <>
          <Textarea
            minRows={5}
            placeholder={edit.description}
            value={editedDescription}
            onChange={onChange}
            onKeyUp={onKeyUp}
            style={{
              width: '100%',
              marginTop: '1rem',
              ...(descriptionExceedsCharLimit(editedDescription)?.style || {})
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
              disabled={determineEditButtonDoneStatus()}
              onClick={onEditFinish}
              style={{ fontSize: '1.7rem' }}
            >
              {doneLabel}
            </Button>
          </div>
        </>
      ) : (
        <LongText
          style={{
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
            fontSize: '1.6rem',
            padding: '1rem 0',
            lineHeight: '2.3rem'
          }}
        >
          {stringIsEmpty(description) ? noDescriptionLabel : description}
        </LongText>
      )}
    </div>
  );
}
