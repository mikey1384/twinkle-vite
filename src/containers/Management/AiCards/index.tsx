import React, { useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import InvalidPage from '~/components/InvalidPage';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';
import { ADMIN_USER_ID, cloudFrontURL } from '~/constants/defaultValues';
import { useAppContext, useKeyContext } from '~/contexts';

interface ManagedCard {
  id: number;
  word: string;
  prompt: string;
  imagePath: string;
  level: number;
  style: string;
  engine: string;
  isMystery: number;
  isBurned: number;
  ownerId: number;
  ownerUsername: string;
}

function resolveImageUrl(imagePath: string) {
  if (!imagePath) return '';
  if (imagePath.startsWith('data:') || imagePath.startsWith('http')) {
    return imagePath;
  }
  return `${cloudFrontURL}${imagePath}`;
}

export default function AiCards() {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadCard = useAppContext(
    (v) => v.requestHelpers.loadAICardForImageRegeneration
  );
  const regenerateImage = useAppContext(
    (v) => v.requestHelpers.regenerateAICardImage
  );

  const [cardIdInput, setCardIdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [card, setCard] = useState<ManagedCard | null>(null);
  const [promptDraft, setPromptDraft] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const isOwner = userId === ADMIN_USER_ID;
  const promptDirty = !!card && promptDraft.trim() !== (card.prompt || '').trim();

  if (!isOwner) {
    return (
      <InvalidPage
        title="For authorized admins only"
        text="This page is only available to the site owner"
      />
    );
  }

  return (
    <div className={containerClass}>
      <div className={headerClass}>
        <h1>AI Card Image</h1>
        <p>
          Silently re-render an existing card&apos;s image in place. It reuses
          the card&apos;s original engine, art style, and example sentence — you
          can also edit the sentence below before regenerating. This does not
          post a feed, send a notification, or move the card; it only swaps the
          image. New images are always generated safe-for-work (people stay
          fully clothed; words like &quot;shower&quot; render the setting, never
          a nude person).
        </p>
      </div>

      <div className={controlsClass}>
        <div className={fieldClass}>
          <label htmlFor="ai-card-image-id">Card ID</label>
          <input
            id="ai-card-image-id"
            value={cardIdInput}
            inputMode="numeric"
            placeholder="e.g. 12345"
            onChange={(event) =>
              setCardIdInput(event.target.value.replace(/[^0-9]/g, ''))
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleLoad();
            }}
          />
          <Button color="logoBlue" loading={loading} onClick={handleLoad}>
            Load
          </Button>
        </div>
      </div>

      {error && <div className={errorClass}>{error}</div>}
      {successMessage && <div className={successClass}>{successMessage}</div>}

      {card && (
        <div className={cardLayoutClass}>
          <div className={imageColumnClass}>
            <div className={imageFrameClass}>
              {card.imagePath ? (
                <img
                  src={resolveImageUrl(card.imagePath)}
                  alt={`Card ${card.id}`}
                />
              ) : (
                <div className={noImageClass}>
                  {regenerating ? 'Generating…' : 'No image yet'}
                </div>
              )}
            </div>
          </div>

          <div className={detailColumnClass}>
            <div className={metaRowClass}>
              <span className={metaItemClass}>
                <strong>Word:</strong> {card.word || '—'}
              </span>
              <span className={metaItemClass}>
                <strong>Owner:</strong>{' '}
                {card.ownerUsername || `#${card.ownerId}`}
              </span>
              <span className={metaItemClass}>
                <strong>Level:</strong> {card.level}
              </span>
              <span className={metaItemClass}>
                <strong>Style:</strong> {card.style || '—'}
              </span>
              <span className={metaItemClass}>
                <strong>Engine:</strong> {card.engine || '—'}
              </span>
              {Number(card.isBurned) === 1 && (
                <span className={`${metaItemClass} ${burnedTagClass}`}>
                  Burned
                </span>
              )}
            </div>

            <label className={promptLabelClass} htmlFor="ai-card-image-prompt">
              Example sentence (image prompt)
            </label>
            <textarea
              id="ai-card-image-prompt"
              className={promptInputClass}
              value={promptDraft}
              rows={5}
              onChange={(event) => setPromptDraft(event.target.value)}
            />
            <div className={promptHintRowClass}>
              {promptDirty ? (
                <span className={dirtyHintClass}>
                  Edited — the new sentence will be saved with the new image.
                </span>
              ) : (
                <span className={mutedHintClass}>
                  Using the card&apos;s original sentence.
                </span>
              )}
              {promptDirty && (
                <button
                  className={resetButtonClass}
                  onClick={() => setPromptDraft(card.prompt || '')}
                >
                  Reset
                </button>
              )}
            </div>

            <div className={actionsRowClass}>
              <Button
                color="green"
                loading={regenerating}
                disabled={!promptDraft.trim()}
                onClick={handleRegenerate}
              >
                <Icon icon="sync" />
                <span style={{ marginLeft: '0.5rem' }}>Regenerate image</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  async function handleLoad() {
    const parsed = Number(cardIdInput) || 0;
    if (!parsed) {
      setError('Enter a valid card ID');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const { card: loadedCard } = await loadCard(parsed);
      setCard(loadedCard);
      setPromptDraft(loadedCard?.prompt || '');
    } catch (loadError: any) {
      setCard(null);
      setError(
        loadError?.response?.data?.error ||
          loadError?.message ||
          'Failed to load card'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    if (!card || !promptDraft.trim()) return;
    setRegenerating(true);
    setError('');
    setSuccessMessage('');
    try {
      const result = await regenerateImage({
        cardId: card.id,
        prompt: promptDraft
      });
      setCard((prev) =>
        prev
          ? {
              ...prev,
              imagePath: result.imagePath || prev.imagePath,
              prompt: result.prompt ?? prev.prompt
            }
          : prev
      );
      setPromptDraft(result.prompt ?? promptDraft);
      setSuccessMessage(
        result.promptWasEdited
          ? 'New image generated and the edited sentence saved.'
          : 'New image generated.'
      );
    } catch (regenError: any) {
      setError(
        regenError?.response?.data?.error ||
          regenError?.message ||
          'Failed to regenerate image'
      );
    } finally {
      setRegenerating(false);
    }
  }
}

const containerClass = css`
  width: 100%;
  font-size: 1.1rem;
  padding-bottom: 5rem;
`;

const headerClass = css`
  h1 {
    font-size: 2rem;
    font-weight: bold;
    margin: 0 0 0.5rem;
  }
  p {
    font-size: 1.1rem;
    color: ${Color.darkerGray()};
    margin: 0;
    max-width: 70rem;
    line-height: 1.5;
  }
`;

const controlsClass = css`
  margin: 1.5rem 0;
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
  align-items: center;
`;

const fieldClass = css`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  label {
    font-size: 1.1rem;
    font-weight: bold;
  }
  input {
    width: 12rem;
    font-size: 1.1rem;
    padding: 0.5rem 0.8rem;
    border: 1px solid ${Color.borderGray()};
    border-radius: 5px;
  }
`;

const errorClass = css`
  color: ${Color.rose()};
  font-size: 1.1rem;
  margin: 1rem 0;
`;

const successClass = css`
  color: ${Color.green()};
  font-size: 1.1rem;
  margin: 1rem 0;
  font-weight: bold;
`;

const cardLayoutClass = css`
  margin-top: 1.5rem;
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  @media (max-width: ${mobileMaxWidth}) {
    flex-direction: column;
  }
`;

const imageColumnClass = css`
  flex-shrink: 0;
`;

const imageFrameClass = css`
  width: 28rem;
  max-width: 80vw;
  aspect-ratio: 1 / 1;
  border: 1px solid ${Color.borderGray()};
  border-radius: 10px;
  overflow: hidden;
  background: ${Color.highlightGray()};
  display: flex;
  align-items: center;
  justify-content: center;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const noImageClass = css`
  font-size: 1.2rem;
  color: ${Color.darkerGray()};
`;

const detailColumnClass = css`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
`;

const metaRowClass = css`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  margin-bottom: 1.2rem;
`;

const metaItemClass = css`
  font-size: 1.1rem;
  color: ${Color.darkerGray()};
  strong {
    color: ${Color.black()};
  }
`;

const burnedTagClass = css`
  color: ${Color.rose()};
  font-weight: bold;
`;

const promptLabelClass = css`
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const promptInputClass = css`
  width: 100%;
  font-size: 1.1rem;
  line-height: 1.5;
  padding: 0.8rem 1rem;
  border: 1px solid ${Color.borderGray()};
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
`;

const promptHintRowClass = css`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.6rem;
`;

const dirtyHintClass = css`
  font-size: 1.1rem;
  color: ${Color.orange()};
`;

const mutedHintClass = css`
  font-size: 1.1rem;
  color: ${Color.gray()};
`;

const resetButtonClass = css`
  font-size: 1.1rem;
  color: ${Color.logoBlue()};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
`;

const actionsRowClass = css`
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 1.5rem;
`;
