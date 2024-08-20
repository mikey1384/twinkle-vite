import React, { useRef } from 'react';
import Icon from '~/components/Icon';
import { useOutsideTap, useOutsideClick } from '~/helpers/hooks';
import { isMobile } from '~/helpers';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

const deviceIsMobile = isMobile(navigator);
const outsideClickMethod = deviceIsMobile ? useOutsideTap : useOutsideClick;

export default function Content({
  closeColor,
  closeWhenClickedOutside,
  children,
  className,
  onHide,
  style
}: {
  closeColor?: string;
  closeWhenClickedOutside?: boolean;
  children?: any;
  className?: string;
  onHide?: () => void;
  style?: object;
}) {
  const ContentRef = useRef(null);
  outsideClickMethod(ContentRef, () =>
    closeWhenClickedOutside ? onHide?.() : null
  );
  return (
    <div style={style} className={className} ref={ContentRef}>
      <button
        className={css`
          background: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          position: absolute;
          top: 1rem;
          right: 1rem;
          border: none;
          width: 30px;
          height: 30px;
          cursor: pointer;
          .close {
            z-index: 100;
            color: ${closeColor || Color.darkerGray()};
            opacity: 0.5;
          }
          &:hover {
            > .close {
              opacity: 1;
            }
          }
        `}
        onClick={onHide}
      >
        <Icon className="close" icon="times" />
      </button>
      {children}
    </div>
  );
}
