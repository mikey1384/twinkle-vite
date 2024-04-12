import React from 'react';
import ProfilePic from '~/components/ProfilePic';
import LoginToViewContent from '~/components/LoginToViewContent';
import ContentFileViewer from '~/components/ContentFileViewer';
import { useNavigate } from 'react-router-dom';
import { useKeyContext } from '~/contexts';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

const commentContentCSS = css`
  display: grid;
  height: 100%;
  background: #fff;
  grid-template-columns: 4fr minmax(min-content, 1fr);
  grid-template-rows: 1fr 1fr 1fr;
  grid-template-areas:
    'title thumb'
    'description thumb'
    'reward reward';
  align-items: start;
  gap: 0.7rem;
  padding: 1rem;
  cursor: pointer;
  border-radius: ${borderRadius};

  .title {
    grid-area: title;
    font-weight: bold;
    font-size: 2.2rem;
    margin-bottom: 0.5rem;
    > p {
      margin: 0;
      overflow: hidden;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
      display: -moz-box;
      -moz-box-orient: vertical;
      -moz-line-clamp: 1;
      display: box;
      box-orient: vertical;
      line-clamp: 1;
      text-overflow: ellipsis;
    }
    > small {
      font-size: 1.3rem;
      display: block;
      margin-top: 0;
      line-height: 1.3;
    }

    @media (max-width: ${mobileMaxWidth}) {
      font-size: 1.8rem;
      margin-bottom: 0.3rem;
      > small {
        font-size: 1.1rem;
      }
    }
  }

  .thumb {
    position: relative;
    height: 100%;
    grid-area: thumb;
    display: flex;
    justify-content: end;
    align-items: start;
    > img {
      max-height: 100%;
      object-fit: contain;
    }
  }

  .description {
    height: 100%;
    width: 100%;
    grid-area: description;
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
    -webkit-line-clamp: 3;
    -moz-line-clamp: 3;
    line-clamp: 3;
    word-wrap: break-word;
    text-overflow: ellipsis;
    @media (max-width: ${mobileMaxWidth}) {
      font-size: 1rem;
    }
  }

  .reward-bar {
    grid-area: reward;
    font-size: 1.3rem;
    margin-left: CALC(-1rem - 1px);
    margin-right: CALC(-1rem - 1px);
    align-self: end;
    @media (max-width: ${mobileMaxWidth}) {
      font-size: 1rem;
    }
  }

  transition: background 0.5s, border 0.5s;

  border: 1px solid ${Color.borderGray()};
  &:hover {
    .title {
      color: ${Color.black()};
    }
    background: ${Color.highlightGray()};
    border: 1px solid ${Color.darkerBorderGray()};
  }

  &.expandable {
    background: ${Color.whiteGray()};
  }

  &.no-thumb {
    grid-template-columns: 1fr;
    grid-template-areas:
      'title'
      'description'
      'reward';
  }

  &.no-reward {
    grid-template-columns: 4fr minmax(min-content, 1.5fr);
    grid-template-areas:
      'title thumb'
      'description thumb'
      'description thumb';
    &.no-thumb {
      grid-template-columns: 1fr;
      grid-template-areas:
        'title'
        'description'
        'description';
    }
  }

  &.no-reward .description {
    -webkit-line-clamp: 5;
    -moz-line-clamp: 5;
    line-clamp: 5;
  }

  &.is-video {
    grid-template-columns: minmax(min-content, 1fr) 1fr 1fr 1fr 1fr 1fr;
    grid-template-areas:
      'thumb thumb title title title title'
      'thumb thumb description description description description'
      'thumb thumb description description description description';
    .thumb {
      justify-content: start;
    }
  }

  @media (max-width: ${mobileMaxWidth}) {
    grid-template-columns: 2fr 1fr;
    grid-template-areas:
      'title thumb'
      'description thumb'
      'reward reward';
    &.no-reward {
      grid-template-columns: 6fr 3fr;
      grid-template-areas:
        'title thumb'
        'description thumb'
        'description thumb';
    }
    &.hideSideBordersOnMobile {
      border-left: none;
      border-right: none;
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
      className={commentContentCSS}
      onClick={() => navigate(`/${contentType}s/${contentId}`)}
    >
      <div
        className={css`
          width: 5rem;
          height: 5rem;
        `}
      >
        <ProfilePic
          style={{ width: '100%' }}
          userId={uploader.id}
          profilePicUrl={uploader.profilePicUrl}
        />
      </div>
      {uploader.username && (
        <div
          className={css`
            color: ${Color.darkGray()};
            font-weight: bold;
          `}
        >
          by {uploader.username}
        </div>
      )}
      <div
        className={css`
          margin-top: 2rem;
          width: 100%;
          text-align: left;
          color: ${Color.black()};
          white-space: pre-wrap;
          overflow-wrap: break-word;
          word-break: break-word;
          display: -webkit-box;
          webkit-box-orient: vertical;
          overflow: hidden;
          -webkit-line-clamp: 15;
        `}
      >
        {filePath && (
          <div>
            {userId ? (
              <div style={{ width: '100%', maxHeight: '30vh' }}>
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
              </div>
            ) : (
              <LoginToViewContent />
            )}
          </div>
        )}
        <div
          className={css`
            width: 100%;
            text-align: left;
            color: ${Color.black()};
            white-space: pre-wrap;
            overflow-wrap: break-word;
            word-break: break-word;
            overflow: hidden;
            font-size: 1.2rem;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            @media (max-width: ${mobileMaxWidth}) {
              line-height: 1.4;
              -webkit-line-clamp: 3;
            }
          `}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
