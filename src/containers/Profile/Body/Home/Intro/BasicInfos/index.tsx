import React, { useMemo, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import InfoEditForm from './InfoEditForm';
import PasswordInputModal from './PasswordInputModal';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { returnTheme } from '~/helpers';
import { stringIsEmpty, trimUrl } from '~/helpers/stringHelpers';
import { timeSince } from '~/helpers/timeStampHelpers';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import {
  useAppContext,
  useChatContext,
  useInputContext,
  useKeyContext
} from '~/contexts';
import { SELECTED_LANGUAGE } from '~/constants/defaultValues';
import localize from '~/constants/localize';

const editLabel = localize('edit');
const emailHasBeenSentLabel = localize('emailHasBeenSent');
const memberSinceLabel = localize('memberSince');
const pleaseVerifyEmailLabel = localize('pleaseVerifyEmail');
const userEmailNotVerifiedLabel = localize('userEmailNotVerified');
const wasLastActiveLabel = localize('wasLastActive');
const websiteLabel = localize('Website');
const youtubeLabel = localize('youtube');

export default function BasicInfos({
  className,
  email,
  verifiedEmail,
  online,
  joinDate,
  lastActive,
  profilePicUrl,
  profileTheme,
  selectedTheme,
  userId,
  username,
  website,
  youtubeName,
  youtubeUrl,
  style
}: {
  className?: string;
  email: string;
  verifiedEmail: string;
  online: boolean;
  profilePicUrl: string;
  profileTheme: string;
  joinDate: number;
  lastActive: string;
  selectedTheme: string;
  userId: number;
  username: string;
  website: string;
  youtubeName: string;
  youtubeUrl: string;
  style?: React.CSSProperties;
}) {
  const reportError = useAppContext((v) => v.requestHelpers.reportError);
  const navigate = useNavigate();
  const {
    userId: myId,
    username: myUsername,
    banned
  } = useKeyContext((v) => v.myState);
  const {
    button: { color: buttonColor },
    buttonHovered: { color: buttonHoverColor },
    link: { color: linkColor },
    verifyEmail: { color: verifyEmailColor }
  } = useMemo(
    () => returnTheme(selectedTheme || profileTheme || 'logoBlue'),
    [profileTheme, selectedTheme]
  );
  const loadDMChannel = useAppContext((v) => v.requestHelpers.loadDMChannel);
  const uploadProfileInfo = useAppContext(
    (v) => v.requestHelpers.uploadProfileInfo
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const sendVerificationEmail = useAppContext(
    (v) => v.requestHelpers.sendVerificationEmail
  );
  const onOpenNewChatTab = useChatContext((v) => v.actions.onOpenNewChatTab);
  const userInfoOnEdit = useInputContext(
    (v) => v.state.userInfo.userInfoOnEdit
  );
  const onSetUserInfoOnEdit = useInputContext(
    (v) => v.actions.onSetUserInfoOnEdit
  );
  const [passwordInputModalShown, setPasswordInputModalShown] = useState(false);
  const [emailCheckHighlighted, setEmailCheckHighlighted] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const emailVerified = useMemo(
    () =>
      !stringIsEmpty(email) &&
      !stringIsEmpty(verifiedEmail) &&
      email.trim() === verifiedEmail.trim(),
    [email, verifiedEmail]
  );

  const displayedTime = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return moment.unix(joinDate).format('MM/DD/YYYY');
    }
    return moment.unix(joinDate).format('LL');
  }, [joinDate]);

  const messageUserLabel = useMemo(() => {
    if (SELECTED_LANGUAGE === 'kr') {
      return <span style={{ marginLeft: '0.7rem' }}>채팅하기</span>;
    }
    return (
      <span style={{ marginLeft: '0.7rem' }}>
        {online ? 'Chat' : 'Message'}
        <span className="desktop">
          {online ? ' with' : ''} {username}
        </span>
      </span>
    );
  }, [online, username]);

  return (
    <div className={className} style={style}>
      <div style={{ marginBottom: '0.5rem' }}>
        {memberSinceLabel} {displayedTime}
      </div>
      {userInfoOnEdit && userId === myId && (
        <InfoEditForm
          email={email}
          youtubeUrl={youtubeUrl}
          youtubeName={youtubeName}
          website={website}
          onCancel={() => onSetUserInfoOnEdit(false)}
          onSubmit={onEditedInfoSubmit}
        />
      )}
      {(!userInfoOnEdit || userId !== myId) &&
        (email || youtubeUrl || website) && (
          <div
            className={css`
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.4rem;
              }
            `}
            style={{ textAlign: 'center' }}
          >
            {email && (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <div
                    style={{
                      lineHeight:
                        myId === userId && !emailVerified ? '0.5rem' : undefined
                    }}
                  >
                    <a
                      href={`mailto:${email}`}
                      style={{ color: Color[linkColor]() }}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {email}
                    </a>
                  </div>
                  <Icon
                    onMouseEnter={() =>
                      setEmailCheckHighlighted(
                        !verificationEmailSent && myId === userId
                      )
                    }
                    onMouseLeave={() => setEmailCheckHighlighted(false)}
                    className={css`
                      margin-left: 0.5rem;
                    `}
                    style={{
                      cursor:
                        verificationEmailSent ||
                        myId !== userId ||
                        emailVerified
                          ? 'default'
                          : 'pointer',
                      color:
                        emailVerified || emailCheckHighlighted
                          ? Color[verifyEmailColor]()
                          : Color.lighterGray()
                    }}
                    icon="check-circle"
                    onClick={
                      myId !== userId || emailVerified
                        ? () => null
                        : onVerifyEmail
                    }
                  />
                </div>
                {myId === userId && !emailVerified && (
                  <div>
                    <a
                      onMouseEnter={() =>
                        setEmailCheckHighlighted(!verificationEmailSent)
                      }
                      onMouseLeave={() => setEmailCheckHighlighted(false)}
                      style={{
                        textDecoration: emailCheckHighlighted
                          ? 'underline'
                          : undefined,
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        color: Color[verifyEmailColor]()
                      }}
                      onClick={
                        verificationEmailSent ? goToEmail : onVerifyEmail
                      }
                    >
                      {verificationEmailSent
                        ? emailHasBeenSentLabel
                        : pleaseVerifyEmailLabel}
                    </a>
                  </div>
                )}
                {myId !== userId && !emailVerified && (
                  <div style={{ color: Color.gray(), fontSize: '1.2rem' }}>
                    {userEmailNotVerifiedLabel}
                  </div>
                )}
              </>
            )}
            {youtubeUrl && (
              <div
                style={{
                  marginTop: '0.5rem'
                }}
              >
                <span>{youtubeLabel}: </span>
                <a
                  style={{ color: Color[linkColor]() }}
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {youtubeName || trimUrl(youtubeUrl)}
                </a>
              </div>
            )}
            {website && (
              <div style={{ marginTop: '0.5rem' }}>
                <span>{websiteLabel}: </span>
                <a
                  style={{ color: Color[linkColor]() }}
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {trimUrl(website)}
                </a>
              </div>
            )}
          </div>
        )}
      {!userInfoOnEdit &&
        myId === userId &&
        (!email || !youtubeUrl || !website) && (
          <div
            style={{
              height: '100%',
              display: 'flex',
              textAlign: 'center',
              alignItems: 'center',
              marginTop: email || youtubeUrl ? '1rem' : 0
            }}
          >
            {renderEditMessage({ email, youtubeUrl, website })}
          </div>
        )}
      {myId === userId ? (
        !userInfoOnEdit ? (
          <Button
            style={{
              marginTop: !email || !youtubeUrl || !website ? 0 : '1rem',
              marginBottom: '0.5rem'
            }}
            transparent
            onClick={() => setPasswordInputModalShown(true)}
          >
            <Icon icon="pencil-alt" />
            <span style={{ marginLeft: '0.7rem' }}>{editLabel}</span>
          </Button>
        ) : null
      ) : lastActive ? (
        <div
          style={{
            marginTop: email || youtubeUrl ? '1rem' : 0,
            textAlign: 'center'
          }}
        >
          <div>
            {online ? (
              <span
                style={{ fontWeight: 'bold', color: Color.green() }}
              >{`${username} is online`}</span>
            ) : (
              `${wasLastActiveLabel} ${timeSince(lastActive)}`
            )}
            {myId !== userId && (
              <Button
                style={{
                  marginTop: '1rem',
                  width: '100%'
                }}
                skeuomorphic
                color={buttonColor}
                hoverColor={buttonHoverColor}
                onClick={handleTalkButtonClick}
              >
                <Icon icon="comments" />
                {messageUserLabel}
              </Button>
            )}
          </div>
        </div>
      ) : null}
      {passwordInputModalShown && (
        <PasswordInputModal
          onHide={() => setPasswordInputModalShown(false)}
          onConfirm={() => {
            setVerificationEmailSent(false);
            onSetUserInfoOnEdit(true);
          }}
        />
      )}
    </div>
  );

  async function handleTalkButtonClick() {
    const { pathId } = await loadDMChannel({
      recipient: { id: userId, username }
    });
    if (!pathId) {
      if (!userId) {
        return reportError({
          componentPath: 'Profile/Body/Home/Intro/BasicInfos/index',
          message: `handleTalkButtonClick: recipient userId is null. recipient: ${JSON.stringify(
            {
              userId,
              username
            }
          )}`
        });
      }
      onOpenNewChatTab({
        user: {
          username: myUsername,
          id: myId,
          profilePicUrl
        },
        recipient: {
          username: username,
          id: userId,
          profilePicUrl: profilePicUrl
        }
      });
    }
    setTimeout(() => navigate(pathId ? `/chat/${pathId}` : `/chat/new`), 0);
  }

  function goToEmail() {
    const emailProvider = 'https://www.' + email.split('@')[1];
    window.location.href = emailProvider;
  }

  async function onEditedInfoSubmit({
    email,
    website,
    youtubeName,
    youtubeUrl
  }: {
    email: string;
    website: string;
    youtubeName: string;
    youtubeUrl: string;
  }) {
    if (banned?.posting) {
      return;
    }
    const data = await uploadProfileInfo({
      email,
      website,
      youtubeName,
      youtubeUrl
    });
    onSetUserState({ userId, newState: data });
    onSetUserInfoOnEdit(false);
  }

  function onVerifyEmail() {
    sendVerificationEmail({ email, userId });
    setEmailCheckHighlighted(false);
    setVerificationEmailSent(true);
  }

  function renderEditMessage({
    email,
    youtubeUrl,
    website
  }: {
    email: string;
    youtubeUrl: string;
    website: string;
  }) {
    const unfilledItems = [
      { label: localize('email'), value: email },
      { label: localize('youtube'), value: youtubeUrl },
      { label: localize('website'), value: website }
    ].filter((item) => !item.value);
    const emptyItemsArray = unfilledItems.map((item) => item.label);
    if (SELECTED_LANGUAGE === 'kr') {
      const emptyItemsString =
        emptyItemsArray.length === 3
          ? `${emptyItemsArray[0]}, ${emptyItemsArray[1]}, ${emptyItemsArray[2]}`
          : emptyItemsArray.join(', ');
      return `아래 '수정' 버튼을 누르신 후 다음 정보를 등록하세요: ${emptyItemsString}`;
    }
    const emptyItemsString =
      emptyItemsArray.length === 3
        ? `${emptyItemsArray[0]}, ${emptyItemsArray[1]}, and ${emptyItemsArray[2]}`
        : emptyItemsArray.join(' and ');
    return `Add your ${emptyItemsString} address${
      emptyItemsArray.length > 1 ? 'es' : ''
    } by tapping the "Edit" button below`;
  }
}
