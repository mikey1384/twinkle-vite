import { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import MemberListItem from './MemberListItem';
import { useChatContext } from '~/contexts';
import { Color } from '~/constants/css';
import ErrorBoundary from '~/components/ErrorBoundary';

Members.propTypes = {
  channelId: PropTypes.number,
  creatorId: PropTypes.number,
  members: PropTypes.array.isRequired,
  onlineMembers: PropTypes.object.isRequired
};

function Members({ channelId, creatorId, members, onlineMembers }) {
  const channelOnCallId = useChatContext((v) => v.state.channelOnCall.id);
  const membersOnCallObj = useChatContext((v) => v.state.channelOnCall.members);
  const membersOnCall = useMemo(
    () =>
      channelOnCallId === channelId
        ? members.filter((member) => !!membersOnCallObj[member.id])
        : [],
    [channelId, channelOnCallId, members, membersOnCallObj]
  );

  const membersNotOnCall = useMemo(
    () =>
      channelOnCallId === channelId
        ? members.filter((member) => !membersOnCallObj[member.id])
        : members,
    [channelId, channelOnCallId, members, membersOnCallObj]
  );

  const callIsOnGoing = useMemo(
    () => membersOnCall.length > 0,
    [membersOnCall.length]
  );

  return (
    <ErrorBoundary componentPath="Chat/RightMenu/ChatInfo/Members/index">
      <div style={{ width: '100%' }}>
        {callIsOnGoing && (
          <div
            style={{
              textAlign: 'center',
              width: '100%',
              fontWeight: 'bold',
              color: Color.darkerGray()
            }}
          >
            on call
          </div>
        )}
        {callIsOnGoing && (
          <div style={{ marginBottom: '2rem' }}>
            {membersOnCall.map((member) => (
              <MemberListItem
                key={`oncall-member-${member.id}`}
                creatorId={creatorId}
                onlineMembers={onlineMembers}
                member={member}
              />
            ))}
          </div>
        )}
        {callIsOnGoing && membersNotOnCall.length > 0 && (
          <div
            style={{
              textAlign: 'center',
              width: '100%',
              fontWeight: 'bold',
              color: Color.darkerGray()
            }}
          >
            others
          </div>
        )}
        {membersNotOnCall.map((member, index) => (
          <MemberListItem
            key={`member-${member.id}`}
            creatorId={creatorId}
            onlineMembers={onlineMembers}
            member={member}
            style={{
              paddingBottom: index === members.length - 1 ? '15rem' : '1rem'
            }}
          />
        ))}
      </div>
    </ErrorBoundary>
  );
}

export default memo(Members);
