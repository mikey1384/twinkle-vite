import React, { useEffect, useState } from 'react';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { appCardClass, appCardsClass, examGroupClass, mutedTextClass } from './styles';

interface ShelfApp {
  buildId: number;
  title: string;
  thumbnailUrl: string | null;
  maxXP?: number;
}

// The apps stop: Math Lab always first (Mikey 11-25), then the live Earn
// shelf's top picks (the same list the Bounties section shows).
export function TourApps({
  pinnedBuildId,
  extra,
  onOpen
}: {
  pinnedBuildId: number;
  extra: number;
  onOpen: (buildId: number) => void;
}) {
  const loadRewardEarnHub = useAppContext((v) => v.requestHelpers.loadRewardEarnHub);
  const [apps, setApps] = useState<ShelfApp[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    Promise.resolve(loadRewardEarnHub({ period: 'week' }))
      .then((hub: any) => {
        if (cancelled) return;
        setApps(Array.isArray(hub?.apps) ? hub.apps : []);
      })
      .catch(() => {
        if (!cancelled) setApps([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const shelf = apps || [];
  const pinned: ShelfApp = shelf.find((app) => app.buildId === pinnedBuildId) || {
    buildId: pinnedBuildId,
    title: 'Math Lab',
    thumbnailUrl: null
  };
  const picks = [pinned, ...shelf.filter((app) => app.buildId !== pinnedBuildId).slice(0, extra)];
  return (
    <div className={appCardsClass}>
      {picks.map((app) => (
        <button
          key={app.buildId}
          type="button"
          className={appCardClass}
          data-pinned={app.buildId === pinnedBuildId ? 'true' : undefined}
          onClick={() => onOpen(app.buildId)}
        >
          {app.thumbnailUrl ? (
            <img src={app.thumbnailUrl} alt="" loading="lazy" />
          ) : (
            <span className="thumb">
              <Icon icon={app.buildId === pinnedBuildId ? 'puzzle-piece' : 'rocket-launch'} />
            </span>
          )}
          <span>
            <b>{app.title}</b>
            <small>{Number(app.maxXP) > 0 ? `Up to ${Number(app.maxXP).toLocaleString()} XP` : 'Pays XP'}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

// The Arena stop: every exam the Arena has, grouped, straight from its
// catalog (twinkle-api helpers/welcomeTour/stops.ts welcomeTourArenaExams).
export function TourArenaExams({
  arena
}: {
  arena: { total: number; groups: { label: string; exams: string[] }[] };
}) {
  return (
    <div>
      {arena.groups.map((group) => (
        <section key={group.label} className={examGroupClass}>
          <h4>{group.label}</h4>
          <ul>
            {group.exams.map((exam) => (
              <li key={exam}>{exam}</li>
            ))}
          </ul>
        </section>
      ))}
      <p className={mutedTextClass}>{arena.total} real exams to practise, from a quick round to the full sitting.</p>
    </div>
  );
}
