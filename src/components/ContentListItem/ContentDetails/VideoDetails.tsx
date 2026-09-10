import React, { useMemo } from 'react';
import { getMarkdownPreviewPlainText } from '~/helpers/markdownPreviewText';
import { Color } from '~/constants/css';
import { User } from '~/types';

export default function VideoDetails({
  description,
  title,
  uploader
}: {
  description: string;
  title: string;
  uploader: User;
}) {
  const previewText = useMemo(
    () => getMarkdownPreviewPlainText(description),
    [description]
  );

  return (
    <>
      <div className="title">
        <p>{title}</p>
        <small style={{ color: Color.gray() }}>
          Uploaded by {uploader.username}
        </small>
      </div>
      {previewText && (
        <div className="description">{previewText}</div>
      )}
    </>
  );
}
