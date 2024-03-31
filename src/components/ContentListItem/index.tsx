import React, { useEffect, useMemo, useRef, useState } from 'react';
import Main from './Main';
import { useInView } from 'react-intersection-observer';
import { useLazyLoad } from '~/helpers/hooks';
import { css } from '@emotion/css';
import { placeholderHeights, visibles } from '~/constants/state';

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
    threshold: 0
  });
  const inViewRef = useRef(inView);
  useEffect(() => {
    inViewRef.current = inView;
  }, [inView]);
  const [placeholderHeight, setPlaceholderHeight] = useState(
    previousPlaceholderHeight
  );
  const placeholderHeightRef = useRef(previousPlaceholderHeight);
  const [visible, setVisible] = useState(previousVisible);
  const visibleRef = useRef(previousVisible);
  const contentShown = useMemo(() => visible || inView, [inView, visible]);

  useLazyLoad({
    PanelRef: MainRef,
    inView,
    onSetPlaceholderHeight: (height: number) => {
      setPlaceholderHeight(height);
      placeholderHeightRef.current = height;
    },
    onSetVisible: (visible: boolean) => {
      setVisible(visible);
      visibleRef.current = visible;
    },
    delay: 1500
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
          contentObj={contentObj}
          contentId={contentId}
          contentType={contentType}
          expandable={expandable}
          innerStyle={innerStyle}
          hideSideBordersOnMobile={hideSideBordersOnMobile}
          onContentIsDeleted={onContentIsDeleted}
          MainRef={MainRef}
          modalOverModal={modalOverModal}
          onClick={onClick}
          selectable={selectable}
          selected={selected}
          style={style}
        />
      )}
    </div>
  );
}
