import React, { useEffect, useRef, useState } from 'react';
import Icon from '~/components/Icon';
import { GUIDE_PICTURE } from './Greeter';
import MakeChoice from './MakeChoice';
import { TourApps, TourArenaExams } from './StopExtras';
import type { StopMark, WelcomeTourData, WelcomeTourGuide, WelcomeTourStop } from './rules';
import {
  GUIDE_COLOR,
  GUIDE_NAME,
  GUIDE_SOFT,
  actionsClass,
  badgeClass,
  closeClass,
  extraClass,
  freeBadgeClass,
  ghostButtonClass,
  primaryButtonClass,
  skipButtonClass,
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
// stop, seen or not), the guide's line typed out, the stop's extra (make
// something, the apps, the Arena's exams), and Ask / Skip / Next.
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
  onSkip,
  onNext,
  onAsk,
  onClose,
  onMake,
  onOpenApp,
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
  onJump: (index: number) => void;
  onSkip: () => void;
  onNext: () => void;
  onAsk: () => void;
  onClose: () => void;
  onMake: (result: { idea: string; title: string }) => void;
  onOpenApp: (buildId: number) => void;
  // the guide's chat window is open: the panel moves to the other side
  besideDock?: boolean;
}) {
  const stop = stops[index];
  const line = finishing ? data.tour.greeting.finishLine[guide] : stop?.lines[guide] || '';
  const [typed, setTyped] = useState(0);
  const [makeOpen, setMakeOpen] = useState(false);
  const stripRef = useRef<HTMLDivElement | null>(null);
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
        <button type="button" className={closeClass} aria-label="End the tour" onClick={onClose}>
          <Icon icon="times" />
        </button>
        <div className={tourHeadClass} style={{ paddingRight: '3.2rem' }}>
          <div className={stripClass} ref={stripRef} role="tablist" aria-label="Tour stops">
            {stops.map((item, i) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={i === index}
                className={stripChipClass}
                data-mark={marks[i]}
                onClick={() => onJump(i)}
              >
                {marks[i] === 'done' ? <Icon icon="check" /> : null}
                {item.short}
              </button>
            ))}
          </div>
        </div>
        <div className={tourTitleRowClass}>
          <h3>{finishing ? 'Tour complete' : stop.title}</h3>
          {replay && !finishing ? (
            <span className={badgeClass}>
              <Icon icon="undo" /> Seen before
            </span>
          ) : null}
          <span style={{ flex: 1 }} />
          <span className={badgeClass}>
            {index + 1} / {stops.length}
          </span>
        </div>
        <p
          className={tourLineClass}
          data-typing={typing ? 'true' : undefined}
          onClick={() => setTyped(line.length)}
          aria-live="polite"
        >
          {line.slice(0, typed)}
        </p>
        {!finishing && stop.extra ? (
          <div className={extraClass}>
            {stop.extra === 'make' ? (
              makeOpen ? (
                <MakeChoice
                  tree={data.tour.makeChoices}
                  free={data.welcomeCard ? data.free.card : data.free.build}
                  working={making}
                  error={makeError}
                  onDone={onMake}
                  onCancel={() => setMakeOpen(false)}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                  <button type="button" className={primaryButtonClass} onClick={() => setMakeOpen(true)}>
                    <Icon icon="wand-magic-sparkles" /> Make something
                  </button>
                  {(data.welcomeCard ? data.free.card : data.free.build) ? (
                    <span className={freeBadgeClass}>
                      <Icon icon="gift" /> This one’s on us
                    </span>
                  ) : null}
                </div>
              )
            ) : stop.extra === 'apps' ? (
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
          {!finishing && !isLast ? (
            <button type="button" className={skipButtonClass} onClick={onSkip}>
              Skip
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
}
