import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ItemTypes from '~/constants/itemTypes';
import { useDrag, useDrop } from 'react-dnd';
import FullTextReveal from '~/components/Texts/FullTextRevealFromOuterLayer';
import VideoThumbImage from '~/components/VideoThumbImage';
import { textIsOverflown, isMobile } from '~/helpers';
import { mobileFullTextRevealShowDuration } from '~/constants/defaultValues';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

const deviceIsMobile = isMobile(navigator);

SortableThumb.propTypes = {
  id: PropTypes.number.isRequired,
  onMove: PropTypes.func.isRequired,
  video: PropTypes.object.isRequired
};

export default function SortableThumb({ id, onMove, video }) {
  const [titleContext, setTitleContext] = useState(null);
  const Draggable = useRef(null);
  const timerRef = useRef(null);
  const ThumbLabelContainerRef = useRef(null);
  const ThumbLabelRef = useRef(null);
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.THUMB,
    item: { id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  });
  const [, drop] = useDrop({
    accept: ItemTypes.THUMB,
    hover(item) {
      if (!Draggable.current) {
        return;
      }
      if (item.id !== id) {
        onMove({ sourceId: item.id, targetId: id });
      }
    }
  });

  useEffect(() => {
    if (titleContext && deviceIsMobile) {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setTitleContext(null);
      }, mobileFullTextRevealShowDuration);
    }
  }, [titleContext]);

  return (
    <div
      ref={drag(drop(Draggable))}
      key={video.id}
      className={css`
        width: 16%;
        @media (max-width: ${mobileMaxWidth}) {
          width: 32%;
        }
      `}
      style={{
        opacity: isDragging ? 0.5 : 1,
        margin: '0.3%',
        cursor: 'pointer',
        boxShadow: `0 0 5px ${Color.darkerGray()}`,
        background: Color.whiteGray()
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '100%',
          flexDirection: 'column',
          alignItems: 'flex-end'
        }}
      >
        <div style={{ width: '100%' }}>
          <VideoThumbImage
            height="65%"
            videoId={video.id}
            rewardLevel={video.rewardLevel}
            src={`https://img.youtube.com/vi/${video.content}/mqdefault.jpg`}
          />
        </div>
        <div
          style={{
            height: '8rem',
            width: '100%',
            padding: '0 1rem'
          }}
        >
          <div
            ref={ThumbLabelContainerRef}
            onMouseOver={onMouseOver}
            onMouseLeave={() => setTitleContext(null)}
          >
            <p
              ref={ThumbLabelRef}
              style={{
                marginTop: '1rem',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                lineHeight: 'normal'
              }}
            >
              {video.title}
            </p>
            {titleContext && (
              <FullTextReveal
                style={{ fontSize: '1.3rem' }}
                textContext={titleContext}
                text={video.title}
              />
            )}
          </div>
          <p
            style={{
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              fontSize: '1.3rem',
              lineHeight: 2
            }}
          >
            {video.uploaderName}
          </p>
        </div>
      </div>
    </div>
  );

  function onMouseOver() {
    if (textIsOverflown(ThumbLabelRef.current)) {
      const parentElementDimensions =
        ThumbLabelContainerRef.current?.getBoundingClientRect?.() || {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        };
      setTitleContext(parentElementDimensions);
    }
  }
}
