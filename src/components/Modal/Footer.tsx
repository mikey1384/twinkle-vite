import React, { createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { css, cx } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

export const modalFooterStyles = `
  width: 100%;
  padding: ${deviceIsMobile ? '1rem' : '1.5rem'};
  border-top: none;
  background-color: ${Color.wellGray(0.3)};
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: ${deviceIsMobile ? '0.75rem' : '1rem'};
  flex-shrink: 0;
  > button {
    min-height: 44px;
    min-width: 44px;
  }
  @media (max-width: ${mobileMaxWidth}) {
    > button { font-size: 14px; }
  }
`;

export const modalFooterClass = css(modalFooterStyles);

export const ModalFooterContext = createContext<{
  container: HTMLDivElement | null;
  fullscreen: boolean;
} | null>(null);

// Forms can keep their action state beside their fields while the parent Modal
// owns the footer's position, outside its scrolling body.
export default function ModalFooter({
  children,
  className,
  style,
  fullscreen = false
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  fullscreen?: boolean;
}) {
  const host = useContext(ModalFooterContext);
  const content = (
    <footer
      className={cx(modalFooterClass, className)}
      style={{
        borderRadius: (host?.fullscreen ?? fullscreen) ? undefined : '0 0 12px 12px',
        ...style
      }}
    >
      {children}
    </footer>
  );
  if (!host) return content;
  return host.container ? createPortal(content, host.container) : null;
}
