import React, { useEffect, useRef, useState } from 'react';
import Button from '~/components/Button';
import DropdownList from '~/components/DropdownList';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';

interface Props {
  buttonStyle?: any;
  color?: string;
  className?: string;
  isMenuShownWhenMounted?: boolean;
  onDropdownShown?: (isShown: boolean) => void;
  opacity?: number;
  style?: any;
  icon?: string;
  iconSize?: string;
  listStyle?: any;
  menuProps?: any;
  noBorderRadius?: boolean;
  onButtonClick?: (arg: any) => void;
  text?: any;
  stretch?: boolean;
  innerRef?: any;
  transparent?: boolean;
  xAdjustment?: number;
  skeuomorphic?: boolean;
}
export default function DropdownButton({
  buttonStyle = {},
  className,
  isMenuShownWhenMounted,
  onDropdownShown,
  opacity = 1,
  style,
  icon = 'ellipsis-h',
  iconSize = '1x',
  listStyle = {},
  menuProps,
  noBorderRadius,
  onButtonClick,
  text = '',
  stretch,
  innerRef,
  transparent,
  xAdjustment,
  ...props
}: Props) {
  const [dropdownContext, setDropdownContext] = useState(null);
  const coolDownRef: React.MutableRefObject<any> = useRef(null);
  const ButtonRef: React.RefObject<any> = useRef(null);

  useEffect(() => {
    if (isMenuShownWhenMounted) {
      handleClick();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onDropdownShown?.(!!dropdownContext);
  }, [dropdownContext, onDropdownShown]);

  return (
    <ErrorBoundary
      componentPath="DropdownButton"
      innerRef={innerRef}
      style={{ position: 'relative', ...style }}
    >
      <div ref={ButtonRef}>
        <Button
          {...props}
          filled={!!dropdownContext && !transparent}
          transparent={transparent}
          opacity={transparent ? 0 : dropdownContext ? 1 : opacity}
          className={`${className ? `${className} ` : ''}${css`
            &:hover {
              opacity: 1;
            }
          `}`}
          style={{
            borderRadius: noBorderRadius && 0,
            border: noBorderRadius && 0,
            margin: noBorderRadius && 0,
            ...(stretch ? { width: '100%' } : {}),
            ...buttonStyle
          }}
          onClick={handleClick}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Icon icon={icon} size={iconSize} />
            {text && <span>&nbsp;&nbsp;</span>}
            {text}
          </div>
        </Button>
        {dropdownContext && (
          <DropdownList
            style={{
              textTransform: 'none',
              minWidth: '12rem',
              ...listStyle
            }}
            xAdjustment={xAdjustment}
            dropdownContext={dropdownContext}
            onHideMenu={handleHideMenuWithCoolDown}
          >
            {renderMenu()}
          </DropdownList>
        )}
      </div>
    </ErrorBoundary>
  );

  function handleClick() {
    if (coolDownRef.current) return;
    const menuDisplayed = !!dropdownContext;
    if (typeof onButtonClick === 'function') {
      onButtonClick(!menuDisplayed);
    }
    const parentElementDimensions =
      ButtonRef.current?.getBoundingClientRect?.() || {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };
    setDropdownContext(menuDisplayed ? null : parentElementDimensions);
  }

  function handleHideMenuWithCoolDown() {
    coolDownRef.current = true;
    setDropdownContext(null);
    setTimeout(() => {
      coolDownRef.current = false;
    }, 100);
  }

  function renderMenu() {
    return menuProps.map((prop: any, index: number) => {
      if (prop.separator) {
        return <hr key={index} />;
      }
      return (
        <li
          style={prop.style}
          className={`${css`
            opacity: ${prop.disabled && 0.3};
            cursor: ${prop.disabled ? 'default' : 'pointer'};
            &:hover {
              background: ${prop.disabled ? '#fff !important' : ''};
            }
          `} ${prop.className}
          `}
          onClick={
            prop.disabled ? () => {} : () => handleMenuClick(prop.onClick)
          }
          key={index}
        >
          {prop.label}
        </li>
      );
    });
  }

  function handleMenuClick(action: any) {
    action?.();
    setDropdownContext(null);
  }
}
