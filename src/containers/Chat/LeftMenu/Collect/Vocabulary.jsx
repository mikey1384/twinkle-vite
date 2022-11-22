import { useMemo } from 'react';
import Icon from '~/components/Icon';
import localize from '~/constants/localize';
import { useChatContext, useKeyContext } from '~/contexts';
import { returnWordLevel, wordLevelHash } from '~/constants/defaultValues';
import { addCommasToNumber } from '~/helpers/stringHelpers';

const vocabularyLabel = localize('vocabulary');
const youLabel = localize('You');

export default function Vocabulary() {
  const { userId: myId } = useKeyContext((v) => v.myState);
  const wordsObj = useChatContext((v) => v.state.wordsObj);
  const vocabActivities = useChatContext((v) => v.state.vocabActivities);

  const lastActivity = useMemo(() => {
    return wordsObj[vocabActivities[vocabActivities.length - 1]];
  }, [vocabActivities, wordsObj]);

  const lastRewardedXp = useMemo(
    () =>
      addCommasToNumber(
        wordLevelHash[
          returnWordLevel({
            frequency: lastActivity?.frequency,
            word: lastActivity?.content
          })
        ].rewardAmount
      ),
    [lastActivity?.content, lastActivity?.frequency]
  );

  return (
    <div style={{ height: '5rem', position: 'relative' }}>
      <div style={{ fontSize: '1.7rem' }}>
        <Icon icon="book" />
        <span style={{ fontWeight: 'bold', marginLeft: '0.7rem' }}>
          {vocabularyLabel}
        </span>
      </div>
      {lastActivity && (
        <div style={{ position: 'absolute' }}>
          <p
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '100%'
            }}
          >
            {lastActivity.userId === myId ? youLabel : lastActivity.username}:{' '}
            <b>
              {lastActivity.content} (+{lastRewardedXp} XP)
            </b>
          </p>
        </div>
      )}
    </div>
  );
}
