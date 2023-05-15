import React, { useMemo } from 'react';
import UserDetails from '~/components/UserDetails';
import ProfilePic from '~/components/ProfilePic';
import { useNavigate } from 'react-router-dom';
import { useChatContext } from '~/contexts';
import { borderRadius, Color, mobileMaxWidth } from '~/constants/css';
import { css } from '@emotion/css';

export default function DefaultComponent({
  src,
  pageType,
  subPageType,
  profile
}: {
  src: string;
  pageType?: string;
  subPageType?: string;
  profile: {
    id: number;
    username: string;
    profilePicUrl: string;
  };
  profileId: number;
}) {
  const navigate = useNavigate();
  const chatStatus = useChatContext((v) => v.state.chatStatus);
  const heading = useMemo(() => {
    switch (pageType) {
      case 'watched':
        return 'Watched';
      case 'likes':
        return 'Likes';
      case 'all':
        if (subPageType === 'byuser') {
          return `All Posts made by ${profile.username}`;
        }
        return 'Posts (All)';
      case 'comments':
        return 'Comments';
      case 'subjects':
        if (subPageType === 'byuser') {
          return `All Subjects made by ${profile.username}`;
        }
        return 'Subjects';
      case 'ai-stories':
        return 'AI Stories';
      case 'videos':
        if (subPageType === 'byuser') {
          return `All Videos made by ${profile.username}`;
        }
        return 'Videos';
      case 'links':
        if (subPageType === 'byuser') {
          return `All Links made by ${profile.username}`;
        }
        return 'Links';
      default:
        return '';
    }
  }, [pageType, profile?.username, subPageType]);

  return (
    <div
      onClick={() => navigate(src)}
      style={{
        padding: '1rem',
        border: `1px solid ${Color.borderGray()}`,
        borderRadius
      }}
      className={`${css`
        .label {
          font-size: 2rem;
          color: ${Color.black()};
        }
        background: #fff;
        padding: 1rem;
        transition: background 0.5s;
        border: 1px solid ${Color.borderGray()};
        border-radius: ${borderRadius};
        cursor: pointer;
        &:hover {
          background: ${Color.highlightGray()};
        }
        @media (max-width: ${mobileMaxWidth}) {
          .label {
            font-size: 1.7rem;
          }
        }
      `}`}
    >
      {heading ? (
        <div
          className={`label ${css`
            font-weight: bold;
            margin-bottom: 0.5rem;
            overflow-wrap: break-word;
            word-break: break-word;
          `}`}
          style={{ marginBottom: '1.5rem' }}
        >
          {heading}
        </div>
      ) : null}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%'
        }}
      >
        <div
          className={css`
            width: 18rem;
            @media (max-width: ${mobileMaxWidth}) {
              width: 13rem;
            }
          `}
        >
          <ProfilePic
            userId={profile.id}
            profilePicUrl={profile.profilePicUrl || ''}
            online={chatStatus[profile.id]?.isOnline}
            statusShown
            large
          />
        </div>
        <div style={{ marginLeft: '3rem', flexGrow: 1 }}>
          <UserDetails
            noLink
            small
            unEditable
            profile={profile}
            userId={profile.id}
          />
        </div>
      </div>
    </div>
  );
}
