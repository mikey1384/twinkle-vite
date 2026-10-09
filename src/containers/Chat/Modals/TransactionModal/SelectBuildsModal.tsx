import React, { useEffect, useRef, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import SearchInput from '~/components/Texts/SearchInput';
import FilterBar from '~/components/FilterBar';
import TradeBuilds, { type TradeBuild } from '~/components/Build/TradeBuilds';
import { useAppContext, useKeyContext } from '~/contexts';

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
  const doneColor = useKeyContext((v) => v.theme.done.color);
  const [selection, setSelection] = useState(selected);
  const [selectedTab, setSelectedTab] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<TradeBuild[]>([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  useEffect(() => {
    const current = ++sequence.current;
    setLoading(true);
    setResults([]);
    setMore(false);
    const timer = window.setTimeout(() => void load(0, current), 200);
    return () => {
      window.clearTimeout(timer);
      sequence.current = current + 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId, search, type]);
  const visibleBuilds = selectedTab ? selection : results;

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
          <Button color={doneColor} onClick={() => onDone(selection)}>
            Done{selection.length ? ` (${selection.length})` : ''}
          </Button>
        </>
      }
    >
      <div
        className={css`
          width: 100%;
          min-width: 0;
          .picker-hint {
            margin: 1rem 0 0;
            color: #617087;
            font-size: 1.2rem;
            line-height: 1.6;
          }
          .picker-results {
            min-height: 16rem;
          }
          .picker-empty {
            min-height: 16rem;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 2rem;
            color: #617087;
            font-size: 1.4rem;
          }
          .picker-pagination {
            margin-top: 2rem;
            padding-bottom: 0.4rem;
          }
          .picker-select {
            min-width: 9rem;
            min-height: 3.6rem;
          }
          @media (max-width: 767px) {
            .picker-select {
              min-width: 8rem;
              min-height: 40px;
            }
          }
        `}
      >
        <SearchInput
          value={search}
          placeholder="Search apps"
          onChange={setSearch}
        />
        <p className="picker-hint">
          {type === 'offer'
            ? 'Choose apps you own.'
            : 'Choose apps to ask their owner for.'}{' '}
          Team branches stay with their contributors.
        </p>
        <FilterBar style={{ marginBottom: '1.6rem' }}>
          <nav
            role="tab"
            aria-selected={!selectedTab}
            tabIndex={0}
            className={selectedTab ? '' : 'active'}
            onClick={() => setSelectedTab(false)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setSelectedTab(false);
              }
            }}
          >
            All apps
          </nav>
          <nav
            role="tab"
            aria-selected={selectedTab}
            tabIndex={0}
            className={selectedTab ? 'active' : ''}
            onClick={() => setSelectedTab(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setSelectedTab(true);
              }
            }}
          >
            Selected{selection.length ? ` (${selection.length})` : ''}
          </nav>
        </FilterBar>
        {error && (
          <p role="alert" className="picker-hint">
            {error}
          </p>
        )}
        {selection.length >= 20 && (
          <p className="picker-hint">
            20 apps selected. Remove one to choose another.
          </p>
        )}
        <div className="picker-results">
          <TradeBuilds
            builds={visibleBuilds}
            selectedIds={selection.map((app) => app.id)}
            renderAction={(build) => {
              const isSelected = selection.some((app) => app.id === build.id);
              return (
                <Button
                  className="picker-select"
                  color={doneColor}
                  variant={isSelected ? 'solid' : 'soft'}
                  uppercase={false}
                  aria-label={`${isSelected ? 'Remove' : 'Select'} ${build.title}`}
                  aria-pressed={isSelected}
                  disabled={!isSelected && selection.length >= 20}
                  onClick={() => handleToggle(build)}
                >
                  {isSelected && (
                    <Icon icon="check" style={{ marginRight: '0.5rem' }} />
                  )}
                  {isSelected ? 'Selected' : 'Select'}
                </Button>
              );
            }}
          />
          {!visibleBuilds.length && (
            <div
              className="picker-empty"
              role={loading && !selectedTab ? 'status' : undefined}
            >
              {selectedTab
                ? 'No apps selected yet.'
                : loading
                  ? 'Loading apps…'
                  : error
                    ? 'Try searching again.'
                    : 'No apps found.'}
            </div>
          )}
        </div>
        {!selectedTab && more && (
          <div className="picker-pagination">
            <LoadMoreButton
              loading={loading}
              onClick={() =>
                void load(results.at(-1)?.id || 0, sequence.current)
              }
            />
          </div>
        )}
      </div>
    </Modal>
  );

  function handleToggle(build: TradeBuild) {
    setSelection((current) =>
      current.some((app) => app.id === build.id)
        ? current.filter((app) => app.id !== build.id)
        : current.length < 20
          ? [...current, build]
          : current
    );
  }

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
