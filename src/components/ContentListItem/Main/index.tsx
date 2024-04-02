import React, { memo, useMemo } from 'react';
import CommentContent from './CommentContent';
import RootContent from './RootContent';

function Main({
  content,
  description,
  contentId,
  contentType,
  expandable,
  fileName,
  filePath,
  fileSize,
  hideSideBordersOnMobile,
  innerStyle,
  isCommentItem,
  itemSelectedColor,
  itemSelectedOpacity,
  MainRef,
  modalOverModal,
  navigate,
  onClick,
  rewardLevel,
  rootType,
  rootState,
  secretAnswer,
  selected,
  selectable,
  secretAttachment,
  style,
  story,
  title,
  topic,
  thumbUrl,
  uploader,
  userId
}: {
  content: string;
  description: string;
  contentId: number;
  contentType: string;
  expandable?: boolean;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  hideSideBordersOnMobile?: boolean;
  isCommentItem?: boolean | null;
  itemSelectedColor: string;
  itemSelectedOpacity: number;
  innerStyle?: React.CSSProperties;
  MainRef: React.RefObject<HTMLDivElement>;
  modalOverModal?: boolean;
  navigate: (v: any) => void;
  onClick?: () => void;
  rewardLevel: number;
  rootState?: any;
  rootType?: string;
  secretAnswer: string;
  selected?: boolean;
  selectable?: boolean;
  secretAttachment: string;
  style?: React.CSSProperties;
  story?: string;
  title: string;
  topic?: string;
  thumbUrl?: string;
  uploader: { id: number; username: string };
  userId: number;
}) {
  const InnerContent = useMemo(() => {
    return isCommentItem ? (
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
    );
  }, [
    content,
    contentId,
    contentType,
    description,
    expandable,
    fileName,
    filePath,
    fileSize,
    hideSideBordersOnMobile,
    innerStyle,
    isCommentItem,
    itemSelectedColor,
    itemSelectedOpacity,
    modalOverModal,
    navigate,
    onClick,
    rewardLevel,
    rootState,
    rootType,
    secretAnswer,
    secretAttachment,
    selectable,
    selected,
    story,
    style,
    thumbUrl,
    title,
    topic,
    uploader,
    userId
  ]);

  return (
    <div style={{ width: style?.width || '100%' }} ref={MainRef}>
      {InnerContent}
    </div>
  );
}

export default memo(Main);
