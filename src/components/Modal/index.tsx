import React, { RefObject, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import Content from './Content';

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
  const [maxHeight, setMaxHeight] = useState('100vh');

  useEffect(() => {
    const handleResize = () => {
      if (!wrapped) {
        setMaxHeight(`${window.innerHeight * 0.9}px`);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
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
            className={css`
              position: relative;
              border-radius: ${borderRadius};
              background: #fff;
              width: ${modalWidth[widthKey]};
              top: 3rem;
              margin-left: ${marginLeft[widthKey]};
              box-shadow: 3px 4px 5px ${Color.black()};
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              min-height: 30vh;
              ${wrapped ? '' : `max-height: ${maxHeight};`}
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
                justify-content: flex-start;
                align-items: center;
                ${wrapped ? '' : 'overflow-y: auto;'}
                flex-grow: 1;
                @media (max-width: ${mobileMaxWidth}) {
                  overflow-y: visible;
                  flex-grow: 0;
                }
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
                max-height: none;
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
