import React, { useEffect, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import FilterBar from '~/components/FilterBar';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import {
  APPRENTICE_MAX_PICKS,
  type ApprenticeChoice,
  type ApprenticeResolvedPick
} from '~/constants/apprentice';

type Tab = 'build' | 'subject' | 'selected';

const keyOf = (pick: { type: string; id: number }) => `${pick.type}:${pick.id}`;

// Choose which of your own public builds and posts the application shows.
// The standard window (title, close, Cancel / Done) with the site's FilterBar
// for Builds | Posts | Selected; rows follow Pin Builds' pick rows. The list
// comes from the server (only your own public builds and live posts), and
// the server checks the picks again when the application is saved.
export default function PicksModal({
  initialPicks,
  choices: givenChoices,
  onHide,
  onDone
}: {
  initialPicks: ApprenticeResolvedPick[];
  // given only by the preview; the page loads them
  choices?: { builds: ApprenticeChoice[]; subjects: ApprenticeChoice[] };
  onHide: () => void;
  onDone: (picks: ApprenticeResolvedPick[]) => void;
}) {
  const loadApprenticeChoices = useAppContext(
    (v) => v.requestHelpers.loadApprenticeChoices
  );
  const doneRole = useRoleColor('done', { fallback: 'blue' });
  const doneColor = doneRole.getColor() || Color.blue();
  const [tab, setTab] = useState<Tab>('build');
  const [choices, setChoices] = useState(givenChoices || null);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState<ApprenticeResolvedPick[]>(
    initialPicks
  );

  useEffect(() => {
    if (givenChoices) return;
    let canceled = false;
    loadApprenticeChoices()
      .then((data: any) => {
        if (!canceled) {
          setChoices({
            builds: Array.isArray(data?.builds) ? data.builds : [],
            subjects: Array.isArray(data?.subjects) ? data.subjects : []
          });
        }
      })
      .catch(() => {
        if (!canceled) setLoadError('Could not load your builds and posts.');
      });
    return () => {
      canceled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedKeys = useMemo(
    () => new Set(selected.map(keyOf)),
    [selected]
  );
  const rows: (ApprenticeChoice | ApprenticeResolvedPick)[] =
    tab === 'selected'
      ? selected
      : (tab === 'build' ? choices?.builds : choices?.subjects) || [];
  const full = selected.length >= APPRENTICE_MAX_PICKS;

  return (
    <Modal
      modalKey="ApprenticePicks"
      isOpen
      size="lg"
      onClose={onHide}
      title="Choose builds and posts"
      footer={
        <>
          <Button variant="ghost" onClick={onHide}>
            Cancel
          </Button>
          <Button color={doneColor} onClick={() => onDone(selected)}>
            Done
          </Button>
        </>
      }
    >
      <div style={{ width: '100%' }}>
        <FilterBar style={{ marginBottom: '1.5rem' }}>
          <nav
            className={tab === 'build' ? 'active' : ''}
            onClick={() => setTab('build')}
          >
            Builds
          </nav>
          <nav
            className={tab === 'subject' ? 'active' : ''}
            onClick={() => setTab('subject')}
          >
            Posts
          </nav>
          <nav
            className={tab === 'selected' ? 'active' : ''}
            onClick={() => setTab('selected')}
          >
            Selected
          </nav>
        </FilterBar>
        <div className={counterClass}>
          {selected.length}/{APPRENTICE_MAX_PICKS} selected
        </div>
        {loadError ? (
          <div className={emptyClass}>{loadError}</div>
        ) : !choices && tab !== 'selected' ? (
          <Loading />
        ) : rows.length === 0 ? (
          <div className={emptyClass}>
            {tab === 'selected'
              ? 'Nothing selected yet'
              : tab === 'build'
                ? 'You have no public builds yet'
                : 'You have no posts yet'}
          </div>
        ) : (
          <div className={listClass}>
            {rows.map((row) => {
              const isSelected = selectedKeys.has(keyOf(row));
              const disabled = !isSelected && full;
              const description =
                'description' in row ? row.description : '';
              return (
                <button
                  key={keyOf(row)}
                  type="button"
                  disabled={disabled}
                  className={`${rowClass} ${isSelected ? selectedRowClass : ''}`}
                  onClick={() => toggle(row)}
                >
                  <div className={rowHeaderClass}>
                    <div className={rowTitleClass}>
                      {row.title || 'Untitled'}
                    </div>
                    <div className={checkClass}>
                      <Icon
                        icon={isSelected ? 'check-circle' : ['far', 'circle']}
                      />
                    </div>
                  </div>
                  {tab === 'selected' && (
                    <div className={rowDescriptionClass}>
                      {row.type === 'build' ? 'Build' : 'Post'}
                    </div>
                  )}
                  {description && (
                    <div className={rowDescriptionClass}>{description}</div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );

  function toggle(row: ApprenticeChoice | ApprenticeResolvedPick) {
    const key = keyOf(row);
    setSelected((current) => {
      if (current.some((pick) => keyOf(pick) === key)) {
        return current.filter((pick) => keyOf(pick) !== key);
      }
      if (current.length >= APPRENTICE_MAX_PICKS) return current;
      return [
        ...current,
        {
          type: row.type,
          id: row.id,
          title: row.title,
          path: row.type === 'build' ? `/app/${row.id}` : `/subjects/${row.id}`
        }
      ];
    });
  }
}

const counterClass = css`
  font-weight: bold;
  margin-bottom: 1.2rem;
`;

const emptyClass = css`
  min-height: 10rem;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: ${Color.gray()};
  font-weight: bold;
`;

const listClass = css`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const rowClass = css`
  width: 100%;
  border: 1px solid ${Color.borderGray()};
  border-radius: 1.2rem;
  background: white;
  padding: 1.3rem 1.4rem;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: ${Color.logoBlue()};
    box-shadow: 0 10px 24px -18px rgba(0, 0, 0, 0.35);
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const selectedRowClass = css`
  border-color: ${Color.logoBlue()};
  box-shadow: 0 0 0 1px ${Color.logoBlue()};
`;

const rowHeaderClass = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
`;

const rowTitleClass = css`
  font-weight: bold;
  font-size: 1.6rem;
  color: ${Color.black()};
`;

const checkClass = css`
  flex-shrink: 0;
  color: ${Color.logoBlue()};
  font-size: 1.8rem;
`;

const rowDescriptionClass = css`
  margin-top: 0.5rem;
  color: ${Color.gray()};
  line-height: 1.5;
`;
