import React, { memo, useMemo } from 'react';
import Container from './Container';
import { css } from '@emotion/css';

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
  rootRewardLevel,
  secretAnswer,
  secretAttachment,
  selected,
  selectable,
  story,
  style,
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
  secretAnswer: string;
  secretAttachment: string;
  selectable?: boolean;
  story?: string;
  style?: React.CSSProperties;
  innerStyle?: React.CSSProperties;
  title: string;
  thumbUrl?: string;
  topic?: string;
  uploader: { id: number; username: string };
  userId?: number;
}) {
  const componentStyle = useMemo(() => {
    return css`
      width: ${style?.width || '100%'};
    `;
  }, [style]);

  return (
    <div style={{ width: '100%' }} className={componentStyle}>
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
        rootRewardLevel={rootRewardLevel}
        rootType={rootType}
        secretAnswer={secretAnswer}
        secretAttachment={secretAttachment}
        selected={selected}
        selectable={selectable}
        story={story}
        style={style}
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
