import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import VideoThumbImage from '~/components/VideoThumbImage';
import Icon from '~/components/Icon';
import { useKeyContext } from '~/contexts';
import { videoRewardHash } from '~/constants/defaultValues';
import { addCommasToNumber } from '~/helpers/stringHelpers';

const primaryPreviewTextClass = 'home-feed-card__primary-preview-text';

export default function VideoPreview({
  content,
  contentId,
  variant = 'main'
}: {
  content: any;
  contentId: number;
  variant?: 'main' | 'target';
}) {
  const rewardBoostLvl = useKeyContext((v) => v.myState.rewardBoostLvl);
  const videoCode = String(content?.content || '').trim();
  const rewardLevel = Number(content?.rewardLevel || 0);
  const channelName = String(content?.ytChannelName || '').trim();
  const description = String(content?.description || '').trim();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Mirrors XPVideoPlayer's per-minute reward math so the figure matches the
  // watch page exactly (rate scales with the viewer's reward boost level;
  // coins only start at reward level 3).
  const xpPerMinute = useMemo(
    () => rewardLevel * (videoRewardHash?.[rewardBoostLvl]?.xp || 20),
    [rewardBoostLvl, rewardLevel]
  );
  const coinPerMinute = useMemo(
    () => videoRewardHash?.[rewardBoostLvl]?.coin || 2,
    [rewardBoostLvl]
  );
  const canEarnCoins = rewardLevel >= 3;

  const isTarget = variant === 'target';
  const wrapperClass = isTarget
    ? 'home-feed-card__target-content home-feed-card__target-video has-media'
    : 'home-feed-card__video-preview';
  const thumbClass = isTarget
    ? 'home-feed-card__target-media'
    : 'home-feed-card__video-thumb';
  const copyClass = isTarget
    ? 'home-feed-card__target-copy'
    : 'home-feed-card__video-copy';
  const thumbUrl = useBestYouTubeThumb(videoCode, wrapperRef, thumbClass);

  return (
    <div className={wrapperClass} ref={wrapperRef}>
      <VideoThumbImage
        className={thumbClass}
        rewardLevel={rewardLevel}
        videoId={contentId}
        noPaddingBottom
        src={thumbUrl}
      />
      <div className={copyClass}>
        {isTarget ? (
          <h4 className="home-feed-card__target-video-title">
            {content?.title}
          </h4>
        ) : (
          <h3 className={primaryPreviewTextClass}>{content?.title}</h3>
        )}
        {channelName ? (
          <span className="home-feed-card__video-channel">
            <Icon icon={['fab', 'youtube']} />
            <span>{channelName}</span>
          </span>
        ) : null}
        {rewardLevel > 0 ? (
          <span className="home-feed-card__video-reward">
            <span className="home-feed-card__video-reward-xp">
              <span className="home-feed-card__video-reward-xp-number">
                {addCommasToNumber(xpPerMinute)}
              </span>
              <span className="home-feed-card__video-reward-xp-label">XP</span>
            </span>
            {canEarnCoins ? (
              <span className="home-feed-card__video-reward-coins">
                <Icon icon="coins" />
                {addCommasToNumber(coinPerMinute)}
              </span>
            ) : null}
            <span className="home-feed-card__video-reward-per">/ min</span>
          </span>
        ) : null}
        {description ? (
          <p className={isTarget ? undefined : primaryPreviewTextClass}>
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// YouTube's mqdefault (320x180, 16:9) always exists and is our safe default.
// maxresdefault (1280x720, 16:9) is crisper but only present for higher-res
// uploads; it returns a real 404 when missing (unlike hqdefault/sddefault,
// which serve a gray placeholder with a 200), so a plain Image() probe is a
// reliable "use it only if it loads" gate. VideoThumbImage paints the src as a
// background-image (no onError), so the fallback has to live here.
//
// maxresdefault decodes to about 3.7 MB, 16 times mqdefault, so it is asked
// for only when the tile needs more than mqdefault can give: the tile is
// filled (background-size: cover), so a 16:9 picture must span the tile's
// width or its height times 16/9, in device pixels.
const MQ_DEFAULT_ENOUGH_DEVICE_PX = 400;
function useBestYouTubeThumb(
  videoCode: string,
  wrapperRef: React.RefObject<HTMLDivElement | null>,
  thumbClass: string
) {
  const defaultUrl = videoCode
    ? `https://img.youtube.com/vi/${videoCode}/mqdefault.jpg`
    : '';
  const [src, setSrc] = useState(defaultUrl);
  const [needsHighRes, setNeedsHighRes] = useState(false);

  useLayoutEffect(() => {
    const thumb = wrapperRef.current?.getElementsByClassName(thumbClass)[0];
    if (!thumb) return;
    const measure = () => {
      const rect = thumb.getBoundingClientRect();
      const devicePx =
        Math.max(rect.width, (rect.height * 16) / 9) *
        (window.devicePixelRatio || 1);
      // Never drop back once the crisper picture was needed (e.g. rotation).
      if (devicePx > MQ_DEFAULT_ENOUGH_DEVICE_PX) setNeedsHighRes(true);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(thumb);
    return () => observer.disconnect();
  }, [thumbClass, wrapperRef]);

  useEffect(() => {
    setSrc(defaultUrl);
    if (!videoCode || !needsHighRes) return;

    let active = true;
    const highResUrl = `https://img.youtube.com/vi/${videoCode}/maxresdefault.jpg`;
    const probe = new Image();
    probe.onload = () => {
      if (active && probe.naturalWidth > 320) setSrc(highResUrl);
    };
    probe.onerror = () => {};
    probe.src = highResUrl;

    return () => {
      active = false;
      probe.onload = null;
      probe.onerror = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoCode, needsHighRes]);

  return src;
}
