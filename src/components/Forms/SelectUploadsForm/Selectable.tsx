import React, { useRef, useState } from 'react';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import VideoThumbImage from '~/components/VideoThumbImage';
import Embedly from '~/components/Embedly';
import ErrorBoundary from '~/components/ErrorBoundary';
import { isMobile, textIsOverflown } from '~/helpers';
import { Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import { useRoleColor } from '~/theme/hooks/useRoleColor';

const deviceIsMobile = isMobile(navigator);

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
    defaultOpacity: itemSelectedOpacity = 0.4,
    getColor: getItemSelectedColor
  } = useRoleColor('itemSelected', {
    opacity: 0.4,
    fallback: 'logoBlue'
  });
  const [titleHovered, setTitleHovered] = useState(false);
  const highlightColor = getItemSelectedColor(itemSelectedOpacity);
  const ThumbLabelRef: React.RefObject<any> = useRef(null);

  return (
    <ErrorBoundary
      componentPath="SelectUploadsForm/Selectable"
      className={`unselectable ${css`
        width: calc(33.333% - 8px);
        min-width: 0;
        @media (max-width: ${mobileMaxWidth}) {
          width: calc(50% - 8px);
        }
        [role='button']:focus-visible {
          outline: 2px solid currentColor;
          outline-offset: 2px;
        }
      `}`}
      style={{
        margin: 4,
        cursor: 'pointer',
        boxShadow: `0 0 5px ${selected ? highlightColor : Color.darkerGray()}`,
        border: selected ? `0.5rem solid ${highlightColor}` : '',
        background: Color.whiteGray()
      }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        aria-label={`${selected ? 'Deselect' : 'Select'} ${item.title || contentType}`}
        onKeyDown={(event) => {
          if (
            event.target !== event.currentTarget ||
            event.nativeEvent.isComposing ||
            event.repeat
          )
            return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (selected) onDeselect(item.id);
            else onSelect(item.id);
          }
        }}
        onFocus={() => setTitleHovered(true)}
        onBlur={() => setTitleHovered(false)}
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
            minHeight: '8rem',
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
                fontSize: 14,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                lineHeight: 1.4
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
              fontSize: 12,
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
