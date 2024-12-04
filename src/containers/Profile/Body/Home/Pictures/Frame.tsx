import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ImageModal from '~/components/Modals/ImageModal';
import { Color, borderRadius, innerBorderRadius } from '~/constants/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts';

Frame.propTypes = {
  forCarousel: PropTypes.bool,
  numPictures: PropTypes.number,
  picture: PropTypes.object.isRequired,
  userIsUploader: PropTypes.bool,
  onUpdatePictureCaption: PropTypes.func,
  style: PropTypes.object
};

export default function Frame({
  forCarousel,
  numPictures,
  onUpdatePictureCaption,
  picture,
  style,
  userIsUploader
}: {
  forCarousel?: boolean;
  numPictures: number;
  onUpdatePictureCaption: (arg0: any) => any;
  picture: any;
  style: React.CSSProperties;
  userIsUploader: boolean;
}) {
  const updateUserPictureCaption = useAppContext(
    (v) => v.requestHelpers.updateUserPictureCaption
  );
  const imageUrl = useMemo(() => {
    return picture?.src ? `${cloudFrontURL}${picture?.src}` : '';
  }, [picture]);
  const [imageModalShown, setImageModalShown] = useState(false);
  const width = useMemo(() => Math.min(100 / numPictures, 33), [numPictures]);
  const frameWidth = useMemo(
    () => (forCarousel ? 100 : width),
    [forCarousel, width]
  );

  return (
    <div
      style={style}
      className={css`
        background: #fff;
        position: relative;
        border: 1px solid ${Color.borderGray()};
        border-radius: ${borderRadius};
        width: ${frameWidth}%;
        height: CALC(${frameWidth}% - 2px);
        padding-bottom: CALC(${frameWidth}% - ${numPictures}px);
      `}
    >
      {imageUrl && (
        <img
          loading="lazy"
          draggable={false}
          style={{
            cursor: 'pointer',
            borderRadius: innerBorderRadius,
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center'
          }}
          onClick={() => setImageModalShown(true)}
          src={imageUrl}
        />
      )}
      {imageModalShown && (
        <ImageModal
          hasCaption
          caption={picture?.caption}
          downloadable={false}
          src={imageUrl}
          userIsUploader={userIsUploader}
          onEditCaption={handleEditCaption}
          onHide={() => setImageModalShown(false)}
        />
      )}
    </div>
  );

  async function handleEditCaption(text: string) {
    await updateUserPictureCaption({ caption: text, pictureId: picture.id });
    onUpdatePictureCaption({ caption: text, pictureId: picture.id });
  }
}
