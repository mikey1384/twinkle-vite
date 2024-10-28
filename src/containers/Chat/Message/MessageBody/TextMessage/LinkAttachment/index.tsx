import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import request from 'axios';
import VideoPlayer from '~/components/VideoPlayer';
import Icon from '~/components/Icon';
import URL from '~/constants/URL';
import TwinkleVideo from './TwinkleVideo';
import UrlContent from './UrlContent';
import { css } from '@emotion/css';
import {
  getFileInfoFromFileName,
  isValidYoutubeUrl,
  extractVideoIdFromTwinkleVideoUrl,
  fetchedVideoCodeFromURL
} from '~/helpers/stringHelpers';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useContentContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { cloudFrontURL } from '~/constants/defaultValues';
import { isMobile } from '~/helpers';

const fallbackImage = '/img/link.png';
const API_URL = `${URL}/content`;
const deviceIsMobile = isMobile(navigator);

function LinkAttachment({
  messageId,
  defaultThumbUrl,
  extractedUrl,
  onHideAttachment = () => null,
  style,
  userCanEditThis
}: {
  messageId: number;
  defaultThumbUrl: string;
  extractedUrl: string;
  onHideAttachment?: () => void;
  style: React.CSSProperties;
  userCanEditThis: boolean;
}) {
  const makeThumbnailSecure = useAppContext(
    (v) => v.requestHelpers.makeThumbnailSecure
  );
  const checkContentUrl = useAppContext(
    (v) => v.requestHelpers.checkContentUrl
  );
  const onSetActualDescription = useContentContext(
    (v) => v.actions.onSetActualDescription
  );
  const onSetActualTitle = useContentContext((v) => v.actions.onSetActualTitle);
  const onSetSiteUrl = useContentContext((v) => v.actions.onSetSiteUrl);
  const onSetThumbUrl = useContentContext((v) => v.actions.onSetThumbUrl);
  const onSetVideoCurrentTime = useContentContext(
    (v) => v.actions.onSetVideoCurrentTime
  );
  const onSetMediaStarted = useContentContext(
    (v) => v.actions.onSetMediaStarted
  );

  const {
    currentTime = 0,
    prevUrl,
    thumbUrl: rawThumbUrl,
    thumbLoaded,
    linkTitle: actualTitle,
    linkDescription: actualDescription,
    linkUrl: siteUrl,
    embeddedUrl: contentStateUrl
  } = useContentState({ contentType: 'chat', contentId: messageId });

  const url = useMemo(
    () => contentStateUrl || extractedUrl,
    [contentStateUrl, extractedUrl]
  );

  const thumbUrl = useMemo(() => {
    if (rawThumbUrl?.split('/')[1] === 'thumbs') {
      return `${cloudFrontURL}${rawThumbUrl}`;
    }
    return rawThumbUrl || defaultThumbUrl;
  }, [defaultThumbUrl, rawThumbUrl]);

  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [twinkleVideoId, setTwinkleVideoId] = useState(
    extractVideoIdFromTwinkleVideoUrl(url)
  );
  const [startingPosition, setStartingPosition] = useState(currentTime);
  const timeAtRef = useRef(startingPosition);
  const { notFound, title: videoTitle } = useContentState({
    contentId: Number(twinkleVideoId),
    contentType: 'video'
  });
  const isYouTube = useMemo(() => {
    return isValidYoutubeUrl(url);
  }, [url]);
  const videoThumbUrl = useMemo(
    () =>
      isYouTube
        ? `https://img.youtube.com/vi/${fetchedVideoCodeFromURL(
            url
          )}/mqdefault.jpg`
        : '',
    [url, isYouTube]
  );
  const loadingRef = useRef(false);

  useEffect(() => {
    if (isYouTube) {
      setStartingPosition(currentTime);
    }
    const extractedVideoId = extractVideoIdFromTwinkleVideoUrl(url);
    if (extractedVideoId) {
      setTwinkleVideoId(extractedVideoId);
    } else if (
      !loadingRef.current &&
      url &&
      ((typeof siteUrl !== 'string' && !thumbUrl) ||
        (prevUrl && url !== prevUrl))
    ) {
      fetchUrlData();
    }
    async function fetchUrlData() {
      setLoading(true);
      loadingRef.current = true;
      if (isYouTube) {
        await loadYouTubeVideoData();
      } else {
        await loadUrlData();
      }
      loadingRef.current = false;
    }

    async function loadYouTubeVideoData() {
      try {
        const { ytDetails } = await checkContentUrl({
          url,
          contentType: 'video'
        });
        onSetActualDescription({
          contentId: messageId,
          contentType: 'chat',
          description: ytDetails.ytDescription
        });
        onSetActualTitle({
          contentId: messageId,
          contentType: 'chat',
          title: ytDetails.ytTitle
        });
        return Promise.resolve();
      } catch (error: any) {
        console.error(error.response || error);
        return Promise.reject();
      }
    }

    async function loadUrlData() {
      try {
        const {
          data: { image, title, description, site }
        } = await request.put(`${API_URL}/embed`, {
          url,
          contentId: messageId,
          contentType: 'chat'
        });
        onSetThumbUrl({
          contentId: messageId,
          contentType: 'chat',
          thumbUrl: image.url.replace('http://', 'https://')
        });
        onSetActualDescription({
          contentId: messageId,
          contentType: 'chat',
          description
        });
        onSetActualTitle({
          contentId: messageId,
          contentType: 'chat',
          title
        });
        onSetSiteUrl({
          contentId: messageId,
          contentType: 'chat',
          siteUrl: site
        });
        setLoading(false);
        return Promise.resolve();
      } catch (error) {
        setImageUrl(fallbackImage);
        onHideAttachment();
        setLoading(false);
        return Promise.reject(error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevUrl, url, thumbLoaded, siteUrl, thumbUrl]);

  useEffect(() => {
    if (
      url &&
      !url.includes('http://') &&
      getFileInfoFromFileName(url)?.fileType === 'image'
    ) {
      setImageUrl(url);
    } else {
      if (thumbUrl?.includes('http://')) {
        makeThumbnailSecure({
          contentId: messageId,
          contentType: 'chat',
          thumbUrl
        });
      }
      if (!loading) {
        setImageUrl(thumbUrl);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thumbUrl, url, loading]);

  useEffect(() => {
    return function setCurrentTimeBeforeUnmount() {
      if (timeAtRef.current > 0) {
        onSetVideoCurrentTime({
          contentType: 'chat',
          contentId: messageId,
          currentTime: timeAtRef.current
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlay = useCallback(() => {
    onSetMediaStarted({
      contentType: 'chat',
      contentId: messageId,
      started: true
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId]);

  return notFound ? null : (
    <div
      style={{
        position: 'relative',
        ...style
      }}
      className={css`
        height: 37rem;
        @media (max-width: ${mobileMaxWidth}) {
          height: 23rem;
        }
      `}
    >
      {userCanEditThis && (
        <Icon
          style={{
            right: '1rem',
            position: 'absolute',
            cursor: 'pointer',
            zIndex: 10
          }}
          onClick={() => onHideAttachment()}
          className={css`
            right: ${isYouTube || twinkleVideoId ? '1rem' : 'CALC(50% - 1rem)'};
            color: ${Color.darkGray()};
            font-size: 2rem;
            &:hover {
              color: ${Color.black()};
            }
            @media (max-width: ${mobileMaxWidth}) {
              right: 1rem;
            }
          `}
          icon="times"
        />
      )}
      <div
        style={{ height: '100%' }}
        className={css`
          max-width: 65%;
          height: 100%;
          position: relative;
          @media (max-width: ${mobileMaxWidth}) {
            width: 100%;
            max-width: 100%;
          }
        `}
      >
        <div
          className={css`
            width: 100%;
            height: 100%;
            > a {
              text-decoration: none;
            }
            h3 {
              font-size: 1.4rem;
            }
            p {
              font-size: 1.2rem;
              margin-top: 1rem;
            }
            @media (max-width: ${mobileMaxWidth}) {
              width: 85%;
              h3 {
                font-size: 1.3rem;
              }
              p {
                font-size: 1.1rem;
              }
            }
          `}
        >
          {twinkleVideoId ? (
            <TwinkleVideo
              messageId={messageId}
              onPlay={handlePlay}
              style={{
                height: `CALC(100% - ${deviceIsMobile ? '1' : '5'}rem)`
              }}
              title={videoTitle}
              videoId={Number(twinkleVideoId)}
            />
          ) : isYouTube ? (
            <div
              style={{
                width: '100%',
                height: deviceIsMobile ? 'CALC(100% - 2.5rem)' : '100%',
                paddingTop: deviceIsMobile ? '2.5rem' : 0
              }}
            >
              <VideoPlayer
                width={deviceIsMobile ? '33rem' : '66rem'}
                height="100%"
                src={fetchedVideoCodeFromURL(url)}
                fileType="youtube"
                onPlay={handlePlay}
                onProgress={(currentTime) => {
                  timeAtRef.current = currentTime;
                }}
                initialTime={startingPosition}
              />
            </div>
          ) : (
            <UrlContent
              actualTitle={actualTitle}
              actualDescription={actualDescription}
              fallbackImage={fallbackImage}
              imageUrl={videoThumbUrl || imageUrl}
              loading={loading}
              url={url}
              siteUrl={siteUrl}
              onSetImageUrl={setImageUrl}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(LinkAttachment);
