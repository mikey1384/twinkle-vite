import React, { useMemo } from 'react';
import ProgressBar from '~/components/ProgressBar';
import { Color } from '~/constants/css';

export default function FileUploadStatusIndicator({
  fileName,
  style,
  theme,
  uploadProgress,
  hideUploading
}: {
  fileName?: string;
  style?: React.CSSProperties;
  theme?: string;
  uploadProgress: number;
  hideUploading?: boolean;
}) {
  const normalizedProgress = useMemo(() => {
    if (!Number.isFinite(uploadProgress) || uploadProgress < 0) return 0;
    if (uploadProgress > 1) return 1;
    return uploadProgress;
  }, [uploadProgress]);
  const uploadComplete = useMemo(
    () => normalizedProgress > 0.999,
    [normalizedProgress]
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
    () => (uploadComplete ? 100 : Math.ceil(100 * normalizedProgress)),
    [uploadComplete, normalizedProgress]
  );

  return (
    <div style={{ marginTop: '1rem', ...style }}>
      {!hideUploading && (
        <div
          style={{
            textAlign: 'center',
            maxWidth: '100%',
            textOverflow: 'ellipsis',
            overflow: 'hidden'
          }}
        >{`Uploading${fileName ? ` ${fileName}` : ''}...`}</div>
      )}
      <ProgressBar
        text={text}
        theme={theme}
        color={color}
        progress={progress}
      />
    </div>
  );
}
