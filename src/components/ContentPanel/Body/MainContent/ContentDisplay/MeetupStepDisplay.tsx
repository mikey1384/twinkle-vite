import React from 'react';
import { css } from '@emotion/css';
import { Link } from 'react-router-dom';
import Icon from '~/components/Icon';
import CrewCover from '~/containers/BridgeBuilderQuest/CrewCover';
import { MemberAvatars } from '~/containers/BridgeBuilderQuest/DirectoryCard';
import { Color } from '~/constants/css';

// A Bridge Builder crew's step milestone, on its content page and above a
// comment about it. PUBLIC: the server only sends the crew name, usernames,
// avatars, branches and the step reached (never a date, area, activity,
// classroom, adult or video).
export default function MeetupStepDisplay({
  content,
  style
}: {
  content: any;
  style?: React.CSSProperties;
}) {
  const crew = content?.crew;
  if (!crew?.id) return null;
  const members = Array.isArray(content?.members) ? content.members : [];
  return (
    <div
      style={style}
      className={css`
        width: 100%;
        border-radius: 1.2rem;
        border: 1px solid var(--ui-border);
        background: #fff;
        overflow: hidden;
      `}
    >
      <CrewCover cover={crew.cover} height="9rem" rounded="0">
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '4rem',
            textShadow: '0 1px 3px rgba(0,0,0,0.35)'
          }}
        >
          <Icon icon={content?.stepKey === 'review' ? 'trophy' : 'star'} />
        </span>
      </CrewCover>
      <div style={{ padding: '1.4rem 1.6rem' }}>
        <h3 style={{ margin: 0, fontSize: '2rem', color: Color.black() }}>
          {content?.title}{' '}
          <span style={{ fontSize: '1.4rem', color: Color.darkGray() }}>
            (Step {content?.stepNumber} of 5)
          </span>
        </h3>
        {content?.line ? (
          <p style={{ margin: '0.4rem 0 0', fontSize: '1.5rem', color: Color.darkerGray() }}>
            {content.line}
          </p>
        ) : null}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.9rem',
            flexWrap: 'wrap',
            marginTop: '1rem',
            fontSize: '1.4rem'
          }}
        >
          <MemberAvatars
            size="2.8rem"
            members={members.map((member: any) => ({
              userId: member.id,
              username: member.username,
              profilePicUrl: member.profilePicUrl
            }))}
          />
          <span>
            <b>{crew.displayName}</b>
            {crew.branchesText ? ` · ${crew.branchesText}` : ''}
          </span>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '1.3rem' }}>
          <Link to={`/achievements/bridge-builder/crew/${crew.id}`}>
            See the crew
          </Link>
        </div>
      </div>
    </div>
  );
}
