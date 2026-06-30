import React, { useRef, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import { IconName } from '@fortawesome/fontawesome-svg-core';
import UploadModal from '../Modals/UploadModal';

export default function UploadButton({
  onFileSelect,
  onFilesSelect,
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
  onFileSelect: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;

  icon?: IconName;
  iconSize?: string;
  text?: string;

  color?: string;
  hoverColor?: string;
  style?: React.CSSProperties;
  className?: string;

  transparent?: boolean;
  filled?: boolean;

  mobilePadding?: string;

  title?: string;
  'aria-label'?: string;

  buttonProps?: Record<string, any>;

  onMouseEnter?: () => void;
  onMouseLeave?: () => void;

  enableAIGeneration?: boolean;
}) {
  const { colorKey: defaultButtonColor } = useRoleColor('button', {
    fallback: 'logoBlue'
  });
  const { colorKey: defaultHoverColor } = useRoleColor('buttonHovered', {
    fallback: defaultButtonColor || 'logoBlue'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modalShown, setModalShown] = useState(false);

  const appliedColor = color || defaultButtonColor;
  const appliedHoverColor = hoverColor || defaultHoverColor || appliedColor;
  const { variant: overrideVariant, tone: overrideTone, ...restButtonProps } =
    buttonProps;
  const resolvedVariant =
    overrideVariant ??
    (filled ? 'solid' : transparent ? 'ghost' : 'soft');
  const resolvedTone =
    overrideTone ??
    (resolvedVariant === 'soft' ? 'raised' : undefined);

  return (
    <>
      <Button
        variant={resolvedVariant}
        tone={resolvedTone}
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
        {...restButtonProps}
      >
        <Icon size={iconSize} icon={icon} />
        {text && <span>{text}</span>}
      </Button>

      <UploadModal
        isOpen={modalShown}
        onHide={() => setModalShown(false)}
        onFileSelect={onFileSelect}
        onFilesSelect={onFilesSelect}
        accept={accept}
        multiple={multiple}
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
