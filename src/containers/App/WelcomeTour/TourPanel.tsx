import React, { useEffect, useRef, useState } from 'react';
import Icon from '~/components/Icon';
import { GUIDE_PICTURE } from './Greeter';
import MakeChoice from './MakeChoice';
import { TourApps, TourArenaExams } from './StopExtras';
import {
  lumineStopFor,
  type StopMark,
  type WelcomeTourData,
  type WelcomeTourGuide,
  type WelcomeTourProject,
  type WelcomeTourStop
} from './rules';
import {
  GUIDE_COLOR,
  GUIDE_NAME,
  GUIDE_SOFT,
  actionsClass,
  badgeClass,
  celebrateClass,
  extraClass,
  mutedTextClass,
  srOnlyClass,
  freeBadgeClass,
  ghostButtonClass,
  primaryButtonClass,
  projectCardClass,
  skipButtonClass,
  skipTourClass,
  stripChipClass,
  stripClass,
  tourDockClass,
  tourHeadClass,
  tourLineClass,
  tourPanelClass,
  tourSpriteClass,
  tourTitleRowClass
} from './styles';

const TYPE_MS_PER_CHAR = 22;

// One tour stop: the guide on the panel's corner, the stop strip (jump to any
// stop, seen or not), "2 of 6", the guide's line typed out, the stop's extra
// (their first project or make something, the apps, the Arena's exams), and
// Ask / Back / Next, with Skip tour in the corner. The last Next shows the
// "You've seen it all!" moment.
export default function TourPanel({
  guide,
  stops,
  index,
  marks,
  replay,
  data,
  finishing,
  making,
  makeError,
  onJump,
  onBack,
  onNext,
  onAsk,
  onSkipTour,
  onMake,
  onOpenProject,
  onOpenCardChat,
  onOpenApp,
  visited,
  lumine,
  besideDock = false
}: {
  guide: WelcomeTourGuide;
  stops: WelcomeTourStop[];
  index: number;
  marks: StopMark[];
  // this stop was already done: a replay
  replay: boolean;
  data: WelcomeTourData;
  finishing: boolean;
  making: boolean;
  makeError: string;
  // stops this run has shown (only these are ticked at the end)
  visited: string[];
  // what the Lumine stop offers (rules.ts lumineStopFor)
  lumine: ReturnType<typeof lumineStopFor>;
  onJump: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
  onAsk: () => void;
  onSkipTour: () => void;
  onMake: (result: { idea: string; title: string }) => void;
  onOpenProject: (project: WelcomeTourProject) => void;
  onOpenCardChat: () => void;
  onOpenApp: (buildId: number) => void;
  // the guide's chat window is open: the panel moves to the other side
  besideDock?: boolean;
}) {
  const stop = stops[index];
  const allSeen = stops.every((item) => visited.includes(item.key));
  // a full finish says so; with stops skipped, the chips are the way back
  const line = finishing
    ? (allSeen ? null : data.tour.greeting.partialFinishLine?.[guide]) || data.tour.greeting.finishLine[guide]
    : stop?.lines[guide] || '';
  const [typed, setTyped] = useState(0);
  const [makeOpen, setMakeOpen] = useState(false);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  // a new stop (or a replay, or Skip mid-line) restarts the narration cleanly
  useEffect(() => {
    setMakeOpen(false);
    if (reduceMotion) {
      setTyped(line.length);
      return;
    }
    setTyped(0);
    const timer = window.setInterval(() => {
      setTyped((count) => {
        if (count >= line.length) {
          window.clearInterval(timer);
          return count;
        }
        return count + 1;
      });
    }, TYPE_MS_PER_CHAR);
    return () => window.clearInterval(timer);
  }, [line, reduceMotion]);

  // keep the current stop in view in the strip
  useEffect(() => {
    const chip = stripRef.current?.querySelector<HTMLElement>('[data-mark="current"]');
    chip?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
  }, [index]);

  // Focus (review 11-26 #8): into the panel when it opens and onto the new
  // heading at every stop, so a control that disappears (Back on stop two,
  // the stop's own buttons) never leaves focus behind the panel. The panel
  // stays non-modal: the page remains usable around it.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [index, finishing]);

  if (!stop) return null;
  const typing = typed < line.length;
  const isLast = index === stops.length - 1;
  return (
    <div className={tourDockClass} data-welcome-tour-panel="" data-beside-dock={besideDock ? 'true' : undefined}>
      <div
        className={tourPanelClass}
        role="dialog"
        aria-label={`Tour with ${GUIDE_NAME[guide]}: ${stop.title}`}
        style={
          {
            '--guide': GUIDE_COLOR[guide],
            '--guide-soft': GUIDE_SOFT[guide]
          } as React.CSSProperties
        }
      >
        <img className={tourSpriteClass} src={GUIDE_PICTURE[guide]} alt={GUIDE_NAME[guide]} />
        <button type="button" className={skipTourClass} onClick={onSkipTour}>
          {finishing ? 'Close' : 'Skip tour'}
        </button>
        <div className={tourHeadClass}>
          <nav className={stripClass} ref={stripRef} aria-label="Tour stops">
            {stops.map((item, i) => {
              // at the end only the stops this run showed are ticked
              const mark = finishing ? (visited.includes(item.key) ? 'done' : 'upcoming') : marks[i];
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-current={!finishing && i === index ? 'step' : undefined}
                  className={stripChipClass}
                  data-mark={mark}
                  onClick={() => onJump(i)}
                >
                  {mark === 'done' ? <Icon icon="check" /> : null}
                  {item.short}
                </button>
              );
            })}
          </nav>
        </div>
        <div className={tourTitleRowClass}>
          {finishing ? (
            <span className={celebrateClass} aria-hidden>
              <Icon icon="party-horn" />
            </span>
          ) : null}
          <h3 ref={headingRef} tabIndex={-1}>
            {finishing ? (allSeen ? 'You’ve seen it all!' : 'That’s the tour!') : stop.title}
          </h3>
          {replay && !finishing ? (
            <span className={badgeClass}>
              <Icon icon="undo" /> Seen before
            </span>
          ) : null}
          <span style={{ flex: 1 }} />
          {finishing ? null : (
            <span className={badgeClass} aria-label={`Stop ${index + 1} of ${stops.length}`}>
              {index + 1} of {stops.length}
            </span>
          )}
        </div>
        {/* the typed line is for the eyes; screen readers get the whole line
            once (review 11-26 #8) */}
        <p
          className={tourLineClass}
          data-typing={typing ? 'true' : undefined}
          onClick={() => setTyped(line.length)}
          aria-hidden
        >
          {line.slice(0, typed)}
        </p>
        <p className={srOnlyClass} aria-live="polite">
          {line}
        </p>
        {!finishing && stop.extra ? (
          <div className={extraClass}>
            {stop.extra === 'make' ? renderLumine() : stop.extra === 'apps' ? (
              <TourApps
                pinnedBuildId={data.tour.apps.pinnedBuildId}
                extra={data.tour.apps.extra}
                onOpen={onOpenApp}
              />
            ) : stop.extra === 'arena_exams' ? (
              <TourArenaExams arena={data.tour.arena} />
            ) : null}
          </div>
        ) : null}
        <div className={actionsClass}>
          {!finishing ? (
            <button type="button" className={ghostButtonClass} onClick={onAsk}>
              <Icon icon="comment" /> Ask {GUIDE_NAME[guide]}
              {data.free.talk === 'free' ? (
                <small>free · text or call</small>
              ) : data.free.talk === 'low' ? (
                <small>free part nearly used</small>
              ) : (
                <small style={{ color: 'inherit', opacity: 0.7, fontWeight: 600 }}>uses your Energy</small>
              )}
            </button>
          ) : null}
          <span className="spacer" />
          {!finishing && index > 0 ? (
            <button type="button" className={skipButtonClass} onClick={onBack}>
              <Icon icon="arrow-left" /> Back
            </button>
          ) : null}
          <button type="button" className={primaryButtonClass} onClick={onNext}>
            {finishing ? 'Done' : isLast ? 'Finish' : 'Next'}
            {!finishing && !isLast ? <Icon icon="arrow-right" /> : null}
          </button>
        </div>
      </div>
    </div>
  );

  // The Lumine stop (review 11-26 P0): their first project when there is
  // one (opened, never remade); the welcome card's own free first build
  // ("Show me!") while the card waits; its chat while the card is making it;
  // the tour's own "Make something" only with no card and no project; and on
  // an older API with neither answer, nothing to press.
  function renderLumine() {
    if (lumine.kind === 'project') {
      const project = lumine.project;
      return (
        <div className={projectCardClass}>
          <span className="thumb" aria-hidden>
            <Icon icon="code-branch" />
          </span>
          <span className="text">
            <b>{project.title}</b>
            <small>Your first project, made with Lumine</small>
          </span>
          <button type="button" className={primaryButtonClass} onClick={() => onOpenProject(project)}>
            Open it <Icon icon="arrow-right" />
          </button>
        </div>
      );
    }
    if (lumine.kind === 'card_in_progress') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          <span className={mutedTextClass} style={{ margin: 0 }}>
            {GUIDE_NAME[guide]} is setting up your first project in your chat.
          </span>
          <button type="button" className={primaryButtonClass} onClick={onOpenCardChat}>
            <Icon icon="comment" /> Go to the chat
          </button>
        </div>
      );
    }
    if (lumine.kind !== 'card_waiting' && lumine.kind !== 'make') return null;
    const free = lumine.kind === 'card_waiting' ? data.free.card : data.free.build;
    if (makeOpen) {
      return (
        <MakeChoice
          tree={data.tour.makeChoices}
          free={free}
          working={making}
          error={makeError}
          onDone={onMake}
          onCancel={() => setMakeOpen(false)}
        />
      );
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
        <button type="button" className={primaryButtonClass} onClick={() => setMakeOpen(true)}>
          <Icon icon="wand-magic-sparkles" /> {lumine.kind === 'card_waiting' ? 'Show me!' : 'Make something'}
        </button>
        {free ? (
          <span className={freeBadgeClass}>
            <Icon icon="gift" /> This one’s on us
          </span>
        ) : null}
      </div>
    );
  }
}
