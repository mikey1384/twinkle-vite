import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import CommentContent from './CommentContent';
import RootContent from './RootContent';
import { useContentState } from '~/helpers/hooks';
import { useNavigate } from 'react-router-dom';
import { useKeyContext } from '~/contexts';
import { useInView } from 'react-intersection-observer';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

const rootContentCSS = css`
  height: 100%;
  display: grid;
  grid-template-columns: 3fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  grid-template-areas:
    'title thumb'
    'description description'
    'reward reward';
  align-items: center;
  gap: 0.7rem;
  padding: 1rem;
  cursor: pointer;
  border-radius: ${borderRadius};

  .title {
    grid-area: title;
    font-weight: bold;
    font-size: 2.2rem;
  }

  .description {
    grid-area: description;
    color: ${Color.black()};
    transition: color 1s;
  }

  .reward-bar {
    grid-area: reward;
    font-size: 1.3rem;
  }

  transition: background 0.5s, border 0.5s;

  &:hover {
    .title {
      color: ${Color.black()};
    }
  }

  &.expandable {
    background: ${Color.whiteGray()};
  }

  &.selected {
    border: 0.5rem solid var(--border-color);
    &:hover {
      border-color: var(--border-color);
    }
  }

  &:not(.selected) {
    border: 1px solid ${Color.borderGray()};
    &:hover {
      border-color: ${Color.darkerBorderGray()};
      background: ${Color.highlightGray()};
    }
  }

  @media (max-width: ${mobileMaxWidth}) {
    &.hideSideBordersOnMobile {
      border-left: none;
      border-right: none;
    }
  }

  @media (max-width: ${mobileMaxWidth}) {
    margin-top: -0.5rem;
    .posted,
    .reward-bar {
      font-size: 1rem;
    }
    .title {
      font-size: 1.8rem;
    }
  }
`;

function ContentListItem({
  onClick,
  contentObj,
  contentObj: { id: contentId, contentType },
  expandable,
  modalOverModal,
  onContentIsDeleted,
  selectable,
  selected,
  style,
  hideSideBordersOnMobile
}: {
  onClick?: () => void;
  contentObj: any;
  expandable?: boolean;
  modalOverModal?: boolean;
  onContentIsDeleted?: (contentId: number) => void;
  selectable?: boolean;
  selected?: boolean;
  style?: React.CSSProperties;
  hideSideBordersOnMobile?: boolean;
}) {
  const [ComponentRef, inView] = useInView();
  const navigate = useNavigate();
  const PanelRef = useRef(null);
  const { userId } = useKeyContext((v) => v.myState);
  const {
    itemSelected: { color: itemSelectedColor, opacity: itemSelectedOpacity }
  } = useKeyContext((v) => v.theme);
  const [currentContent, setCurrentContent] = useState<any>(contentObj || {});
  const [rootContent, setRootContent] = useState<any>(
    contentObj?.rootObj || {}
  );
  const contentState = useContentState({ contentId, contentType });
  const rootState = useContentState({
    contentId: currentContent?.rootObj?.id,
    contentType: currentContent?.rootObj?.contentType
  });

  useEffect(() => {
    if (currentContent.isDeleted) {
      onContentIsDeleted?.(contentId);
    }
  }, [contentId, currentContent.isDeleted, onContentIsDeleted]);

  const isCommentItem = useMemo(() => {
    return !!currentContent.notFound || !!currentContent.isDeleted
      ? null
      : contentType === 'comment';
  }, [contentType, currentContent.isDeleted, currentContent.notFound]);

  useEffect(() => {
    if (contentState.loaded) {
      setCurrentContent(contentState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentState?.loaded]);

  useEffect(() => {
    if (currentContent?.rootObj?.id && rootState.loaded) {
      setRootContent(rootState);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentContent?.rootObj?.id, rootState?.loaded]);

  const {
    content,
    description,
    fileName,
    filePath,
    fileSize,
    rewardLevel,
    story,
    topic,
    title,
    thumbUrl,
    uploader = {}
  } = currentContent;

  const borderColor = useMemo(() => {
    return selected
      ? Color[itemSelectedColor](itemSelectedOpacity)
      : Color.borderGray();
  }, [selected, itemSelectedColor, itemSelectedOpacity]);

  return (
    <div
      style={{
        width: style?.width || '100%',
        height: '17rem',
        overflow: 'hidden',
        ...(expandable ? { marginTop: '-1rem' } : {}),
        ...style
      }}
      className={css`
        '--border-color': ${borderColor};
      `}
      ref={ComponentRef}
    >
      {inView ? (
        <div ref={PanelRef} style={{ width: '100%', height: '100%' }}>
          {isCommentItem ? (
            <CommentContent
              contentId={contentId}
              contentType={contentType}
              uploader={uploader}
              content={content}
              fileName={fileName}
              filePath={filePath}
              fileSize={fileSize}
              thumbUrl={thumbUrl}
            />
          ) : (
            <RootContent
              content={content}
              contentId={contentId}
              contentType={contentType}
              description={description}
              fileName={fileName}
              filePath={filePath}
              fileSize={fileSize}
              onClick={onClick}
              rootType={rootContent.contentType}
              expandable={expandable}
              selected={selected}
              hideSideBordersOnMobile={hideSideBordersOnMobile}
              itemSelectedColor={itemSelectedColor}
              itemSelectedOpacity={itemSelectedOpacity}
              modalOverModal={modalOverModal}
              navigate={navigate}
              rewardLevel={rewardLevel}
              rootId={rootContent.id}
              rootContent={rootContent}
              rootRewardLevel={rootContent.rewardLevel}
              rootContentCSS={rootContentCSS}
              selectable={selectable}
              story={story}
              thumbUrl={thumbUrl}
              title={title}
              topic={topic}
              uploader={uploader}
              userId={userId}
            />
          )}
        </div>
      ) : (
        <div style={{ width: '100%' }} />
      )}
    </div>
  );
}

export default memo(ContentListItem);
