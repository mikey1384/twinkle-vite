import React, { useEffect, useMemo, useRef, useState } from 'react';
import Main from './Main';
import { useInView } from 'react-intersection-observer';
import { useContentState, useLazyLoad } from '~/helpers/hooks';
import { css } from '@emotion/css';
import { placeholderHeights, visibles } from '~/constants/state';
import { useNavigate } from 'react-router-dom';
import { useKeyContext, useContentContext } from '~/contexts';

export default function ContentListItem({
  onClick = () => null,
  isAlwaysVisible,
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
  isAlwaysVisible?: boolean;
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
  const previousPlaceholderHeight = useMemo(
    () => placeholderHeights[`listItem-${contentType}-${contentId}`],
    [contentId, contentType]
  );
  const previousVisible = useMemo(
    () => visibles[`listItem-${contentType}-${contentId}`],
    [contentId, contentType]
  );
  const MainRef = useRef(null);
  const [ComponentRef, inView] = useInView({
    rootMargin: '50px 0px 0px 0px',
    threshold: 0,
    skip: isAlwaysVisible
  });
  const inViewRef = useRef(inView);
  const timerRef = useRef<any>(null);
  const [isVisible, setIsVisible] = useState<boolean>(
    typeof previousVisible === 'boolean' ? previousVisible : true
  );

  useEffect(() => {
    inViewRef.current = inView;
    if (inView) {
      clearTimeout(timerRef.current);
      setIsVisible(true);
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 1000);
    }
  }, [inView]);

  const [placeholderHeight, setPlaceholderHeight] = useState(
    previousPlaceholderHeight
  );
  const placeholderHeightRef = useRef(previousPlaceholderHeight);
  const contentShown = useMemo(
    () => isAlwaysVisible || inView || isVisible,
    [inView, isAlwaysVisible, isVisible]
  );

  useLazyLoad({
    PanelRef: MainRef,
    onSetPlaceholderHeight: (height: number) => {
      setPlaceholderHeight(height);
      placeholderHeightRef.current = height;
    }
  });

  useEffect(() => {
    return function cleanUp() {
      placeholderHeights[`listItem-${contentType}-${contentId}`] =
        placeholderHeightRef.current;
      visibles[`listItem-${contentType}-${contentId}`] = inViewRef.current;
    };
  }, [contentId, contentType]);

  const componentStyle = useMemo(() => {
    return css`
      width: ${style?.width || '100%'};
    `;
  }, [style]);

  const componentHeight = useMemo(
    () =>
      contentShown
        ? 'auto'
        : placeholderHeight
        ? placeholderHeight + 3.6
        : '9rem',
    [contentShown, placeholderHeight]
  );
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
    <div
      className={componentStyle}
      style={{
        height: componentHeight
      }}
      ref={ComponentRef}
    >
      {contentShown && (
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
          MainRef={MainRef}
          modalOverModal={modalOverModal}
          navigate={navigate}
          onClick={onClick}
          rewardLevel={rewardLevel}
          rootState={rootState}
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
      )}
    </div>
  );
}
