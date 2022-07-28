import { useMemo } from 'react';
import PropTypes from 'prop-types';
import Reaction from './Reaction';

Reactions.propTypes = {
  reactions: PropTypes.array,
  onRemoveReaction: PropTypes.func,
  onAddReaction: PropTypes.func,
  reactionsMenuShown: PropTypes.bool,
  theme: PropTypes.string
};

export default function Reactions({
  reactions,
  onRemoveReaction,
  onAddReaction,
  reactionsMenuShown,
  theme
}) {
  const reactionList = useMemo(() => {
    const result = [];
    if (!reactions) return result;
    for (const reaction of reactions) {
      if (!result.includes(reaction.type)) {
        result.push(reaction.type);
      }
    }
    return result;
  }, [reactions]);
  const reactionObj = useMemo(() => {
    const result = {};
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
          reactedUserIds={reactionObj[reaction].map(({ userId }) => userId)}
          onRemoveReaction={() => onRemoveReaction(reaction)}
          onAddReaction={() => onAddReaction(reaction)}
          reactionsMenuShown={reactionsMenuShown}
          theme={theme}
        />
      ))}
    </div>
  );
}
