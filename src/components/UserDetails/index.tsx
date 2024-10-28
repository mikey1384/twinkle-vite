import React, { useMemo, useRef, useState, useEffect } from 'react';
import Link from '~/components/Link';
import StatusInput from './StatusInput';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import UserTitle from '~/components/Texts/UserTitle';
import request from 'axios';
import ErrorBoundary from '~/components/ErrorBoundary';
import StatusMsg from './StatusMsg';
import Bio from '~/components/Texts/Bio';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import {
  addEmoji,
  finalizeEmoji,
  renderText,
  replaceFakeAtSymbol
} from '~/helpers/stringHelpers';
import URL from '~/constants/URL';
import {
  useAppContext,
  useContentContext,
  useInputContext,
  useProfileContext
} from '~/contexts';
import localize from '~/constants/localize';

const doesNotHaveBioLabel = localize('doesNotHaveBio');

export default function UserDetails({
  noLink,
  profile,
  removeStatusMsg,
  small,
  style = {},
  onSetBioEditModalShown,
  unEditable,
  updateStatusMsg,
  userId
}: {
  noLink?: boolean;
  onSetBioEditModalShown?: (v: any) => any;
  profile: any;
  removeStatusMsg?: any;
  style?: any;
  unEditable?: boolean;
  updateStatusMsg?: any;
  userId?: number;
  small?: boolean;
}) {
  const auth = useAppContext((v) => v.requestHelpers.auth);
  const onReloadContent = useContentContext((v) => v.actions.onReloadContent);
  const editedStatusColor = useInputContext((v) => v.state.editedStatusColor);
  const editedStatusMsg = useInputContext((v) => v.state.editedStatusMsg);
  const onSetEditedStatusColor = useInputContext(
    (v) => v.actions.onSetEditedStatusColor
  );
  const onSetEditedStatusMsg = useInputContext(
    (v) => v.actions.onSetEditedStatusMsg
  );
  const onResetProfile = useProfileContext((v) => v.actions.onResetProfile);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  useEffect(() => {
    onSetEditedStatusColor('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  const StatusInputRef: React.RefObject<any> = useRef(null);
  const { profileFirstRow, profileSecondRow, profileThirdRow } = profile;
  const statusColor = useMemo(() => {
    return (
      (userId === profile.id
        ? editedStatusColor || profile.statusColor
        : profile.statusColor) || 'logoBlue'
    );
  }, [editedStatusColor, profile.id, profile.statusColor, userId]);
  const noProfile = useMemo(
    () => !profileFirstRow && !profileSecondRow && !profileThirdRow,
    [profileFirstRow, profileSecondRow, profileThirdRow]
  );
  const displayedStatusMsg = useMemo(
    () =>
      userId === profile.id && editedStatusMsg
        ? editedStatusMsg
        : profile.statusMsg,
    [editedStatusMsg, profile.id, profile.statusMsg, userId]
  );
  return (
    <ErrorBoundary
      componentPath="UserDetails/index"
      style={{
        display: 'flex',
        flexDirection: 'column',
        ...style
      }}
    >
      <Link
        to={noLink ? '' : `/users/${profile.username}`}
        onClick={handleReloadProfile}
        style={{
          width: 'auto',
          fontSize: small ? '3rem' : '3.5rem',
          fontWeight: 'bold',
          color: Color.darkerGray(),
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: 1.3,
          textDecoration: 'none'
        }}
        className={
          noLink
            ? ''
            : css`
                transition: color 0.2s;
                &:hover {
                  color: ${Color[
                    profile.profileTheme || 'logoBlue'
                  ]()}!important;
                }
              `
        }
      >
        {profile.username}
      </Link>
      <div
        style={{
          fontSize: small ? '1.3rem' : '1.5rem'
        }}
      >
        <UserTitle
          user={profile}
          className={`unselectable ${css`
            font-size: ${small ? '1.3rem' : '1.5rem'};
            font-weight: bold;
            display: inline;
            margin-right: 0.7rem;
            color: ${Color.darkGray()};
            font-size: 1.5rem;
          `}`}
        />
        <span
          className={css`
            color: ${Color.gray()};
          `}
        >
          {profile.realName}
        </span>
      </div>
      {userId === profile.id && !unEditable && (
        <StatusInput
          innerRef={StatusInputRef}
          profile={profile}
          statusColor={statusColor}
          editedStatusMsg={editedStatusMsg}
          setColor={onSetEditedStatusColor}
          onTextChange={(event: any) => {
            onSetEditedStatusMsg(addEmoji(renderText(event.target.value)));
            if (!event.target.value) {
              onSetEditedStatusColor('');
            }
          }}
          onCancel={() => {
            onSetEditedStatusMsg('');
            onSetEditedStatusColor('');
          }}
          onStatusSubmit={onStatusMsgSubmit}
        />
      )}
      {(profile.statusMsg || displayedStatusMsg) && (
        <StatusMsg
          statusColor={statusColor}
          statusMsg={displayedStatusMsg}
          userId={userId || 0}
        />
      )}
      {profile.statusMsg &&
        !editedStatusMsg &&
        userId === profile.id &&
        !unEditable && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '0.5rem'
            }}
          >
            <Button
              transparent
              onClick={() => {
                onSetEditedStatusMsg(
                  replaceFakeAtSymbol(profile.statusMsg || '')
                );
                StatusInputRef.current.focus();
              }}
            >
              <Icon icon="pencil-alt" />
              <span style={{ marginLeft: '0.7rem' }}>Change</span>
            </Button>
            <Button
              transparent
              style={{ marginLeft: '1rem' }}
              onClick={() => setConfirmModalShown(true)}
            >
              <Icon icon="trash-alt" />
              <span style={{ marginLeft: '0.7rem' }}>Remove</span>
            </Button>
          </div>
        )}
      {!noProfile && (
        <Bio
          small={small}
          userId={profile.id}
          firstRow={profileFirstRow}
          secondRow={profileSecondRow}
          thirdRow={profileThirdRow}
        />
      )}
      {noProfile &&
        (userId === profile.id && !unEditable ? (
          <div style={{ padding: '4rem 1rem 3rem 1rem' }}>
            <a
              style={{
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '2rem'
              }}
              onClick={() => onSetBioEditModalShown?.(true)}
            >
              Introduce yourself!
            </a>
          </div>
        ) : (
          <div
            style={{
              height: '6rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start'
            }}
          >
            <span>
              {profile.username}
              {doesNotHaveBioLabel}
            </span>
          </div>
        ))}
      {confirmModalShown && (
        <ConfirmModal
          onConfirm={onRemoveStatus}
          onHide={() => setConfirmModalShown(false)}
          title={`Remove Status Message`}
        />
      )}
    </ErrorBoundary>
  );

  function handleReloadProfile() {
    onReloadContent({
      contentId: profile.id,
      contentType: 'user'
    });
    onResetProfile(profile.username);
  }

  async function onRemoveStatus() {
    await request.delete(`${URL}/user/statusMsg`, auth());
    removeStatusMsg(profile.id);
    setConfirmModalShown(false);
  }

  async function onStatusMsgSubmit() {
    const statusMsg = finalizeEmoji(editedStatusMsg);
    const statusColor = editedStatusColor || profile.statusColor;
    const { data } = await request.post(
      `${URL}/user/statusMsg`,
      {
        statusMsg,
        statusColor
      },
      auth()
    );
    onSetEditedStatusColor('');
    onSetEditedStatusMsg('');
    if (typeof updateStatusMsg === 'function') updateStatusMsg(data);
  }
}
