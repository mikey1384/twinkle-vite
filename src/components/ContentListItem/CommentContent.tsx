import React, { useMemo } from 'react';
import ProfilePic from '~/components/ProfilePic';
import LoginToViewContent from '~/components/LoginToViewContent';
import ContentFileViewer from '~/components/ContentFileViewer';
import Thumbnail from '../Thumbnail';
import SecretComment from '~/components/SecretComment';
import { getFileInfoFromFileName } from '~/helpers/stringHelpers';
import { useNavigate } from 'react-router-dom';
import { useKeyContext } from '~/contexts';
import {
  Color,
  borderRadius,
  mobileMaxWidth,
  desktopMinWidth
} from '~/constants/css';
import { css } from '@emotion/css';

const commentContentCSS = css`
  display: grid;
  height: 100%;
  background: #fff;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr 1fr;
  grid-template-areas:
    'profile thumb'
    'content thumb';
  &.no-file {
    grid-template-columns: 1fr;
    grid-template-areas:
      'profile'
      'content';
  }
  align-items: start;
  gap: 0.7rem;
  padding: 1rem;
  cursor: pointer;
  border-radius: ${borderRadius};
  .profile {
    grid-area: profile;
  }
  .thumb {
    grid-area: thumb;
  }
  .username {
    color: ${Color.darkGray()};
    font-weight: bold;
  }
  /* With context (a featured comment on a profile): the avatar sits beside
     the author and a one-line "Reply on" naming what it was posted on. */
  &.with-context .profile {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    min-width: 0;
  }
  &.with-context .profile-lines {
    min-width: 0;
  }
  .context {
    font-size: 1.2rem;
    color: ${Color.gray()};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    > b {
      color: ${Color.darkerGray()};
    }
  }
  &.with-context {
    grid-template-rows: auto 1fr;
  }
  &.with-context .content {
    -webkit-line-clamp: 5;
    line-clamp: 5;
  }
  .content {
    grid-area: content;
    font-size: 1.1rem;
    color: ${Color.black()};
    transition: color 1s;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    display: -moz-box;
    -moz-box-orient: vertical;
    display: box;
    box-orient: vertical;
    -webkit-line-clamp: 4;
    -moz-line-clamp: 4;
    line-clamp: 4;
    word-wrap: break-word;
    text-overflow: ellipsis;
    @media (max-width: ${mobileMaxWidth}) {
      font-size: 1.1rem;
    }
  }
  .fileViewer {
    grid-area: fileViewer;
  }
  transition: background 0.5s, border 0.5s;
  border: 1px solid var(--ui-border);
  @media (max-width: ${mobileMaxWidth}) {
    border: none;
    border-radius: 0;
    .content {
      font-size: 1.2rem;
      -webkit-line-clamp: 3;
    }
  }
  @media (min-width: ${desktopMinWidth}) {
    &:hover {
      background: ${Color.highlightGray()};
      border: 1px solid var(--ui-border-strong);
    }
  }
`;

export default function CommentContent({
  contentId,
  contentType,
  context,
  onClick,
  secretHidden,
  selected,
  selectedBorder,
  uploader,
  content,
  fileName = '',
  filePath,
  fileSize,
  thumbUrl
}: {
  contentId: number;
  contentType: string;
  // what the comment was posted on (shown only where a list asks for it)
  context?: string | null;
  // a picker (selectable list) handles the tap instead of opening the page
  onClick?: () => void;
  // under a secret the viewer hasn't unlocked: the usual secret box instead
  secretHidden?: boolean;
  selected?: boolean;
  selectedBorder?: string;
  uploader: {
    id: number;
    username: string;
    profilePicUrl?: string;
  };
  content?: string;
  story?: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  topic?: string;
  thumbUrl?: string;
}) {
  const { fileType } = useMemo(
    () => getFileInfoFromFileName(fileName || ''),
    [fileName]
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const navigate = useNavigate();

  return (
    <div
      className={`${commentContentCSS}${filePath ? '' : ' no-file'}${
        context ? ' with-context' : ''
      }`}
      style={
        selected && selectedBorder
          ? {
              borderColor: selectedBorder,
              borderWidth: 2,
              borderStyle: 'solid',
              boxShadow: `inset 0 0 0 2px ${selectedBorder}`
            }
          : undefined
      }
      onClick={onClick || (() => navigate(`/${contentType}s/${contentId}`))}
    >
      <div className="profile">
        <div style={{ width: '5rem', height: '5rem', flexShrink: 0 }}>
          <ProfilePic
            style={{ width: '100%' }}
            userId={uploader.id}
            profilePicUrl={uploader.profilePicUrl}
          />
        </div>
        <div className="profile-lines">
          {uploader.username && (
            <div style={{ fontSize: '1.3rem' }} className="username">
              by {uploader.username}
            </div>
          )}
          {context && (
            <div className="context">
              Reply on: <b>{context}</b>
            </div>
          )}
        </div>
      </div>
      {secretHidden ? (
        // the card's tap opens the comment page, which leads to the subject
        <SecretComment style={{ gridArea: 'content', fontSize: '1.4rem' }} />
      ) : (
        <div className="content">{content}</div>
      )}
      {filePath && (
        <>
          {userId ? (
            <>
              {fileType === 'image' || (fileType === 'video' && thumbUrl) ? (
                <Thumbnail
                  className="thumb"
                  contentType={contentType}
                  filePath={filePath}
                  fileName={fileName}
                  thumbUrl={thumbUrl}
                />
              ) : (
                <ContentFileViewer
                  isThumb
                  className="thumb"
                  contentId={contentId}
                  contentType="comment"
                  fileName={fileName}
                  filePath={filePath}
                  fileSize={Number(fileSize)}
                  thumbUrl={thumbUrl}
                  videoHeight="100%"
                  thumbHeight="100%"
                />
              )}
            </>
          ) : (
            <LoginToViewContent />
          )}
        </>
      )}
    </div>
  );
}

// What a comment was posted on, for its one-line context: the subject it
// answers, else its root's title, or whose profile it was left on.
export function getCommentContextTitle(comment: any): string | null {
  const subjectTitle = String(comment?.targetObj?.subject?.title || '').trim();
  if (subjectTitle) return subjectTitle;
  const root = comment?.rootObj || {};
  if (String(comment?.rootType || root?.contentType || '') === 'user') {
    const username = String(root?.username || '').trim();
    return username ? `${username}'s profile` : null;
  }
  return String(root?.title || root?.topic || '').trim() || null;
}
