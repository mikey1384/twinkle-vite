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
import { Color, tabletMaxWidth } from '~/constants/css';
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
import { getCanonicalProfileStatus } from '~/helpers/profileCanonicalState';
const doesNotHaveBioLabel = ' does not have a bio, yet';

export default function UserDetails({
  noLink,
  isChatEmbed = false,
  identityBadge,
  profile,
  removeStatusMsg,
  small,
  style = {},
  onSetBioEditModalShown,
  unEditable,
  updateStatusMsg,
  userId
}: {
  identityBadge?: React.ReactNode;
  isChatEmbed?: boolean;
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
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  useEffect(() => {
    if (!unEditable) onSetEditedStatusColor('');
  }, [userId, unEditable, onSetEditedStatusColor]);
  const StatusInputRef: React.RefObject<any> = useRef(null);
  const { profileFirstRow, profileSecondRow, profileThirdRow } = profile;
  const statusColor = useMemo(() => {
    return (
      (!unEditable && userId === profile.id
        ? editedStatusColor || profile.statusColor
        : profile.statusColor) || 'logoBlue'
    );
  }, [editedStatusColor, profile.id, profile.statusColor, userId, unEditable]);
  const noProfile = useMemo(
    () => !profileFirstRow && !profileSecondRow && !profileThirdRow,
    [profileFirstRow, profileSecondRow, profileThirdRow]
  );
  const displayedStatusMsg = useMemo(
    () =>
      !unEditable && userId === profile.id && editedStatusMsg
        ? editedStatusMsg
        : profile.statusMsg,
    [editedStatusMsg, profile.id, profile.statusMsg, userId, unEditable]
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
      <div
        className={css`
          width: 100%;
          @media (max-width: ${tabletMaxWidth}) {
            text-align: center;
          }
        `}
      >
        <Link
          to={noLink ? '' : `/users/${profile.username}`}
          onClick={handleReloadProfile}
          style={{
            width: 'auto',
            fontSize: isChatEmbed ? '20px' : small ? '3rem' : '3.5rem',
            fontWeight: 'bold',
            color: Color.darkerGray(),
            whiteSpace: isChatEmbed ? 'normal' : 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.3,
            textDecoration: 'none'
          }}
          className={
            noLink
              ? ''
              : css`
                  @media (hover: hover) and (pointer: fine) {
                    transition: color 0.2s;
                    &:hover {
                      color: ${Color[
                        profile.profileTheme || 'logoBlue'
                      ]()}!important;
                    }
                  }
                `
          }
        >
          {profile.username}
        </Link>
        <div
          style={{
            fontSize: isChatEmbed ? '13px' : small ? '1.3rem' : '1.5rem'
          }}
        >
          <UserTitle
            readOnly={unEditable}
            user={profile}
            className={`unselectable ${css`
              font-size: ${small ? '1.3rem' : '1.5rem'};
              font-weight: bold;
              display: inline;
              margin-right: 0.7rem;
              color: ${Color.darkGray()};
              font-size: ${isChatEmbed ? '13px' : '1.5rem'};
            `}`}
          />
          <span
            className={css`
              color: ${isChatEmbed ? '#64748b' : Color.gray()};
            `}
          >
            {profile.realName}
          </span>
        </div>
        {identityBadge}
      </div>
      {userId === profile.id && !unEditable && (
        <StatusInput
          innerRef={StatusInputRef}
          profile={profile}
          statusColor={statusColor}
          editedStatusMsg={editedStatusMsg}
          setColor={onSetEditedStatusColor}
          onTextChange={(text: string) => {
            onSetEditedStatusMsg(addEmoji(renderText(text)));
            if (!text) {
              onSetEditedStatusColor('');
            }
          }}
          onCancel={() => {
            onSetEditedStatusMsg('');
            onSetEditedStatusColor('');
          }}
          onStatusSubmit={onStatusMsgSubmit}
          submitting={statusSubmitting}
        />
      )}
      {(profile.statusMsg || displayedStatusMsg) && (
        <StatusMsg
          contrastSafe={isChatEmbed}
          style={isChatEmbed ? { fontSize: '14px', lineHeight: 1.5, padding: '10px', borderRadius: 8, boxShadow: 'none' } : undefined}
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
              variant="ghost"
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
              variant="ghost"
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
          style={isChatEmbed ? { fontSize: '14px', paddingLeft: 0, marginTop: '12px' } : undefined}
          small={small}
          userId={profile.id}
          firstRow={profileFirstRow}
          secondRow={profileSecondRow}
          thirdRow={profileThirdRow}
        />
      )}
      {noProfile &&
        (userId === profile.id && !unEditable ? (
          <div
            style={{
              padding: '2rem 1rem 1.5rem 1rem',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <Button
              variant="soft"
              size="lg"
              tone="raised"
              color={profile.profileTheme || 'logoBlue'}
              onClick={() => onSetBioEditModalShown?.(true)}
              style={{ fontWeight: 700 }}
            >
              <Icon icon="user-edit" />
              <span style={{ marginLeft: '0.6rem' }}>Introduce yourself!</span>
            </Button>
          </div>
        ) : (
          <div
            className={css`
              height: 6rem;
              display: flex;
              align-items: center;
              justify-content: flex-start;
              @media (max-width: ${tabletMaxWidth}) {
                justify-content: center;
              }
            `}
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
    const { data } = await request.delete(`${URL}/user/statusMsg`, auth());
    const canonicalStatus = getCanonicalProfileStatus(data);
    removeStatusMsg(canonicalStatus);
    setConfirmModalShown(false);
  }

  async function onStatusMsgSubmit() {
    if (statusSubmitting) return;
    const statusMsg = finalizeEmoji(editedStatusMsg);
    const statusColor = editedStatusColor || profile.statusColor;
    setStatusSubmitting(true);
    try {
      const { data } = await request.post(
        `${URL}/user/statusMsg`,
        {
          statusMsg,
          statusColor
        },
        auth()
      );
      const canonicalStatus = getCanonicalProfileStatus(data);
      if (typeof updateStatusMsg === 'function') {
        updateStatusMsg(canonicalStatus);
      }
      onSetEditedStatusColor('');
      onSetEditedStatusMsg('');
    } catch (error) {
      console.error(error);
    } finally {
      setStatusSubmitting(false);
    }
  }
}
