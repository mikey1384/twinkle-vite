import React, { memo, useEffect, useState } from 'react';
import Loading from '~/components/Loading';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext, useInteractiveContext } from '~/contexts';

function SlideEmbedly({
  style,
  onSetEmbedProps,
  url,
  thumbUrl,
  actualTitle,
  actualDescription,
  interactiveId,
  prevUrl,
  siteUrl,
  slideId
}: {
  style?: any;
  onSetEmbedProps: (props: any) => void;
  url: string;
  thumbUrl: string;
  actualTitle: string;
  actualDescription: string;
  interactiveId: number;
  prevUrl: string;
  siteUrl: string;
  slideId: number;
}) {
  const fetchUrlEmbedData = useAppContext(
    (v) => v.requestHelpers.fetchUrlEmbedData
  );
  const updateEmbedData = useAppContext(
    (v) => v.requestHelpers.updateEmbedData
  );
  const onChangeNumUpdates = useInteractiveContext(
    (v) => v.actions.onChangeNumUpdates
  );
  const [loading, setLoading] = useState(false);
  const fallbackImage = '/img/link.png';

  useEffect(() => {
    if (!thumbUrl || (prevUrl && url !== prevUrl)) {
      fetchUrlData();
    }
    onSetEmbedProps({ prevUrl: url });
    async function fetchUrlData() {
      try {
        setLoading(true);
        const { image, title, description, site } = await fetchUrlEmbedData(
          url
        );
        setLoading(false);
        onSetEmbedProps({
          thumbUrl: image.url,
          actualTitle: title,
          actualDescription: description,
          siteUrl: site,
          prevUrl: url
        });
        const numUpdates = await updateEmbedData({
          slideId,
          thumbUrl: image.url,
          actualTitle: title,
          actualDescription: description,
          siteUrl: site
        });
        onChangeNumUpdates({ interactiveId, numUpdates });
      } catch (error: any) {
        setLoading(false);
        onSetEmbedProps({ thumbUrl: fallbackImage });
        console.error(error.response || error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, thumbUrl, prevUrl]);

  return (
    <div style={{ position: 'relative', ...style }}>
      {loading ? (
        <Loading
          className={css`
            height: 30rem;
            @media (max-width: ${mobileMaxWidth}) {
              height: 25rem;
            }
          `}
        />
      ) : (
        <a
          style={{ width: '100%' }}
          target="_blank"
          rel="noopener noreferrer"
          href={url}
        >
          <img
            style={{ width: '100%', objectFit: 'cover' }}
            src={thumbUrl}
            loading="lazy"
            onError={handleImageLoadError}
            alt={actualTitle || ''}
          />
        </a>
      )}
      <div style={{ color: Color.darkerGray() }}>
        <h3
          style={{
            marginTop: '1rem',
            fontSize: '1.7rem',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {actualTitle}
        </h3>
        <p
          style={{
            marginTop: '1rem',
            fontSize: '1.3rem',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {actualDescription}
        </p>
        <p
          style={{ fontWeight: 'bold', marginTop: '1rem', fontSize: '1.3rem' }}
        >
          {siteUrl}
        </p>
      </div>
    </div>
  );

  function handleImageLoadError() {
    onSetEmbedProps({ thumbUrl: thumbUrl || fallbackImage });
  }
}

export default memo(SlideEmbedly);
