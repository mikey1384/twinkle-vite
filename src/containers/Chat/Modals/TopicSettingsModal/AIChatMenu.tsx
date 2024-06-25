import React, { useEffect, useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Textarea from '~/components/Texts/Textarea';
import { useAppContext } from '~/contexts';
import { exceedsCharLimit, addEmoji } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import Icon from '~/components/Icon';

export default function AIChatMenu({
  customInstructions,
  isCustomInstructionsOn,
  topicText,
  onSetCustomInstructions,
  onSetIsCustomInstructionsOn
}: {
  customInstructions: string;
  isCustomInstructionsOn: boolean;
  topicText: string;
  onSetCustomInstructions: (customInstructions: string) => void;
  onSetIsCustomInstructionsOn: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const getCustomInstructionsForTopic = useAppContext(
    (v) => v.requestHelpers.getCustomInstructionsForTopic
  );
  const [loading, setLoading] = useState(true);

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
      onSetCustomInstructions(customInstructions);
      setLoading(false);
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
            onSetIsCustomInstructionsOn(
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
        {loading && isCustomInstructionsOn && (
          <div style={{ marginTop: '1rem', color: Color.darkGray() }}>
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
                onSetCustomInstructions(event.target.value)
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
      onSetCustomInstructions(addEmoji(event.target.value));
    }
  }
}
