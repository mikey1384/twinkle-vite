import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useRoleColor } from '~/theme/hooks/useRoleColor';

export default function FileDownload({
  className = '',
  extension,
  fileName,
  fileType,
  isPreview,
  openFile = true,
  src,
  theme
}: {
  className?: string;
  extension?: string;
  fileName: string;
  fileType?: 'image' | 'audio' | 'video' | 'pdf' | 'text' | 'other' | string;
  isPreview?: boolean;
  openFile?: boolean;
  src: string;
  theme?: string;
}) {
  const typeKey = useMemo(() => getFileIcon(fileType), [fileType]);
  const kindLabel = useMemo(
    () => getFileKindLabel({ extension, fileType }),
    [extension, fileType]
  );
  const extensionLabel = useMemo(
    () => getFileExtensionLabel({ extension, fileName }),
    [extension, fileName]
  );
  const { color: linkColor } = useRoleColor('link', {
    themeName: theme,
    fallback: 'logoBlue'
  });
  const cardClassName = `${className} rich-text-file-card ${fileCardClass}`;
  const cardStyle = {
    '--rich-text-file-accent': linkColor
  } as React.CSSProperties;
  const contents = (
    <>
      <span className="rich-text-file-card__icon" aria-hidden="true">
        <Icon icon={typeKey as any} />
      </span>
      <span className="rich-text-file-card__copy">
        <span>{kindLabel}</span>
        <strong title={fileName}>{fileName || 'Attached file'}</strong>
      </span>
      <span className="rich-text-file-card__meta">
        <span title={extensionLabel}>{extensionLabel}</span>
        {openFile ? <Icon icon="external-link-alt" /> : null}
      </span>
    </>
  );

  return (
    <ErrorBoundary componentPath="Texts/RichText/Markdown/EmbeddedComponent/FileDownload">
      {openFile ? (
        <a
          aria-label={`Open ${fileName || 'attached file'}`}
          className={cardClassName}
          href={src}
          rel="noopener noreferrer"
          style={cardStyle}
          target="_blank"
          onClick={(event) => event.stopPropagation()}
        >
          {contents}
        </a>
      ) : (
        <div
          className={cardClassName}
          data-rich-text-file-preview={isPreview ? 'true' : undefined}
          style={cardStyle}
        >
          {contents}
        </div>
      )}
    </ErrorBoundary>
  );
}

const fileCardClass = css`
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 3.6rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.78rem;
  width: min(100%, 42rem);
  max-width: 42rem;
  min-height: 5.35rem;
  padding: 0.68rem 0.78rem;
  overflow: hidden;
  border: 1px solid ${Color.borderGray()};
  border-radius: 0.8rem;
  background: #fff;
  color: ${Color.darkerGray()};
  line-height: 1.18;
  text-align: left;
  text-decoration: none;

  &[href] {
    cursor: pointer;
  }

  &[href]:hover {
    border-color: var(--rich-text-file-accent, ${Color.logoBlue()});
    color: ${Color.darkerGray()};
    text-decoration: none;
  }

  .rich-text-file-card__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.6rem;
    height: 3.6rem;
    border-radius: 0.9rem;
    background: ${Color.logoBlue(0.1)};
    color: var(--rich-text-file-accent, ${Color.logoBlue()});
    font-size: 1.65rem;
  }

  .rich-text-file-card__copy {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 0.14rem;
  }

  .rich-text-file-card__copy > span {
    color: ${Color.darkGray()};
    font-size: 1rem;
    font-weight: 800;
  }

  .rich-text-file-card__copy > strong {
    min-width: 0;
    overflow: hidden;
    color: ${Color.black()};
    font-size: 1.2rem;
    font-weight: 850;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rich-text-file-card__meta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.42rem;
    min-width: 2.8rem;
    min-height: 2rem;
    padding: 0.3rem 0.52rem;
    border-radius: 999px;
    background: ${Color.black(0.06)};
    color: ${Color.darkGray()};
    font-size: 1rem;
    font-weight: 900;
    line-height: 1;
  }

  .rich-text-file-card__meta > span {
    max-width: 6rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rich-text-file-card__meta svg {
    color: var(--rich-text-file-accent, ${Color.logoBlue()});
    font-size: 1rem;
  }

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 3.2rem minmax(0, 1fr) auto;
    gap: 0.62rem;
    width: 100%;
    min-height: 4.85rem;
    padding: 0.58rem 0.65rem;

    .rich-text-file-card__icon {
      width: 3.2rem;
      height: 3.2rem;
      border-radius: 0.78rem;
      font-size: 1.45rem;
    }

    .rich-text-file-card__copy > strong {
      font-size: 1.12rem;
    }

    .rich-text-file-card__meta {
      min-width: 2.45rem;
      padding-inline: 0.44rem;
      font-size: 1rem;
    }

    .rich-text-file-card__meta > span {
      max-width: 4.5rem;
    }
  }
`;

function getFileIcon(fileType?: string) {
  if (fileType === 'audio') return 'file-audio';
  if (fileType === 'video') return 'file-video';
  if (fileType === 'pdf') return 'file-pdf';
  if (fileType === 'image') return 'file-image';
  if (fileType === 'text') return 'file-alt';
  if (fileType === 'archive') return 'file-archive';
  if (fileType === 'word') return 'file-word';
  return 'file';
}

function getFileKindLabel({
  extension,
  fileType
}: {
  extension?: string;
  fileType?: string;
}) {
  const normalizedExtension = String(extension || '').toLowerCase();
  if (fileType === 'audio') return 'Audio';
  if (fileType === 'video') return 'Video';
  if (fileType === 'pdf') return 'PDF';
  if (fileType === 'image') return 'Image';
  if (
    fileType === 'text' ||
    ['csv', 'json', 'log', 'md', 'txt'].includes(normalizedExtension)
  ) {
    return 'Text file';
  }
  if (fileType === 'archive') return 'Archive';
  if (fileType === 'word') return 'Document';
  return 'File';
}

function getFileExtensionLabel({
  extension,
  fileName
}: {
  extension?: string;
  fileName: string;
}) {
  const normalizedExtension = String(extension || '').trim().toUpperCase();
  if (normalizedExtension) return normalizedExtension;

  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex > 0 && lastDotIndex < fileName.length - 1) {
    return fileName.slice(lastDotIndex + 1).toUpperCase();
  }
  return 'FILE';
}
