import React, { useEffect, useRef, useState } from 'react';
import { css, cx } from '@emotion/css';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import Loading from '~/components/Loading';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import MonsterSprite from '~/components/WordMonster/MonsterSprite';
import { badgeStyle } from '~/components/WordMasterBadges';
import { useAppContext, useChatContext } from '~/contexts';
import WordModal from '../WordModal';
import { LOOT_ICONS } from './art';
import { isBattleLocked, wordIdOf } from './index';

const PIXEL_FONT = "'Press Start 2P', monospace";

// Wordle words are Word Master words (Mikey 11-23): a Wordle answer opens the
// same battle popup a Word Master feed card opens, for the same per-member
// battle (beaten in one place is beaten everywhere). The server decides which
// word the answer is (its base word for ACIDS) and whether the member may see
// it yet (GET /chat/wordle/battle).
export interface WordleBattleResult {
  status: 'ok' | 'finish_first' | 'unavailable' | 'off';
  answer?: string;
  wordObj?: Record<string, any>;
  captured?: boolean | null;
}

// The popup behind a General Chat Wordle result. Not battled: the gate.
// Beaten: the definition. Past the day's battles: Capture / Just read it (the
// gate's own choices). Today's answer of someone else before the member has
// finished their own Wordle: "Finish today's Wordle first", with nothing
// about the word.
export function WordleWordPopup({
  messageId,
  onHide,
  onPlayWordle
}: {
  messageId: number;
  onHide: () => void;
  onPlayWordle?: () => void;
}) {
  const loadWordleBattle = useAppContext((v) => v.requestHelpers.loadWordleBattle);
  const onApplyServerWordObj = useChatContext((v) => v.actions.onApplyServerWordObj);
  const [result, setResult] = useState<WordleBattleResult | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next: WordleBattleResult = await loadWordleBattle({ messageId });
        if (cancelled) return;
        if (next?.status === 'ok' && next.wordObj?.content) {
          onApplyServerWordObj(next.wordObj);
        }
        setResult(next);
      } catch (error) {
        console.error(error);
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Context request/action helpers have stable identities by contract.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId]);

  if (result?.status === 'ok' && result.wordObj?.content) {
    return (
      <WordModal
        word={result.wordObj.content}
        typedWord={String(result.answer || '').toLowerCase()}
        onHide={onHide}
      />
    );
  }

  const finishFirst = result?.status === 'finish_first';
  return (
    <Modal
      modalKey="WordleWordPopup"
      isOpen
      size="sm"
      hasHeader
      title="Word battle"
      onClose={onHide}
      footer={
        <div className={footerCls}>
          {finishFirst && onPlayWordle && (
            <Button
              color="logoBlue"
              onClick={() => {
                onHide();
                onPlayWordle();
              }}
            >
              Play today's Wordle
            </Button>
          )}
          <Button variant="ghost" onClick={onHide}>
            Close
          </Button>
        </div>
      }
    >
      <ErrorBoundary componentPath="Chat/Body/Collect/Vocabulary/WordBattle/WordleWordPopup">
        {!result && !failed ? (
          <Loading style={{ minHeight: '14rem' }} />
        ) : (
          <div className={noticeCls} data-testid="wordle-word-notice">
            {finishFirst && (
              <div className={tilesCls} aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i}>?</span>
                ))}
              </div>
            )}
            <div className={noticeTitleCls}>
              {finishFirst
                ? "Finish today's Wordle first!"
                : failed
                  ? "Couldn't open this word."
                  : result?.status === 'off'
                    ? 'Word battles are resting.'
                    : 'No monster lives here yet.'}
            </div>
            <div className={noticeSubCls}>
              {finishFirst
                ? "Today's word hides a monster. Solve your own Wordle (or give it your best try), then come back to battle it."
                : failed
                  ? 'Please try again in a moment.'
                  : result?.status === 'off'
                    ? 'Please come back a little later.'
                    : `${result?.answer || 'This word'} has no Word Master entry to battle yet.`}
            </div>
          </div>
        )}
      </ErrorBoundary>
    </Modal>
  );
}

