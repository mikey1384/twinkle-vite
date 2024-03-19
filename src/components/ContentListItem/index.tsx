import React, { memo, useEffect } from 'react';
import PropTypes from 'prop-types';
import CommentContent from './CommentContent';
import RootContent from './RootContent';
import { useNavigate } from 'react-router-dom';
import { useContentState } from '~/helpers/hooks';
import { useContentContext, useKeyContext } from '~/contexts';

ContentListItem.propTypes = {
  onClick: PropTypes.func,
  contentObj: PropTypes.object.isRequired,
  expandable: PropTypes.bool,
  modalOverModal: PropTypes.bool,
  onContentIsDeleted: PropTypes.func,
  selectable: PropTypes.bool,
  selected: PropTypes.bool,
  style: PropTypes.object,
  innerStyle: PropTypes.object,
  hideSideBordersOnMobile: PropTypes.bool
};
function ContentListItem({
  onClick = () => null,
  contentObj,
  contentObj: { id: contentId, contentType, rootType, notFound },
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
  contentObj: {
    id: number;
    contentType: string;
    uploader: {
      id: number;
      username: string;
      profilePicUrl: string;
    };
    content: string;
    story: string;
    fileName?: string;
    filePath?: string;
    fileSize?: number;
    topic?: string;
    thumbUrl?: string;
    rootType?: string;
    notFound?: boolean;
  };
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
  const onInitContent = useContentContext((v) => v.actions.onInitContent);
  useEffect(() => {
    if (!loaded) {
      onInitContent({ contentId, ...contentObj });
    }
    if (rootObj) {
      onInitContent({
        contentId: rootObj.id,
        contentType: rootObj.contentType,
        ...rootObj
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  useEffect(() => {
    if (isDeleted) {
      onContentIsDeleted?.(contentId);
    }
  }, [contentId, isDeleted, onContentIsDeleted]);

  return !!notFound || !!isDeleted ? null : contentType === 'comment' ? (
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
      rootObj={rootObj}
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
}

export default memo(ContentListItem);
