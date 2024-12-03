import React from 'react';
import Loading from '~/components/Loading';
import { css } from '@emotion/css';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';

export default function UrlContent({
  actualTitle,
  actualDescription,
  fallbackImage,
  imageUrl,
  loading,
  onSetImageUrl,
  thumbUrl,
  title,
  url,
  siteUrl
}: {
  actualTitle?: string;
  actualDescription?: string;
  fallbackImage?: string;
  imageUrl?: string;
  loading?: boolean;
  onSetImageUrl: (v: any) => void;
  thumbUrl?: string;
  title?: string;
  url?: string;
  siteUrl?: string;
}) {
  return (
    <div
      className={`
        color: ${Color.darkerGray()};
        position: relative;
        overflow: hidden;
      `}
      style={{ width: '100%', height: '100%' }}
    >
      {!imageUrl || loading ? (
        <Loading
          className={css`
            height: 100%;
          `}
        />
      ) : (
        <section
          className={css`
            position: relative;
            width: 100%;
            height: 27rem;
            @media (max-width: ${mobileMaxWidth}) {
              height: 13rem;
            }
          `}
        >
          <a
            style={{
              width: '100%',
              height: '100%',
              textDecoration: 'none',
              color: Color.darkerGray()
            }}
            target="_blank"
            rel="noopener noreferrer"
            href={url}
          >
            <img
              loading="lazy"
              fetchPriority="low"
              className={css`
                border-radius: ${borderRadius};
                width: 100%;
                height: 100%;
                object-fit: contain;
              `}
              src={imageUrl}
              onError={handleImageLoadError}
              alt={title}
            />
            <div
              className={css`
                margin-top: 1rem;
                height: 8rem;
                @media (max-width: ${mobileMaxWidth}) {
                  height: 7rem;
                }
              `}
            >
              <h3
                style={{
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {actualTitle || title}
              </h3>
              {actualDescription && (
                <p
                  style={{
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {actualDescription}
                </p>
              )}
              {siteUrl ? <p style={{ fontWeight: 'bold' }}>{siteUrl}</p> : null}
            </div>
          </a>
        </section>
      )}
    </div>
  );

  function handleImageLoadError() {
    onSetImageUrl(
      !thumbUrl || imageUrl === thumbUrl ? fallbackImage : thumbUrl
    );
  }
}
