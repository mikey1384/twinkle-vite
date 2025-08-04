import React, { memo, useState } from 'react';
import ImageModal from '~/components/Modals/ImageModal';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

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
