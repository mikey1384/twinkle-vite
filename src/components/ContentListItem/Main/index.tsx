import React, { memo } from 'react';
import CommentContent from './CommentContent';
import RootContent from './RootContent';

function Main({
  content,
  description,
  contentObj,
  contentObj: { rootType },
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

export default memo(Main);