// After a finished Wordle, a bonus the member may take, never a forced fight
// (Mikey 11-23): the word's monster peeks in from the edge with a loot hint.
// Catch the bonus opens the word's battle popup; Capture keeps it in the Den
// (locked) for later; Not now lets it wave goodbye. Shown only while the word
// is unplayed. Its only animations run once (no loops), and none at all with
// reduced motion.
export function WordleBonus({
  channelId,
  isSolved
}: {
  channelId: number;
  isSolved: boolean;
}) {
  const loadWordleBattle = useAppContext((v) => v.requestHelpers.loadWordleBattle);
  const captureWordBattle = useAppContext((v) => v.requestHelpers.captureWordBattle);
  const onApplyServerWordObj = useChatContext((v) => v.actions.onApplyServerWordObj);
  const [result, setResult] = useState<WordleBattleResult | null>(null);
  const [popupShown, setPopupShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next: WordleBattleResult = await loadWordleBattle({ channelId });
        if (cancelled) return;
        if (next?.status === 'ok' && next.wordObj?.content) {
          onApplyServerWordObj(next.wordObj);
        }
        setResult(next);
      } catch (error) {
        // A bonus that can't load just doesn't show; the win stays a win.
        console.error(error);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Context request/action helpers have stable identities by contract.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, reloadKey]);

  const wordObj = result?.status === 'ok' ? result.wordObj : null;
  const shown = !!wordObj && isBattleLocked(wordObj) && !gone;
  if (!shown && !popupShown) return null;

  const word = String(wordObj?.content || '');
  const level = Math.max(1, Math.min(5, Number(wordObj?.wordLevel) || 3));
  const captured = result?.captured === true;
  const name = word.toUpperCase();

  return (
    <ErrorBoundary componentPath="Chat/Body/Collect/Vocabulary/WordBattle/WordleBonus">
      {shown && (
        <div
          ref={panelRef}
          className={cx(bonusCls, leaving && bonusLeavingCls)}
          data-testid="wordle-bonus"
          onAnimationEnd={(event) => {
            if (leaving && event.target === panelRef.current) setGone(true);
          }}
        >
          <div className={bonusTextCls}>
            <div className={bonusTitleCls}>BONUS!</div>
            <div className={bonusLineCls}>
              {captured
                ? `${name} is waiting in your Den.`
                : isSolved
                  ? `A wild ${name} is lurking nearby...`
                  : `Missed it? A wild ${name} is lurking nearby...`}
            </div>
            <div className={lootHintCls} aria-label="Possible loot: Word Master points, XP, Coins and rare drops">
              <span className={cx(badgeStyle('passionFruit', 0.85), chipCls)}>pts</span>
              <span className={cx(badgeStyle('limeGreen', 0.85), chipCls)}>
                <Icon icon={['far', 'star']} /> XP
              </span>
              <span className={cx(badgeStyle('gold', 0.85), chipCls)}>
                <Icon icon="coins" /> Coins
              </span>
              <span className={rareCls}>
                <img src={LOOT_ICONS.card} alt="" />
                <img src={LOOT_ICONS.battery} alt="" />
                rare drops?
              </span>
            </div>
            <div className={bonusActionsCls}>
              <button
                type="button"
                className={catchButtonCls}
                disabled={leaving}
                onClick={() => setPopupShown(true)}
              >
                {captured ? 'Battle it now ▶' : 'Catch the bonus ▶'}
              </button>
              <button
                type="button"
                className={secondaryButtonCls}
                disabled={captured || capturing || leaving}
                onClick={handleCapture}
              >
                {captured ? 'In your Den ✓' : 'Capture'}
              </button>
              <button
                type="button"
                className={laterButtonCls}
                disabled={leaving}
                onClick={handleNotNow}
              >
                Not now
              </button>
            </div>
          </div>
          <div className={cx(peekCls, leaving && peekWaveCls)} aria-hidden="true">
            {leaving && <span className={byeCls}>Bye!</span>}
            <MonsterSprite word={word} level={level} scale={2} pose={leaving ? 'idle' : 'peek'} still />
          </div>
        </div>
      )}
      {popupShown && word && (
        <WordModal
          word={word}
          typedWord={String(result?.answer || '').toLowerCase()}
          onHide={() => {
            setPopupShown(false);
            // The server's word now: beaten, lost, read or captured.
            setReloadKey((key) => key + 1);
          }}
        />
      )}
    </ErrorBoundary>
  );

  async function handleCapture() {
    if (!wordObj || capturing) return;
    setCapturing(true);
    try {
      const next = await captureWordBattle(wordIdOf(wordObj));
      if (typeof next?.captured === 'boolean') {
        setResult((prev) => (prev ? { ...prev, captured: next.captured } : prev));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCapturing(false);
    }
  }

  function handleNotNow() {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return setGone(true);
    setLeaving(true);
  }
}

// The Wordle result card's "battle this word" hint.
export function WordleBattleHint() {
  return (
    <span className={hintCls} aria-hidden="true">
      Word battle ▶
    </span>
  );
}

const footerCls = css`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  width: 100%;
  flex-wrap: wrap;
`;

const noticeCls = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  padding: 2.4rem 1.6rem;
  background: #0f0b1a;
  border: 3px solid #1a1426;
  box-shadow: inset 0 0 0 3px #2c2442;
  color: #ffffff;
  text-align: center;
`;

const tilesCls = css`
  display: flex;
  gap: 6px;
  span {
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: ${PIXEL_FONT};
    font-size: 14px;
    color: #a99fc4;
    background: #2c2442;
    border: 3px solid #4a3f66;
  }
`;

const noticeTitleCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 13px;
  line-height: 1.6;
  color: #ffd34d;
`;

const noticeSubCls = css`
  font-size: 1.5rem;
  line-height: 1.5;
  color: #d8d0ea;
  max-width: 34rem;
`;

