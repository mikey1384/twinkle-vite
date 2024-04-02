import React, { useEffect, useMemo, useRef, useState } from 'react';
import Main from './Main';
import { useInView } from 'react-intersection-observer';
import { useLazyLoad } from '~/helpers/hooks';
import { css } from '@emotion/css';
import { placeholderHeights, visibles } from '~/constants/state';

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
  const previousPlaceholderHeight = useMemo(
    () => placeholderHeights[`listItem-${contentType}-${contentId}`],
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
  const contentShown = useMemo(
    () => isAlwaysVisible || inView,
    [inView, isAlwaysVisible]
  );

  useLazyLoad({
    PanelRef: MainRef,
    initialHeight: previousPlaceholderHeight,
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
