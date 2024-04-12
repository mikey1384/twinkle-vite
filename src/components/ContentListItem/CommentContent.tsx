import React from 'react';
import ProfilePic from '~/components/ProfilePic';
import LoginToViewContent from '~/components/LoginToViewContent';
import ContentFileViewer from '~/components/ContentFileViewer';
import { useNavigate } from 'react-router-dom';
import { useKeyContext } from '~/contexts';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

const commentContentCSS = css`
  display: grid;
  height: 100%;
  background: #fff;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  grid-template-areas:
    'profile profile'
    'fileViewer fileViewer'
    'content content';
  &.no-file {
    grid-template-rows: 1fr 1fr;
    grid-template-areas:
      'profile profile'
      'content content';
  }
  align-items: start;
  gap: 0.7rem;
  padding: 1rem;
  cursor: pointer;
  border-radius: ${borderRadius};
  .profile {
    grid-area: profile;
  }
  .username {
    font-size: 1.3rem;
    color: ${Color.darkGray()};
    font-weight: bold;
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
      font-size: 1rem;
    }
  }
  .fileViewer {
    grid-area: fileViewer;
  }
  transition: background 0.5s, border 0.5s;
  border: 1px solid ${Color.borderGray()};
  &:hover {
    background: ${Color.highlightGray()};
    border: 1px solid ${Color.darkerBorderGray()};
  }
  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    grid-template-areas:
      'profilePic'
      'username'
      'content'
      'fileViewer';
    .content {
      font-size: 1.2rem;
      -webkit-line-clamp: 3;
    }
  }
`;

export default function CommentContent({
  contentId,
  contentType,
  uploader,
  content,
  fileName = '',
  filePath,
  fileSize,
  thumbUrl
}: {
  contentId: number;
  contentType: string;
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
  const { userId } = useKeyContext((v) => v.myState);
  const navigate = useNavigate();

  return (
    <div
      className={`${commentContentCSS}${filePath ? '' : ' no-file'}`}
      onClick={() => navigate(`/${contentType}s/${contentId}`)}
    >
      <div className="profile">
        <div style={{ width: '5rem', height: '5rem' }}>
          <ProfilePic
            style={{ width: '100%' }}
            userId={uploader.id}
            profilePicUrl={uploader.profilePicUrl}
          />
        </div>
        {uploader.username && (
          <div className="username">by {uploader.username}</div>
        )}
      </div>
      {filePath && (
        <div className="fileViewer">
          {userId ? (
            <ContentFileViewer
              isThumb
              contentId={contentId}
              contentType="comment"
              fileName={fileName}
              filePath={filePath}
              fileSize={Number(fileSize)}
              thumbUrl={thumbUrl}
              videoHeight="100%"
              thumbHeight="100%"
              style={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
                height: 'auto',
                maxHeight: '25vh',
                overflow: 'hidden',
                marginBottom: '1rem'
              }}
            />
          ) : (
            <LoginToViewContent />
          )}
        </div>
      )}
      <div className="content">{content}</div>
    </div>
  );
}
