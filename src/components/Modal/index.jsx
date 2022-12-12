import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import Content from './Content';

Modal.propTypes = {
  className: PropTypes.string,
  closeColor: PropTypes.string,
  children: PropTypes.node,
  closeWhenClickedOutside: PropTypes.bool,
  modalOverModal: PropTypes.bool,
  onHide: PropTypes.func,
  small: PropTypes.bool,
  large: PropTypes.bool,
  modalStyle: PropTypes.object,
  style: PropTypes.object
};

export default function Modal({
  className,
  closeColor,
  closeWhenClickedOutside = true,
  children,
  modalOverModal,
  onHide,
  small,
  large,
  modalStyle,
  style
}) {
  const modalWidth = {
    default: '50%',
    small: '26%',
    large: '80%'
  };
  const marginLeft = {
    default: '25%',
    small: '37%',
    large: '10%'
  };
  const widthKey = small ? 'small' : large ? 'large' : 'default';
  const Modal = (
    <ErrorBoundary componentPath="Modal/index">
      <div
        className={`${css`
          position: fixed;
          z-index: 9999999;
          top: 0;
          right: 0;
          left: 0;
          bottom: 0;
        `} ${className}`}
      >
        <div
          className={css`
            position: absolute;
            z-index: 500;
            top: 0;
            right: 0;
            left: 0;
            bottom: 0;
            padding-bottom: 7rem;
            background: ${Color.black(0.5)};
            overflow-y: scroll;
            -webkit-overflow-scrolling: touch;
          `}
          style={style}
        >
          <Content
            closeColor={closeColor}
            closeWhenClickedOutside={closeWhenClickedOutside}
            style={modalStyle}
            eventTypes={['mouseup']}
            className={css`
              position: relative;
              border-radius: ${borderRadius};
              background: #fff;
              width: ${modalWidth[widthKey]};
              min-height: 30vh;
              top: 3rem;
              margin-left: ${marginLeft[widthKey]};
              box-shadow: 3px 4px 5px ${Color.black()};
              display: flex;
              justify-content: flex-start;
              flex-direction: column;
              height: auto;
              > header {
                display: flex;
                align-items: center;
                line-height: 1.5;
                color: ${Color.black()};
                font-weight: bold;
                font-size: 2rem;
                padding: 2rem;
                margin-top: 0.5rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.7rem;
                }
              }
              > main {
                display: flex;
                padding: 1.5rem 2rem;
                font-size: 1.5rem;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                min-height: 20vh;
              }
              > footer {
                padding: 1.5rem 1.5rem 1.5rem 1.5rem;
                display: flex;
                align-items: center;
                justify-content: flex-end;
                border-top: 1px solid ${Color.borderGray()};
              }
              @media (max-width: ${mobileMaxWidth}) {
                width: 100% !important;
                margin: 0;
              }
            `}
            onHide={onHide}
          >
            {children}
          </Content>
        </div>
      </div>
    </ErrorBoundary>
  );
  return modalOverModal
    ? Modal
    : createPortal(Modal, document.getElementById('modal'));
}
