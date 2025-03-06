import React, { RefObject, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { css } from '@emotion/css';
import { borderRadius, Color } from '~/constants/css';
import ErrorBoundary from '~/components/ErrorBoundary';
import Content from './Content';
import { isMobile, isTablet, debounce } from '~/helpers';

type Size = 'small' | 'medium' | 'large' | 'default';
type Orientation = 'landscape' | 'portrait';
type DeviceType = 'desktop' | 'tablet' | 'mobile';

const deviceIsMobile = isMobile(navigator);
const deviceIsTablet = isTablet(navigator);
const dimensions: {
  [key in DeviceType]: {
    [key in Orientation | Size]?:
      | {
          [key in Size]: string;
        }
      | string;
  };
} = {
  desktop: { small: '26%', medium: '35%', large: '80%', default: '50%' },
  tablet: {
    landscape: {
      small: '40%',
      medium: '50%',
      large: '90%',
      default: '60%'
    },
    portrait: { small: '80%', medium: '85%', large: '95%', default: '90%' }
  },
  mobile: {
    landscape: {
      small: '30%',
      medium: '40%',
      large: '80%',
      default: '50%'
    },
    portrait: { small: '95%', medium: '95%', large: '95%', default: '95%' }
  }
};

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

    const debouncedUpdateDimensions = debounce(updateDimensions, 100);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        debouncedUpdateDimensions();
      }
    };

    updateDimensions();

    window.addEventListener('resize', debouncedUpdateDimensions);
    window.addEventListener('orientationchange', debouncedUpdateDimensions);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', debouncedUpdateDimensions);
      window.removeEventListener(
        'orientationchange',
        debouncedUpdateDimensions
      );
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [wrapped]);

  const { width, marginLeft } = useMemo(() => {
    const isLandscape = window.innerWidth > window.innerHeight;
    let deviceType: DeviceType = 'desktop';
    if (deviceIsTablet) deviceType = 'tablet';
    if (deviceIsMobile) deviceType = 'mobile';

    const orientation: Orientation = isLandscape ? 'landscape' : 'portrait';
    const size: Size = small
      ? 'small'
      : medium
      ? 'medium'
      : large
      ? 'large'
      : 'default';

    let width: string;
    const deviceDimensions = dimensions[deviceType];

    if (typeof deviceDimensions[orientation] === 'object') {
      width = (deviceDimensions[orientation] as { [key in Size]: string })[
        size
      ];
    } else if (typeof deviceDimensions[size] === 'string') {
      width = deviceDimensions[size] as string;
    } else {
      width = dimensions.desktop[size] as string;
    }

    const marginLeft = `${(100 - parseFloat(width)) / 2}%`;

    return { width, marginLeft };
  }, [small, medium, large]);

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
              min-height: ${deviceIsTablet &&
              window.innerWidth > window.innerHeight
                ? '50vh'
                : '30vh'};
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
