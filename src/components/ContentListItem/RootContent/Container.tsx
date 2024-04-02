import React, { useMemo } from 'react';
import VideoThumbImage from '~/components/VideoThumbImage';
import Embedly from '~/components/Embedly';
import RewardLevelBar from '~/components/RewardLevelBar';
import SecretAnswer from '~/components/SecretAnswer';
import ContentFileViewer from '~/components/ContentFileViewer';
import VideoThumbnail from '../VideoThumbnail';
import ContentDetails from '../ContentDetails';
import { css } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';

export default function Container({
  content,
  contentType,
  contentId,
  description,
  expandable,
  fileName,
  filePath,
  fileSize,
  hideSideBordersOnMobile,
  innerStyle,
  itemSelectedColor,
  itemSelectedOpacity,
  modalOverModal,
  navigate,
  onClick,
  rewardLevel,
  rootContent,
  rootRewardLevel,
  rootId,
  rootType,
  secretAnswer,
  secretAttachment,
  selected,
  selectable,
  story,
  style,
  thumbUrl,
  title,
  topic,
  uploader,
  userId
}: {
  content: string;
  contentType: string;
  contentId: number;
  description: string;
  expandable?: boolean;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  hideSideBordersOnMobile?: boolean;
  innerStyle?: React.CSSProperties;
  itemSelectedColor: string;
  itemSelectedOpacity: number;
  modalOverModal?: boolean;
  navigate: (path: string) => void;
  onClick?: () => void;
  rewardLevel: number;
  rootContent?: any;
  rootRewardLevel?: number;
  rootId?: number;
  rootType?: string;
  secretAnswer?: string;
  secretAttachment?: string;
  selected?: boolean;
  selectable?: boolean;
  story?: string;
  style?: React.CSSProperties;
  thumbUrl?: string;
  title: string;
  topic?: string;
  uploader: { id: number; username: string };
  userId?: number;
}) {
  const boxShadowColor = useMemo(() => {
    return selected ? Color[itemSelectedColor](itemSelectedOpacity) : '';
  }, [selected, itemSelectedColor, itemSelectedOpacity]);
  const borderColor = useMemo(() => {
    return selected
      ? Color[itemSelectedColor](itemSelectedOpacity)
      : Color.borderGray();
  }, [selected, itemSelectedColor, itemSelectedOpacity]);

  const secretAnswerMarginTop = useMemo(
    () => ((filePath && userId) || rootType === 'url' ? '0.5rem' : 0),
    [filePath, rootType, userId]
  );

  const rootContentCSS = useMemo(() => {
    const backgroundColor = expandable ? Color.whiteGray() : '#fff';
    return css`
      cursor: pointer;
      box-shadow: ${selected ? `0 0 5px ${boxShadowColor}` : ''};
      border: ${selected
        ? `0.5rem solid ${borderColor}`
        : `1px solid ${Color.borderGray()}`};
      background: ${backgroundColor};
      border-radius: ${borderRadius};
      .label {
        font-size: 2.2rem;
        font-weight: bold;
        color: ${Color.black()};
        transition: color 1s;
      }
      small {
        line-height: 0.7;
        margin-bottom: 0.7rem;
        font-size: 1.3rem;
      }
      margin-top: ${expandable ? '-1rem' : '0'};
      transition: background 0.5s, border 0.5s;
      &:hover {
        border-color: ${selected ? borderColor : Color.darkerBorderGray()};
        .label {
          color: ${Color.black()};
        }
        background: ${expandable ? '#fff' : Color.highlightGray()};
      }
      @media (max-width: ${mobileMaxWidth}) {
        margin-top: -0.5rem;
        ${hideSideBordersOnMobile
          ? 'border-left: none; border-right: none;'
          : ''}
        small {
          font-size: 1rem;
        }
        .label {
          font-size: 1.8rem;
        }
      }
    `;
  }, [
    borderColor,
    boxShadowColor,
    expandable,
    hideSideBordersOnMobile,
    selected
  ]);

  return (
    <div
      onClick={onClick}
      className={rootContentCSS}
      style={{ width: '100%', ...style }}
    >
      <div
        onClick={
          expandable || selectable
            ? () => null
            : () =>
                navigate(
                  `/${
                    contentType === 'url'
                      ? 'link'
                      : contentType === 'aiStory'
                      ? 'ai-storie'
                      : contentType
                  }s/${contentId}`
                )
        }
      >
        <div style={{ padding: '1rem' }}>
          <div
            className={css`
              display: flex;
              width: 100%;
              font-size: 1.5rem;
              min-height: ${contentType === 'subject' ? '10rem' : ''};
            `}
            style={innerStyle}
          >
            {contentType === 'video' && (
              <VideoThumbnail
                content={content}
                contentId={contentId}
                rewardLevel={rewardLevel}
              />
            )}
            <ContentDetails
              contentType={contentType}
              description={description}
              story={story}
              topic={topic}
              title={title}
              uploader={uploader}
              contentId={contentId}
            />
            {contentType === 'subject' && rootId && (
              <div
                className={css`
                  display: flex;
                  align-items: center;
                  width: 25%;
                  margin-bottom: ${secretAnswer ? '1rem' : ''};
                `}
              >
                {rootType === 'video' && (
                  <VideoThumbImage
                    rewardLevel={rootRewardLevel}
                    videoId={rootId}
                    src={`https://img.youtube.com/vi/${rootContent}/mqdefault.jpg`}
                  />
                )}
                {rootType === 'url' && (
                  <Embedly
                    imageOnly
                    noLink
                    contentId={rootId}
                    defaultThumbUrl={rootContent?.thumbUrl || ''}
                  />
                )}
              </div>
            )}
            {filePath && userId && (
              <ContentFileViewer
                contentId={contentId}
                contentType={contentType}
                fileName={fileName}
                filePath={filePath}
                fileSize={fileSize}
                modalOverModal={modalOverModal}
                thumbUrl={thumbUrl}
                videoHeight="100%"
                isThumb
                style={{
                  display: 'flex',
                  width: '15rem',
                  height: '11rem'
                }}
              />
            )}
          </div>
          {contentType === 'subject' && (secretAnswer || secretAttachment) && (
            <SecretAnswer
              style={{
                marginTop: secretAnswerMarginTop
              }}
              answer={secretAnswer || ''}
              subjectId={contentId}
              uploaderId={uploader.id}
              attachment={secretAttachment}
              modalOverModal={modalOverModal}
              mediaDisabled
            />
          )}
        </div>
        {!!rewardLevel && contentType === 'subject' && (
          <div
            className={css`
              margin-right: -1px;
              margin-left: -1px;
              padding-bottom: ${rewardLevel ? '1rem' : ''};
              @media (max-width: ${mobileMaxWidth}) {
                margin-left: 0px;
                margin-right: 0px;
              }
            `}
          >
            <RewardLevelBar
              style={{ fontSize: '1.3rem' }}
              rewardLevel={rewardLevel}
            />
          </div>
        )}
      </div>
    </div>
  );
}
