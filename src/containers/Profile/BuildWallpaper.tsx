import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';
import { css } from '@emotion/css';

const WALLPAPER_SDK_STUB = `<script>
(function() {
  if (window.Twinkle) return;
  var noop = function() { return Promise.resolve(null); };
  var noopArr = function() { return Promise.resolve([]); };
  window.Twinkle = {
    build: { id: null, title: null, username: null },
    db: {
      open: noop, save: noop, exec: function() { return []; },
      run: noop, query: function() { return []; },
      getDb: function() { return null; }, isOpen: function() { return false; },
      close: noop
    },
    ai: { listPrompts: noopArr, chat: noop },
    viewer: {
      id: null, username: null, profilePicUrl: null,
      isLoggedIn: false, isOwner: false, get: noop, refresh: noop
    },
    viewerDb: { query: noopArr, exec: function() { return []; } },
    social: {
      follow: noop, unfollow: noop, isFollowing: function() { return Promise.resolve(false); },
      getFollowing: noopArr, getFollowers: noopArr
    },
    api: {
      getCurrentUser: noop, getViewer: noop, getUser: noop,
      getUsers: noopArr, getDailyReflections: noopArr,
      getDailyReflectionsByUser: noopArr
    },
    content: { getMySubjects: noopArr, getSubject: noop, getSubjectComments: noopArr },
    vocabulary: {
      lookupWord: noop, collectWord: noop,
      getBreakStatus: noop, getCollectedWords: noopArr
    },
    sharedDb: {
      getTopics: noopArr, createTopic: noop, getEntries: noopArr,
      addEntry: noop, updateEntry: noop, deleteEntry: noop
    }
  };
})();
</script>`;

export default function BuildWallpaper({ buildId }: { buildId: number }) {
  const loadWallpaperCode = useAppContext(
    (v) => v.requestHelpers.loadWallpaperCode
  );
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    handleLoadCode();
    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };

    async function handleLoadCode() {
      const result = await loadWallpaperCode(buildId);
      if (cancelled || !result?.code) return;
      const code = result.code;
      let injected: string;
      if (code.includes('<head>')) {
        injected = code.replace('<head>', '<head>' + WALLPAPER_SDK_STUB);
      } else if (code.includes('<body>')) {
        injected = code.replace('<body>', '<body>' + WALLPAPER_SDK_STUB);
      } else {
        injected = WALLPAPER_SDK_STUB + code;
      }
      const blob = new Blob([injected], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setBlobUrl(url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildId]);

  if (!blobUrl) return null;

  return (
    <iframe
      src={blobUrl}
      sandbox="allow-scripts"
      onLoad={() => setLoaded(true)}
      title="Profile wallpaper"
      className={css`
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: none;
        z-index: 2;
        pointer-events: none;
        opacity: ${loaded ? 1 : 0};
        transition: opacity 0.5s ease-in;
      `}
    />
  );
}
