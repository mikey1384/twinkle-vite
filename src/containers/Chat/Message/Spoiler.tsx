import React, { useMemo, useState } from 'react';
import {
  limitBrs,
  processMentionLink,
  processedStringWithURL
} from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';

export default function Spoiler({ content = '' }) {
  const [spoilerShown, setSpoilerShown] = useState(false);
  const [grayness, setGrayness] = useState(105);
  const contentLength = useMemo(() => {
    if ((content || '').startsWith('/spoiler ')) {
      return content.substring(9).length;
    }
    if ((content || '').startsWith('/secret ')) {
      return content.substring(8).length;
    }
    return 0;
  }, [content]);

  const processedText = useMemo(() => {
    if ((content || '').startsWith('/spoiler ')) {
      return processedStringWithURL(content.substring(9));
    }
    if ((content || '').startsWith('/secret ')) {
      return processedStringWithURL(content.substring(8));
    }
    return '';
  }, [content]);

  const finalText = useMemo(
    () => processMentionLink(limitBrs(processedText)),
    [processedText]
  );

  return (
    <div>
      {spoilerShown ? (
        <span
          style={{
            background: Color.lighterGray(),
            borderRadius: '2px'
          }}
        >
          {finalText}
        </span>
      ) : (
        <div
          style={{
            cursor: 'pointer',
            background: `rgb(${grayness},${grayness},${grayness})`,
            height: '2.5rem',
            maxWidth: '100%',
            width: contentLength > 50 ? '80%' : 0.8 * contentLength + 'rem',
            borderRadius: '5px'
          }}
          onClick={handleSpoilerClick}
          onMouseEnter={() => setGrayness(128)}
          onMouseLeave={() => setGrayness(105)}
        />
      )}
    </div>
  );

  function handleSpoilerClick() {
    setSpoilerShown(true);
  }
}
