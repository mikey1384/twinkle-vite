import React, { useState } from 'react';
import Icon from '~/components/Icon';
import {
  composeMakeIdea,
  makeTitleFor,
  type MakeChoiceOption,
  type MakeChoiceQuestion
} from './rules';
import {
  choiceChipClass,
  choiceGridClass,
  freeBadgeClass,
  ghostButtonClass,
  mutedTextClass,
  ownInputClass,
  primaryButtonClass,
  questionClass
} from './styles';

// "What do you want to make?" (Mikey 11-25): App / Website / Game / Type your
// own, then a follow-up for the pick, always with room for their own words.
// Nothing is built until they press Build it, and never something random.
// Used by the tour's Lumine stop and by the welcome card's Show me!.
export default function MakeChoice({
  tree,
  free,
  working,
  error,
  onDone,
  onCancel
}: {
  tree: MakeChoiceQuestion;
  // Twinkle pays for the first run ("This one's on us"); false says plainly
  // that it uses their own AI Energy
  free: boolean;
  working?: boolean;
  error?: string;
  onDone: (result: { idea: string; title: string }) => void;
  onCancel?: () => void;
}) {
  const [path, setPath] = useState<MakeChoiceOption[]>([]);
  const [typingOwn, setTypingOwn] = useState(false);
  const [own, setOwn] = useState('');
  const [extra, setExtra] = useState('');
  const question = path.length ? path[path.length - 1].next : tree;
  // a leaf: their choice is complete; they can add details and build
  const ready = !question || (typingOwn && own.trim().length >= 3);
  const ideas = path.map((option) => option.idea);
  const labels = path.map((option) => option.label);
  return (
    <div>
      {!ready || typingOwn ? (
        question ? (
          <>
            <p className={questionClass}>{question.question}</p>
            {!typingOwn ? (
              <div className={choiceGridClass}>
                {question.options.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    className={choiceChipClass}
                    // a teacher's class ideas stand out; nothing is preselected
                    data-highlight={/class|lesson/i.test(option.label) ? 'true' : undefined}
                    onClick={() => setPath((current) => [...current, option])}
                  >
                    {option.label}
                  </button>
                ))}
                <button
                  type="button"
                  className={choiceChipClass}
                  onClick={() => setTypingOwn(true)}
                >
                  <Icon icon="pencil-alt" /> Type your own…
                </button>
              </div>
            ) : (
              <input
                className={ownInputClass}
                autoFocus
                maxLength={200}
                placeholder={question.ownHint}
                value={own}
                onChange={(event) => setOwn(event.target.value)}
              />
            )}
          </>
        ) : null
      ) : (
        <>
          <p className={questionClass}>
            {labels.join(' · ')}
          </p>
          <input
            className={ownInputClass}
            maxLength={200}
            placeholder="Anything else Lumine should know? (optional)"
            value={extra}
            onChange={(event) => setExtra(event.target.value)}
          />
        </>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        {path.length > 0 || typingOwn ? (
          <button
            type="button"
            className={ghostButtonClass}
            onClick={() => {
              if (typingOwn) {
                setTypingOwn(false);
                setOwn('');
              } else {
                setPath((current) => current.slice(0, -1));
              }
            }}
          >
            <Icon icon="chevron-left" /> Back
          </button>
        ) : onCancel ? (
          <button type="button" className={ghostButtonClass} onClick={onCancel}>
            Not now
          </button>
        ) : null}
        <span style={{ flex: 1 }} />
        {free ? <span className={freeBadgeClass}><Icon icon="gift" /> This one’s on us</span> : null}
        <button
          type="button"
          className={primaryButtonClass}
          disabled={!ready || working}
          onClick={() =>
            onDone({
              idea: composeMakeIdea({ ideas, own, extra }),
              title: makeTitleFor({ labels, own })
            })
          }
        >
          <Icon icon="wand-magic-sparkles" /> {working ? 'Starting…' : 'Build it'}
        </button>
      </div>
      {!free ? (
        <p className={mutedTextClass}>This build uses your own AI Energy.</p>
      ) : null}
      {error ? <p className={mutedTextClass} role="alert">{error}</p> : null}
    </div>
  );
}
