import React, { memo, useState } from 'react';
import PropTypes from 'prop-types';
import ImageModal from '~/components/Modals/ImageModal';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

ImagePreview.propTypes = {
  isThumb: PropTypes.bool,
  modalOverModal: PropTypes.bool,
  src: PropTypes.string.isRequired,
  fileName: PropTypes.string.isRequired
};
function ImagePreview({
  isThumb,
  modalOverModal,
  src,
  fileName
}: {
  isThumb?: boolean;
  modalOverModal?: boolean;
  src: string;
  fileName: string;
}) {
  const [imageModalShown, setImageModalShown] = useState(false);
  const [imageWorks, setImageWorks] = useState(true);
  return imageWorks ? (
    <div
      style={{
        display: 'flex',
        height: '100%',
        width: isThumb ? '100%' : 'auto',
        justifyContent: isThumb ? 'center' : 'flex-start',
        alignItems: 'center'
      }}
    >
      <img
        loading="lazy"
        fetchPriority="low"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: isThumb ? 'cover' : 'contain',
          cursor: 'pointer'
        }}
        className={css`
          height: 25vw;
          @media (max-width: ${mobileMaxWidth}) {
            height: 50vw;
          }
        `}
        src={src}
        rel={fileName}
        onClick={() => setImageModalShown(true)}
        onError={() => setImageWorks(false)}
      />
      {imageModalShown && (
        <ImageModal
          onHide={() => setImageModalShown(false)}
          modalOverModal={modalOverModal}
          fileName={fileName}
          src={src}
        />
      )}
    </div>
  ) : null;
}

export default memo(ImagePreview);
