import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import SectionPanel from '~/components/SectionPanel';
import StatusMsg from '~/components/UserDetails/StatusMsg';
import StatusInput from '~/components/UserDetails/StatusInput';
import RankBar from '~/components/RankBar';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import DropDownButton from '~/components/Buttons/DropdownButton';
import LoginToViewContent from '~/components/LoginToViewContent';
import BasicInfos from './BasicInfos';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import BioEditModal from '~/components/Modals/BioEditModal';
import Bio from '~/components/Texts/Bio';
import ErrorBoundary from '~/components/ErrorBoundary';
import request from 'axios';
import URL from '~/constants/URL';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import {
  useAppContext,
  useChatContext,
  useInputContext,
  useKeyContext
} from '~/contexts';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import {
  addEmoji,
  renderText,
  stringIsEmpty,
  finalizeEmoji,
  replaceFakeAtSymbol
} from '~/helpers/stringHelpers';
import localize from '~/constants/localize';

const editLabel = localize('edit');
const enterMessageForVisitorsLabel = localize('enterMessageForVisitors');
const removeLabel = localize('remove');

Intro.propTypes = {
  profile: PropTypes.object,
  selectedTheme: PropTypes.string.isRequired
};

export default function Intro({
  profile,
  selectedTheme
}: {
  profile: any;
  selectedTheme: string;
}) {
  const chatStatus = useChatContext((v) => v.state.chatStatus);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const auth = useAppContext((v) => v.requestHelpers.auth);
  const uploadGreeting = useAppContext((v) => v.requestHelpers.uploadGreeting);
  const uploadBio = useAppContext((v) => v.requestHelpers.uploadBio);
  const editedStatusMsg = useInputContext((v) => v.state.editedStatusMsg);
  const editedStatusColor = useInputContext((v) => v.state.editedStatusColor);
  const onSetEditedStatusColor = useInputContext(
    (v) => v.actions.onSetEditedStatusColor
  );
  const onSetEditedStatusMsg = useInputContext(
    (v) => v.actions.onSetEditedStatusMsg
  );
  const userId = useKeyContext((v) => v.myState.userId);
  const banned = useKeyContext((v) => v.myState.banned);
  const [bioEditModalShown, setBioEditModalShown] = useState(false);
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  useEffect(() => {
    onSetEditedStatusColor('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const {
    email,
    id,
    verifiedEmail,
    greeting,
    joinDate,
    lastActive,
    profilePicUrl,
    profileTheme,
    profileFirstRow,
    profileSecondRow,
    profileThirdRow,
    statusColor,
    statusMsg,
    username,
    website,
    youtubeName,
    youtubeUrl
  } = profile;

  const StatusInputRef: React.RefObject<any> = useRef(null);
  const bioExists = useMemo(
    () => profileFirstRow || profileSecondRow || profileThirdRow,
    [profileFirstRow, profileSecondRow, profileThirdRow]
  );
  const usernameColor = useMemo(() => Color[selectedTheme](), [selectedTheme]);
  const defaultMessage = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return (
        <p>
          <b style={{ color: usernameColor }}>{username}</b>님의 프로필
          페이지입니다
        </p>
      );
    }
    return (
      <p>
        Welcome to <b style={{ color: usernameColor }}>{username}</b>
        {`'s`} Profile Page
      </p>
    );
  }, [username, usernameColor]);
  const displayedStatusColor =
    userId === profile.id ? editedStatusColor : statusColor;
  const displayedStatusMsg =
    userId === profile.id ? editedStatusMsg : statusMsg;

  return (
    <ErrorBoundary componentPath="Profile/Body/Home/Intro">
      <SectionPanel
        loaded
        customColorTheme={selectedTheme}
        title={greeting || 'Welcome!'}
        canEdit={id === userId}
        placeholder={enterMessageForVisitorsLabel}
        onEditTitle={handleEditGreeting}
      >
        <div
          style={{
            display: 'flex',
            minHeight: '10rem',
            width: '100%',
            marginTop: '1rem',
            paddingBottom: '4rem'
          }}
        >
          <div
            style={{
              width: 'CALC(50% - 1rem)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginRight: '1rem'
            }}
          >
            <div
              style={{
                width: '90%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                flexDirection: 'column'
              }}
            >
              {userId === profile.id && (
                <StatusInput
                  innerRef={StatusInputRef}
                  profile={profile}
                  statusColor={editedStatusColor || statusColor}
                  editedStatusMsg={editedStatusMsg}
                  setColor={(color) => onSetEditedStatusColor(color)}
                  onTextChange={(event: any) => {
                    onSetEditedStatusMsg(
                      addEmoji(renderText(event.target.value))
                    );
                    if (!event.target.value) {
                      onSetEditedStatusColor('');
                    }
                  }}
                  onCancel={() => {
                    onSetEditedStatusMsg('');
                    onSetEditedStatusColor('');
                  }}
                  onStatusSubmit={handleStatusMsgSubmit}
                />
              )}
              {(!stringIsEmpty(statusMsg) || displayedStatusMsg) && (
                <StatusMsg
                  style={{
                    fontSize: '1.6rem',
                    width: '100%',
                    marginTop: profile.twinkleXP > 0 || bioExists ? '1rem' : 0,
                    marginBottom:
                      profile.twinkleXP > 0 || bioExists ? '2rem' : 0
                  }}
                  statusColor={
                    displayedStatusColor || statusColor || 'logoBlue'
                  }
                  statusMsg={displayedStatusMsg || statusMsg}
                  userId={userId}
                />
              )}
              {userId === profile.id &&
                !editedStatusMsg &&
                !stringIsEmpty(statusMsg) && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      marginTop: '-1rem',
                      marginBottom:
                        profile.twinkleXP > 0 || bioExists ? '1rem' : 0
                    }}
                  >
                    <Button
                      transparent
                      onClick={() => {
                        onSetEditedStatusMsg(
                          replaceFakeAtSymbol(statusMsg || '')
                        );
                        StatusInputRef.current?.focus();
                      }}
                    >
                      <Icon icon="pencil-alt" />
                      <span style={{ marginLeft: '0.7rem' }}>{editLabel}</span>
                    </Button>
                    <Button
                      transparent
                      style={{ marginLeft: '0.5rem' }}
                      onClick={() => setConfirmModalShown(true)}
                    >
                      <Icon icon="trash-alt" />
                      <span style={{ marginLeft: '0.7rem' }}>
                        {removeLabel}
                      </span>
                    </Button>
                  </div>
                )}
              {userId !== profile.id && stringIsEmpty(statusMsg) && (
                <div
                  style={{
                    width: '100%',
                    fontSize: '2rem',
                    display: 'flex',
                    textAlign: 'center',
                    alignItems: 'center'
                  }}
                >
                  {defaultMessage}
                </div>
              )}
            </div>
          </div>
          {userId ? (
            <BasicInfos
              profileTheme={profileTheme}
              className={css`
                font-size: 1.7rem;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1.5rem;
                }
              `}
              style={{
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                justifyContent: 'center',
                width: 'CALC(50% - 1rem)',
                marginLeft: '1rem',
                marginBottom: '1rem'
              }}
              email={email}
              verifiedEmail={verifiedEmail}
              joinDate={joinDate}
              online={chatStatus[profile.id]?.isOnline}
              lastActive={lastActive}
              profilePicUrl={profilePicUrl}
              userId={id}
              username={username}
              selectedTheme={selectedTheme}
              website={website}
              youtubeName={youtubeName}
              youtubeUrl={youtubeUrl}
            />
          ) : (
            <LoginToViewContent />
          )}
        </div>
        {profile.twinkleXP > 0 && (
          <RankBar
            profile={profile}
            className={css`
              margin-left: ${!!profile.rank && profile.rank < 4
                ? '-11px'
                : '-10px'};
              margin-right: ${!!profile.rank && profile.rank < 4
                ? '-11px'
                : '-10px'};
              @media (max-width: ${mobileMaxWidth}) {
                margin-left: -1rem !important;
                margin-right: -1rem !important;
              }
            `}
            style={{
              display: 'block',
              borderRadius: 0,
              borderRight: 0,
              borderLeft: 0
            }}
          />
        )}
        {!profile.twinkleXP && bioExists && (
          <hr
            style={{
              padding: '1px',
              background: '#fff',
              borderTop: `2px solid ${Color[selectedTheme || 'logoBlue'](0.6)}`,
              borderBottom: `2px solid ${Color[selectedTheme || 'logoBlue'](
                0.6
              )}`
            }}
          />
        )}
        {bioExists && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            <Bio
              style={{
                fontSize: '1.6rem',
                marginBottom: '1rem',
                width: '100%'
              }}
              userId={profile.id}
              firstRow={profileFirstRow}
              secondRow={profileSecondRow}
              thirdRow={profileThirdRow}
            />
            {userId === profile.id && (
              <DropDownButton
                opacity={0.7}
                style={{
                  right: 0,
                  top: '1rem',
                  position: 'absolute'
                }}
                skeuomorphic
                color="darkerGray"
                menuProps={[
                  {
                    label: (
                      <>
                        <Icon icon="pencil-alt" />
                        <span style={{ marginLeft: '1rem' }}>{editLabel}</span>
                      </>
                    ),
                    onClick: () => setBioEditModalShown(true)
                  },
                  {
                    label: (
                      <>
                        <Icon icon="trash-alt" />
                        <span style={{ marginLeft: '1rem' }}>
                          {removeLabel}
                        </span>
                      </>
                    ),
                    onClick: async () => {
                      const data = await uploadBio({
                        firstLine: '',
                        secondLine: '',
                        thirdLine: ''
                      });
                      onSetUserState({
                        userId: data.userId,
                        newState: data.bio
                      });
                    }
                  }
                ]}
              />
            )}
          </div>
        )}
        {!bioExists && profile.id === userId && (
          <div
            style={{
              width: '100%',
              justifyContent: 'center',
              display: 'flex',
              marginTop: '1rem'
            }}
          >
            <Button
              style={{ fontSize: '2rem' }}
              transparent
              onClick={() => setBioEditModalShown(true)}
            >
              Add a Bio
            </Button>
          </div>
        )}
      </SectionPanel>
      {bioEditModalShown && (
        <BioEditModal
          firstLine={replaceFakeAtSymbol(profileFirstRow || '')}
          secondLine={replaceFakeAtSymbol(profileSecondRow || '')}
          thirdLine={replaceFakeAtSymbol(profileThirdRow || '')}
          onSubmit={handleUploadBio}
          onHide={() => setBioEditModalShown(false)}
        />
      )}
      {confirmModalShown && (
        <ConfirmModal
          onConfirm={handleRemoveStatus}
          onHide={() => setConfirmModalShown(false)}
          title={`Remove Status Message`}
        />
      )}
    </ErrorBoundary>
  );

  async function handleUploadBio(params: any) {
    if (banned?.posting) {
      return;
    }
    const data = await uploadBio(params);
    onSetUserState({ userId: data.userId, newState: data.bio });
    setBioEditModalShown(false);
  }

  async function handleEditGreeting(greeting: string) {
    if (banned?.posting) {
      return;
    }
    await uploadGreeting({ greeting });
    onSetUserState({ userId, newState: { greeting } });
  }

  async function handleRemoveStatus() {
    await request.delete(`${URL}/user/statusMsg`, auth());
    onSetUserState({
      userId,
      newState: { statusMsg: '', statusColor: '' }
    });
    setConfirmModalShown(false);
  }

  async function handleStatusMsgSubmit() {
    if (banned?.posting) {
      return;
    }
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
    onSetUserState({ userId, newState: data });
  }
}
