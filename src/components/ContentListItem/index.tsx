import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Main from './Main';
import { useInView } from 'react-intersection-observer';
import { useLazyLoad } from '~/helpers/hooks';
import { placeholderHeights, visibles } from '~/constants/state';

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
  const previousPlaceholderHeight =
    placeholderHeights[`listItem-${contentType}-${contentId}`];
  const previousVisible = visibles[`listItem-${contentType}-${contentId}`];
  const MainRef = useRef(null);
  const [ComponentRef, inView] = useInView({
    threshold: 0
  });
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
    delay: 500
  });

  useEffect(() => {
    return function cleanUp() {
      placeholderHeights[`listItem-${contentType}-${contentId}`] =
        placeholderHeightRef.current;
      visibles[`listItem-${contentType}-${contentId}`] = false;
    };
  }, [contentId, contentType]);

  return (
    <div
      style={{
        width: style?.width || '100%',
        height: contentShown
          ? 'auto'
          : placeholderHeight
          ? placeholderHeight + 2
          : '9rem'
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
