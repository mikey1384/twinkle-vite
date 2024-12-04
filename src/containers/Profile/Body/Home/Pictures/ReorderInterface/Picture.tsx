import React, { useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import ItemTypes from '~/constants/itemTypes';
import { css } from '@emotion/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { Color, borderRadius, innerBorderRadius } from '~/constants/css';
import { useDrag, useDrop } from 'react-dnd';

Picture.propTypes = {
  picture: PropTypes.object.isRequired,
  numPictures: PropTypes.number,
  style: PropTypes.object,
  onMove: PropTypes.func.isRequired
};

export default function Picture({
  numPictures,
  picture,
  style,
  onMove
}: {
  picture: any;
  numPictures: number;
  style: React.CSSProperties;
  onMove: (arg0: any) => any;
}) {
  const imageUrl = useMemo(() => {
    return picture?.src ? `${cloudFrontURL}${picture?.src}` : '';
  }, [picture]);
  const width = Math.min(100 / (numPictures + 1), 33);
  const Draggable = useRef(null);
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.PICTURE,
    item: { id: picture.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  });
  const [, drop] = useDrop({
    accept: ItemTypes.PICTURE,
    hover(item: { id: number }) {
      if (!Draggable.current) {
        return;
      }
      if (item.id !== picture.id) {
        onMove({ sourceId: item.id, targetId: picture.id });
      }
    }
  });
  const PictureRef: any = drag(drop(Draggable));

  return (
    <div
      ref={PictureRef}
      className={css`
        cursor: pointer;
        opacity: ${isDragging ? 0.5 : 1};
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
    </div>
  );
}
