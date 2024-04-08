import React, { memo } from 'react';
import Container from './Container';

function RootContent({
  content,
  contentId,
  contentType,
  description,
  fileName,
  filePath,
  fileSize,
  onClick,
  rootType,
  expandable,
  hideSideBordersOnMobile,
  itemSelectedColor,
  itemSelectedOpacity,
  modalOverModal,
  navigate,
  rewardLevel,
  rootId,
  rootContent,
  rootContentCSS,
  rootRewardLevel,
  selected,
  selectable,
  story,
  innerStyle,
  thumbUrl,
  title,
  topic,
  uploader,
  userId
}: {
  content: any;
  contentId: number;
  contentType: string;
  description: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  onClick?: () => void;
  rootType?: string;
  expandable?: boolean;
  hideSideBordersOnMobile?: boolean;
  selected?: boolean;
  itemSelectedColor: string;
  itemSelectedOpacity: number;
  modalOverModal?: boolean;
  navigate: (path: string) => void;
  rewardLevel: number;
  rootId?: number;
  rootContent?: string;
  rootRewardLevel?: number;
  rootContentCSS: string;
  secretAnswer: string;
  secretAttachment: string;
  selectable?: boolean;
  story?: string;
  innerStyle?: React.CSSProperties;
  title: string;
  thumbUrl?: string;
  topic?: string;
  uploader: { id: number; username: string };
  userId?: number;
}) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Container
        content={content}
        contentType={contentType}
        contentId={contentId}
        description={description}
        expandable={expandable}
        fileName={fileName}
        filePath={filePath}
        fileSize={fileSize}
        hideSideBordersOnMobile={hideSideBordersOnMobile}
        innerStyle={innerStyle}
        itemSelectedOpacity={itemSelectedOpacity}
        itemSelectedColor={itemSelectedColor}
        modalOverModal={modalOverModal}
        navigate={navigate}
        onClick={onClick}
        rewardLevel={rewardLevel}
        rootContent={rootContent}
        rootId={rootId}
        rootContentCSS={rootContentCSS}
        rootRewardLevel={rootRewardLevel}
        rootType={rootType}
        selected={selected}
        selectable={selectable}
        story={story}
        thumbUrl={thumbUrl}
        title={title}
        topic={topic}
        uploader={uploader}
        userId={userId}
      />
    </div>
  );
}

export default memo(RootContent);
