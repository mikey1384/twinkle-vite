import React from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';

FileIcon.propTypes = {
  fileType: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  size: PropTypes.string,
  style: PropTypes.object
};

export default function FileIcon({ fileType, size = '7x', onClick, style }) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
      onClick={onClick}
    >
      {fileType === 'other' && <Icon size={size} icon="file" />}
      {fileType !== 'other' && <Icon size={size} icon={`file-${fileType}`} />}
    </div>
  );
}
