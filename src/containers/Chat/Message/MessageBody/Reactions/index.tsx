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
    const result: Record<string, ChatReaction[]> = {};
    for (const reaction of reactions || []) {
      if (!result[reaction.type]) {
        result[reaction.type] = [reaction];
        continue;
      }
      result[reaction.type].push(reaction);
    }
    return result;
  }, [reactions]);

  return (
    <div style={{ display: 'flex' }}>
      {reactionList.map((reaction) => (
        <Reaction
          key={reaction}
          pendingMutation={pendingReactionMutations[reaction]}
          reaction={reaction}
          reactionCount={reactionObj[reaction]?.length || 0}
          reactedUserIds={(reactionObj[reaction] || []).map(
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
