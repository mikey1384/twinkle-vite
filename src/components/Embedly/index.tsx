import React, {
  createElement,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import request from 'axios';
import Loading from '~/components/Loading';
import Icon from '~/components/Icon';
import URL from '~/constants/URL';
import TwinkleVideo from './TwinkleVideo';
import { css } from '@emotion/css';
import {
  getFileInfoFromFileName,
  extractVideoIdFromTwinkleVideoUrl
} from '~/helpers/stringHelpers';
import { useNavigate } from 'react-router-dom';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useContentContext } from '~/contexts';
import { useContentState } from '~/helpers/hooks';
import { cloudFrontURL } from '~/constants/defaultValues';

const API_URL = `${URL}/content`;

function Embedly({
  className,
  contentId,
  contentType = 'url',
  directUrl,
  defaultThumbUrl,
  defaultActualTitle,
  defaultActualDescription,
  defaultSiteUrl,
  extractedUrl,
  imageWidth,
  imageOnly,
  loadingHeight = '100%',
  mobileLoadingHeight,
  noLink,
  onHideAttachment = () => null,
  small,
  style,
  userCanEditThis,
  videoWidth,
  videoHeight
}: {
  className?: string;
  contentId: number;
  contentType?: string;
  directUrl?: string;
  defaultThumbUrl?: string;
  defaultSiteUrl?: string;
  defaultActualTitle?: string;
  defaultActualDescription?: string;
  extractedUrl?: string;
  imageWidth?: string;
  imageOnly?: boolean;
  loadingHeight?: string;
  mobileLoadingHeight?: string;
  noLink?: boolean;
  onHideAttachment?: () => void;
  small?: boolean;
  style?: React.CSSProperties;
  userCanEditThis?: boolean;
  videoWidth?: string;
  videoHeight?: string;
}) {
  const navigate = useNavigate();
  const makeThumbnailSecure = useAppContext(
    (v) => v.requestHelpers.makeThumbnailSecure
  );
  const translator = {
    actualDescription:
      contentType === 'url' ? 'actualDescription' : 'linkDescription',
    actualTitle: contentType === 'url' ? 'actualTitle' : 'linkTitle',
    siteUrl: contentType === 'url' ? 'siteUrl' : 'linkUrl',
    url: contentType === 'url' ? 'content' : 'embeddedUrl'
  };
  const onSetActualDescription = useContentContext(
    (v) => v.actions.onSetActualDescription
  );
  const onSetActualTitle = useContentContext((v) => v.actions.onSetActualTitle);
  const onSetPrevUrl = useContentContext((v) => v.actions.onSetPrevUrl);
  const onSetSiteUrl = useContentContext((v) => v.actions.onSetSiteUrl);
  const onSetThumbUrl = useContentContext((v) => v.actions.onSetThumbUrl);
  const onSetMediaStarted = useContentContext(
    (v) => v.actions.onSetMediaStarted
  );

  const {
    description,
    prevUrl,
    thumbUrl: rawThumbUrl,
    title,
    [translator.actualDescription]: actualDescription,
    [translator.actualTitle]: actualTitle,
    [translator.siteUrl]: siteUrl,
    [translator.url]: contentStateUrl
  } = useContentState({ contentType, contentId });

  const url = useMemo(() => {
    return contentStateUrl || extractedUrl;
  }, [contentStateUrl, extractedUrl]);

  const appliedRawThumbUrl = useMemo(
    () => rawThumbUrl || defaultThumbUrl,
    [defaultThumbUrl, rawThumbUrl]
  );

  const thumbUrl = useMemo(() => {
    if (appliedRawThumbUrl?.split('/')[1] === 'thumbs') {
      return `${cloudFrontURL}${appliedRawThumbUrl}`;
    }
    return appliedRawThumbUrl;
  }, [appliedRawThumbUrl]);

  const [twinkleVideoId, setTwinkleVideoId] = useState('');
  const { notFound } = useContentState({
    contentId: Number(twinkleVideoId),
    contentType: 'video'
  });
  const loadingRef = useRef(false);
  const fallbackImage = '/img/link.png';
  const contentCss = useMemo(
    () => css`
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
      color: ${Color.darkerGray()};
      position: relative;
      overflow: hidden;
      ${!small ? 'flex-direction: column;' : ''};
    `,
    [small]
  );
  const thumbUrlIsNotAvailable = useMemo(
    () => !appliedRawThumbUrl && (rawThumbUrl === '' || defaultThumbUrl === ''),
    [appliedRawThumbUrl, defaultThumbUrl, rawThumbUrl]
  );
  const [imageUrl, setImageUrl] = useState(
    thumbUrlIsNotAvailable ? fallbackImage : thumbUrl
  );

  useEffect(() => {
    if (imageUrl !== '') {
      setImageUrl(thumbUrlIsNotAvailable ? fallbackImage : thumbUrl);
    }
    const extractedVideoId = extractVideoIdFromTwinkleVideoUrl(url);
    if (extractedVideoId && contentType === 'chat') {
      setTwinkleVideoId(extractedVideoId);
    } else if (
      !loadingRef.current &&
      url &&
      ((!thumbUrl && !thumbUrlIsNotAvailable) || (prevUrl && url !== prevUrl))
    ) {
      setImageUrl('');
      fetchUrlData();
    }
    if (!extractedVideoId || contentType !== 'chat') {
      onSetPrevUrl({ contentId, contentType, prevUrl: url, thumbUrl });
    }
    async function fetchUrlData() {
      loadingRef.current = true;
      try {
        const {
          data: { image, title, description, site }
        } = await request.put(`${API_URL}/embed`, {
          url,
          contentId,
          contentType
        });
        const imageUrl = image?.url
          ? image.url.replace('http://', 'https://')
          : fallbackImage;
        onSetThumbUrl({
          contentId,
          contentType,
          thumbUrl: imageUrl
        });
        setImageUrl(imageUrl);
        onSetActualDescription({ contentId, contentType, description });
        onSetActualTitle({ contentId, contentType, title });
        onSetSiteUrl({ contentId, contentType, siteUrl: site });
      } catch (error: any) {
        setImageUrl(fallbackImage);
        onHideAttachment();
        console.error(error.response || error);
      }
      loadingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    contentId,
    prevUrl,
    url,
    defaultSiteUrl,
    defaultThumbUrl,
    rawThumbUrl,
    siteUrl,
    thumbUrl
  ]);

  useEffect(() => {
    if (getFileInfoFromFileName(url)?.fileType === 'image') {
      setImageUrl(url);
    }
    if (thumbUrl?.includes('http://')) {
      makeThumbnailSecure({ contentId, contentType, thumbUrl });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thumbUrl, url]);

  const handlePlay = useCallback(() => {
    onSetMediaStarted({
      contentType,
      contentId,
      started: true
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId, contentType]);

  const InnerContent = useMemo(() => {
    return (
      <div
        style={{
          height: '100%'
        }}
        className={contentCss}
      >
        {!imageUrl ? (
          <Loading
            className={css`
              height: ${loadingHeight};
              @media (max-width: ${mobileMaxWidth}) {
                height: ${mobileLoadingHeight || loadingHeight};
              }
            `}
          />
        ) : noLink ? (
          <div style={{ width: small ? '25%' : '100%', height: '100%' }}>
            <section
              className={css`
                position: relative;
                width: 100%;
                height: 100%;
                &:after {
                  content: '';
                  display: block;
                  padding-bottom: ${small ? '100%' : '60%'};
                }
              `}
            >
              <img
                className={css`
                  position: absolute;
                  width: 100%;
                  height: 100%;
                  object-fit: ${contentType === 'chat' ? 'contain' : 'cover'};
                `}
                loading="lazy"
                src={imageUrl}
                onError={handleImageLoadError}
                alt={title}
              />
            </section>
          </div>
        ) : (
          <a
            style={{ width: small ? '25%' : '100%', height: '100%' }}
            target="_blank"
            rel="noopener noreferrer"
            href={url}
          >
            <section
              className={css`
                position: relative;
                width: 100%;
                height: 100%;
                &:after {
                  content: '';
                  display: block;
                  padding-bottom: ${small ? '100%' : '60%'};
                }
              `}
            >
              <img
                className={css`
                  position: absolute;
                  width: 100%;
                  height: 100%;
                  object-fit: ${contentType === 'chat' ? 'contain' : 'cover'};
                `}
                loading="lazy"
                src={imageUrl}
                onError={handleImageLoadError}
                alt={title}
              />
            </section>
          </a>
        )}
        {!imageOnly &&
          createElement(
            contentType === 'chat' || directUrl ? 'a' : 'section',
            {
              style: {
                textDecoration: 'none',
                color: Color.darkerGray()
              },
              target: contentType === 'chat' || directUrl ? '_blank' : null,
              rel:
                contentType === 'chat' || directUrl
                  ? 'noopener noreferrer'
                  : null,
              href:
                contentType === 'chat' || directUrl ? directUrl || url : null,
              className: css`
                width: 100%;
                line-height: 1.5;
                padding: 1rem;
                cursor: ${contentType === 'chat' || directUrl || small
                  ? 'pointer'
                  : ''};
                ${contentType === 'chat' || directUrl
                  ? 'margin-bottom: 1rem;'
                  : ''}
                ${small ? 'margin-left: 1rem;' : ''}
                ${small ? '' : 'margin-top: 1rem;'}
              `,
              onClick:
                small && !directUrl && !noLink
                  ? () => navigate(`/links/${contentId}`)
                  : null
            },
            <>
              <h3
                style={{
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {actualTitle || defaultActualTitle || title}
              </h3>
              <p
                style={{
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {actualDescription || defaultActualDescription || description}
              </p>
              <p style={{ fontWeight: 'bold' }}>{siteUrl}</p>
            </>
          )}
      </div>
    );
    function handleImageLoadError() {
      const appliedImageUrl =
        !thumbUrl || imageUrl === thumbUrl ? fallbackImage : thumbUrl;
      onSetThumbUrl({ contentId, contentType, thumbUrl: appliedImageUrl });
      setImageUrl(appliedImageUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    contentCss,
    imageUrl,
    loadingHeight,
    mobileLoadingHeight,
    noLink,
    small,
    contentType,
    title,
    url,
    imageOnly,
    directUrl,
    actualTitle,
    defaultActualTitle,
    actualDescription,
    defaultActualDescription,
    description,
    siteUrl,
    navigate,
    contentId,
    thumbUrl
  ]);

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        ...style
      }}
    >
      {contentType === 'chat' && userCanEditThis && !notFound && (
        <Icon
          style={{
            position: 'absolute',
            cursor: 'pointer',
            zIndex: 10
          }}
          onClick={() => onHideAttachment()}
          className={css`
            right: ${twinkleVideoId ? '1rem' : 'CALC(50% - 1rem)'};
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
          width: ${imageWidth || (contentType === 'chat' ? '50%' : '100%')};
          position: relative;
          align-items: center;
          justify-content: ${contentType === 'chat' && imageOnly && 'center'};
          display: flex;
          @media (max-width: ${mobileMaxWidth}) {
            width: 100%;
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
              font-size: ${contentType === 'chat' ? '1.4rem' : '1.9rem'};
            }
            p {
              font-size: ${contentType === 'chat' ? '1.2rem' : '1.5rem'};
              margin-top: 1rem;
            }
            @media (max-width: ${mobileMaxWidth}) {
              width: ${contentType === 'chat' ? '85%' : '100%'};
              h3 {
                font-size: ${contentType === 'chat' ? '1.3rem' : '1.7rem'};
              }
              p {
                font-size: ${contentType === 'chat' ? '1.1rem' : '1.3rem'};
              }
            }
          `}
        >
          {noLink ? (
            <div className={contentCss}>{InnerContent}</div>
          ) : twinkleVideoId ? (
            <TwinkleVideo
              imageOnly={imageOnly}
              onPlay={handlePlay}
              style={{
                width: videoWidth || '50vw',
                height: videoHeight || 'CALC(30vw + 3rem)'
              }}
              videoId={Number(twinkleVideoId)}
            />
          ) : (
            InnerContent
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(Embedly);
