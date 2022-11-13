import { useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { useChatContext, useKeyContext } from '~/contexts';
import { returnWordLevel, wordLevelHash } from '~/constants/defaultValues';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import localize from '~/constants/localize';
import ErrorBoundary from '~/components/ErrorBoundary';

const vocabularyLabel = localize('vocabulary');
const youLabel = localize('You');

Collect.propTypes = {
  selected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

function Collect({ selected, onClick }) {
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
    <ErrorBoundary componentPath="Chat/LeftMenu/Vocabulary">
      <div
        style={{
          cursor: 'pointer',
          padding: '1rem',
          borderBottom: `1px solid ${Color.borderGray()}`,
          background: selected && Color.highlightGray()
        }}
        className={`unselectable ${css`
          &:hover {
            background: ${Color.checkboxAreaGray()};
          }
        `}`}
        onClick={onClick}
      >
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
                {lastActivity.userId === myId
                  ? youLabel
                  : lastActivity.username}
                :{' '}
                <b>
                  {lastActivity.content} (+{lastRewardedXp} XP)
                </b>
              </p>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default memo(Collect);
