import React, { useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import SectionPanel from '~/components/SectionPanel';
import Button from '~/components/Button';
import Table from '../Table';
import AddSupermodModal from '../Modals/AddSupermodModal';
import EditSupermodModal from '../Modals/EditSupermodModal';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useManagementContext, useKeyContext } from '~/contexts';
import {
  MENTOR_ACHIEVEMENT_ID,
  SAGE_ACHIEVEMENT_ID,
  TWINKLE_FOUNDER_ACHIEVEMENT_ID,
  MENTOR_LABEL,
  SAGE_LABEL,
  FOUNDER_LABEL
} from '~/constants/defaultValues';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Icon from '~/components/Icon';
import localize from '~/constants/localize';

const nowLabel = localize('now');
const onlineLabel = localize('online');
const userLabel = localize('user');

export default function Supermods({ canManage }: { canManage: boolean }) {
  const { userId } = useKeyContext((v) => v.myState);
  const {
    tableHeader: { color: tableHeaderColor }
  } = useKeyContext((v) => v.theme);
  const supermods = useManagementContext((v) => v.state.supermods);
  const supermodsLoaded = useManagementContext((v) => v.state.supermodsLoaded);
  const numSupermodsShown = useManagementContext(
    (v) => v.state.numSupermodsShown
  );
  const onLoadMoreSupermods = useManagementContext(
    (v) => v.actions.onLoadMoreSupermods
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [addSupermodModalShown, setAddSupermodModalShown] = useState(false);
  const [moderatorModalTarget, setModeratorModalTarget] = useState(null);
  const filteredSupermods = useMemo(() => {
    return supermods.filter((supermod: { username: string }) =>
      searchQuery
        ? supermod.username.toLowerCase().includes(searchQuery.toLowerCase())
        : supermod
    );
  }, [supermods, searchQuery]);

  return (
    <ErrorBoundary componentPath="Management/Main/Supermods">
      <SectionPanel
        title="Supermods"
        isEmpty={supermods.length === 0}
        emptyMessage="No supermods found"
        searchPlaceholder="Search Supermods"
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        loaded={supermodsLoaded}
        innerStyle={{ paddingLeft: 0, paddingRight: 0 }}
        button={
          canManage ? (
            <Button
              color="darkerGray"
              skeuomorphic
              onClick={() => setAddSupermodModalShown(true)}
            >
              <Icon icon="plus" />
              <span style={{ marginLeft: '0.7rem' }}>Add</span>
            </Button>
          ) : null
        }
      >
        <Table
          color={tableHeaderColor}
          columns={`
            minmax(15rem, 1.5fr)
            minmax(10rem, 1fr)
            minmax(15rem, 1fr)
            ${canManage ? 'minmax(17rem, 2fr)' : ''}
          `}
        >
          <thead>
            <tr>
              <th>{userLabel}</th>
              <th>{onlineLabel}</th>
              <th>Title</th>
              {canManage && <th></th>}
            </tr>
          </thead>
          <tbody>
            {filteredSupermods
              .filter((_: any, index: number) => index < numSupermodsShown)
              .map((supermod: any) => {
                const isMentor = supermod.unlockedAchievementIds?.includes(
                  MENTOR_ACHIEVEMENT_ID
                );
                const isSage =
                  supermod.unlockedAchievementIds?.includes(
                    SAGE_ACHIEVEMENT_ID
                  );
                const isTwinkleFounder =
                  supermod.unlockedAchievementIds?.includes(
                    TWINKLE_FOUNDER_ACHIEVEMENT_ID
                  );
                let role = '';
                if (isMentor) role = MENTOR_LABEL;
                if (isSage) role = SAGE_LABEL;
                if (isTwinkleFounder) role = FOUNDER_LABEL;
                return (
                  <tr
                    key={supermod.id}
                    style={{ cursor: canManage ? 'pointer' : '' }}
                    onClick={() =>
                      canManage ? setModeratorModalTarget(supermod) : {}
                    }
                  >
                    <td style={{ fontWeight: 'bold', fontSize: '1.6rem' }}>
                      {supermod.username}
                    </td>
                    <td>
                      {userId === supermod.id || supermod.online
                        ? nowLabel
                        : timeSince(supermod.lastActive)}
                    </td>
                    <td
                      style={{
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {role || supermod.title} (lv {supermod.level})
                    </td>
                    {canManage && (
                      <td style={{ display: 'flex', justifyContent: 'center' }}>
                        <a>Manage Role</a>
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </Table>
        {supermods.length > numSupermodsShown && !searchQuery && (
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
              transparent
              style={{ fontSize: '2rem' }}
              onClick={onLoadMoreSupermods}
            />
          </div>
        )}
      </SectionPanel>
      {addSupermodModalShown && (
        <AddSupermodModal onHide={() => setAddSupermodModalShown(false)} />
      )}
      {moderatorModalTarget && (
        <EditSupermodModal
          target={moderatorModalTarget}
          onHide={() => setModeratorModalTarget(null)}
        />
      )}
    </ErrorBoundary>
  );
}
