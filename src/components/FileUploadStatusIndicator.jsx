import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import ProgressBar from '~/components/ProgressBar';
import { Color } from '~/constants/css';

FileUploadStatusIndicator.propTypes = {
  fileName: PropTypes.string,
  uploadProgress: PropTypes.number,
  style: PropTypes.object,
  theme: PropTypes.string
};

export default function FileUploadStatusIndicator({
  fileName,
  style,
  theme,
  uploadProgress
}) {
  const uploadComplete = useMemo(
    () => uploadProgress > 0.995,
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
      <div style={{ textAlign: 'center' }}>{`Uploading${
        fileName ? ` ${fileName}` : ''
      }...`}</div>
      <ProgressBar
        text={text}
        theme={theme}
        color={color}
        progress={progress}
      />
    </div>
  );
}
