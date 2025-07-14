import React, { useRef, useCallback } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useKeyContext } from '~/contexts';
import { IconName } from '@fortawesome/fontawesome-svg-core';

interface UploadButtonProps {
  // Core functionality
  onFileSelect: (file: File) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;

  // Button appearance
  icon?: IconName;
  iconSize?: string;
  text?: string;

  // Button styling
  color?: string;
  hoverColor?: string;
  style?: React.CSSProperties;
  className?: string;

  // Button variants
  skeuomorphic?: boolean;
  transparent?: boolean;
  filled?: boolean;

  // Size and spacing
  mobilePadding?: string;

  // Accessibility
  title?: string;
  'aria-label'?: string;

  // Additional props to pass to Button
  buttonProps?: Record<string, any>;

  // Mouse events
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function UploadButton({
  onFileSelect,
  accept,
  multiple = false,
  disabled = false,
  icon = 'upload',
  iconSize = 'lg',
  text,
  color,
  hoverColor,
  style,
  className,
  skeuomorphic = true,
  transparent = false,
  filled = false,
  mobilePadding,
  title,
  'aria-label': ariaLabel,
  buttonProps = {},
  onMouseEnter = () => {},
  onMouseLeave = () => {}
}: UploadButtonProps) {
  const {
    button: { color: defaultButtonColor }
  } = useKeyContext((v) => v.theme);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        if (multiple) {
          onFileSelect(files[0]);
        } else {
          onFileSelect(files[0]);
        }
      }
      event.target.value = '';
    },
    [multiple, onFileSelect]
  );

  const appliedColor = color || defaultButtonColor;
  const appliedHoverColor = hoverColor || appliedColor;

  return (
    <>
      <Button
        skeuomorphic={skeuomorphic}
        transparent={transparent}
        filled={filled}
        disabled={disabled}
        onClick={handleButtonClick}
        color={appliedColor}
        hoverColor={appliedHoverColor}
        mobilePadding={mobilePadding}
        style={style}
        className={className}
        aria-label={ariaLabel || title || 'Upload file'}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        {...buttonProps}
      >
        <Icon size={iconSize} icon={icon} />
        {text && <span style={{ marginLeft: '0.7rem' }}>{text}</span>}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    </>
  );
}
