import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Button from '~/components/Button';
import DropdownList from '~/components/DropdownList';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';

DropdownButton.propTypes = {
  buttonStyle: PropTypes.object,
  className: PropTypes.string,
  isMenuShownWhenMounted: PropTypes.bool,
  onDropdownShown: PropTypes.func,
  opacity: PropTypes.number,
  style: PropTypes.object,
  icon: PropTypes.string,
  iconSize: PropTypes.string,
  listStyle: PropTypes.object,
  menuProps: PropTypes.array,
  noBorderRadius: PropTypes.bool,
  onButtonClick: PropTypes.func,
  text: PropTypes.string,
  stretch: PropTypes.bool,
  innerRef: PropTypes.any,
  transparent: PropTypes.bool,
  xAdjustment: PropTypes.number,
  skeuomorphic: PropTypes.bool
};
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
  menuProps = [],
  noBorderRadius,
  onButtonClick,
  text = '',
  stretch,
  innerRef,
  transparent,
  xAdjustment,
  ...props
}: {
  buttonStyle?: any;
  className?: string;
  isMenuShownWhenMounted?: boolean;
  onDropdownShown?: (isShown: boolean) => void;
  opacity?: number;
  style?: React.CSSProperties;
  icon?: string;
  iconSize?: string;
  listStyle?: React.CSSProperties;
  menuProps?: any[];
  noBorderRadius?: boolean;
  onButtonClick?: (arg: any) => void;
  text?: string;
  stretch?: boolean;
  innerRef?: React.RefObject<any>;
  transparent?: boolean;
  xAdjustment?: number;
  skeuomorphic?: boolean;
}) {
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
            prop.disabled ? () => null : () => handleMenuClick(prop.onClick)
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
