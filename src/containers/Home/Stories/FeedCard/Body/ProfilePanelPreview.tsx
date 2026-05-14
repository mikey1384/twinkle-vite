import React from 'react';
import Loading from '~/components/Loading';
import ProfilePic from '~/components/ProfilePic';
import RichText from '~/components/Texts/RichText';
import UserTitle from '~/components/Texts/UserTitle';
import StatusMsg from '~/components/UserDetails/StatusMsg';
import { CompactProfileRankStrip } from './PreviewPrimitives';

export default function ProfilePanelPreview({
  profile,
  theme
}: {
  profile: any;
  theme?: string;
}) {
  if (!profile?.id || profile?.notFound) {
    return (
      <div className="home-feed-card__mini-profile-loading">
        <Loading theme={theme} />
      </div>
    );
  }

  const username = profile?.username || 'Profile';
  const realName = profile?.realName || '';
  const statusColor = profile?.statusColor || profile?.profileTheme || 'logoBlue';
  const bioRows = [
    { section: 'bio1', text: profile?.profileFirstRow },
    { section: 'bio2', text: profile?.profileSecondRow },
    { section: 'bio3', text: profile?.profileThirdRow }
  ].filter((row) => Boolean(row.text));

  return (
    <div className="home-feed-card__mini-profile-panel">
      <div className="home-feed-card__mini-profile-header">
        <div className="home-feed-card__mini-profile-avatar-wrap">
          <ProfilePic
            className="home-feed-card__mini-profile-avatar"
            size="10rem"
            userId={profile.id}
            profilePicUrl={profile.profilePicUrl || ''}
            online={profile.online}
            statusShown
          />
        </div>
        <div className="home-feed-card__mini-profile-details">
          <h4>{username}</h4>
          <div className="home-feed-card__mini-profile-title-row">
            <UserTitle
              user={profile}
              className="home-feed-card__mini-profile-title"
            />
            {realName ? (
              <span className="home-feed-card__mini-profile-real-name">
                {realName}
              </span>
            ) : null}
          </div>
          {profile?.statusMsg ? (
            <StatusMsg
              statusColor={statusColor}
              statusMsg={profile.statusMsg}
              userId={profile.id}
              style={{
                marginTop: '0.35rem',
                padding: '0.52rem 0.68rem',
                fontSize: '1.12rem',
                lineHeight: 1.25,
                maxHeight: '4.45rem',
                overflow: 'hidden',
                boxShadow: 'none'
              }}
            />
          ) : null}
        </div>
        <div className="home-feed-card__mini-profile-bio-panel">
          {bioRows.length > 0 ? (
            <div className="home-feed-card__mini-profile-bio">
              {bioRows.slice(0, 2).map((row) => (
                <div key={row.section}>
                  <span className="home-feed-card__mini-profile-bio-dot">
                    •
                  </span>
                  <RichText
                    contentId={profile.id}
                    contentType="user"
                    isPreview
                    isProfileComponent
                    maxLines={2}
                    section={row.section}
                    style={{
                      fontSize: 'inherit',
                      lineHeight: 1.28,
                      minHeight: '1.28em'
                    }}
                    theme={theme}
                  >
                    {row.text}
                  </RichText>
                </div>
              ))}
            </div>
          ) : (
            <p className="home-feed-card__mini-profile-empty-bio">
              {username} does not have a bio, yet
            </p>
          )}
        </div>
      </div>
      <CompactProfileRankStrip profile={profile} />
    </div>
  );
}
