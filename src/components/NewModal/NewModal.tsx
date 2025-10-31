import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  PropsWithChildren
} from 'react';
import { createPortal } from 'react-dom';
import { css } from '@emotion/css';
import { keyframes } from '@emotion/react';
import { Color } from '~/constants/css';
import { isMobile, isTablet } from '~/helpers';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

const slideOut = keyframes`
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
`;

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';

export interface NewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  showCloseButton?: boolean;
  hasHeader?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  modalLevel?: number;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
  preventBodyScroll?: boolean;
  animationDuration?: number;
  portalTarget?: HTMLElement;
  // When true, allow the modal to naturally exceed viewport height
  // so the backdrop scrolls (instead of constraining to 95vh and
  // forcing an inner scroll region).
  allowOverflow?: boolean;
  // Optional padding for the modal body content area.
  // When provided, overrides the default responsive padding.
  bodyPadding?: string | number;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const sizeMap: Record<ModalSize, { width: string; maxWidth: string }> = {
  sm: { width: '90vw', maxWidth: '400px' },
  md: { width: '90vw', maxWidth: '600px' },
  lg: { width: '90vw', maxWidth: '800px' },
  xl: { width: '90vw', maxWidth: '1200px' },
  fullscreen: { width: '100vw', maxWidth: '100vw' }
};

const deviceIsMobile = isMobile(navigator);
const deviceIsTablet = isTablet(navigator);

let modalCounter = 0;
const openModals = new Set<number>();

const getNextModalId = () => ++modalCounter;

const getZIndex = (level: number) => 9_999_999 + level * 1000;

export const NewModal = forwardRef<
  HTMLDivElement,
  PropsWithChildren<NewModalProps>
