import { useRef } from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { useOutsideClick } from '~/helpers/hooks';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

Content.propTypes = {
  closeColor: PropTypes.string,
  closeWhenClickedOutside: PropTypes.bool,
  onHide: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object
};

export default function Content({
  closeColor,
  closeWhenClickedOutside,
  children,
  className,
  onHide,
  style
}) {
  const ContentRef = useRef(null);
  useOutsideClick(ContentRef, () =>
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
