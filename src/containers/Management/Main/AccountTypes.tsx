import { useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import SectionPanel from '~/components/SectionPanel';
import Button from '~/components/Button';
import Table from '../Table';
import Check from '../Check';
import AddAccountTypeModal from '../Modals/AddAccountTypeModal';
import EditAccountTypeModal from '../Modals/EditAccountTypeModal';
import Icon from '~/components/Icon';
import { useManagementContext, useKeyContext } from '~/contexts';
import localize from '~/constants/localize';

const accountTypesLabel = localize('accountTypes');
const addAccountTypeLabel = localize('addAccountType');
const authLevelLabel = localize('authLevel');
const deleteLabel = localize('delete');
const editLabel = localize('edit');
const editPlaylistsLabel = localize('editPlaylists');
const editRewardLevelLabel = localize('editRewardLevel');
const featureContentsLabel = localize('featureContents');
const labelLabel = localize('label');
const rewardLabel = localize('reward');
const noAccountTypesLabel = localize('noAccountTypes');

AccountTypes.propTypes = {
  canManage: PropTypes.bool.isRequired
};

export default function AccountTypes({ canManage }) {
  const {
    tableHeader: { color: tableHeaderColor }
  } = useKeyContext((v) => v.theme);
  const accountTypes = useManagementContext((v) => v.state.accountTypes);
  const accountTypesLoaded = useManagementContext(
    (v) => v.state.accountTypesLoaded
  );
  const [addAccountTypeModalShown, setAddAccountTypeModalShown] =
    useState(false);
  const [accountTypeModalTarget, setAccountTypeModalTarget] = useState(null);

  return (
    <ErrorBoundary componentPath="Management/Main/AccountTypes">
      <SectionPanel
        title={accountTypesLabel}
        isEmpty={accountTypes.length === 0}
        emptyMessage={noAccountTypesLabel}
        loaded={accountTypesLoaded}
        innerStyle={{ paddingLeft: 0, paddingRight: 0 }}
        button={
          canManage ? (
            <Button
              color="darkerGray"
              skeuomorphic
              onClick={() => setAddAccountTypeModalShown(true)}
            >
              <Icon icon="plus" />
              <span style={{ marginLeft: '0.7rem' }}>
                {addAccountTypeLabel}
              </span>
            </Button>
          ) : null
        }
      >
        <Table
          color={tableHeaderColor}
          headerFontSize="1.5rem"
          columns={`
          minmax(10rem, 1.5fr)
          minmax(15rem, 1.5fr)
          minmax(10rem, 1fr)
          minmax(10rem, 1.2fr)
          minmax(10rem, 1.1fr)
          minmax(17rem, 2fr)
          minmax(15rem, 1.6fr)
          minmax(17rem, 2fr)
        `}
        >
          <thead>
            <tr>
              <th>{labelLabel}</th>
              <th style={{ textAlign: 'center' }}>{authLevelLabel}</th>
              <th style={{ textAlign: 'center' }}>{editLabel}</th>
              <th style={{ textAlign: 'center' }}>{deleteLabel}</th>
              <th style={{ textAlign: 'center' }}>{rewardLabel}</th>
              <th style={{ textAlign: 'center' }}>{featureContentsLabel}</th>
              <th style={{ textAlign: 'center' }}>{editPlaylistsLabel}</th>
              <th style={{ textAlign: 'center' }}>{editRewardLevelLabel}</th>
            </tr>
          </thead>
          <tbody>
            {accountTypes.map((accountType) => (
              <tr
                onClick={() =>
                  canManage ? setAccountTypeModalTarget(accountType.label) : {}
                }
                key={accountType.label}
                style={{ cursor: canManage && 'pointer' }}
              >
                <td
                  style={{
                    fontWeight: 'bold',
                    fontSize: '1.6rem'
                  }}
                >
                  {accountType.label}
                </td>
                <td style={{ textAlign: 'center' }}>{accountType.authLevel}</td>
                <td style={{ textAlign: 'center' }}>
                  <Check checked={!!accountType.canEdit} />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <Check checked={!!accountType.canDelete} />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <Check checked={!!accountType.canReward} />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <Check checked={!!accountType.canPinPlaylists} />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <Check checked={!!accountType.canEditPlaylists} />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <Check checked={!!accountType.canEditRewardLevel} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </SectionPanel>
      {addAccountTypeModalShown && (
        <AddAccountTypeModal
          onHide={() => setAddAccountTypeModalShown(false)}
        />
      )}
      {accountTypeModalTarget && (
        <EditAccountTypeModal
          target={
            accountTypes.filter(
              (accountType) => accountType.label === accountTypeModalTarget
            )[0]
          }
          onHide={() => setAccountTypeModalTarget(null)}
        />
      )}
    </ErrorBoundary>
  );
}
