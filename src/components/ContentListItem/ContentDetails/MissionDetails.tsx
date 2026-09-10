import React, { useMemo } from 'react';
import { getMarkdownPreviewPlainText } from '~/helpers/markdownPreviewText';
import { Color } from '~/constants/css';

export default function MissionDetails({
  description,
  title
}: {
  description?: string;
  title: string;
}) {
  const previewText = useMemo(
    () => getMarkdownPreviewPlainText(description),
    [description]
  );

  return (
    <>
      <div className="title">
        <p>{title}</p>
        <small
          style={{ color: Color.gold(), fontSize: '1.3rem', fontWeight: 'bold' }}
        >
          Mission
        </small>
      </div>
      {previewText && (
        <div style={{ lineHeight: 1.3 }} className="description">
          {previewText}
        </div>
      )}
    </>
  );
}
