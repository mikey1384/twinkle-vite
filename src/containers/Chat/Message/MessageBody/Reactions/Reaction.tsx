import React, {
  memo,
  useContext,
  useEffect,
  useId,
  useRef,
  useState
} from 'react';
import Tooltip from './Tooltip';
import PeopleModal from './PeopleModal';
import useReactionPeople from './useReactionPeople';
import LocalContext from '../../../Context';
import { useAppContext, useKeyContext } from '~/contexts';
import ChatReactionEmoji from '~/components/ChatReactionEmoji';
import { getChatReaction } from '~/constants/chatReactions';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { isMobile } from '~/helpers';
import { useOutsideClick } from '~/helpers/hooks';
import { useRoleColor } from '~/theme/hooks/useRoleColor';
import Icon from '~/components/Icon';
import type { PendingReactionMutation } from './types';

const deviceIsMobile = isMobile(navigator);

function Reaction({
  reaction,
  reactionCount,
  reactedUserIds,
  pendingMutation,
  onRemoveReaction,
  onAddReaction,
  theme
}: {
  reaction: string;
  reactionCount: number;
  reactedUserIds: number[];
  pendingMutation?: PendingReactionMutation;
  onRemoveReaction: () => void;
  onAddReaction: () => void;
  reactionsMenuShown: boolean;
  theme: string;
}) {
  const {
    actions: { onSetUserState },
    state: { userObj }
  } = useContext(LocalContext);
  const loadProfile = useAppContext((v) => v.requestHelpers.loadProfile);
  const ReactionRef = useRef<HTMLDivElement>(null);
  const tooltipId = useId();
  const [tooltipContext, setTooltipContext] = useState<DOMRect | null>(null);
  const [userListModalShown, setUserListModalShown] = useState(false);
  const userId = useKeyContext((v) => v.myState.userId);
  const username = useKeyContext((v) => v.myState.username);
  const profilePicUrl = useKeyContext((v) => v.myState.profilePicUrl);
  useOutsideClick(ReactionRef, () => setTooltipContext(null), {
    enabled: Boolean(tooltipContext),
    closeOnScroll: true
  });
  useEffect(() => {
    if (!tooltipContext) return;
    const dismiss = () => setTooltipContext(null);
    window.addEventListener('resize', dismiss);
    return () => window.removeEventListener('resize', dismiss);
  }, [tooltipContext]);
  const {
    color: reactionButtonColor,
    getColor: getReactionButtonColor,
    token: reactionButtonToken
  } = useRoleColor('reactionButton', {
    themeName: theme,
    fallback: 'logoBlue'
  });
  const reactionButtonOpacity = reactionButtonToken?.opacity ?? 0.2;
  const isPending = Boolean(pendingMutation);
  const reactionLabel = getChatReaction(reaction)?.label.toLowerCase() || reaction;
  const userReacted = reactedUserIds.includes(userId);
  const { people, loading, failed, retry } = useReactionPeople({
    userIds: reactedUserIds,
    viewer: { id: userId, username, profilePicUrl },
    userObj,
    loadProfile,
    onSetUserState,
    mode: userListModalShown ? 'all' : tooltipContext ? 'preview' : 'closed'
  });

  return (
    <div
      ref={ReactionRef}
      onMouseEnter={() => { if (!deviceIsMobile) showTooltip(); }}
      onMouseLeave={() => setTooltipContext(null)}
      onFocusCapture={() => { if (!userListModalShown) showTooltip(); }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setTooltipContext(null);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && tooltipContext) {
          event.preventDefault();
          event.stopPropagation();
          setTooltipContext(null);
        }
      }}
      className={css`
        display: inline-flex;
        > button {
          min-height: 32px;
          min-width: 36px;
        }
        @media (max-width: 1024px), (pointer: coarse) {
          > button {
            min-height: 44px;
            min-width: 44px;
          }
        }
        > button:hover:not(:disabled) { box-shadow: inset 0 0 0 999px rgba(15, 23, 42, 0.05); }
        > button:focus-visible {
          outline: 2px solid #334155;
          outline-offset: 2px;
        }
      `}
      style={{
        borderRadius: 999,
        border: `1px solid ${
          userReacted ? reactionButtonColor : Color.borderGray()
        }`,
        background: Color.targetGray(),
        marginRight: '0.5rem',
        zIndex: 5000
      }}
    >
      <button
        type="button"
        aria-busy={isPending}
        aria-pressed={userReacted}
        aria-describedby={tooltipContext ? tooltipId : undefined}
        aria-label={
          isPending
            ? `${pendingMutation === 'add' ? 'Adding' : 'Removing'} ${reactionLabel} reaction`
            : `${userReacted ? 'Remove' : 'Add'} ${reactionLabel} reaction`
        }
        disabled={isPending}
        style={{
          appearance: 'none',
          background: userReacted
            ? getReactionButtonColor(reactionButtonOpacity)
            : 'transparent',
          borderRadius: '999px 0 0 999px',
          border: 0,
          boxSizing: 'border-box',
          color: Color.darkGray(),
          cursor: isPending ? 'wait' : 'pointer',
          fontFamily: 'inherit',
          padding: '3px 6px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
        onClick={(event) => { event.stopPropagation(); handleClick(); }}
      >
        <ChatReactionEmoji reaction={reaction} size={22} />
        {isPending ? (
          <Icon
            icon="spinner"
            pulse
            style={{
              color: getReactionButtonColor(0.55),
              marginLeft: 4,
              fontSize: 13
            }}
          />
        ) : null}
      </button>
      <button
        type="button"
        aria-label={`See ${reactionCount} ${reactionCount === 1 ? 'person' : 'people'} who reacted with ${reactionLabel}`}
        aria-haspopup="dialog"
        aria-describedby={tooltipContext ? tooltipId : undefined}
        disabled={reactionCount === 0}
        style={{
          appearance: 'none', border: 0, borderLeft: `1px solid ${Color.borderGray()}`,
          borderRadius: '0 999px 999px 0', padding: '3px 8px', fontFamily: 'inherit',
          fontSize: 13, fontWeight: 600, color: '#334155', background: 'transparent',
          cursor: reactionCount ? 'pointer' : 'default'
        }}
        onClick={(event) => {
          event.stopPropagation();
          setTooltipContext(null);
          setUserListModalShown(true);
        }}
      >{reactionCount}</button>
      {tooltipContext && reactionCount > 0 && (
        <Tooltip
          id={tooltipId}
          parentContext={tooltipContext}
          total={reactionCount}
          displayedReactedUsers={people.slice(0, 2).map((person) => ({ ...person, username: person.id === userId ? 'You' : person.username }))}
          loading={loading}
        />
      )}
      {userListModalShown && (
        <PeopleModal
          reaction={reaction}
          people={people}
          loading={loading}
          failed={failed}
          onRetry={retry}
          onHide={() => setUserListModalShown(false)}
        />
      )}
    </div>
  );

  function showTooltip() {
    if (reactionCount && ReactionRef.current) {
      setTooltipContext(ReactionRef.current.getBoundingClientRect());
    }
  }

  function handleClick() {
    if (isPending) return;
    if (userReacted) {
      onRemoveReaction();
      return;
    }
    onAddReaction();
  }
}

export default memo(Reaction);
