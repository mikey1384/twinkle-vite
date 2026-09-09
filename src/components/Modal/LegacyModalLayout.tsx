import React from 'react';
import { css, cx } from '@emotion/css';
import { Color } from '~/constants/css';
import { isMobile, isTablet } from '~/helpers';
import { modalFooterClass } from './Footer';

const deviceIsMobile = isMobile(navigator);
const deviceIsTablet = isTablet(navigator);

export default function LegacyModalLayout({
  children,
  wrapped,
  className
}: {
  children: React.ReactNode;
  wrapped?: boolean;
  className?: string;
}) {
  const isLandscape =
    typeof window !== 'undefined' && window.innerWidth > window.innerHeight;
  const baseClassName = css`
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: ${deviceIsTablet && isLandscape ? '50vh' : '30vh'};

    > header {
      display: flex;
      align-items: center;
      line-height: 1.5;
      color: ${Color.black()};
      font-weight: bold;
      font-size: ${deviceIsMobile || deviceIsTablet ? '1.7rem' : '2rem'};
      padding: ${deviceIsMobile || deviceIsTablet ? '1.5rem' : '2rem'};
      margin-top: 0.5rem;
    }

    > main {
      display: flex;
      padding: ${deviceIsMobile || deviceIsTablet ? '1rem 1.5rem' : '1.5rem 2rem'};
      font-size: ${deviceIsMobile || deviceIsTablet ? '1.3rem' : '1.5rem'};
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      ${wrapped ? '' : 'overflow-y: auto;'}
      flex-grow: 1;
    }
  `;

  return (
    <div className={`${baseClassName} ${className || ''}`}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement<{ className?: string }>(child) || child.type !== 'footer') {
          return child;
        }
        return React.cloneElement(child, {
          className: cx(modalFooterClass, child.props.className)
        });
      })}
    </div>
  );
}
