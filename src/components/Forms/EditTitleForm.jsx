import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Input from '~/components/Texts/Input';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { useOutsideClick } from '~/helpers/hooks';
import { useKeyContext } from '~/contexts';
import {
  addEmoji,
  finalizeEmoji,
  stringIsEmpty
} from '~/helpers/stringHelpers';
import { edit } from '~/constants/placeholders';

EditTitleForm.propTypes = {
  autoFocus: PropTypes.bool,
  inputStyle: PropTypes.object,
  maxLength: PropTypes.number,
  onClickOutSide: PropTypes.func.isRequired,
  onEditSubmit: PropTypes.func.isRequired,
  savingEdit: PropTypes.bool,
  style: PropTypes.object,
  title: PropTypes.string.isRequired
};

export default function EditTitleForm({
  autoFocus,
  maxLength = 100,
  onClickOutSide,
  style,
  inputStyle,
  onEditSubmit,
  savingEdit,
  ...props
}) {
  const {
    success: { color: successColor }
  } = useKeyContext((v) => v.theme);
  const [title, setTitle] = useState(props.title);
  const FormRef = useRef(null);
  useOutsideClick(FormRef, onClickOutSide);

  return (
    <div style={style} ref={FormRef}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
        <Input
          style={{
            width: '100%',
            color: title?.length > maxLength && 'red',
            ...inputStyle
          }}
          autoFocus={autoFocus}
          placeholder={edit.title}
          value={title}
          onChange={(text) => setTitle(text)}
          onKeyUp={handleKeyUp}
        />
        {!stringIsEmpty(title) && (
          <Button
            style={{ marginLeft: '1rem', zIndex: 1000 }}
            filled
            disabled={title?.length > maxLength || savingEdit}
            color={successColor}
            onClick={handleEditSubmit}
          >
            <Icon icon="check" size="lg" />
          </Button>
        )}
      </div>
      <div>
        <small
          style={{
            color: title?.length > maxLength && 'red',
            fontSize: '1.3rem',
            lineHeight: '2rem'
          }}
        >
          {title?.length}/{maxLength} Characters
        </small>
      </div>
    </div>
  );

  function handleKeyUp(event) {
    setTitle(addEmoji(event.target.value));
    if (event.keyCode === 13) {
      handleEditSubmit();
    }
  }

  function handleEditSubmit() {
    if (title?.length > maxLength || savingEdit) return;
    if (!stringIsEmpty(title) && title !== props.title) {
      onEditSubmit(finalizeEmoji(title));
    } else {
      onClickOutSide();
    }
  }
}
