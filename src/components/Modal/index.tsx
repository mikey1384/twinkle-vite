import React, { RefObject, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { css } from '@emotion/css';
import { borderRadius, Color } from '~/constants/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import Content from './Content';
import { isMobile, isTablet } from '~/helpers';

const deviceIsMobile = isMobile(navigator);
const deviceIsTablet = isTablet(navigator);

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
    const updateDimensions = () => {
      if (!wrapped) {
        const newMaxHeight = `${window.innerHeight * 0.9}px`;
        setMaxHeight(newMaxHeight);
      }
    };

    const handleOrientationChange = () => {
      setTimeout(updateDimensions, 100);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateDimensions();
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', handleOrientationChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [wrapped]);

  const getModalDimensions = () => {
    const isLandscape = window.innerWidth > window.innerHeight;

    if (deviceIsTablet) {
      if (isLandscape) {
        // Tablet landscape mode dimensions
        return {
          width: small ? '40%' : medium ? '50%' : large ? '90%' : '60%',
          marginLeft: small ? '30%' : medium ? '25%' : large ? '5%' : '20%'
        };
      } else {
        // Tablet portrait mode dimensions
        return {
          width: small ? '70%' : medium ? '80%' : large ? '95%' : '85%',
          marginLeft: small ? '15%' : medium ? '10%' : large ? '2.5%' : '7.5%'
        };
      }
    }

    if (deviceIsMobile) {
      if (isLandscape) {
        // Mobile landscape mode dimensions
        return {
          width: small ? '30%' : medium ? '40%' : large ? '80%' : '50%',
          marginLeft: small ? '35%' : medium ? '30%' : large ? '10%' : '25%'
        };
      } else {
        // Mobile portrait mode dimensions
        return {
          width: '90%',
          marginLeft: '5%'
        };
      }
    }

    // Desktop dimensions
    return {
      width: small ? '26%' : medium ? '35%' : large ? '80%' : '50%',
      marginLeft: small ? '37%' : medium ? '31%' : large ? '10%' : '25%'
    };
  };

  const { width, marginLeft } = getModalDimensions();

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
              width: ${width};
              margin-left: ${marginLeft};
              top: ${deviceIsMobile || deviceIsTablet ? '1rem' : '3rem'};
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
                font-size: ${deviceIsMobile || deviceIsTablet
                  ? '1.7rem'
                  : '2rem'};
                padding: ${deviceIsMobile || deviceIsTablet
                  ? '1.5rem'
                  : '2rem'};
                margin-top: 0.5rem;
              }
              > main {
                display: flex;
                padding: ${deviceIsMobile || deviceIsTablet
                  ? '1rem 1.5rem'
                  : '1.5rem 2rem'};
                font-size: ${deviceIsMobile || deviceIsTablet
                  ? '1.3rem'
                  : '1.5rem'};
                flex-direction: column;
                justify-content: flex-start;
                align-items: center;
                ${wrapped ? '' : 'overflow-y: auto;'}
                flex-grow: 1;
              }
              > footer {
                padding: 1.5rem;
                display: flex;
                align-items: center;
                justify-content: flex-end;
                border-top: 1px solid ${Color.borderGray()};
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
