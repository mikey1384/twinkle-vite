import React, { useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import SectionPanel from '~/components/SectionPanel';
import Button from '~/components/Button';
import Table from '../Table';
import AddSupermodModal from '../Modals/AddSupermodModal';
import EditSupermodModal from '../Modals/EditSupermodModal';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useManagementContext, useKeyContext } from '~/contexts';
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
  const accountTypes = useManagementContext((v) => v.state.accountTypes);
  const supermods = useManagementContext((v) => v.state.supermods);
  const moderatorsLoaded = useManagementContext(
    (v) => v.state.moderatorsLoaded
  );
  const numModeratorsShown = useManagementContext(
    (v) => v.state.numModeratorsShown
  );
  const onLoadMoreSupermods = useManagementContext(
    (v) => v.actions.onLoadMoreSupermods
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [addSupermodModalShown, setAddSupermodModalShown] = useState(false);
  const [moderatorModalTarget, setModeratorModalTarget] = useState(null);
  const filteredModerators = useMemo(() => {
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
        loaded={moderatorsLoaded}
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
            {filteredModerators
              .filter((_: any, index: number) => index < numModeratorsShown)
              .map((moderator: any) => (
                <tr
                  key={moderator.id}
                  style={{ cursor: canManage ? 'pointer' : '' }}
                  onClick={() =>
                    canManage ? setModeratorModalTarget(moderator) : {}
                  }
                >
                  <td style={{ fontWeight: 'bold', fontSize: '1.6rem' }}>
                    {moderator.username}
                  </td>
                  <td>
                    {userId === moderator.id || moderator.online
                      ? nowLabel
                      : timeSince(moderator.lastActive)}
                  </td>
                  <td
                    style={{
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {moderator.userType}
                  </td>
                  {canManage && (
                    <td style={{ display: 'flex', justifyContent: 'center' }}>
                      <a>Manage Achievements</a>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </Table>
        {supermods.length > numModeratorsShown && !searchQuery && (
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
        <AddSupermodModal
          accountTypes={accountTypes}
          onHide={() => setAddSupermodModalShown(false)}
        />
      )}
      {moderatorModalTarget && (
        <EditSupermodModal
          accountTypes={accountTypes}
          target={moderatorModalTarget}
          onHide={() => setModeratorModalTarget(null)}
        />
      )}
    </ErrorBoundary>
  );
}
