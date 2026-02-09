import React, { useMemo, useState } from 'react';
import { useAppContext } from '~/contexts';
import SectionPanel from '~/components/SectionPanel';
import Table from '../../Table';
import ErrorBoundary from '~/components/ErrorBoundary';
import AchievementListItem from './AchievementListItem';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import { useRoleColor } from '~/theme/useRoleColor';

const achievementsLabel = 'Achievements';

interface Achievement {
  id: string | number;
  name: string;
  type: string;
  description: string;
  orderNumber: number;
}

export default function Achievements() {
  const achievementsObj = useAppContext((v) => v.user.state.achievementsObj);
  const tableHeaderRole = useRoleColor('tableHeader', { fallback: 'logoBlue' });
  const tableHeaderColor = tableHeaderRole.colorKey || 'logoBlue';
  const [numAchievementsShown, setNumAchievementsShown] = useState(5);

  const achievementsList = useMemo(
    () => Object.values(achievementsObj) as Achievement[],
    [achievementsObj]
  );

  return (
    <ErrorBoundary componentPath="Management/Main/Achievements">
      <SectionPanel
        title={achievementsLabel}
        loaded={achievementsList.length > 0}
        emptyMessage="No achievements"
        isEmpty={achievementsList.length === 0}
      >
        <Table
          color={tableHeaderColor}
          columns={`
            minmax(4.5rem, 0.25fr)
            minmax(7rem, 0.6fr)
            minmax(20rem, 2.5fr)
            minmax(10rem, 0.65fr)
          `}
        >
          <thead>
            <tr>
              <th>&nbsp;</th>
              <th>Type</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {achievementsList
              .sort((a, b) => a.orderNumber - b.orderNumber)
              .slice(0, numAchievementsShown)
              .map((achievement) => (
                <AchievementListItem
                  key={achievement.id}
                  achievement={achievement}
                />
              ))}
          </tbody>
        </Table>
        {achievementsList.length > numAchievementsShown && (
          <div
            style={{
              marginTop: '2rem',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <LoadMoreButton
              variant="ghost"
              style={{ fontSize: '2rem' }}
              onClick={handleLoadMoreAchievements}
            />
          </div>
        )}
      </SectionPanel>
    </ErrorBoundary>
  );

  function handleLoadMoreAchievements() {
    setNumAchievementsShown((prev) => prev + 5);
  }
}
