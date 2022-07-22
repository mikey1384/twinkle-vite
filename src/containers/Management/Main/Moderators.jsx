import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import SectionPanel from '~/components/SectionPanel';
import Button from '~/components/Button';
import Table from '../Table';
import AddModeratorModal from '../Modals/AddModeratorModal';
import EditModeratorModal from '../Modals/EditModeratorModal';
import { timeSince } from '~/helpers/timeStampHelpers';
import { useManagementContext, useKeyContext } from '~/contexts';
import { isMobile } from '~/helpers';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Icon from '~/components/Icon';
import localize from '~/constants/localize';

const accountTypeLabel = localize('accountType');
const changeAccountTypeLabel = localize('changeAccountType');
const moderatorsLabel = localize('moderators');
const nowLabel = localize('now');
const noModeratorsLabel = localize('noModerators');
const onlineLabel = localize('online');
const searchModeratorsLabel = localize('searchModerators');
const userLabel = localize('user');
const deviceIsMobile = isMobile(navigator);

Moderators.propTypes = {
  canManage: PropTypes.bool.isRequired
};

export default function Moderators({ canManage }) {
  const { userId } = useKeyContext((v) => v.myState);
  const {
    tableHeader: { color: tableHeaderColor }
  } = useKeyContext((v) => v.theme);
  const accountTypes = useManagementContext((v) => v.state.accountTypes);
  const moderators = useManagementContext((v) => v.state.moderators);
  const moderatorsLoaded = useManagementContext(
    (v) => v.state.moderatorsLoaded
  );
  const numModeratorsShown = useManagementContext(
    (v) => v.state.numModeratorsShown
  );
  const onLoadMoreModerators = useManagementContext(
    (v) => v.actions.onLoadMoreModerators
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [addModeratorModalShown, setAddModeratorModalShown] = useState(false);
  const [moderatorModalTarget, setModeratorModalTarget] = useState(null);
  const filteredModerators = useMemo(() => {
    return moderators.filter((moderator) =>
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
    <ErrorBoundary componentPath="Management/Main/Moderators">
      <SectionPanel
        title={moderatorsLabel}
        isEmpty={moderators.length === 0}
        emptyMessage={noModeratorsLabel}
        searchPlaceholder={searchModeratorsLabel}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        loaded={moderatorsLoaded}
        innerStyle={{ paddingLeft: 0, paddingRight: 0 }}
        button={
          canManage ? (
            <Button
              color="darkerGray"
              skeuomorphic
              onClick={() => setAddModeratorModalShown(true)}
            >
              <Icon icon="plus" />
              <span style={{ marginLeft: '0.7rem' }}>{addLabel}</span>
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
              <th>{accountTypeLabel}</th>
              {canManage && <th></th>}
            </tr>
          </thead>
          <tbody>
            {filteredModerators
              .filter((moderator, index) => index < numModeratorsShown)
              .map((moderator) => (
                <tr
                  key={moderator.id}
                  style={{ cursor: canManage && 'pointer' }}
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
                      <a>{changeAccountTypeLabel}</a>
                    </td>
                  )}
                </tr>
              ))}
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
    </ErrorBoundary>
  );
}
