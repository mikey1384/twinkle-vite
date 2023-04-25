import React, { useMemo } from 'react';
import Reaction from './Reaction';

export default function Reactions({
  reactions,
  onRemoveReaction,
  onAddReaction,
  reactionsMenuShown,
  theme
}: {
  reactions: any[];
  onRemoveReaction: (reaction: string) => void;
  onAddReaction: (reaction: string) => void;
  reactionsMenuShown: boolean;
  theme: string;
}) {
  const reactionList = useMemo(() => {
    const result: any[] = [];
    if (!reactions) return result;
    for (const reaction of reactions) {
      if (!result.includes(reaction.type)) {
        result.push(reaction.type);
      }
    }
    return result;
  }, [reactions]);
  const reactionObj = useMemo(() => {
    const result: Record<string, any> = {};
    if (!reactions) return result;
    for (const reaction of reactions) {
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
          reaction={reaction}
          reactionCount={reactionObj[reaction].length}
          reactedUserIds={reactionObj[reaction].map(
            ({ userId }: { userId: number }) => userId
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
