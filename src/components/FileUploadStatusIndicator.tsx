import React, { useMemo } from 'react';
import ProgressBar from '~/components/ProgressBar';
import { Color } from '~/constants/css';

export default function FileUploadStatusIndicator({
  fileName,
  style,
  theme,
  uploadProgress
}: {
  fileName?: string;
  style?: React.CSSProperties;
  theme?: string;
  uploadProgress: number;
}) {
  const uploadComplete = useMemo(
    () => uploadProgress > 0.999,
    [uploadProgress]
  );
  const text = useMemo(
    () => (uploadComplete ? 'Upload Complete!' : ''),
    [uploadComplete]
  );
  const color = useMemo(
    () => (uploadComplete ? Color.green() : undefined),
    [uploadComplete]
  );
  const progress = useMemo(
    () => (uploadComplete ? 100 : Math.ceil(100 * uploadProgress)),
    [uploadComplete, uploadProgress]
  );

  return (
    <div style={{ marginTop: '1rem', ...style }}>
      <div
        style={{
          textAlign: 'center',
          maxWidth: '100%',
          textOverflow: 'ellipsis',
          overflow: 'hidden'
        }}
      >{`Uploading${fileName ? ` ${fileName}` : ''}...`}</div>
      <ProgressBar
        text={text}
        theme={theme}
        color={color}
        progress={progress}
      />
    </div>
  );
}
