import React, { useEffect, useState } from 'react';
import { useAppContext, useKeyContext } from '~/contexts';
import { homePanelClass } from '~/theme/homePanels';

// Apps on their own addresses that this member lets sign in with Twinkle
// (twinkle-api GET /build/app-connections). Remove ends the app's access and
// every session in it; when an app account in that app is linked to this
// member, Unlink ends only the link (that account keeps its progress but
// stops earning on this member's behalf). Shows nothing when there are none.
interface Connection {
  buildId: number;
  title: string;
  grantedAt: number;
  linkedPlayer: { id: number; name: string } | null;
}

export default function ConnectedAppsItem({ loading }: { loading: boolean }) {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadAppConnections = useAppContext((v) => v.requestHelpers.loadAppConnections);
  const unlinkAppConnection = useAppContext((v) => v.requestHelpers.unlinkAppConnection);
  const removeAppConnection = useAppContext((v) => v.requestHelpers.removeAppConnection);
  const [apps, setApps] = useState<Connection[]>([]);
  const [busy, setBusy] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (loading || !userId) return;
    let cancelled = false;
    loadAppConnections()
      .then((data: any) => !cancelled && setApps(Array.isArray(data?.apps) ? data.apps : []))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, userId]);

  if (!apps.length) return null;
  return (
    <section className={homePanelClass} data-scroll-anchor-id="home-settings:connected-apps">
      <h2>Apps you sign in to with Twinkle</h2>
      {apps.map((app) => (
        <div
          key={app.buildId}
          style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', padding: '0.6rem 0' }}
        >
          <div style={{ flex: 1, minWidth: '12rem' }}>
            <b>{app.title}</b>
            {app.linkedPlayer && (
              <div style={{ fontSize: '1.3rem', opacity: 0.8 }}>
                Linked to its player “{app.linkedPlayer.name}”
              </div>
            )}
          </div>
          {app.linkedPlayer && (
            <button type="button" disabled={busy > 0} onClick={() => handle(app, 'unlink')}>
              Unlink
            </button>
          )}
          <button type="button" disabled={busy > 0} onClick={() => handle(app, 'remove')}>
            Remove
          </button>
        </div>
      ))}
      {failed && <span role="alert">Couldn’t do that. Try again.</span>}
    </section>
  );

  async function handle(app: Connection, action: 'unlink' | 'remove') {
    if (busy) return;
    setBusy(app.buildId);
    setFailed(false);
    try {
      if (action === 'unlink') {
        await unlinkAppConnection({ buildId: app.buildId });
        setApps((list) => list.map((item) => (item.buildId === app.buildId ? { ...item, linkedPlayer: null } : item)));
      } else {
        await removeAppConnection({ buildId: app.buildId });
        setApps((list) => list.filter((item) => item.buildId !== app.buildId));
      }
    } catch {
      setFailed(true);
    } finally {
      setBusy(0);
    }
  }
}
