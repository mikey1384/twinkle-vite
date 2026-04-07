import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { useRoleColor } from '~/theme/useRoleColor';
import { css } from '@emotion/css';
import { useContentContext } from '~/contexts';
import { useInView } from 'react-intersection-observer';

export default function BuildContent({
  build,
  contentId,
  navigate,
  theme
}: {
  build: {
    id?: number;
    title?: string;
    description?: string;
    thumbnailUrl?: string | null;
    updatedAt?: number | null;
  };
  contentId: number;
  navigate: (url: string) => void;
  theme?: string;
}) {
  const onSetMediaStarted = useContentContext(
    (v) => v.actions.onSetMediaStarted
  );
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [VisibilityRef, previewInView] = useInView({
    initialInView: true,
    threshold: 0.05
  });
  const [iframeActivated, setIframeActivated] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);
  const buildId = Number(build?.id || 0);
  const thumbnailUrl = String(build?.thumbnailUrl || '').trim();
  const hasThumbnail = Boolean(thumbnailUrl);
  const { colorKey: playButtonColorKey } = useRoleColor('button', {
    themeName: theme,
    fallback: 'logoBlue'
  });
  const { colorKey: playButtonHoverColorKey } = useRoleColor(
    'buttonHovered',
    {
      themeName: theme,
      fallback: playButtonColorKey || 'logoBlue'
    }
  );
  const appPath = useMemo(() => {
    return buildId ? `/app/${buildId}` : '';
  }, [buildId]);
  const embeddedAppPath = useMemo(() => {
    if (!appPath) return '';
    const searchParams = new URLSearchParams({
      embedded: '1'
    });
    if (Number(build?.updatedAt) > 0) {
      searchParams.set('rev', String(Number(build.updatedAt)));
    }
    return `${appPath}?${searchParams.toString()}`;
  }, [appPath, build?.updatedAt]);

  useEffect(() => {
    setIframeReady(false);
  }, [embeddedAppPath]);

  useEffect(() => {
    if (!iframeActivated || !iframeReady) return;
    postRuntimeVisibility(previewInView);
  }, [iframeActivated, iframeReady, previewInView]);

  if (!buildId || !embeddedAppPath) {
    return (
      <div
        className={css`
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 18rem;
          border: 1px solid var(--ui-border);
          border-radius: ${borderRadius};
          background: #fff;
          color: ${Color.darkGray()};
          font-weight: 600;
        `}
      >
        This app preview is unavailable.
      </div>
    );
  }

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        gap: 1rem;
      `}
    >
      <div
        className={css`
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        `}
      >
        <div
          className={css`
            display: flex;
            align-items: center;
            gap: 0.7rem;
            min-width: 0;
          `}
        >
          <div
            className={css`
              display: inline-flex;
              align-items: center;
              gap: 0.55rem;
              padding: 0.45rem 0.85rem;
              border-radius: 999px;
              background: ${Color.logoBlue(0.12)};
              color: ${Color.logoBlue()};
              font-size: 1.2rem;
              font-weight: 700;
            `}
          >
            <Icon icon="rocket" />
            <span>Lumine App</span>
          </div>
          {build.title ? (
            <div
              className={css`
                min-width: 0;
                font-size: 1.35rem;
                font-weight: 700;
                color: ${Color.darkGray()};
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              `}
            >
              {build.title}
            </div>
          ) : null}
        </div>
        <Button
          variant="ghost"
          onClick={() => navigate(appPath)}
          style={{ whiteSpace: 'nowrap' }}
        >
          <Icon icon="external-link-alt" />
          <span style={{ marginLeft: '0.7rem' }}>Open app</span>
        </Button>
      </div>
      <div
        ref={VisibilityRef}
        className={css`
          position: relative;
          width: 100%;
          height: 58rem;
          border: 1px solid var(--ui-border);
          border-radius: ${borderRadius};
          overflow: hidden;
          background: #fff;
          @media (max-width: ${mobileMaxWidth}) {
            height: 48rem;
            border-left: 0;
            border-right: 0;
            border-radius: 0;
          }
        `}
      >
        {!iframeActivated && (
          <div
            className={css`
              position: absolute;
              inset: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 1rem;
              padding: 2rem;
              background: ${hasThumbnail
                ? `linear-gradient(180deg, rgba(8, 16, 32, 0.18) 0%, rgba(8, 16, 32, 0.28) 56%, rgba(8, 16, 32, 0.4) 100%), url("${thumbnailUrl}") center / cover no-repeat`
                : 'radial-gradient(circle at top, #eef5ff 0%, #fafbff 58%, #fff 100%)'};
              color: ${hasThumbnail ? '#fff' : Color.darkGray()};
              z-index: 1;
              text-align: center;
            `}
          >
            <div
              className={css`
                width: 4.8rem;
                height: 4.8rem;
                border-radius: 999px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: ${hasThumbnail
                  ? 'rgba(255, 255, 255, 0.16)'
                  : Color.logoBlue(0.12)};
                color: ${hasThumbnail ? '#fff' : Color.logoBlue()};
                font-size: 1.8rem;
                backdrop-filter: ${hasThumbnail ? 'blur(8px)' : 'none'};
              `}
            >
              <Icon icon="rocket" />
            </div>
            <div
              className={css`
                font-size: 1.55rem;
                font-weight: 800;
                color: ${hasThumbnail ? '#fff' : Color.darkGray()};
                max-width: 32rem;
                line-height: 1.3;
                text-shadow: ${hasThumbnail
                  ? '0 2px 18px rgba(0, 0, 0, 0.35)'
                  : 'none'};
              `}
            >
              {build.title || 'Lumine App'}
            </div>
            {build.description?.trim() ? (
              <div
                className={css`
                  max-width: 32rem;
                  font-size: 1.05rem;
                  line-height: 1.55;
                  color: ${hasThumbnail
                    ? 'rgba(255, 255, 255, 0.94)'
                    : Color.darkGray(0.8)};
                  display: -webkit-box;
                  -webkit-line-clamp: 3;
                  -webkit-box-orient: vertical;
                  overflow: hidden;
                  text-shadow: ${hasThumbnail
                    ? '0 2px 16px rgba(0, 0, 0, 0.28)'
                    : 'none'};
                `}
              >
                {build.description.trim()}
              </div>
            ) : null}
            <Button
              color={playButtonColorKey}
              hoverColor={playButtonHoverColorKey}
              variant="solid"
              tone="raised"
              shape="pill"
              size="lg"
              uppercase={false}
              onClick={handlePlay}
              style={{
                minWidth: '14rem',
                justifyContent: 'center',
                boxShadow: hasThumbnail
                  ? '0 12px 24px rgba(18, 90, 255, 0.3)'
                  : '0 10px 20px rgba(18, 90, 255, 0.18)'
              }}
            >
              <Icon icon="play" />
              <span style={{ marginLeft: '0.7rem' }}>Play</span>
            </Button>
          </div>
        )}
        {iframeActivated && !iframeReady && (
          <div
            className={css`
              position: absolute;
              inset: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 0.8rem;
              background: #fafbff;
              color: ${Color.darkGray()};
              z-index: 1;
            `}
          >
            <Icon icon="spinner" pulse />
            <div
              className={css`
                font-size: 1.25rem;
                font-weight: 700;
              `}
            >
              Loading app...
            </div>
          </div>
        )}
        {iframeActivated && (
          <iframe
            ref={iframeRef}
            src={embeddedAppPath}
            title={build.title || 'Lumine App'}
            loading="lazy"
            onLoad={() => {
              setIframeReady(true);
              postRuntimeVisibility(previewInView);
            }}
            className={css`
              position: absolute;
              inset: 0;
              width: 100%;
              height: 100%;
              border: none;
              background: #fff;
              opacity: ${iframeReady ? 1 : 0};
              transition: opacity 0.18s ease;
            `}
          />
        )}
      </div>
    </div>
  );

  function handlePlay() {
    onSetMediaStarted({
      contentType: 'build',
      contentId,
      started: true
    });
    setIframeActivated(true);
    setIframeReady(false);
  }

  function postRuntimeVisibility(visible: boolean) {
    const runtimeWindow = iframeRef.current?.contentWindow;
    if (!runtimeWindow) return;
    runtimeWindow.postMessage(
      {
        source: 'twinkle-content-panel',
        type: 'runtime-visibility:update',
        payload: {
          visible
        }
      },
      '*'
    );
  }
}
