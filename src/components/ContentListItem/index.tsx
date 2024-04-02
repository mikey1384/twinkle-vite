import React, { useEffect, useMemo } from 'react';
import Main from './Main';
import { useContentState } from '~/helpers/hooks';
import { useNavigate } from 'react-router-dom';
import { useKeyContext, useContentContext } from '~/contexts';

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
  const navigate = useNavigate();
  const { userId } = useKeyContext((v) => v.myState);
  const {
    itemSelected: { color: itemSelectedColor, opacity: itemSelectedOpacity }
  } = useKeyContext((v) => v.theme);
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
    return !!contentObj.notFound || !!isDeleted
      ? null
      : contentType === 'comment';
  }, [contentObj.notFound, contentType, isDeleted]);

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
    <Main
      content={content}
      description={description}
      fileName={fileName}
      filePath={filePath}
      fileSize={fileSize}
      userId={userId}
      contentId={contentId}
      contentType={contentType}
      expandable={expandable}
      innerStyle={innerStyle}
      isCommentItem={isCommentItem}
      itemSelectedColor={itemSelectedColor}
      itemSelectedOpacity={itemSelectedOpacity}
      hideSideBordersOnMobile={hideSideBordersOnMobile}
      modalOverModal={modalOverModal}
      navigate={navigate}
      onClick={onClick}
      rewardLevel={rewardLevel}
      rootId={rootState?.id}
      rootContent={rootState?.content}
      rootRewardLevel={rootState?.rewardLevel}
      secretAnswer={secretAnswer}
      secretAttachment={secretAttachment}
      selectable={selectable}
      selected={selected}
      story={story}
      thumbUrl={thumbUrl}
      title={title}
      topic={topic}
      uploader={uploader}
      style={style}
    />
  );
}