const bonusCls = css`
  position: relative;
  width: 100%;
  box-sizing: border-box;
  margin-top: 2.4rem;
  display: flex;
  align-items: stretch;
  overflow: hidden;
  background: #0f0b1a;
  border: 3px solid #ffd34d;
  box-shadow: 0 0 0 3px #0f0b1a, inset 0 0 0 3px #2c2442;
  color: #ffffff;
  animation: wordle-bonus-in 0.45s steps(5) 1 both;
  @keyframes wordle-bonus-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// After the wave the panel folds away.
const bonusLeavingCls = css`
  animation: wordle-bonus-out 0.5s steps(5) 1.25s 1 forwards;
  @keyframes wordle-bonus-out {
    to {
      opacity: 0;
      transform: translateY(6px);
    }
  }
`;

const bonusTextCls = css`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.4rem 0 1.4rem 1.4rem;
`;

const bonusTitleCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 12px;
  letter-spacing: 2px;
  color: #ffd34d;
`;

const bonusLineCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 11px;
  line-height: 1.7;
  overflow-wrap: anywhere;
`;

const lootHintCls = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
`;

const chipCls = css`
  min-width: 0;
  font-size: 0.9rem;
  padding: 0.4rem 0.6rem;
  gap: 0.4rem;
  color: #ffffff;
  &:hover {
    transform: none;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  }
`;

const rareCls = css`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: ${PIXEL_FONT};
  font-size: 9px;
  color: #c27bff;
  img {
    width: 14px;
    height: 14px;
    image-rendering: pixelated;
  }
`;

const bonusActionsCls = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
`;

// Glows three times as it arrives, then stays lit (no endless loop).
const catchButtonCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 11px;
  padding: 11px 14px;
  white-space: nowrap;
  @media (max-width: 400px) {
    font-size: 10px;
    padding: 11px 10px;
  }
  color: #3b2200;
  background: #ffd34d;
  border: 3px solid #ffffff;
  box-shadow: 0 4px 0 #b88a00, 0 0 12px 2px rgba(255, 211, 77, 0.55);
  cursor: pointer;
  animation: wordle-bonus-glow 1.1s ease-in-out 0.5s 3;
  @keyframes wordle-bonus-glow {
    50% {
      box-shadow: 0 4px 0 #b88a00, 0 0 22px 7px rgba(255, 211, 77, 0.9);
    }
  }
  &:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 1px 0 #b88a00, 0 0 12px 2px rgba(255, 211, 77, 0.55);
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const secondaryButtonCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 10px;
  padding: 10px 12px;
  color: #ffffff;
  background: #2c2442;
  border: 3px solid #a99fc4;
  box-shadow: 0 4px 0 #120d1f;
  cursor: pointer;
  &:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 1px 0 #120d1f;
  }
  &:disabled {
    opacity: 0.75;
    cursor: default;
  }
`;

const laterButtonCls = css`
  font-family: ${PIXEL_FONT};
  font-size: 9px;
  padding: 8px 4px;
  color: #a99fc4;
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
  &:disabled {
    cursor: default;
  }
`;

// The monster peeks in from the right edge (head, both eyes and most of its
// body in view; the 128px canvas's far side stays past the edge), sliding in
// once.
const peekCls = css`
  position: relative;
  flex-shrink: 0;
  width: 92px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  animation: wordle-bonus-peek 0.7s steps(7) 0.35s 1 both;
  @keyframes wordle-bonus-peek {
    from {
      transform: translateX(100%);
    }
    to {
      transform: none;
    }
  }
  @media (max-width: 400px) {
    width: 84px;
  }
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// Not now: it comes out a little, waves (a wiggle), and slips away.
const peekWaveCls = css`
  animation: wordle-bonus-wave 1.6s steps(16) 1 forwards;
  @keyframes wordle-bonus-wave {
    0% {
      transform: none;
    }
    15% {
      transform: translateX(-26px);
    }
    25% {
      transform: translateX(-26px) rotate(-10deg);
    }
    35% {
      transform: translateX(-26px) rotate(10deg);
    }
    45% {
      transform: translateX(-26px) rotate(-10deg);
    }
    55% {
      transform: translateX(-26px) rotate(10deg);
    }
    65% {
      transform: translateX(-26px) rotate(0);
    }
    100% {
      transform: translateX(110%);
    }
  }
`;

const byeCls = css`
  position: absolute;
  bottom: 84px;
  left: -10px;
  z-index: 1;
  font-family: ${PIXEL_FONT};
  font-size: 9px;
  color: #0f0b1a;
  background: #ffffff;
  border: 2px solid #0f0b1a;
  padding: 4px 5px;
  white-space: nowrap;
`;

const hintCls = css`
  display: inline-block;
  font-family: ${PIXEL_FONT};
  font-size: max(9px, 0.95rem);
  line-height: 1.6;
  padding: 4px 8px;
  color: #3b2200;
  background: #ffd34d;
  border: 2px solid #ffffff;
  box-shadow: 0 3px 0 #b88a00;
  white-space: nowrap;
`;
