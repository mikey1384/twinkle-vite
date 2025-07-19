import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import FilterBar from '~/components/FilterBar';
import Ranker from './Ranker';
import { useAppContext, useKeyContext } from '~/contexts';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';
import localize from '~/constants/localize';
import { User } from '~/types';

const myRankingLabel = localize('myRanking');
const top30Label = localize('top30');

GrammarRankings.propTypes = {
  mission: PropTypes.object.isRequired,
  myAttempts: PropTypes.object.isRequired
};

export default function GrammarRankings({
  mission,
  myAttempts
}: {
  mission: any;
  myAttempts: any;
}) {
  const userId = useKeyContext((v) => v.myState.userId);
  const tableHeaderColor = useKeyContext((v) => v.theme.tableHeader.color);
  const [allSelected, setAllSelected] = useState(
    myAttempts[mission.id]?.status === 'pass'
  );
  const [top30s, setTop30s] = useState([]);
  const [all, setAll] = useState([]);
  const loadMissionRankings = useAppContext(
    (v) => v.requestHelpers.loadMissionRankings
  );
  useEffect(() => {
    init();
    async function init() {
      const { top30s, all } = await loadMissionRankings(mission.id);
      setTop30s(top30s);
      setAll(all);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rankers = useMemo(
    () => (allSelected ? all : top30s),
    [all, allSelected, top30s]
  );

  return (
    <div>
      {myAttempts[mission.id]?.status === 'pass' && (
        <FilterBar bordered>
          <nav
            onClick={() => setAllSelected(true)}
            className={allSelected ? 'active' : ''}
          >
            {myRankingLabel}
          </nav>
          <nav
            onClick={() => setAllSelected(false)}
            className={!allSelected ? 'active' : ''}
          >
            {top30Label}
          </nav>
        </FilterBar>
      )}
      <div
        className={css`
          border: 1px solid ${Color.borderGray()};
          border-radius: ${borderRadius};
          @media (max-width: ${mobileMaxWidth}) {
            border-left: 0;
            border-right: 0;
            border-radius: 0;
          }
        `}
        style={{
          width: '100%',
          marginTop: '1rem',
          display: 'flex',
          justifyContent: 'center',
          background: Color.wellGray()
        }}
      >
        <div
          className={css`
            min-width: 40rem;
            width: 40%;
            @media (max-width: ${mobileMaxWidth}) {
              min-width: 0;
              width: 100%;
            }
          `}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              background: Color[tableHeaderColor](),
              color: '#fff',
              fontWeight: 'bold',
              padding: '0.5rem 0'
            }}
          >
            <div style={{ justifySelf: 'center' }}>Rank</div>
            <div />
            <div />
            <div style={{ justifySelf: 'center' }}>Times Completed</div>
          </div>
          {rankers.map((ranker: User) => (
            <Ranker key={ranker.id} user={ranker} myId={userId} />
          ))}
        </div>
      </div>
    </div>
  );
}
