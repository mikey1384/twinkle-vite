import React, { useEffect, useRef, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import TradeBuilds, { type TradeBuild } from '~/components/Build/TradeBuilds';
import { useAppContext } from '~/contexts';

export default function SelectBuildsModal({
  partnerId,
  type,
  selected,
  onHide,
  onDone
}: {
  partnerId: number;
  type: 'offer' | 'want';
  selected: TradeBuild[];
  onHide: () => void;
  onDone: (builds: TradeBuild[]) => void;
}) {
  const loadBuildsForTrade = useAppContext(
    (v) => v.requestHelpers.loadBuildsForTrade
  );
  const [selection, setSelection] = useState(selected);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<TradeBuild[]>([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  useEffect(() => {
    const current = ++sequence.current;
    setLoading(true);
    const timer = window.setTimeout(() => {
      void load(0, current);
    }, 200);
    return () => {
      window.clearTimeout(timer);
      sequence.current = current + 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, search, type]);

  return (
    <Modal
      modalKey="SelectTradeApps"
      isOpen
      title="Choose Lumine apps"
      onClose={onHide}
      modalLevel={2}
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            Cancel
          </Button>
          <Button onClick={() => onDone(selection)}>
            Done{selection.length ? ` (${selection.length})` : ''}
          </Button>
        </>
      }
    >
      <div style={{ width: '100%', minWidth: 0 }}>
        <Input value={search} placeholder="Search apps" onChange={setSearch} />
        <p style={{ fontSize: '1.2rem' }}>
          {type === 'offer'
            ? 'Choose apps you own.'
            : 'Choose an app to ask its owner for.'}{' '}
          Team branches stay with their contributors.
        </p>
        {selection.length > 0 && (
          <TradeBuilds
            builds={selection}
            onRemove={(id) =>
              setSelection((current) => current.filter((app) => app.id !== id))
            }
          />
        )}
        {error && <p role="alert">{error}</p>}
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
          {results.map((build) => (
            <div key={build.id}>
              <TradeBuilds builds={[build]} />
              <Button
                style={{ marginTop: '0.5rem' }}
                disabled={
                  selection.some((app) => app.id === build.id) ||
                  selection.length >= 20
                }
                onClick={() => setSelection((current) => [...current, build])}
              >
                {selection.some((app) => app.id === build.id)
                  ? 'Selected'
                  : `Choose ${build.title}`}
              </Button>
            </div>
          ))}
        </div>
        {loading && <p role="status">Loading apps…</p>}
        {!loading && !error && !results.length && <p>No apps found.</p>}
        {more && (
          <Button
            disabled={loading}
            onClick={() => void load(results.at(-1)?.id || 0, sequence.current)}
          >
            Load more
          </Button>
        )}
      </div>
    </Modal>
  );

  async function load(lastId: number, current: number) {
    setLoading(true);
    setError('');
    try {
      const data = await loadBuildsForTrade({
        partnerId,
        type,
        search,
        lastId
      });
      if (current !== sequence.current) return;
      setResults((previous) =>
        lastId ? [...previous, ...data.results] : data.results
      );
      setMore(data.loadMoreShown);
    } catch {
      if (current === sequence.current)
        setError('Could not load apps. Try searching again.');
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }
}
