import React, { useMemo } from 'react';
import ProgressBar from '~/components/ProgressBar';
import { Color } from '~/constants/css';

export default function FileUploadStatusIndicator({
  compactMode = false,
  fileName,
  style,
  theme,
  uploadProgress,
  hideUploading
}: {
  compactMode?: boolean;
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
    <div style={{ marginTop: compactMode ? 0 : '1rem', ...style }}>
      {!hideUploading && (
        <div
          style={{
            textAlign: compactMode ? 'left' : 'center',
            maxWidth: '100%',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: compactMode ? 'nowrap' : undefined,
            fontSize: compactMode ? '0.82rem' : undefined,
            lineHeight: compactMode ? 1.25 : undefined
          }}
        >{`Uploading${fileName ? ` ${fileName}` : ''}...`}</div>
      )}
      <ProgressBar
        compactMode={compactMode}
        text={text}
        theme={theme}
        color={color}
        progress={progress}
      />
    </div>
  );
}
