import React, { useEffect, useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Textarea from '~/components/Texts/Textarea';
import { useAppContext } from '~/contexts';
import { exceedsCharLimit, addEmoji } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import Icon from '~/components/Icon'; // Import Icon component

export default function AIChatMenu({ topicText }: { topicText: string }) {
  const getCustomInstructionsForTopic = useAppContext(
    (v) => v.requestHelpers.getCustomInstructionsForTopic
  );
  const [isCustomInstructionsOn, setIsCustomInstructionsOn] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [loading, setLoading] = useState(true); // Add loading state

  const commentExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'comment',
        text: customInstructions
      }),
    [customInstructions]
  );

  useEffect(() => {
    init();
    async function init() {
      const customInstructions = await getCustomInstructionsForTopic(topicText);
      setCustomInstructions(customInstructions);
      setLoading(false); // Set loading to false after instructions are loaded
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary componentPath="Chat/Modals/TopicSettingsModal/AIChatMenu">
      <div
        className={css`
          margin-top: 0.5rem;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        `}
      >
        <SwitchButton
          checked={isCustomInstructionsOn}
          onChange={() =>
            setIsCustomInstructionsOn(
              (isCustomInstructionsOn) => !isCustomInstructionsOn
            )
          }
          labelStyle={{
            fontWeight: 'bold',
            fontSize: '1.3rem',
            color: '#333'
          }}
          label="Custom Instructions"
        />
        {loading && (
          <div style={{ marginTop: '1rem' }}>
            <Icon style={{ marginRight: '0.5rem' }} icon="spinner" pulse />
            <span>Loading instructions...</span>
          </div>
        )}
        {!loading && isCustomInstructionsOn && (
          <div style={{ width: '100%' }}>
            <Textarea
              placeholder="Enter instructions..."
              style={{
                width: '100%',
                marginTop: '1rem',
                position: 'relative'
              }}
              hasError={!!commentExceedsCharLimit}
              minRows={3}
              value={customInstructions}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                setCustomInstructions(event.target.value)
              }
              onKeyUp={handleKeyUp}
            />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  function handleKeyUp(event: { key: string; target: { value: string } }) {
    if (event.key === ' ') {
      setCustomInstructions(addEmoji(event.target.value));
    }
  }
}