>(
  (
    {
      isOpen,
      onClose,
      title,
      size = 'md',
      showCloseButton = true,
      hasHeader = true,
      closeOnBackdropClick = true,
      closeOnEscape = true,
      className = '',
      style = {},
      priority = false,
      modalLevel,
      header,
      footer,
      loading = false,
      preventBodyScroll = true,
      animationDuration = 200,
      portalTarget,
      allowOverflow = false,
      bodyPadding,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
      children
    },
    ref
  ) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [shouldRender, setShouldRender] = useState(isOpen);
    const modalRef = useRef<HTMLDivElement>(null);
    const backdropRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);
    const modalIdRef = useRef<number | null>(null);

    if (modalIdRef.current === null) {
      modalIdRef.current = getNextModalId();
    }

    const modalId = modalIdRef.current;

    const currentLevel = useMemo(() => {
      if (modalLevel !== undefined) return modalLevel;
      if (priority) return 1;
      return openModals.size;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modalLevel, priority, modalId]);

    const zIndex = useMemo(() => getZIndex(currentLevel), [currentLevel]);

    useEffect(() => {
      if (isOpen) {
        openModals.add(modalId);
      } else {
        openModals.delete(modalId);
      }

      return () => {
        openModals.delete(modalId);
      };
    }, [isOpen, modalId]);

    // For width behavior only: treat tablet-landscape like desktop
    const isLandscape =
      typeof window !== 'undefined' && window.innerWidth > window.innerHeight;

    const { width, maxWidth, height } = useMemo(() => {
      const baseSize = sizeMap[size];

      if (size === 'fullscreen') {
        return {
          width: '100vw',
          maxWidth: '100vw',
          height: '100vh'
        };
      }

      if (deviceIsTablet) {
        if (isLandscape) {
          return {
            ...baseSize,
            height: 'auto'
          };
        }
        return {
          width: '85vw',
          maxWidth: baseSize.maxWidth,
          height: 'auto'
        };
      }

      if (deviceIsMobile) {
        return {
          width: '100vw',
          maxWidth: size === 'sm' ? '350px' : '100vw',
          height: 'auto'
        };
      }

      return {
        ...baseSize,
        height: 'auto'
      };
    }, [size, isLandscape]);

    useEffect(() => {
      if (!preventBodyScroll || currentLevel > 0) return;

      const targetDocument = portalTarget?.ownerDocument ?? document;
      const targetWindow = targetDocument?.defaultView ?? window;
      const bodyElement = targetDocument?.body;
      if (!bodyElement) return;

      if (isOpen) {
        const originalStyle =
          targetWindow.getComputedStyle(bodyElement).overflow;
        bodyElement.style.overflow = 'hidden';
        return () => {
          bodyElement.style.overflow = originalStyle;
        };
      }
    }, [isOpen, preventBodyScroll, currentLevel, portalTarget]);

    useEffect(() => {
      if (!closeOnEscape || !isOpen) return;

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          const topModalId = Math.max(...Array.from(openModals));
          if (modalId === topModalId) {
            onClose();
          }
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [closeOnEscape, isOpen, onClose, modalId]);

    useEffect(() => {
      if (isOpen) {
        previousActiveElement.current = document.activeElement as HTMLElement;

        setTimeout(() => {
          modalRef.current?.focus();
          if (allowOverflow && backdropRef.current) {
            backdropRef.current.scrollTop = 0;
          }
        }, 50);
      } else if (previousActiveElement.current) {
        previousActiveElement.current.focus();
        previousActiveElement.current = null;
      }
    }, [isOpen, allowOverflow]);

    useEffect(() => {
      if (isOpen) {
        setShouldRender(true);
        setIsAnimating(false);
      } else if (shouldRender) {
        setIsAnimating(true);

        const endTimer = setTimeout(() => {
          setShouldRender(false);
          setIsAnimating(false);
        }, animationDuration);

        return () => clearTimeout(endTimer);
      }
    }, [isOpen, shouldRender, animationDuration]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          event.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          event.preventDefault();
        }
      }
    }, []);

    const handleBackdropClick = useCallback(
      (event: React.MouseEvent) => {
        if (closeOnBackdropClick && event.target === backdropRef.current) {
          event.stopPropagation();
          onClose();
        }
      },
      [closeOnBackdropClick, onClose]
    );

    if (!shouldRender) return null;

    const modalContent = (
      <ErrorBoundary componentPath="NewModal/index">
        <div
          ref={backdropRef}
          className={css`
            position: fixed;
            inset: 0;
            z-index: ${zIndex};
            display: flex;
            width: 100%;
            align-items: ${allowOverflow ? 'flex-start' : 'center'};
            justify-content: center;
            background-color: rgba(0, 0, 0, 0.5);
            animation: ${!isAnimating ? fadeIn : fadeOut} ${animationDuration}ms
              ease-out;
            padding: ${deviceIsMobile ? '0' : deviceIsTablet ? '1rem' : '2rem'};
            ${allowOverflow
              ? `padding-top: ${
                  deviceIsMobile
                    ? '0.75rem'
                    : deviceIsTablet
                    ? '1.25rem'
                    : '2rem'
                };`
              : ''}
            overflow-y: auto;
          `}
          onClick={handleBackdropClick}
          aria-hidden="true"
        >
          <div
            ref={ref || modalRef}
            className={css`
              position: relative;
              width: ${width};
              max-width: ${maxWidth};
              ${height !== 'auto' ? `height: ${height};` : ''}
              ${size === 'fullscreen'
                ? 'max-height: 100vh;'
                : allowOverflow
                ? ''
                : 'max-height: 95vh;'}
              background-color: white;
              border-radius: ${size === 'fullscreen'
                ? '0'
                : deviceIsMobile
                ? '8px'
                : '12px'};
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              animation: ${!isAnimating ? slideIn : slideOut}
                ${animationDuration}ms ease-out;
              display: flex;
              flex-direction: column;
              overflow: hidden;
              ${className}

              &:focus {
                outline: none;
              }
            `}
            style={style}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledby}
          >
            {hasHeader && (header || title || showCloseButton) && (
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  padding: ${deviceIsMobile ? '1rem' : '1.5rem'};
                  border-bottom: none;
                  background-color: white;
                  ${size === 'fullscreen'
                    ? ''
                    : 'border-radius: 12px 12px 0 0;'}
                  flex-shrink: 0;
                `}
              >
                <div
                  className={css`
                    flex: 1;
                    font-size: ${deviceIsMobile || deviceIsTablet
                      ? '1.6rem'
                      : '1.8rem'};
                    font-weight: 600;
                    color: ${Color.black()};
                    margin-right: 1rem;
                  `}
                  id={ariaLabelledby}
                >
                  {header || title}
                </div>

                {showCloseButton && (
                  <button
                    className={css`
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      width: 2rem;
                      height: 2rem;
                      background: none;
                      border: none;
                      border-radius: 6px;
                      color: ${Color.gray()};
                      cursor: pointer;
                      transition: all 0.2s ease;
                      flex-shrink: 0;

                      @media (hover: hover) and (pointer: fine) {
                        &:hover {
                          background-color: ${Color.borderGray()};
                          color: ${Color.black()};
                        }
                      }

                      &:focus-visible {
                        outline: 2px solid ${Color.logoBlue()};
                        outline-offset: 2px;
                      }
                    `}
                    onClick={onClose}
                    aria-label="Close modal"
                    type="button"
                  >
                    <Icon icon="times" />
                  </button>
                )}
              </div>
            )}

            {!hasHeader && showCloseButton && (
              <button
                className={css`
                  position: absolute;
                  top: ${deviceIsMobile ? '0.75rem' : '1rem'};
                  right: ${deviceIsMobile ? '0.75rem' : '1rem'};
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 2rem;
                  height: 2rem;
                  background: none;
                  border: none;
                  border-radius: 6px;
                  color: ${Color.gray()};
                  cursor: pointer;
                  transition: all 0.2s ease;
                  z-index: 1;

                  @media (hover: hover) and (pointer: fine) {
                    &:hover {
                      background-color: ${Color.borderGray()};
                      color: ${Color.black()};
                    }
                  }

                  &:focus-visible {
                    outline: 2px solid ${Color.logoBlue()};
                    outline-offset: 2px;
                  }
                `}
                onClick={onClose}
                aria-label="Close modal"
                type="button"
              >
                <Icon icon="times" />
              </button>
            )}

            <div
              className={css`
                flex: 1;
                overflow-y: ${allowOverflow ? 'visible' : 'auto'};
                width: 100%;
                display: flex;
                justify-content: center;
                padding: ${bodyPadding !== undefined
                  ? typeof bodyPadding === 'number'
                    ? `${bodyPadding}px`
                    : bodyPadding
                  : deviceIsMobile
                  ? '0.75rem'
                  : '1.25rem'};
                position: relative;
                font-size: 1.5rem;
              `}
            >
              {loading ? (
                <div
                  className={css`
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 200px;
                    color: ${Color.gray()};
                  `}
                >
                  <Icon icon="spinner" pulse />
                  <span style={{ marginLeft: '0.5rem' }}>Loading...</span>
                </div>
              ) : (
                children
              )}
            </div>

            {footer && (
              <div
                className={css`
                  padding: ${deviceIsMobile ? '1rem' : '1.5rem'};
                  border-top: none;
                  background-color: ${Color.wellGray(0.3)};
                  ${size === 'fullscreen'
                    ? ''
                    : 'border-radius: 0 0 12px 12px;'}
                  display: flex;
                  align-items: center;
                  justify-content: flex-end;
                  gap: ${deviceIsMobile ? '0.75rem' : '1rem'};
                  flex-shrink: 0;
                `}
              >
                {footer}
              </div>
            )}
          </div>
        </div>
      </ErrorBoundary>
    );

    const target = portalTarget || document.getElementById('modal');

    return target ? createPortal(modalContent, target) : modalContent;
  }
);

NewModal.displayName = 'NewModal';

export default NewModal;
