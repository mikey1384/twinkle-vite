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
import { saveHomeCallAssistant } from '~/helpers/aiVoiceCall';
import Greeter from './Greeter';
import TourPanel from './TourPanel';
import {
  isBuildEditorPath,
  isWelcomeBlockedSurface,
  lumineStopFor,
  newWelcomeRunKey,
  newerWelcomeTourState,
  orderWelcomeStops,
  projectOpenNavState,
  stopMarks,
  welcomeBannerReady,
  welcomeGreetingLine,
  welcomeTourResumeKey,
  type WelcomeTourData,
  type WelcomeTourGuide,
  type WelcomeTourProject,
  type WelcomeTourServerState,
  type WelcomeTourSource,
  type WelcomeTourStop
} from './rules';
import {
  welcomeFocusSurfaces,
  welcomeMedia,
  welcomeTourOpenRequest,
  welcomeTourProgress,
  reportWelcomeMedia
} from './store';
import { GUIDE_COLOR, GUIDE_NAME, spotlightClass } from './styles';

type Mode = 'idle' | 'banner' | 'picker' | 'tour';
type StepEvent = 'start' | 'stop' | 'skip' | 'finish' | 'decline';

// The welcome greeter and guided tour (Mikey 11-25; twinkle-api
// helpers/welcomeTour). The server says whether the banner shows (once per
// member, ever) and holds every word; this host decides WHEN: never over a
// running game or app, the Build editor, an Arena sitting or an open modal,
// and on an XP video page never while the video plays.
//
// Progress is the server's (review 11-26): each "Start the tour" is a run,
// every step of it is sent in order (one at a time) with the run id and a
// step number, and the server keeps only the newest step of the current
// run. Resuming reads the server's state from the writer after this tab's
// own steps have landed; what this tab last saw confirmed is tagged with the
// account, so another account on the same tab never resumes from it.
export default function WelcomeTourHost() {
  const userId = Number(useKeyContext((v) => v.myState.userId) || 0);
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
  // stops this run has shown (only these get a tick, also at the end)
  const [visited, setVisited] = useState<string[]>([]);
  const [replay, setReplay] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [making, setMaking] = useState(false);
  const [makeError, setMakeError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [appRuntimeVisible, setAppRuntimeVisible] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [projectHint, setProjectHint] = useState<WelcomeTourProject | null>(null);
  const pageLoadedAt = useRef(Date.now());
  // how a picker opened from the chip starts its tour once a guide is picked
  const pendingPick = useRef<{ source: WelcomeTourSource; keepOrder: boolean; stopKey: string }>({
    source: 'chip',
    keepOrder: false,
    stopKey: ''
  });
  const skipNavigateOnce = useRef(false);
  const shownRecorded = useRef(false);
  // the stop whose project the member opened: the tour waits in the editor
  // and moves on when they come back
  const awaitingReturnFrom = useRef<string>('');
  // the control that opened the tour, for focus on close
  const launcher = useRef<HTMLElement | null>(null);
  // the run being sent: its key, its id (from the start's answer) and the
  // last step number; steps go one at a time in order
  const run = useRef<{ key: string; id: number; seq: number }>({ key: '', id: 0, seq: 0 });
  const queue = useRef<Promise<unknown>>(Promise.resolve());
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
  const runs = !!data?.features?.runs;

  // A new account on this tab starts clean (nothing of the last one's tour).
  useEffect(() => {
    setData(null);
    setMode('idle');
    setProjectHint(null);
    run.current = { key: '', id: 0, seq: 0 };
    awaitingReturnFrom.current = '';
    shownRecorded.current = false;
    const confirmed = welcomeTourProgress.get();
    if (confirmed && confirmed.userId !== userId) welcomeTourProgress.set(null);
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
    if (!data || (mode === 'idle' && !data.banner.show && !openRequest)) return;
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

  // Opened from the welcome card (its main button or a chapter chip) or the
  // starter chip. The opener's own source and order always win, even over an
  // open banner (review 11-26 #7).
  useEffect(() => {
    if (!openRequest || !userId) return;
    welcomeTourOpenRequest.set(null);
    launcher.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    (async () => {
      // this tab's own steps land first, then the server's state, fresh
      await queue.current.catch(() => {});
      const loaded = (await refresh({ fresh: true })) || data;
      if (!loaded) return;
      setData(loaded);
      const resume = welcomeTourResumeKey(
        newerWelcomeTourState(loaded.state, welcomeTourProgress.get(), userId)
      );
      const open = {
        source: openRequest.source || ('chip' as WelcomeTourSource),
        keepOrder: openRequest.source === 'card',
        stopKey: openRequest.stopKey || resume
      };
      if (openRequest.project) setProjectHint(openRequest.project);
      const chosen = openRequest.guide || loaded.state.guide;
      if (chosen) startTour(chosen, loaded, open);
      else {
        pendingPick.current = open;
        setMode('picker');
      }
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

  // Back from the project they opened on a stop (review 11-26 #5): the stop
  // stayed current while the editor was open; now move on and open the next
  // stop's page together.
  useEffect(() => {
    const from = awaitingReturnFrom.current;
    if (!from || mode !== 'tour' || blocked || isBuildEditorPath(location.pathname)) return;
    awaitingReturnFrom.current = '';
    if (stops[index]?.key !== from) return;
    if (index < stops.length - 1) goTo(index + 1);
    else finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, blocked, location.pathname]);

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
    () => stopMarks({ stops, index, done: visited, skipped: [] }),
    [stops, index, visited]
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
          onPick={(picked) =>
            startTour(
              picked,
              data,
              mode === 'picker' ? pendingPick.current : { source: 'banner', keepOrder: false, stopKey: '' }
            )
          }
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
            visited={visited}
            replay={replay}
            data={data}
            finishing={finishing}
            making={making}
            makeError={makeError}
            lumine={lumineStopFor(data, projectHint)}
            onJump={(next) => goTo(next)}
            onBack={() => goTo(index - 1)}
            onNext={handleNext}
            onAsk={handleAsk}
            onSkipTour={handleSkipTour}
            onMake={handleMake}
            onOpenProject={handleOpenProject}
            onOpenCardChat={handleOpenCardChat}
            onOpenApp={(buildId) => navigate(`/app/${buildId}`)}
            besideDock={dockOpen}
          />
        </>
      ) : null}
    </ErrorBoundary>
  );

  async function refresh({ fresh = false }: { fresh?: boolean } = {}): Promise<WelcomeTourData | null> {
    try {
      const loaded = await loadWelcomeTour({ fresh });
      return loaded?.tour?.stops?.length ? (loaded as WelcomeTourData) : null;
    } catch {
      return null;
    }
  }

  // One step to the server, after every earlier one. The payload is built
  // when it goes, so a step after the start carries the start's run id.
  function send(
    event: StepEvent,
    extra: { stopKey?: string; source?: WelcomeTourSource; guide?: WelcomeTourGuide } = {}
  ) {
    const owner = userId;
    const legacy = !runs;
    const step = queue.current
      .catch(() => {})
      .then(async () => {
        if (owner !== userId) return;
        const payload: Record<string, any> = { event, ...extra, guide: extra.guide || guide };
        if (event === 'skip' && legacy) payload.event = 'decline';
        if (!legacy) {
          if (event === 'start') payload.runKey = run.current.key;
          else if (event !== 'decline') {
            if (!run.current.id) return;
            run.current.seq += 1;
            payload.runId = run.current.id;
            payload.seq = run.current.seq;
          }
        }
        const answer: any = await updateWelcomeTourState(payload as any);
        const state: WelcomeTourServerState | undefined = answer?.state;
        if (event === 'start' && state && Number(state.runId) > 0) run.current.id = Number(state.runId);
        if (state && owner === userId) {
          const mine = newerWelcomeTourState(welcomeTourProgress.get(), { ...state, userId: owner }, owner);
          if (mine) welcomeTourProgress.set({ ...mine, userId: owner });
        }
      })
      .catch(() => {});
    queue.current = step;
    return step;
  }

  function startTour(
    picked: WelcomeTourGuide,
    source: WelcomeTourData,
    open: { source: WelcomeTourSource; keepOrder: boolean; stopKey: string }
  ) {
    const ordered = orderWelcomeStops(source.tour.stops, location.pathname, {
      keepOrder: open.keepOrder
    });
    const startAt = Math.max(
      0,
      ordered.findIndex((item) => item.key === open.stopKey)
    );
    setGuide(picked);
    // The guide they pick becomes the Home page's default call partner
    // (the chooser under the call button). Mikey 11-25.
    saveHomeCallAssistant(userId || null, picked === 'ciel' ? 'Ciel' : 'Zero');
    setStops(ordered);
    setIndex(startAt);
    setVisited(ordered[startAt] ? [ordered[startAt].key] : []);
    setReplay(false);
    setFinishing(false);
    setMakeError('');
    awaitingReturnFrom.current = '';
    setMode('tour');
    run.current = { key: newWelcomeRunKey(), id: 0, seq: 0 };
    send('start', { stopKey: ordered[startAt]?.key, source: open.source, guide: picked }).then(async () => {
      const loaded = await refresh();
      if (loaded) setData(loaded);
    });
  }

  function goTo(next: number) {
    if (next < 0 || next >= stops.length) return;
    const key = stops[next].key;
    setReplay(visited.includes(key));
    setVisited((current) => (current.includes(key) ? current : [...current, key]));
    setFinishing(false);
    setMakeError('');
    setIndex(next);
    send('stop', { stopKey: key });
  }

  function handleNext() {
    if (finishing) {
      closeTour();
      return;
    }
    if (index >= stops.length - 1) return finish();
    goTo(index + 1);
  }

  // Skip tour: ends this run here; the welcome card's button picks up at
  // this stop.
  function handleSkipTour() {
    if (finishing) return closeTour();
    send('skip', { stopKey: stop?.key });
    closeTour();
  }

  function finish() {
    setFinishing(true);
    send('finish', { stopKey: stop?.key });
    setData((current) => (current ? { ...current, banner: { ...current.banner, show: false } } : current));
  }

  function closeTour() {
    setMode('idle');
    setFinishing(false);
    awaitingReturnFrom.current = '';
    setData((current) => (current ? { ...current, banner: { ...current.banner, show: false } } : current));
    restoreFocus();
  }

  // Focus goes back to what opened the tour when it's still there, or to the
  // page's main heading (review 11-26 #8).
  function restoreFocus() {
    const target = launcher.current;
    window.setTimeout(() => {
      if (target && target.isConnected) {
        target.focus({ preventScroll: true });
        return;
      }
      const heading = document.querySelector<HTMLElement>('main h1, h1');
      if (heading) {
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }, 0);
  }

  // "No thanks" on the banner, or closing the guide picker (Mikey 11-25:
  // shown once, no "Later").
  function handleDecline() {
    const wasPicker = mode === 'picker';
    setMode('idle');
    setData((current) => (current ? { ...current, banner: { ...current.banner, show: false } } : current));
    // reopening from the chip and closing the picker again records nothing new
    if (!wasPicker) send('decline');
  }

  function handleAsk() {
    if (!stop) return;
    // the guide's own chat window (the AssistantDock): text, and its call
    // button for talking it through; the first tour's free budget applies
    dockFollowsTour.current = true;
    openAssistantDock(GUIDE_NAME[guide], tourAskContext(stop, guide));
  }

  // The Lumine stop's "Show me!" / "Make something" (review 11-26 P0):
  // - a waiting welcome card: the card's own free first build, planned from
  //   their choice in Zero/Ciel's chat (they confirm it there); the tour
  //   pauses at this stop and the card's button continues it;
  // - no card and no first project: the tour's own build; the server refuses
  //   a second project, and an existing one is opened instead.
  async function handleMake({ idea, title }: { idea: string; title: string }) {
    if (making || !data || !stop) return;
    const lumine = lumineStopFor(data, projectHint);
    setMaking(true);
    setMakeError('');
    try {
      if (lumine.kind === 'card_waiting') {
        const result = await pressSponsoredHelp(lumine.requestId, idea);
        const pathId = Number(result?.request?.assistantPathId || data.welcomeCardPathId || 0);
        pauseTour();
        if (pathId) navigate(`/chat/${pathId}`);
      } else if (lumine.kind === 'make') {
        try {
          // the stop showed it as free: the server sends nothing if it
          // isn't by now
          const result = await startWelcomeTourBuild({ idea, title, expectFree: !!data.free.build });
          if (result?.buildId) {
            // they chose "Build it": their idea goes with it, unless it was
            // shown as free and no longer is (then it waits unsent, said so)
            openFromStop(
              Number(result.buildId),
              result.initialPrompt
                ? { initialPrompt: result.initialPrompt }
                : { initialDraft: result.draft || idea, initialNotice: result.notice || '' }
            );
          }
        } catch (error: any) {
          if (error?.code === 'first_project_exists' && error?.project?.buildId) {
            // never a second project: open the one they have, without a prompt
            openFromStop(Number(error.project.buildId), undefined);
          } else throw error;
        }
      }
      const loaded = await refresh({ fresh: true });
      if (loaded) setData(loaded);
    } catch (error: any) {
      setMakeError(error?.message || 'That didn’t start. Please try again.');
      const loaded = await refresh({ fresh: true });
      if (loaded) setData(loaded);
    } finally {
      setMaking(false);
    }
  }

  // The first project Twinkle already made them: opened live. It sends
  // Lumine the idea by itself only while Twinkle's free first run is the one
  // that would start (review 11-26 P0 #2).
  function handleOpenProject(project: WelcomeTourProject) {
    openFromStop(project.buildId, projectOpenNavState(project));
  }

  // The welcome card is planning or running: its own chat finishes it.
  function handleOpenCardChat() {
    const pathId = Number(data?.welcomeCardPathId || 0);
    pauseTour();
    if (pathId) navigate(`/chat/${pathId}`);
  }

  // The stop stays current while the editor is open; coming back moves on.
  function openFromStop(buildId: number, state: Record<string, string> | undefined) {
    if (stop) awaitingReturnFrom.current = stop.key;
    navigate(`/build/${buildId}`, state ? { state } : undefined);
  }

  // Off to the card's chat: the tour steps aside, the run stays active at
  // this stop, and "Continue the tour" picks it up.
  function pauseTour() {
    setMode('idle');
    awaitingReturnFrom.current = '';
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

function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

// A ring around the stop's feature, with the rest of the page dimmed. Waits a
// moment for the page to draw the element; no ring if it never appears. With
// reduced motion the page jumps to it instead of scrolling (review 11-26 #9).
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
          el.scrollIntoView({ block: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
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
