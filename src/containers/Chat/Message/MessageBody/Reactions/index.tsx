import React, { useMemo } from 'react';
import type { ChatReaction } from '~/types/chat';
import Reaction from './Reaction';
import type { PendingReactionMutations } from './types';

export default function Reactions({
  reactions,
  pendingReactionMutations,
  onRemoveReaction,
  onAddReaction,
  reactionsMenuShown,
  theme
}: {
  reactions?: ChatReaction[];
  pendingReactionMutations: PendingReactionMutations;
  onRemoveReaction: (reaction: string) => void;
  onAddReaction: (reaction: string) => void;
  reactionsMenuShown: boolean;
  theme: string;
}) {
  const reactionList = useMemo(() => {
    const result: string[] = [];
    for (const reaction of reactions || []) {
      if (!result.includes(reaction.type)) {
        result.push(reaction.type);
      }
    }
    for (const [reaction, mutation] of Object.entries(
      pendingReactionMutations
    )) {
      if (mutation === 'add' && !result.includes(reaction)) {
        result.push(reaction);
      }
    }
    return result;
  }, [pendingReactionMutations, reactions]);
  const reactionObj = useMemo(() => {
    const result = new Map<string, ChatReaction[]>();
    for (const reaction of reactions || []) {
      if (!result.has(reaction.type)) {
        result.set(reaction.type, [reaction]);
        continue;
      }
      result.get(reaction.type)!.push(reaction);
    }
    return result;
  }, [reactions]);

  if (!reactionList.length) return null;

  return (
    <div
      aria-label="Message reactions"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        rowGap: '0.5rem',
        marginTop: '0.7rem'
      }}
    >
      {reactionList.map((reaction) => (
        <Reaction
          key={reaction}
          pendingMutation={
            Object.prototype.hasOwnProperty.call(pendingReactionMutations, reaction)
              ? pendingReactionMutations[reaction]
              : undefined
          }
          reaction={reaction}
          reactionCount={reactionObj.get(reaction)?.length || 0}
          reactedUserIds={(reactionObj.get(reaction) || []).map(
            ({ userId }) => userId
          )}
          onRemoveReaction={() => onRemoveReaction(reaction)}
          onAddReaction={() => onAddReaction(reaction)}
          reactionsMenuShown={reactionsMenuShown}
          theme={theme}
        />
      ))}
    </div>
  );
}
