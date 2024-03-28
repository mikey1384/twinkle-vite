import React, { useEffect, useMemo } from 'react';
import CommentContent from './CommentContent';
import RootContent from './RootContent';
import { useNavigate } from 'react-router-dom';
import { useContentState } from '~/helpers/hooks';
import { useKeyContext, useContentContext } from '~/contexts';

export default function Main({
  contentObj,
  contentObj: { rootType, notFound },
  contentId,
  contentType,
  expandable,
  hideSideBordersOnMobile,
  innerStyle,
  onContentIsDeleted,
  MainRef,
  modalOverModal,
  onClick,
  selected,
  selectable,
  style
}: {
  contentObj: {
    id: number;
    contentType: string;
    uploader: {
      id: number;
      username: string;
      profilePicUrl?: string;
    };
    content?: string;
    story?: string;
    fileName?: string;
    filePath?: string;
    fileSize?: number;
    topic?: string;
    thumbUrl?: string;
    rootType?: string;
    notFound?: boolean;
  };
  contentId: number;
  contentType: string;
  expandable?: boolean;
  hideSideBordersOnMobile?: boolean;
  innerStyle?: React.CSSProperties;
  onContentIsDeleted?: (contentId: number) => void;
  MainRef: React.RefObject<HTMLDivElement>;
  modalOverModal?: boolean;
  onClick?: () => void;
  selected?: boolean;
  selectable?: boolean;
  style?: React.CSSProperties;
}) {
  const { userId } = useKeyContext((v) => v.myState);
  const {
    itemSelected: { color: itemSelectedColor, opacity: itemSelectedOpacity }
  } = useKeyContext((v) => v.theme);
  const navigate = useNavigate();
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  const {
    content,
    description,
    isDeleted,
    fileName,
    filePath,
    fileSize,
    loaded,
    rewardLevel,
    rootObj,
    secretAnswer,
    secretAttachment,
    story,
    topic,
    title,
    thumbUrl,
    uploader = {}
  } = useContentState({ contentId, contentType });

  const rootState = useContentState({
    contentId: rootObj?.id,
    contentType: rootObj?.contentType
  });

  useEffect(() => {
    if (isDeleted) {
      onContentIsDeleted?.(contentId);
    }
  }, [contentId, isDeleted, onContentIsDeleted]);

  const isCommentItem = useMemo(() => {
    return !!notFound || !!isDeleted ? null : contentType === 'comment';
  }, [contentType, isDeleted, notFound]);

  useEffect(() => {
    if (!loaded) {
      onInitContent({ contentId, ...contentObj });
    }
    if (rootObj?.id && !rootState?.loaded) {
      onInitContent({
        contentId: rootObj.id,
        contentType: rootObj.contentType,
        ...rootObj
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, rootObj?.id, rootState?.loaded]);

  return (
    <div style={{ width: style?.width || '100%' }} ref={MainRef}>
      {isCommentItem ? (
        <CommentContent contentObj={contentObj} style={style} />
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
          rootType={rootType}
          expandable={expandable}
          selected={selected}
          hideSideBordersOnMobile={hideSideBordersOnMobile}
          itemSelectedColor={itemSelectedColor}
          itemSelectedOpacity={itemSelectedOpacity}
          modalOverModal={modalOverModal}
          navigate={navigate}
          rewardLevel={rewardLevel}
          rootObj={rootState}
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
  );
}
