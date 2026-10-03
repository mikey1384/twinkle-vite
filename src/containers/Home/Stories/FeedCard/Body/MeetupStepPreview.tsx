import React from 'react';
import Icon from '~/components/Icon';
import CrewCover from '~/containers/BridgeBuilderQuest/CrewCover';
import { MemberAvatars } from '~/containers/BridgeBuilderQuest/DirectoryCard';

// A Bridge Builder crew reached a step of the meetup quest (home feed card,
// recommended by default like the daily bonus card). PUBLIC: it only ever shows
// the crew name, usernames, avatars, branches and the step reached; the server
// never sends a date, area, activity, classroom, adult or video.
// Sized and styled like the achievement "pass" card.
export default function MeetupStepPreview({
  content,
  textClassName
}: {
  content: any;
  textClassName?: string;
}) {
  const crew = content?.crew;
  if (!crew?.id) return null;
  const members = Array.isArray(content?.members) ? content.members : [];
  return (
    <div className="home-feed-card__pass-preview home-feed-card__achievement-preview">
      <div
        className="home-feed-card__achievement-badge"
        style={{ width: '7.8rem', height: '7.8rem', flex: '0 0 7.8rem' }}
      >
        <div style={{ width: '100%' }}>
        <CrewCover cover={crew.cover} height="7.8rem" rounded="1.4rem">
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '3.2rem',
              textShadow: '0 1px 3px rgba(0,0,0,0.35)'
            }}
          >
            <Icon icon={content?.stepKey === 'review' ? 'trophy' : 'star'} />
          </span>
        </CrewCover>
        </div>
      </div>
      <div className="home-feed-card__achievement-copy">
        <h3 className={textClassName}>
          {content?.title}
          <span>
            (Step {content?.stepNumber} of 5)
          </span>
        </h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            flexWrap: 'wrap',
            marginTop: '0.4rem'
          }}
        >
          <MemberAvatars
            size="2.4rem"
            members={members.map((member: any) => ({
              userId: member.id,
              username: member.username,
              profilePicUrl: member.profilePicUrl
            }))}
          />
          <span style={{ fontSize: '1.3rem', opacity: 0.8 }}>
            <b>{crew.displayName}</b>
            {crew.branchesText ? ` · ${crew.branchesText}` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
