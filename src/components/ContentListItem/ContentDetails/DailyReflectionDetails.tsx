import React, { useMemo } from 'react';
import { getMarkdownPreviewPlainText } from '~/helpers/markdownPreviewText';
import { Color } from '~/constants/css';
import { User } from '~/types';

export default function DailyReflectionDetails({
  description,
  question,
  uploader
}: {
  description: string;
  question?: string;
  uploader: User;
}) {
  const previewText = useMemo(
    () => getMarkdownPreviewPlainText(description),
    [description]
  );

  return (
    <>
      <div className="title">
        <p>{question || 'Daily Reflection'}</p>
        {uploader.username && (
          <small style={{ color: Color.gray(), fontSize: '1.3rem' }}>
            Posted by {uploader.username}
          </small>
        )}
      </div>
      {previewText && (
        <div style={{ lineHeight: 1.3 }} className="description">
          {previewText}
        </div>
      )}
    </>
  );
}
