import React, { useEffect, useMemo, useState } from 'react';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Input from '~/components/Texts/Input';
import Check from '../Check';
import Table from '../Table';
import Icon from '~/components/Icon';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import ErrorBoundary from '~/components/ErrorBoundary';
import { css } from '@emotion/css';
import { stringIsEmpty } from '~/helpers/stringHelpers';
import { useAppContext, useManagementContext, useKeyContext } from '~/contexts';

export default function EditAccountTypeModal({
  onHide,
  target
}: {
  onHide: () => void;
  target: any;
}) {
  const {
    done: { color: doneColor }
  } = useKeyContext((v) => v.theme);
  const accountTypeObj = useMemo(() => {
    return target;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const deleteAccountType = useAppContext(
    (v) => v.requestHelpers.deleteAccountType
  );
  const editAccountType = useAppContext(
    (v) => v.requestHelpers.editAccountType
  );
  const onDeleteAccountType = useManagementContext(
    (v) => v.actions.onDeleteAccountType
  );
  const onEditAccountType = useManagementContext(
    (v) => v.actions.onEditAccountType
  );
  const [submitting, setSubmitting] = useState(false);
  const [accountLabel, setAccountLabel] = useState(accountTypeObj.label);
  const [deleteModalShown, setDeleteModalShown] = useState(false);
  const [authLevel, setAuthLevel] = useState(accountTypeObj.authLevel);
  const [perks, setPerks] = useState<any>({
    canEdit: false,
    canDelete: false,
    canReward: false,
    canPinPlaylists: false,
    canEditPlaylists: false,
    canEditRewardLevel: false
  });

  useEffect(() => {
    for (const key in accountTypeObj) {
      if (key === 'label' || key === 'authLevel' || key === 'id') continue;
      setPerks((perk: any) => ({
        ...perk,
        [key]: !!accountTypeObj[key]
      }));
    }
  }, [accountTypeObj]);

  const disabled = useMemo(() => {
    for (const key in perks) {
      if (!!accountTypeObj[key] !== perks[key]) return false;
    }
    if (!stringIsEmpty(accountLabel) && accountLabel !== accountTypeObj.label) {
      return false;
    }
    if (authLevel !== accountTypeObj.authLevel) {
      return false;
    }
    return true;
  }, [accountLabel, authLevel, perks, accountTypeObj]);

  return (
    <ErrorBoundary componentPath="Management/Modals/EditAccountTypeModal">
      <Modal onHide={onHide}>
        <header style={{ display: 'block' }}>Edit Account Type:</header>
        <main>
          <div
            style={{
              paddingBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              fontSize: '1.7rem'
            }}
          >
            <label style={{ fontWeight: 'bold' }}>Label: </label>
            <Input
              style={{ marginLeft: '1rem', width: 'auto' }}
              placeholder="Enter label..."
              value={accountLabel}
              onChange={setAccountLabel}
            />
          </div>
          <div
            style={{
              paddingBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              fontSize: '1.7rem'
            }}
          >
            <label style={{ fontWeight: 'bold' }}>Auth Level: </label>
            <Input
              type="text"
              style={{ marginLeft: '1rem', width: 'auto' }}
              value={authLevel}
              onChange={(text) => {
                if (isNaN(Number(text))) return setAuthLevel(0);
                const numberString = String(text % 100);
                const number = Number(numberString.replace(/^0+/, ''));
                setAuthLevel(number);
              }}
            />
          </div>
          <Table columns="2fr 1fr">
            <thead>
              <tr>
                <th>Perks</th>
                <th></th>
              </tr>
            </thead>
            <tbody
              className={`${css`
                tr {
                  cursor: pointer;
                }
              `} unselectable`}
            >
              <tr
                onClick={() =>
                  setPerks((perk: any) => ({
                    ...perk,
                    canEdit: !perk.canEdit
                  }))
                }
              >
                <td style={{ fontWeight: 'bold' }}>Can Edit</td>
                <td style={{ textAlign: 'center' }}>
                  <Check checked={perks.canEdit} />
                </td>
              </tr>
              <tr
                onClick={() =>
                  setPerks((perk: any) => ({
                    ...perk,
                    canDelete: !perk.canDelete
                  }))
                }
              >
                <td style={{ fontWeight: 'bold' }}>Can Delete</td>
                <td style={{ textAlign: 'center' }}>
                  <Check checked={perks.canDelete} />
                </td>
              </tr>
              <tr
                onClick={() =>
                  setPerks((perk: any) => ({
                    ...perk,
                    canReward: !perk.canReward
                  }))
                }
              >
                <td style={{ fontWeight: 'bold' }}>Can Reward</td>
                <td style={{ textAlign: 'center' }}>
                  <Check checked={perks.canReward} />
                </td>
              </tr>
              <tr
                onClick={() =>
                  setPerks((perk: any) => ({
                    ...perk,
                    canPinPlaylists: !perk.canPinPlaylists
                  }))
                }
              >
                <td style={{ fontWeight: 'bold' }}>Can Feature Contents</td>
                <td style={{ textAlign: 'center' }}>
                  <Check checked={perks.canPinPlaylists} />
                </td>
              </tr>
              <tr
                onClick={() =>
                  setPerks((perk: any) => ({
                    ...perk,
                    canEditPlaylists: !perk.canEditPlaylists
                  }))
                }
              >
                <td style={{ fontWeight: 'bold' }}>Can Edit Playlists</td>
                <td style={{ textAlign: 'center' }}>
                  <Check checked={perks.canEditPlaylists} />
                </td>
              </tr>
              <tr
                onClick={() =>
                  setPerks((perk: any) => ({
                    ...perk,
                    canEditRewardLevel: !perk.canEditRewardLevel
                  }))
                }
              >
                <td style={{ fontWeight: 'bold' }}>Can Edit Reward Level</td>
                <td style={{ textAlign: 'center' }}>
                  <Check checked={perks.canEditRewardLevel} />
                </td>
              </tr>
            </tbody>
          </Table>
        </main>
        <footer style={{ justifyContent: 'space-between' }}>
          <div>
            <Button
              transparent
              color="red"
              onClick={() => setDeleteModalShown(true)}
              style={{ marginRight: '0.7rem' }}
            >
              <Icon icon="trash-alt" />
              <span style={{ marginLeft: '1rem' }}>Remove</span>
            </Button>
          </div>
          <div style={{ display: 'flex' }}>
            <Button
              transparent
              onClick={onHide}
              style={{ marginRight: '0.7rem' }}
            >
              Cancel
            </Button>
            <Button
              color={doneColor}
              loading={submitting}
              disabled={disabled}
              onClick={handleSubmit}
            >
              Done
            </Button>
          </div>
        </footer>
        {deleteModalShown && (
          <ConfirmModal
            modalOverModal
            onConfirm={handleDeleteAccountType}
            onHide={() => setDeleteModalShown(false)}
            title="Remove Account Type"
          />
        )}
      </Modal>
    </ErrorBoundary>
  );

  async function handleDeleteAccountType() {
    await deleteAccountType(accountTypeObj.label);
    onDeleteAccountType(accountTypeObj.label);
    onHide();
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
      const editedAccountType = {
        label: accountLabel,
        authLevel,
        ...perks
      };
      await editAccountType({ label: accountTypeObj.label, editedAccountType });
      onEditAccountType({ label: accountTypeObj.label, editedAccountType });
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      onHide();
    }
  }
}
