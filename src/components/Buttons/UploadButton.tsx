import React, { useRef, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useKeyContext } from '~/contexts';
import { IconName } from '@fortawesome/fontawesome-svg-core';
import UploadModal from '../Modals/UploadModal';

export default function UploadButton({
  onFileSelect,
  accept,
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
  onMouseLeave = () => {},
  enableAIGeneration = true
}: {
  // Core functionality
  onFileSelect: (file: File) => void;
  accept?: string;
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

  // New: Enable AI generation option
  enableAIGeneration?: boolean;
}) {
  const {
    button: { color: defaultButtonColor }
  } = useKeyContext((v) => v.theme);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modalShown, setModalShown] = useState(false);

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

      <UploadModal
        isOpen={modalShown}
        onHide={() => setModalShown(false)}
        onFileSelect={onFileSelect}
        accept={accept}
      />
    </>
  );

  function handleButtonClick() {
    if (disabled) return;

    if (enableAIGeneration) {
      setModalShown(true);
    } else {
      handleDirectFileUpload();
    }
  }

  function handleDirectFileUpload() {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }
}
