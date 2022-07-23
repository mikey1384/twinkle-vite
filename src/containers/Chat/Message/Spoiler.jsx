import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  limitBrs,
  processMentionLink,
  processedStringWithURL
} from '~/helpers/stringHelpers';
import { Color } from '~/constants/css';

Spoiler.propTypes = {
  content: PropTypes.string
};

export default function Spoiler({ content }) {
  const [spoilerShown, setSpoilerShown] = useState(false);
  const [grayness, setGrayness] = useState(105);
  const contentLength = useMemo(() => {
    if (content.startsWith('/spoiler ')) {
      return content.substr(9).length;
    }
    if (content.startsWith('/secret ')) {
      return content.substr(8).length;
    }
  }, [content]);

  const processedText = useMemo(() => {
    if (content.startsWith('/spoiler ')) {
      return processedStringWithURL(content.substr(9));
    }
    if (content.startsWith('/secret ')) {
      return processedStringWithURL(content.substr(8));
    }
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
