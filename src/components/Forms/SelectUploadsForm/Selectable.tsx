import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import VideoThumbImage from '~/components/VideoThumbImage';
import Embedly from '~/components/Embedly';
import ErrorBoundary from '~/components/ErrorBoundary';
import { isMobile, textIsOverflown } from '~/helpers';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useKeyContext } from '~/contexts';

const deviceIsMobile = isMobile(navigator);

Selectable.propTypes = {
  contentType: PropTypes.string,
  item: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
  onDeselect: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired
};
export default function Selectable({
  contentType = 'video',
  item = {},
  onSelect,
  onDeselect,
  selected
}: {
  contentType?: string;
  item: any;
  onSelect: (id: string) => void;
  onDeselect: (id: string) => void;
  selected: boolean;
}) {
  const {
    itemSelected: { color: itemSelectedColor, opacity: itemSelectedOpacity }
  } = useKeyContext((v) => v.theme);
  const [titleHovered, setTitleHovered] = useState(false);
  const highlightColor = Color[itemSelectedColor](itemSelectedOpacity);
  const ThumbLabelRef: React.RefObject<any> = useRef(null);

  return (
    <ErrorBoundary
      componentPath="SelectUploadsForm/Selectable"
      className={`unselectable ${css`
        width: 16%;
        @media (max-width: ${mobileMaxWidth}) {
          width: 32%;
        }
      `}`}
      style={{
        margin: '0.3%',
        cursor: 'pointer',
        boxShadow: `0 0 5px ${selected ? highlightColor : Color.darkerGray()}`,
        border: selected ? `0.5rem solid ${highlightColor}` : '',
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
        onClick={() => {
          if (selected) {
            onDeselect(item.id);
          } else {
            onSelect(item.id);
          }
        }}
      >
        <div style={{ width: '100%' }}>
          {contentType === 'video' ? (
            <VideoThumbImage
              videoId={item.id}
              rewardLevel={item.rewardLevel}
              src={`https://img.youtube.com/vi/${item.content}/mqdefault.jpg`}
            />
          ) : (
            <Embedly
              noLink
              imageOnly
              contentType={contentType}
              contentId={item.id}
            />
          )}
        </div>
        <div
          style={{
            height: '8rem',
            width: '100%',
            padding: '0 1rem'
          }}
        >
          <div
            onMouseOver={handleMouseOver}
            onMouseLeave={() => setTitleHovered(false)}
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
              {item.title}
            </p>
            <FullTextReveal show={titleHovered} text={item.title} />
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
            {item.uploader ? item.uploader.username : item.uploaderName}
          </p>
        </div>
      </div>
    </ErrorBoundary>
  );

  function handleMouseOver() {
    if (textIsOverflown(ThumbLabelRef.current) && !deviceIsMobile) {
      setTitleHovered(true);
    }
  }
}
