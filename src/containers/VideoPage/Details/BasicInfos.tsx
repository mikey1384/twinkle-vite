import React from 'react';
import Input from '~/components/Texts/Input';
import FullTextReveal from '~/components/Texts/FullTextReveal';
import UsernameText from '~/components/Texts/UsernameText';
import { edit } from '~/constants/placeholders';
import { timeSince } from '~/helpers/timeStampHelpers';
import { mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import localize from '~/constants/localize';

const addedByLabel = localize('addedBy');

export default function BasicInfos({
  className,
  editedUrl,
  editedTitle,
  innerRef,
  onTitleChange,
  onTitleKeyUp,
  onUrlChange,
  onEdit,
  onMouseLeave,
  onMouseOver,
  onTitleClick,
  style,
  title,
  titleHovered,
  timeStamp,
  titleExceedsCharLimit,
  uploader,
  urlExceedsCharLimit
}: {
  className?: string;
  editedUrl: string;
  editedTitle: string;
  innerRef: React.RefObject<any>;
  onMouseLeave: () => void;
  onMouseOver: () => void;
  onTitleChange: (v: any) => void;
  onTitleKeyUp: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onUrlChange: (v: any) => void;
  onEdit: boolean;
  onTitleClick: () => void;
  style?: React.CSSProperties;
  title: string;
  titleHovered: boolean;
  timeStamp: number;
  titleExceedsCharLimit: (title: string) => any;
  uploader: { id: number; username: string };
  urlExceedsCharLimit: (url: string) => any;
}) {
  return (
    <div className={className} style={style}>
      {onEdit ? (
        <div>
          <Input
            placeholder={edit.video}
            value={editedUrl}
            onChange={onUrlChange}
            style={urlExceedsCharLimit(editedUrl)?.style}
          />
          <Input
            placeholder={edit.title}
            value={editedTitle}
            onChange={onTitleChange}
            onKeyUp={onTitleKeyUp}
            style={{
              marginTop: '1rem',
              ...(titleExceedsCharLimit(editedTitle)?.style || {})
            }}
          />
          {titleExceedsCharLimit(editedTitle) && (
            <small style={{ color: 'red' }}>
              {titleExceedsCharLimit(editedTitle)?.message}
            </small>
          )}
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div
            ref={innerRef}
            style={{
              width: '100%',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              lineHeight: 'normal'
            }}
          >
            <span
              className={css`
                font-size: 2.5rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 2rem;
                }
              `}
              style={{
                fontWeight: 'bold',
                cursor: 'default'
              }}
              onClick={onTitleClick}
              onMouseOver={onMouseOver}
              onMouseLeave={onMouseLeave}
            >
              {title}
            </span>
          </div>
          <FullTextReveal show={titleHovered} text={title} />
        </div>
      )}
      {!onEdit && (
        <div
          className={css`
            margin-top: 0.5rem;
            font-size: 1.5rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.2rem;
            }
          `}
        >
          {addedByLabel} <UsernameText user={uploader} />{' '}
          <span>{`${timeStamp ? timeSince(timeStamp) : ''}`}</span>
        </div>
      )}
    </div>
  );
}
