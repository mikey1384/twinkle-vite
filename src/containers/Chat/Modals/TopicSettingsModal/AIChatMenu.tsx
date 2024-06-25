import React, { useEffect, useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Textarea from '~/components/Texts/Textarea';
import { useAppContext, useKeyContext } from '~/contexts';
import { exceedsCharLimit, addEmoji } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import Button from '~/components/Button';

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
  const { profileTheme } = useKeyContext((v) => v.myState);
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
      setLoading(true);
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
        {isCustomInstructionsOn && (
          <Button
            onClick={handleLoadCustomInstructions}
            color={profileTheme}
            filled
            disabled={loading}
            style={{
              marginTop: '2rem',
              fontSize: '1rem',
              padding: '1rem'
            }}
          >
            {loading ? (
              <>
                <Icon style={{ marginRight: '0.5rem' }} icon="spinner" pulse />
                Generating...
              </>
            ) : (
              <>
                <Icon style={{ marginRight: '0.5rem' }} icon="refresh" />
                Generate
              </>
            )}
          </Button>
        )}
        {!loading && isCustomInstructionsOn && (
          <div style={{ width: '100%', marginTop: '2rem' }}>
            <Textarea
              placeholder="Enter instructions..."
              style={{
                width: '100%',
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

  async function handleLoadCustomInstructions() {
    setLoading(true);
    const customInstructions = await getCustomInstructionsForTopic(topicText);
    onSetCustomInstructions(customInstructions);
    setLoading(false);
  }

  function handleKeyUp(event: { key: string; target: { value: string } }) {
    if (event.key === ' ') {
      onSetCustomInstructions(addEmoji(event.target.value));
    }
  }
}
