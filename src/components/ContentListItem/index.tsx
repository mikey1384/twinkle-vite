import React, { useEffect, useMemo, useRef, useState } from 'react';
import CommentContent from './CommentContent';
import RootContent from './RootContent';
import { useContentState, useLazyLoad } from '~/helpers/hooks';
import { useNavigate } from 'react-router-dom';
import { placeholderHeights } from '~/constants/state';
import { useKeyContext } from '~/contexts';
import { useInView } from 'react-intersection-observer';

export default function ContentListItem({
  onClick = () => null,
  contentObj,
  contentObj: { id: contentId, contentType },
  expandable,
  modalOverModal,
  onContentIsDeleted,
  selectable,
  selected,
  style,
  innerStyle,
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
  innerStyle?: React.CSSProperties;
}) {
  const [ComponentRef, inView] = useInView({
    threshold: 0
  });
  const previousPlaceholderHeight = useMemo(
    () => placeholderHeights[`list-${contentType}-${contentId}`],
    [contentId, contentType]
  );
  const navigate = useNavigate();
  const PanelRef = useRef(null);
  const { userId } = useKeyContext((v) => v.myState);
  const {
    itemSelected: { color: itemSelectedColor, opacity: itemSelectedOpacity }
  } = useKeyContext((v) => v.theme);
  const [currentContent, setCurrentContent] = useState<any>(contentObj || {});
  const [placeholderHeight, setPlaceholderHeight] = useState(
    previousPlaceholderHeight
  );
  const placeholderHeightRef = useRef(previousPlaceholderHeight);
  const heightNotSet = useMemo(
    () => !previousPlaceholderHeight && !placeholderHeight,
    [placeholderHeight, previousPlaceholderHeight]
  );
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
    secretAnswer,
    secretAttachment,
    story,
    topic,
    title,
    thumbUrl,
    uploader = {}
  } = currentContent;

  useLazyLoad({
    PanelRef,
    onSetPlaceholderHeight: (height: number) => {
      setPlaceholderHeight(height);
      placeholderHeightRef.current = height;
    }
  });

  const contentShown = useMemo(() => {
    return heightNotSet || inView;
  }, [heightNotSet, inView]);

  useEffect(() => {
    return function cleanUp() {
      placeholderHeights[`list-${contentType}-${contentId}`] =
        placeholderHeightRef.current;
    };
  }, [contentId, contentType]);

  return (
    <div
      style={{
        height: contentShown ? 'auto' : placeholderHeight,
        width: style?.width || '100%'
      }}
      ref={ComponentRef}
    >
      {contentShown && (
        <div ref={PanelRef} style={{ width: '100%' }}>
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
              style={style}
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
              secretAnswer={secretAnswer}
              secretAttachment={secretAttachment}
              selectable={selectable}
              story={story}
              style={style}
              innerStyle={innerStyle}
              thumbUrl={thumbUrl}
              title={title}
              topic={topic}
              uploader={uploader}
              userId={userId}
            />
          )}
        </div>
      )}
    </div>
  );
}
