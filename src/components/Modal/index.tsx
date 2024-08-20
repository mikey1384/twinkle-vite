import React, { RefObject, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { isMobile } from '~/helpers';
import ErrorBoundary from '~/components/ErrorBoundary';
import Content from './Content';

const deviceIsMobile = isMobile(navigator);

export default function Modal({
  className,
  closeColor,
  closeWhenClickedOutside = true,
  children,
  hasPriority,
  innerRef,
  modalOverModal,
  onHide,
  small,
  medium,
  large,
  modalStyle,
  style,
  wrapped
}: {
  className?: string;
  closeColor?: string;
  closeWhenClickedOutside?: boolean;
  children?: any;
  hasPriority?: boolean;
  innerRef?: RefObject<any> | ((instance: any) => void);
  modalOverModal?: boolean;
  onHide?: () => void;
  small?: boolean;
  medium?: boolean;
  large?: boolean;
  modalStyle?: object;
  style?: object;
  wrapped?: boolean;
}) {
  const [modalHeight, setModalHeight] = useState('auto');

  useEffect(() => {
    function updateModalDimensions() {
      const windowHeight = window.innerHeight;

      if (!wrapped) {
        const maxHeight = deviceIsMobile ? windowHeight : windowHeight - 160;
        setModalHeight(`${maxHeight}px`);
      }
    }

    updateModalDimensions();
    window.addEventListener('resize', updateModalDimensions);
    return () => window.removeEventListener('resize', updateModalDimensions);
  }, [wrapped]);

  const modalWidth = {
    small: '26%',
    medium: '35%',
    default: '50%',
    large: '80%'
  };
  const marginLeft = {
    small: '37%',
    medium: '31%',
    default: '25%',
    large: '10%'
  };
  const widthKey = small
    ? 'small'
    : medium
    ? 'medium'
    : large
    ? 'large'
    : 'default';

  const Modal = (
    <ErrorBoundary componentPath="Modal/index">
      <div
        className={`${css`
          position: fixed;
          z-index: ${9_999_999 +
          (hasPriority || modalOverModal ? 1_000_000_000 : 0)};
          top: 0;
          right: 0;
          left: 0;
          bottom: 0;
        `} ${className}`}
      >
        <div
          ref={innerRef}
          className={css`
            position: absolute;
            z-index: 500;
            top: 0;
            right: 0;
            left: 0;
            bottom: 0;
            padding-bottom: ${deviceIsMobile ? '0' : '7rem'};
            background: ${Color.black(0.5)};
            overflow-y: scroll;
            -webkit-overflow-scrolling: touch;
          `}
          style={style}
        >
          <Content
            closeColor={closeColor}
            closeWhenClickedOutside={closeWhenClickedOutside}
            style={{
              ...modalStyle,
              height: wrapped ? 'auto' : modalHeight,
              maxHeight: wrapped ? 'none' : '100%'
            }}
            className={css`
              position: relative;
              border-radius: ${deviceIsMobile ? '0' : borderRadius};
              background: #fff;
              width: ${deviceIsMobile ? '100%' : modalWidth[widthKey]};
              top: ${deviceIsMobile ? '0' : '3rem'};
              margin-left: ${deviceIsMobile ? '0' : marginLeft[widthKey]};
              box-shadow: ${deviceIsMobile
                ? 'none'
                : `3px 4px 5px ${Color.black()}`};
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              min-height: ${deviceIsMobile ? '100%' : '30vh'};
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
                  padding: 1.5rem;
                }
              }
              > main {
                display: flex;
                padding: 1.5rem 2rem;
                font-size: 1.5rem;
                flex-direction: column;
                justify-content: flex-start;
                align-items: center;
                overflow-y: ${wrapped ? 'visible' : 'auto'};
                flex-grow: 1;
                @media (max-width: ${mobileMaxWidth}) {
                  padding: 1rem;
                  overflow-y: ${wrapped ? 'visible' : 'auto'};
                }
              }
              > footer {
                padding: 1.5rem;
                display: flex;
                align-items: center;
                justify-content: flex-end;
                border-top: 1px solid ${Color.borderGray()};
                @media (max-width: ${mobileMaxWidth}) {
                  padding: 1rem;
                }
              }
              @media (max-width: ${mobileMaxWidth}) {
                width: 100% !important;
                margin: 0;
                height: 100% !important;
                max-height: none;
                border-radius: 0;
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
    : document.getElementById('modal')
    ? createPortal(Modal, document.getElementById('modal') as HTMLElement)
    : null;
}
