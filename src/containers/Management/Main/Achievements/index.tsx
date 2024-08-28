import React, { useMemo } from 'react';
import { useKeyContext, useAppContext } from '~/contexts';
import SectionPanel from '~/components/SectionPanel';
import Table from '../../Table';
import localize from '~/constants/localize';
import ErrorBoundary from '~/components/ErrorBoundary';
import AchievementListItem from './AchievementListItem';

const achievementsLabel = localize('achievements');

interface Achievement {
  id: string | number;
  name: string;
  type: string;
  description: string;
  orderNumber: number;
}

export default function Achievements() {
  const achievementsObj = useAppContext((v) => v.user.state.achievementsObj);
  const {
    tableHeader: { color: tableHeaderColor }
  } = useKeyContext((v) => v.theme);
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
              .map((achievement) => (
                <AchievementListItem
                  key={achievement.id}
                  achievement={achievement}
                />
              ))}
          </tbody>
        </Table>
      </SectionPanel>
    </ErrorBoundary>
  );
}
