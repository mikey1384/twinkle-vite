import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Textarea from '~/components/Texts/Textarea';
import { exceedsCharLimit, addEmoji } from '~/helpers/stringHelpers';

CaptionEditor.propTypes = {
  style: PropTypes.object,
  text: PropTypes.string,
  onSetText: PropTypes.func.isRequired
};

export default function CaptionEditor({ text, onSetText, style }) {
  const commentExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'comment',
        text
      }),
    [text]
  );

  return (
    <div style={{ width: '100%', ...style }}>
      <Textarea
        placeholder="Enter Caption"
        style={{
          width: '100%',
          position: 'relative',
          ...(commentExceedsCharLimit?.style || {})
        }}
        minRows={3}
        value={text}
        onChange={(event) => onSetText(event.target.value)}
        onKeyUp={handleKeyUp}
      />
    </div>
  );

  function handleKeyUp(event) {
    if (event.key === ' ') {
      onSetText(addEmoji(event.target.value));
    }
  }
}
