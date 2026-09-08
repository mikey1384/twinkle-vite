import React, { useState } from 'react';
import { getChatReaction } from '~/constants/chatReactions';

export default function ChatReactionEmoji({
  reaction,
  size = 24
}: {
  reaction: string;
  size?: number;
}) {
  const definition = getChatReaction(reaction);
  const source = definition ? `/img/chat-reactions/${definition.key}-v2.png` : '';
  const [failedSource, setFailedSource] = useState('');
  const style: React.CSSProperties = {
    display: 'inline-block',
    flexShrink: 0,
    width: size,
    height: size,
    objectFit: 'contain',
    verticalAlign: 'middle'
  };

  // Unknown future keys must not crash an older message or its channel row.
  // The enclosing control supplies the accessible reaction name.
  if (!source || failedSource === source) {
    return (
      <span
        aria-hidden="true"
        style={{ ...style, fontSize: size * 0.85, lineHeight: `${size}px` }}
      >
        {definition?.fallback || '?'}
      </span>
    );
  }

  return (
    <img
      src={source}
      alt=""
      aria-hidden="true"
      draggable={false}
      width={size}
      height={size}
      style={style}
      onError={() => setFailedSource(source)}
    />
  );
}
