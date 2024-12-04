import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { Color, borderRadius, innerBorderRadius } from '~/constants/css';

Picture.propTypes = {
  picture: PropTypes.object.isRequired,
  numPictures: PropTypes.number,
  onDelete: PropTypes.func.isRequired,
  style: PropTypes.object
};

export default function Picture({
  numPictures,
  onDelete,
  picture,
  style
}: {
  picture: any;
  numPictures: number;
  onDelete: (arg0: any) => any;
  style: React.CSSProperties;
}) {
  const imageUrl = useMemo(() => {
    return picture?.src ? `${cloudFrontURL}${picture?.src}` : '';
  }, [picture]);
  const width = useMemo(
    () => Math.min(100 / (numPictures + 1), 33),
    [numPictures]
  );

  return (
    <div
      className={css`
        background: black;
        position: relative;
        border: 1px solid ${Color.borderGray()};
        border-radius: ${borderRadius};
        width: ${width}%;
        padding-bottom: CALC(${width}% - 2px);
      `}
      style={style}
    >
      <img
        loading="lazy"
        style={{
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
        src={imageUrl}
      />
      <div
        onClick={() => onDelete(picture.id)}
        style={{
          cursor: 'pointer',
          position: 'absolute',
          width: 'CALC(2rem + 8px)',
          height: 'CALC(2rem + 8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          top: 3,
          right: 3,
          background: Color.black(),
          borderRadius: '50%'
        }}
      >
        <Icon style={{ color: '#fff', fontSize: '2rem' }} icon="times" />
      </div>
    </div>
  );
}
