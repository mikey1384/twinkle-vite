import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '~/components/Modal';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { Color, borderRadius } from '~/constants/css';
import { useAppContext, useKeyContext, useNotiContext } from '~/contexts';

const autoShownRescuePhases = new Set<string>();

const EVENT_COPY: {
  [key: string]: { moment: string; prize: string; claimLabel: string };
} = {
  dailyTask: {
    moment: 'your Daily Task streak is on the line',
    prize: 'a free streak repair',
    claimLabel: 'Repair my streak for free'
  },
  dailyReflection: {
    moment: 'your Reflection streak is on the line',
    prize: 'a free streak repair',
    claimLabel: 'Repair my streak for free'
  },
  aiEnergy: {
    moment: 'your AI battery just ran out',
    prize: 'a free full recharge',
    claimLabel: 'Recharge my battery for free'
  },
  wordMaster: {
    moment: 'your Word Master break got locked',
    prize: 'a free unlock',
    claimLabel: 'Unlock my break for free'
  },
  wordleStrict: {
    moment: 'your double-strict Wordle streak just ended',
    prize: 'a free streak revival',
    claimLabel: 'Revive my strict streak for free'
  },
  wordle: {
    moment: 'your Wordle streak just broke',
    prize: 'a free streak revival',
    claimLabel: 'Revive my streak for free'
  }
};

// One-per-account-ever "first build rescue": shown at a painful moment
// (streak at risk / battery empty) to users who have never made a Lumine
// build call. Making their first call unlocks one free repair/recharge.
// Self-contained: drop <LumineRescueEntry eventType=... active={...} /> into
// a surface and it handles status, the banner, the modal, and redemption.
export default function LumineRescueEntry({
  eventType,
  active,
  onRedeemed,
  params,
  style
}: {
  eventType:
    | 'dailyTask'
    | 'dailyReflection'
    | 'aiEnergy'
    | 'wordMaster'
    | 'wordleStrict'
    | 'wordle';
  active: boolean;
  onRedeemed?: (result: any) => void;
  params?: Record<string, any>;
  style?: React.CSSProperties;
}) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const resolveLumineRescue = useAppContext(
    (v) => v.requestHelpers.resolveLumineRescue
  );
  const redeemLumineRescue = useAppContext(
    (v) => v.requestHelpers.redeemLumineRescue
  );
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const [status, setStatus] = useState<{
    offerAvailable: boolean;
    claimReady: boolean;
  } | null>(null);
  const [modalShown, setModalShown] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const copy = EVENT_COPY[eventType];
  const paramsKey = JSON.stringify(params || {});

  useEffect(() => {
    if (!active || !userId) {
      setStatus(null);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const result = await resolveLumineRescue(eventType, params);
        if (!mounted || !result) return;
        setStatus({
          offerAvailable: Boolean(result.offerAvailable),
          claimReady: Boolean(result.claimReady)
        });
      } catch (error) {
        console.error(error);
      }
    })();
    return () => {
      mounted = false;
    };
    // Context request helpers are stable actions and intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, userId, eventType, paramsKey]);

  const eligible = Boolean(status?.offerAvailable || status?.claimReady);

  // The moment they learn the bad news, the gift appears on its own — once.
  useEffect(() => {
    const phase = status?.claimReady ? 'claim' : 'offer';
    const autoShowKey = `${userId}:${eventType}:${paramsKey}:${phase}`;
    if (eligible && !autoShownRescuePhases.has(autoShowKey)) {
      autoShownRescuePhases.add(autoShowKey);
      setModalShown(true);
    }
  }, [eligible, status?.claimReady, userId, eventType, paramsKey]);

  if (!active || !eligible || !copy) return null;

  return (
    <ErrorBoundary componentPath="LumineRescueEntry">
      <button
        type="button"
        onClick={() => setModalShown(true)}
        style={style}
        className={css`
          display: flex;
          align-items: center;
          gap: 0.8rem;
          padding: 0.9rem 1.1rem;
          border: 1px solid ${Color.gold(0.6)};
          border-radius: ${borderRadius};
          background: ${Color.gold(0.08)};
          cursor: pointer;
          font-size: 1.2rem;
          font-family: inherit;
          width: 100%;
          text-align: left;
          &:hover {
            background: ${Color.gold(0.15)};
          }
        `}
      >
        <span style={{ fontSize: '1.6rem' }} aria-hidden>
          🎁
        </span>
        <span>
          <b>One-time gift:</b>{' '}
          {status?.claimReady
            ? `claim ${copy.prize}!`
            : `earn ${copy.prize} — tap to see how`}
        </span>
      </button>
      {modalShown && (
        <Modal
          modalKey="LumineRescueModal"
          isOpen={true}
          onClose={() => setModalShown(false)}
          size="sm"
          hasHeader
          title="A one-time gift, just for you 🎁"
          footer={
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Button variant="ghost" onClick={() => setModalShown(false)}>
                Maybe later
              </Button>
              {status?.claimReady ? (
                <Button
                  color="green"
                  loading={redeeming}
                  onClick={handleRedeem}
                >
                  {copy.claimLabel}
                </Button>
              ) : (
                <Button
                  color="logoBlue"
                  onClick={() => {
                    setModalShown(false);
                    navigate('/build?sayHi=lumine');
                  }}
                >
                  Make my first app <Icon icon="arrow-right" />
                </Button>
              )}
            </div>
          }
        >
          <main
            className={css`
              display: flex;
              flex-direction: column;
              gap: 1.2rem;
              padding: 0.5rem 0.5rem 1rem 0.5rem;
              font-size: 1.3rem;
              line-height: 1.55;
            `}
          >
            {status?.claimReady ? (
              <>
                <p>
                  You made something with Lumine — that{`'`}s awesome! 🎉 Your
                  one-time gift is ready: {copy.prize}, <b>on the house</b>.
                </p>
                {redeemError ? (
                  <p
                    className={css`
                      color: ${Color.red()};
                      font-size: 1.2rem;
                    `}
                  >
                    {redeemError}
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p>
                  Since {copy.moment}, here{`'`}s some good news: you{`'`}ve
                  never tried <b>Lumine Build</b>, and your first time comes
                  with a gift. 💛
                </p>
                <p>
                  Tell Lumine what to make — a game, a drawing app, anything —
                  and you can make that first build chat even with an empty
                  battery. Do that, come back, and you{`'`}ll get {copy.prize}{' '}
                  <b>for free</b>.
                </p>
                <p
                  className={css`
                    font-size: 1.15rem;
                    color: ${Color.gray()};
                  `}
                >
                  This gift can be used once per account, ever. Best claimed
                  today — but it waits for you all week. 💛
                </p>
              </>
            )}
          </main>
        </Modal>
      )}
    </ErrorBoundary>
  );

  async function handleRedeem() {
    if (redeeming) return;
    setRedeeming(true);
    setRedeemError('');
    try {
      const result = await redeemLumineRescue(eventType, params);
      if (result?.success) {
        // Battery redemptions carry the canonical post-recharge policy
        // snapshot; applying it here means every mount gets a fresh battery
        // without wiring its own handler.
        if (eventType === 'aiEnergy' && result?.snapshot) {
          onUpdateTodayStats({
            newStats: { aiUsagePolicy: result.snapshot }
          });
        }
        setModalShown(false);
        setStatus(null);
        onRedeemed?.(result);
      } else {
        setRedeemError(
          result?.error || 'Something went wrong — please try again.'
        );
      }
    } catch (error: any) {
      setRedeemError(
        error?.response?.data?.error ||
          'Something went wrong — please try again.'
      );
    } finally {
      setRedeeming(false);
    }
  }
}
