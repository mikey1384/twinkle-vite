import React, { useEffect, useMemo, useState } from 'react';
import ErrorBoundary from '~/components/ErrorBoundary';
import SwitchButton from '~/components/Buttons/SwitchButton';
import Textarea from '~/components/Texts/Textarea';
import ConfirmModal from '~/components/Modals/ConfirmModal';
import Icon from '~/components/Icon';
import Button from '~/components/Button';
import { useAppContext } from '~/contexts';
import { exceedsCharLimit, addEmoji } from '~/helpers/stringHelpers';
import { css } from '@emotion/css';

export default function AIChatMenu({
  newCustomInstructions,
  customInstructions,
  isCustomInstructionsOn,
  topicText,
  onSetCustomInstructions,
  onSetIsCustomInstructionsOn,
  onDeleteTopic
}: {
  newCustomInstructions: string;
  customInstructions: string;
  isCustomInstructionsOn: boolean;
  topicText: string;
  onSetCustomInstructions: (customInstructions: string) => void;
  onSetIsCustomInstructionsOn: React.Dispatch<React.SetStateAction<boolean>>;
  onDeleteTopic: () => void;
}) {
  const getCustomInstructionsForTopic = useAppContext(
    (v) => v.requestHelpers.getCustomInstructionsForTopic
  );
  const improveCustomInstructions = useAppContext(
    (v) => v.requestHelpers.improveCustomInstructions
  );
  const [confirmModalShown, setConfirmModalShown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [improving, setImproving] = useState(false);

  const commentExceedsCharLimit = useMemo(
    () =>
      exceedsCharLimit({
        contentType: 'comment',
        text: newCustomInstructions
      }),
    [newCustomInstructions]
  );

  useEffect(() => {
    init();
    async function init() {
      if (!customInstructions) {
        setLoading(true);
        try {
          const generatedCustomInstructions =
            await getCustomInstructionsForTopic(topicText);
          onSetCustomInstructions(generatedCustomInstructions);
        } catch (error) {
          console.error('Failed to load custom instructions:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customInstructions]);

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
          <div
            className={css`
              display: flex;
              margin-top: 2rem;
            `}
          >
            <Button
              onClick={handleLoadCustomInstructions}
              color="darkBlue"
              filled
              disabled={loading || improving}
              style={{
                fontSize: '1rem',
                padding: '1rem',
                marginRight: '1rem'
              }}
            >
              {loading ? (
                <>
                  <Icon
                    style={{ marginRight: '0.5rem' }}
                    icon="spinner"
                    pulse
                  />
                  Generating...
                </>
              ) : (
                <>
                  <Icon style={{ marginRight: '0.5rem' }} icon="redo" />
                  Generate
                </>
              )}
            </Button>
            {newCustomInstructions && (
              <Button
                onClick={handleImproveCustomInstructions}
                color="magenta"
                filled
                disabled={loading || improving}
                style={{
                  fontSize: '1rem',
                  padding: '1rem'
                }}
              >
                {improving ? (
                  <>
                    <Icon
                      style={{ marginRight: '0.5rem' }}
                      icon="spinner"
                      pulse
                    />
                    Improving...
                  </>
                ) : (
                  <>
                    <Icon
                      style={{ marginRight: '0.5rem' }}
                      icon="wand-magic-sparkles"
                    />
                    Improve
                  </>
                )}
              </Button>
            )}
          </div>
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
              value={newCustomInstructions}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                onSetCustomInstructions(event.target.value)
              }
              onKeyUp={handleKeyUp}
            />
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <Button
                onClick={() => setConfirmModalShown(true)}
                color="red"
                filled
                style={{
                  padding: '1rem',
                  marginTop: '1.5rem'
                }}
              >
                <Icon style={{ marginRight: '0.5rem' }} icon="trash" />
                Delete Topic
              </Button>
            </div>
          </div>
        )}
      </div>
      {confirmModalShown && (
        <ConfirmModal
          modalOverModal
          onHide={() => setConfirmModalShown(false)}
          title="Delete Topic"
          onConfirm={onDeleteTopic}
        />
      )}
    </ErrorBoundary>
  );

  async function handleLoadCustomInstructions() {
    setLoading(true);
    try {
      const generatedCustomInstructions = await getCustomInstructionsForTopic(
        topicText
      );
      onSetCustomInstructions(generatedCustomInstructions);
    } catch (error) {
      console.error('Failed to load custom instructions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleImproveCustomInstructions() {
    setImproving(true);
    try {
      const improvedCustomInstructions = await improveCustomInstructions({
        customInstructions: newCustomInstructions,
        topicText
      });
      onSetCustomInstructions(improvedCustomInstructions);
    } catch (error) {
      console.error('Failed to improve custom instructions:', error);
    } finally {
      setImproving(false);
    }
  }

  function handleKeyUp(event: { key: string; target: { value: string } }) {
    if (event.key === ' ') {
      onSetCustomInstructions(addEmoji(event.target.value));
    }
  }
}
