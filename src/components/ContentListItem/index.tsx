import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import CommentContent from './CommentContent';
import RootContent from './RootContent';
import { useContentState, useLazyLoad } from '~/helpers/hooks';
import { useNavigate } from 'react-router-dom';
import { useKeyContext } from '~/contexts';
import { useRoleColor } from '~/theme/useRoleColor';
import { useInView } from 'react-intersection-observer';

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
  hideSideBordersOnMobile,
  noTopBorderRadius
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
  noTopBorderRadius?: boolean;
}) {
  const [ComponentRef, inView] = useInView();
  const navigate = useNavigate();
  const PanelRef = useRef(null);
  const userId = useKeyContext((v) => v.myState.userId);
  const itemSelectedRole = useRoleColor('itemSelected', {
    fallback: 'logoBlue'
  });
  const itemSelectedColor = itemSelectedRole.colorKey || 'logoBlue';
  const itemSelectedOpacity = itemSelectedRole.defaultOpacity ?? 0.8;

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
    isListening,
    actualTitle,
    actualDescription,
    content,
    description,
    fileName,
    filePath,
    fileSize,
    rewardLevel,
    siteUrl,
    story,
    topic,
    title,
    thumbUrl,
    uploader = {}
  } = currentContent;

  const isVisible = useLazyLoad({
    id: `list-item-${contentType}-${contentId}`,
    inView,
    PanelRef
  });

  const contentShown = useMemo(() => {
    return isVisible || inView;
  }, [inView, isVisible]);

  return (
    <div
      style={{
        width: style?.width || '100%',
        height: '17rem',
        overflow: 'hidden',
        ...(expandable ? { marginTop: 'CALC(-1rem - 1px)' } : {}),
        ...style
      }}
      ref={ComponentRef}
    >
      {contentShown ? (
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
              actualTitle={actualTitle}
              actualDescription={actualDescription}
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
              noTopBorderRadius={noTopBorderRadius}
              itemSelectedColor={itemSelectedColor}
              itemSelectedOpacity={itemSelectedOpacity}
              isListening={isListening}
              modalOverModal={modalOverModal}
              navigate={navigate}
              rewardLevel={rewardLevel}
              rootId={rootContent.id}
              rootContent={rootContent}
              rootRewardLevel={rootContent.rewardLevel}
              siteUrl={siteUrl}
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
