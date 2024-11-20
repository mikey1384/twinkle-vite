import React, { useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import SectionPanel from '~/components/SectionPanel';
import Button from '~/components/Button';
import Table from '../../Table';
import AddModeratorModal from './AddModeratorModal';
import EditModeratorModal from './EditModeratorModal';
import ConvertModal from './ConvertModal';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useAppContext, useManagementContext, useKeyContext } from '~/contexts';
import { isMobile } from '~/helpers';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { User } from '~/types';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Icon from '~/components/Icon';
import localize from '~/constants/localize';

const accountTypeLabel = localize('accountType');
const changeAccountTypeLabel = localize('changeAccountType');
const nowLabel = localize('now');
const noModeratorsLabel = localize('noModerators');
const onlineLabel = localize('online');
const searchModeratorsLabel = localize('searchModerators');
const userLabel = localize('user');
const deviceIsMobile = isMobile(navigator);

export default function Moderators({ canManage }: { canManage: boolean }) {
  const { userId } = useKeyContext((v) => v.myState);
  const {
    tableHeader: { color: tableHeaderColor }
  } = useKeyContext((v) => v.theme);
  const accountTypes = useManagementContext((v) => v.state.accountTypes);
  const moderators = useManagementContext((v) => v.state.moderators);
  const loadModeratorsCSV = useAppContext(
    (v) => v.requestHelpers.loadModeratorsCSV
  );
  const moderatorsLoaded = useManagementContext(
    (v) => v.state.moderatorsLoaded
  );
  const numModeratorsShown = useManagementContext(
    (v) => v.state.numModeratorsShown
  );
  const onFilterModerators = useManagementContext(
    (v) => v.actions.onFilterModerators
  );
  const onLoadMoreModerators = useManagementContext(
    (v) => v.actions.onLoadMoreModerators
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [addModeratorModalShown, setAddModeratorModalShown] = useState(false);
  const [moderatorModalTarget, setModeratorModalTarget] = useState(null);
  const [convertModalTarget, setConvertModalTarget] = useState<User | null>(
    null
  );
  const filteredModerators = useMemo(() => {
    return moderators.filter((moderator: { username: string }) =>
      searchQuery
        ? moderator.username.toLowerCase().includes(searchQuery.toLowerCase())
        : moderator
    );
  }, [moderators, searchQuery]);
  const addLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return <>{deviceIsMobile ? '' : '관리자 '}등록</>;
    }
    return <>Add{deviceIsMobile ? '' : ' Moderators'}</>;
  }, []);

  return (
    <ErrorBoundary componentPath="Management/Main/Legacy/Moderators">
      <SectionPanel
        title="Mods (Legacy)"
        isEmpty={moderators.length === 0}
        emptyMessage={noModeratorsLabel}
        searchPlaceholder={searchModeratorsLabel}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        loaded={moderatorsLoaded}
        innerStyle={{ paddingLeft: 0, paddingRight: 0 }}
        button={
          canManage ? (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button
                color="darkerGray"
                skeuomorphic
                onClick={() => setAddModeratorModalShown(true)}
              >
                <Icon icon="plus" />
                <span style={{ marginLeft: '0.7rem' }}>{addLabel}</span>
              </Button>
              <Button
                color="darkerGray"
                skeuomorphic
                onClick={handleDownloadCSV}
              >
                <Icon icon="file-csv" />
              </Button>
            </div>
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
            ${canManage ? 'minmax(10rem, 1fr)' : ''}
          `}
        >
          <thead>
            <tr>
              <th>{userLabel}</th>
              <th>{onlineLabel}</th>
              <th>{accountTypeLabel}</th>
              {canManage && <th></th>}
              {canManage && <th></th>}
            </tr>
          </thead>
          <tbody>
            {filteredModerators
              .filter((_: any, index: number) => index < numModeratorsShown)
              .map((moderator: any) => {
                return (
                  <tr key={moderator.id}>
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
                        <a
                          onClick={() =>
                            canManage ? setModeratorModalTarget(moderator) : {}
                          }
                        >
                          {changeAccountTypeLabel}
                        </a>
                      </td>
                    )}
                    {canManage && (
                      <td style={{ display: 'flex', justifyContent: 'center' }}>
                        <a
                          onClick={() =>
                            canManage ? setConvertModalTarget(moderator) : {}
                          }
                        >
                          Convert
                        </a>
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </Table>
        {moderators.length > numModeratorsShown && !searchQuery && (
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
              onClick={onLoadMoreModerators}
            />
          </div>
        )}
      </SectionPanel>
      {addModeratorModalShown && (
        <AddModeratorModal
          accountTypes={accountTypes}
          onHide={() => setAddModeratorModalShown(false)}
        />
      )}
      {moderatorModalTarget && (
        <EditModeratorModal
          accountTypes={accountTypes}
          target={moderatorModalTarget}
          onHide={() => setModeratorModalTarget(null)}
        />
      )}
      {convertModalTarget && (
        <ConvertModal
          target={convertModalTarget}
          onHide={() => setConvertModalTarget(null)}
          onDone={handleConvertDone}
        />
      )}
    </ErrorBoundary>
  );

  function handleConvertDone() {
    onFilterModerators(convertModalTarget?.id || 0);
    setConvertModalTarget(null);
  }

  async function handleDownloadCSV() {
    try {
      const response = await loadModeratorsCSV();
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'moderators.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  }
}
