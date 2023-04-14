import React, { useMemo } from 'react';
import Textarea from '~/components/Texts/Textarea';
import { exceedsCharLimit, addEmoji } from '~/helpers/stringHelpers';

export default function CaptionEditor({
  text,
  onSetText,
  style
}: {
  text: string;
  onSetText: (text: string) => void;
  style?: React.CSSProperties;
}) {
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
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onSetText(event.target.value)
        }
        onKeyUp={handleKeyUp}
      />
    </div>
  );

  function handleKeyUp(event: { key: string; target: { value: string } }) {
    if (event.key === ' ') {
      onSetText(addEmoji(event.target.value));
    }
  }
}
