import React, { useEffect, useMemo, useState } from 'react';
import VideoThumbImage from '~/components/VideoThumbImage';
import Icon from '~/components/Icon';
import { useKeyContext } from '~/contexts';
import { videoRewardHash } from '~/constants/defaultValues';
import { addCommasToNumber } from '~/helpers/stringHelpers';

const primaryPreviewTextClass = 'home-feed-card__primary-preview-text';

export default function VideoPreview({
  content,
  contentId
}: {
  content: any;
  contentId: number;
}) {
  const rewardBoostLvl = useKeyContext((v) => v.myState.rewardBoostLvl);
  const videoCode = String(content?.content || '').trim();
  const rewardLevel = Number(content?.rewardLevel || 0);
  const channelName = String(content?.ytChannelName || '').trim();
  const description = String(content?.description || '').trim();
  const thumbUrl = useBestYouTubeThumb(videoCode);

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

  return (
    <div className="home-feed-card__video-preview">
      <VideoThumbImage
        className="home-feed-card__video-thumb"
        rewardLevel={rewardLevel}
        videoId={contentId}
        noPaddingBottom
        src={thumbUrl}
      />
      <div className="home-feed-card__video-copy">
        <h3 className={primaryPreviewTextClass}>{content?.title}</h3>
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
          <p className={primaryPreviewTextClass}>{description}</p>
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
function useBestYouTubeThumb(videoCode: string) {
  const defaultUrl = videoCode
    ? `https://img.youtube.com/vi/${videoCode}/mqdefault.jpg`
    : '';
  const [src, setSrc] = useState(defaultUrl);

  useEffect(() => {
    setSrc(defaultUrl);
    if (!videoCode) return;

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
  }, [videoCode]);

  return src;
}
