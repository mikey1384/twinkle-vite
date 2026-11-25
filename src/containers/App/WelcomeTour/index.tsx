import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ErrorBoundary from '~/components/ErrorBoundary';
import { useAppContext, useKeyContext } from '~/contexts';
import { LOADED_BUILD_RUNTIME_SESSION_SELECTOR } from '~/constants/appShell';
import {
  getAssistantDock,
  openAssistantDock,
  subscribeAssistantDock
} from '~/containers/App/AssistantDock/dockState';
import Greeter from './Greeter';
import TourPanel from './TourPanel';
import {
  isWelcomeBlockedSurface,
  orderWelcomeStops,
  stopMarks,
  welcomeBannerReady,
  welcomeGreetingLine,
  type WelcomeTourData,
  type WelcomeTourGuide,
  type WelcomeTourStop
} from './rules';
import {
  welcomeFocusSurfaces,
  welcomeMedia,
  welcomeTourOpenRequest,
  reportWelcomeMedia
} from './store';
import { GUIDE_COLOR, GUIDE_NAME, spotlightClass } from './styles';

type Mode = 'idle' | 'banner' | 'picker' | 'tour';

// The welcome greeter and guided tour (Mikey 11-25; twinkle-api
// helpers/welcomeTour). The server says whether the banner shows (once per
// member, ever) and holds every word; this host decides WHEN: never over a
// running game or app, the Build editor, an Arena sitting or an open modal,
// and on an XP video page never while the video plays.
export default function WelcomeTourHost() {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadWelcomeTour = useAppContext((v) => v.requestHelpers.loadWelcomeTour);
  const updateWelcomeTourState = useAppContext((v) => v.requestHelpers.updateWelcomeTourState);
  const pressSponsoredHelp = useAppContext((v) => v.requestHelpers.pressSponsoredHelp);
  const startWelcomeTourBuild = useAppContext((v) => v.requestHelpers.startWelcomeTourBuild);
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<WelcomeTourData | null>(null);
  const [mode, setMode] = useState<Mode>('idle');
  const [guide, setGuide] = useState<WelcomeTourGuide>('zero');
  const [stops, setStops] = useState<WelcomeTourStop[]>([]);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [replay, setReplay] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [making, setMaking] = useState(false);
  const [makeError, setMakeError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [appRuntimeVisible, setAppRuntimeVisible] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const pageLoadedAt = useRef(Date.now());
  const pendingStopKey = useRef<string>('');
  const skipNavigateOnce = useRef(false);
  const shownRecorded = useRef(false);
  // the guide's chat (text or call) opened from the tour follows its stops
  const dockFollowsTour = useRef(false);
  const focusSurfaces = useSyncExternalStore(
    welcomeFocusSurfaces.subscribe,
    welcomeFocusSurfaces.get
  );
  const media = useSyncExternalStore(welcomeMedia.subscribe, welcomeMedia.get);
  const dockOpen = !!useSyncExternalStore(subscribeAssistantDock, getAssistantDock);
  const openRequest = useSyncExternalStore(
    welcomeTourOpenRequest.subscribe,
    welcomeTourOpenRequest.get
  );

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    refresh().then((loaded) => {
      if (!cancelled && loaded) setData(loaded);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // A new page: a new video starts idle, and the banner's short beat restarts.
  useEffect(() => {
    reportWelcomeMedia('idle');
    pageLoadedAt.current = Date.now();
  }, [location.pathname]);

  // Modals and Build app layers come and go without telling anyone: look.
  useEffect(() => {
    if (!data || mode === 'idle' && !data.banner.show && !openRequest) return;
    const tick = () => {
      setNow(Date.now());
      setModalOpen(!!document.querySelector('[aria-modal="true"]'));
      const layer = document.querySelector<HTMLElement>(LOADED_BUILD_RUNTIME_SESSION_SELECTOR);
      setAppRuntimeVisible(!!layer && layer.offsetParent !== null);
    };
    tick();
    const timer = window.setInterval(tick, 500);
    return () => window.clearInterval(timer);
  }, [data, mode, openRequest]);

  const blocked = isWelcomeBlockedSurface({
    pathname: location.pathname,
    modalOpen,
    focusSurfaces,
    appRuntimeVisible
  });

  // The banner, once: after a short beat on any page (or a paused / finished
  // video), never over something running.
  useEffect(() => {
    if (!data?.banner.show || mode !== 'idle' || shownRecorded.current || blocked) return;
    const ready = welcomeBannerReady({
      pathname: location.pathname,
      media: media.state,
      msSinceLoad: now - pageLoadedAt.current,
      msSinceMediaChange: now - media.at
    });
    if (!ready) return;
    shownRecorded.current = true;
    setMode('banner');
    updateWelcomeTourState({ event: 'shown' }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, mode, blocked, now, media, location.pathname]);

  // Opened from the welcome card's stop list or the starter chip.
  useEffect(() => {
    if (!openRequest || !userId) return;
    welcomeTourOpenRequest.set(null);
    (async () => {
      const loaded = data || (await refresh());
      if (!loaded) return;
      setData(loaded);
      pendingStopKey.current = openRequest.stopKey || loaded.state.stopKey || '';
      const chosen = openRequest.guide || loaded.state.guide;
      if (chosen) startTour(chosen, loaded);
      else setMode('picker');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRequest, userId]);

  const stop = stops[index];
  // Each stop opens its page (unless the member just left it to build).
  useEffect(() => {
    if (mode !== 'tour' || !stop || finishing) return;
    if (skipNavigateOnce.current) {
      skipNavigateOnce.current = false;
      return;
    }
    if (!pathMatches(location.pathname, stop.path)) navigate(stop.path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, stop?.key, finishing]);

  // The guide's chat window, opened from the tour, follows the stops: in a
  // voice call the dock passes the new stop to the call (updateAiVoiceContext)
  // so the guide can talk them through it.
  useEffect(() => {
    if (mode !== 'tour' || !stop || !dockFollowsTour.current) return;
    if (getAssistantDock() !== GUIDE_NAME[guide]) return;
    openAssistantDock(GUIDE_NAME[guide], tourAskContext(stop, guide));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, stop?.key, guide]);

  const marks = useMemo(
    () => stopMarks({ stops, index, done, skipped }),
    [stops, index, done, skipped]
  );

  if (!userId || !data) return null;
  const greetingLine = welcomeGreetingLine(data.tour.greeting, {
    pathname: location.pathname,
    media: media.state
  });

  return (
    <ErrorBoundary componentPath="App/WelcomeTour">
      {(mode === 'banner' || mode === 'picker') && !blocked ? (
        <Greeter
          line={greetingLine}
          onPick={(picked) => startTour(picked, data)}
          onDecline={handleDecline}
        />
      ) : null}
      {mode === 'tour' && !blocked && stop ? (
        <>
          <Spotlight target={stop.target} guide={guide} active={!finishing} pathname={location.pathname} />
          <TourPanel
            guide={guide}
            stops={stops}
            index={index}
            marks={marks}
            replay={replay}
            data={data}
            finishing={finishing}
            making={making}
            makeError={makeError}
            onJump={(next) => goTo(next)}
            onSkip={handleSkip}
            onNext={handleNext}
            onAsk={handleAsk}
            onClose={handleDecline}
            onMake={handleMake}
            onOpenApp={(buildId) => navigate(`/app/${buildId}`)}
            besideDock={dockOpen}
          />
        </>
      ) : null}
    </ErrorBoundary>
  );

  async function refresh(): Promise<WelcomeTourData | null> {
    try {
      const loaded = await loadWelcomeTour();
      return loaded?.tour?.stops?.length ? (loaded as WelcomeTourData) : null;
    } catch {
      return null;
    }
  }

  function startTour(picked: WelcomeTourGuide, source: WelcomeTourData) {
    const ordered = orderWelcomeStops(source.tour.stops, location.pathname);
    const startAt = Math.max(
      0,
      ordered.findIndex((item) => item.key === pendingStopKey.current)
    );
    pendingStopKey.current = '';
    setGuide(picked);
    setStops(ordered);
    setIndex(startAt);
    setDone([]);
    setSkipped([]);
    setReplay(false);
    setFinishing(false);
    setMode('tour');
    updateWelcomeTourState({
      event: 'start',
      guide: picked,
      stopKey: ordered[startAt]?.key
    })
      .then(() => refresh())
      .then((loaded: WelcomeTourData | null) => loaded && setData(loaded))
      .catch(() => {});
  }

  function goTo(next: number) {
    if (next < 0 || next >= stops.length) return;
    setReplay(done.includes(stops[next].key));
    setFinishing(false);
    setMakeError('');
    setIndex(next);
    updateWelcomeTourState({ event: 'stop', guide, stopKey: stops[next].key }).catch(() => {});
  }

  function handleNext() {
    if (finishing) {
      setMode('idle');
      return;
    }
    if (stop && !done.includes(stop.key)) setDone((current) => [...current, stop.key]);
    if (index >= stops.length - 1) return finish();
    goTo(index + 1);
  }

  // Skip goes straight on, even mid-line (the panel restarts its narration).
  function handleSkip() {
    if (stop && !done.includes(stop.key) && !skipped.includes(stop.key)) {
      setSkipped((current) => [...current, stop.key]);
    }
    if (index >= stops.length - 1) return finish();
    goTo(index + 1);
  }

  function finish() {
    setFinishing(true);
    updateWelcomeTourState({ event: 'finish', guide, stopKey: stop?.key }).catch(() => {});
    setData((current) => (current ? { ...current, banner: { ...current.banner, show: false } } : current));
  }

  // Any dismissal ends it for good (Mikey 11-25: shown once, no "Later").
  function handleDecline() {
    const wasPicker = mode === 'picker';
    setMode('idle');
    setData((current) => (current ? { ...current, banner: { ...current.banner, show: false } } : current));
    // reopening from the chip and closing the picker again records nothing new
    if (!wasPicker) {
      updateWelcomeTourState({ event: 'decline' }).catch(() => {});
    }
  }

  function handleAsk() {
    if (!stop) return;
    // the guide's own chat window (the AssistantDock): text, and its call
    // button for talking it through; the first tour's free budget applies
    dockFollowsTour.current = true;
    openAssistantDock(GUIDE_NAME[guide], tourAskContext(stop, guide));
  }

  async function handleMake({ idea, title }: { idea: string; title: string }) {
    if (making || !data) return;
    setMaking(true);
    setMakeError('');
    try {
      if (stop && !done.includes(stop.key)) setDone((current) => [...current, stop.key]);
      if (data.welcomeCard) {
        // the welcome card's own Twinkle-paid first build, planned from
        // their choice in Zero/Ciel's chat (they confirm it there)
        const result = await pressSponsoredHelp(data.welcomeCard.requestId, idea);
        const pathId = Number(result?.request?.assistantPathId || 0);
        advanceWithoutNavigating();
        if (pathId) navigate(`/chat/${pathId}`);
      } else {
        const result = await startWelcomeTourBuild({ idea, title });
        advanceWithoutNavigating();
        if (result?.buildId) {
          navigate(`/build/${result.buildId}`, { state: { initialPrompt: result.initialPrompt || idea } });
        }
      }
      const loaded = await refresh();
      if (loaded) setData(loaded);
    } catch (error: any) {
      setMakeError(error?.message || 'That didn’t start. Please try again.');
    } finally {
      setMaking(false);
    }
  }

  // After "Build it" the member goes to their project (the tour waits while
  // the editor is open) and comes back to the next stop.
  function advanceWithoutNavigating() {
    if (index < stops.length - 1) {
      skipNavigateOnce.current = true;
      goTo(index + 1);
    }
  }
}

function tourAskContext(stop: WelcomeTourStop, guide: WelcomeTourGuide) {
  return {
    kind: 'page',
    label: `Tour: ${stop.title}`,
    path: stop.path,
    excerpt: stop.lines[guide],
    tourStop: stop.key
  };
}

function pathMatches(pathname: string, path: string) {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

// A ring around the stop's feature, with the rest of the page dimmed. Waits a
// moment for the page to draw the element; no ring if it never appears.
function Spotlight({
  target,
  guide,
  active,
  pathname
}: {
  target: string;
  guide: WelcomeTourGuide;
  active: boolean;
  pathname: string;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    setRect(null);
    if (!active) return;
    let scrolled = false;
    let frames = 0;
    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-welcome-tour="${target}"]`);
      if (!el || el.offsetParent === null) {
        setRect(null);
        return;
      }
      if (!scrolled) {
        scrolled = true;
        const box = el.getBoundingClientRect();
        if (box.top < 0 || box.top > window.innerHeight * 0.55) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
      }
      const box = el.getBoundingClientRect();
      // a page-sized target is pointed at by its visible part only
      const top = Math.max(box.top, 8);
      const bottom = Math.min(box.bottom, window.innerHeight - 8);
      if (bottom - top < 24) {
        setRect(null);
        return;
      }
      setRect(new DOMRect(box.left - 6, top - 6, box.width + 12, bottom - top + 12));
    };
    const timer = window.setInterval(() => {
      frames += 1;
      measure();
      if (frames > 40) window.clearInterval(timer);
    }, 250);
    const onMove = () => measure();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [target, active, pathname]);
  if (!rect) return null;
  return (
    <div
      className={spotlightClass}
      data-welcome-spotlight=""
      style={
        {
          '--guide': GUIDE_COLOR[guide],
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        } as React.CSSProperties
      }
    />
  );
}
