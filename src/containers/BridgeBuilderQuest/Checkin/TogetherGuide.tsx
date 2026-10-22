import React, { useEffect, useState } from 'react';
import { css, keyframes } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';

// "Show you're together" (Mikey 10-17: the proximity ladder, with "easy
// intuitive interactive guide that is mobile optimized"). Shown only when a
// check-in couldn't tell the two phones were in one room and none of the
// member's check-ins has yet. Each choice ends in "scan each other again":
//   sound   — phones close, volume up; the phones hear each other's chirp
//   hotspot — one phone shares its internet, the other joins; one network
//   later   — it still counts; Twinkle checks it before the unlock
// One step per screen, big buttons, the steps for this phone only.

type Platform = 'ios' | 'android';
type Screen =
  | { name: 'choose' }
  | { name: 'sound'; step: number }
  | { name: 'whoShares' }
  | { name: 'hotspot'; role: 'share' | 'join'; step: number }
  | { name: 'later' };

interface Step {
  icon: string;
  title: string;
  text: string;
  tip?: string;
}

const slideIn = keyframes`
  from { transform: translateX(1.6rem); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

export function detectPlatform(userAgent: string): Platform {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  // a Mac reporting itself, or a desktop: iPads say "Macintosh" with touch
  return /Macintosh/i.test(userAgent) &&
    typeof document !== 'undefined' &&
    'ontouchend' in document
    ? 'ios'
    : 'android';
}

const SCAN_AGAIN: Step = {
  icon: 'qrcode',
  title: 'Scan each other again',
  text: 'Same as before: one shows the code, the other scans, then swap.'
};

export const SOUND_STEPS: Step[] = [
  {
    icon: 'volume-high',
    title: 'Turn the volume up',
    text: 'On both phones. The sound is short and quiet; some people hear it as a faint tick.'
  },
  {
    icon: 'mobile-screen-button',
    title: 'Hold the phones close',
    text: 'About a hand apart. A quiet spot helps.',
    tip: 'If your browser asks to use the microphone, tap Allow. Nothing is recorded.'
  },
  {
    ...SCAN_AGAIN,
    text: `${SCAN_AGAIN.text} The phones listen for each other while you scan.`
  }
];

export const HOTSPOT_STEPS: Record<
  'share' | 'join',
  Record<Platform, Step[]>
> = {
  share: {
    ios: [
      {
        icon: 'gear',
        title: 'Open Settings',
        text: 'The grey gear app on your home screen.'
      },
      {
        icon: 'tower-broadcast',
        title: 'Tap Personal Hotspot',
        text: 'It’s near the top, under Mobile Service.'
      },
      {
        icon: 'key',
        title: 'Turn on “Allow Others to Join”',
        text: 'Your Wi-Fi password is shown on this screen. Show it to your friend.'
      },
      {
        ...SCAN_AGAIN,
        text: `When your friend is connected: ${SCAN_AGAIN.text.toLowerCase()}`
      }
    ],
    android: [
      { icon: 'gear', title: 'Open Settings', text: 'The gear app.' },
      {
        icon: 'wifi',
        title: 'Tap Connections',
        text: 'On some phones it’s called “Network & internet”.'
      },
      {
        icon: 'tower-broadcast',
        title: 'Tap “Mobile Hotspot and Tethering”',
        text: 'On some phones it’s called “Hotspot & tethering”.'
      },
      {
        icon: 'key',
        title: 'Turn on Mobile Hotspot',
        text: 'Then tap its name to see the password, and show it to your friend.',
        tip: 'Shortcut for next time: swipe down from the top of the screen and tap Hotspot.'
      },
      {
        ...SCAN_AGAIN,
        text: `When your friend is connected: ${SCAN_AGAIN.text.toLowerCase()}`
      }
    ]
  },
  join: {
    ios: [
      {
        icon: 'gear',
        title: 'Open Settings, then Wi-Fi',
        text: 'The grey gear app, then Wi-Fi near the top.'
      },
      {
        icon: 'wifi',
        title: 'Tap your friend’s phone',
        text: 'Their phone’s name shows in the list (it may take a few seconds).'
      },
      {
        icon: 'key',
        title: 'Type the password',
        text: 'Your friend can see it on their hotspot screen.'
      },
      SCAN_AGAIN
    ],
    android: [
      {
        icon: 'gear',
        title: 'Open Settings, then Wi-Fi',
        text: 'In Settings, tap Connections, then Wi-Fi. On some phones it’s “Network & internet”, then “Internet”.'
      },
      {
        icon: 'wifi',
        title: 'Tap your friend’s phone',
        text: 'Their phone’s name shows in the list (it may take a few seconds).'
      },
      {
        icon: 'key',
        title: 'Type the password',
        text: 'Your friend can see it on their hotspot screen.'
      },
      SCAN_AGAIN
    ]
  }
};

export default function TogetherGuide({
  partnerName,
  onScanAgain,
  onDone,
  track
}: {
  partnerName?: string;
  onScanAgain: () => void;
  onDone: () => void;
  track: (kind: string) => void;
}) {
  const [screen, setScreen] = useState<Screen>({ name: 'choose' });
  const [platform, setPlatform] = useState<Platform>(() =>
    detectPlatform(typeof navigator === 'undefined' ? '' : navigator.userAgent)
  );

  useEffect(() => {
    track('together_guide_open');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (screen.name === 'choose') {
    return (
      <div className={columnClass}>
        <BigIcon icon="handshake" tone="gold" />
        <div className={titleClass}>Almost there!</div>
        <p className={leadClass}>
          {partnerName ? (
            <>
              Show that you and <b>{partnerName}</b> are together
            </>
          ) : (
            'Show that you two are together'
          )}{' '}
          and this helps Mikey review your meetup.
        </p>
        <Choice
          icon="ear-listen"
          title="Sound check"
          text="Phones close, volume up, scan again."
          badge="Easiest"
          onClick={() => {
            track('together_try_sound');
            setScreen({ name: 'sound', step: 0 });
          }}
        />
        <Choice
          icon="tower-broadcast"
          title="Phone hotspot"
          text="One phone shares its internet. Good when there’s no Wi-Fi."
          onClick={() => {
            track('together_try_hotspot');
            setScreen({ name: 'whoShares' });
          }}
        />
        <Choice
          icon="clock"
          title="Not now"
          text="It still counts. Twinkle checks it before Bridge Builder unlocks."
          quiet
          onClick={() => {
            track('together_guide_later');
            setScreen({ name: 'later' });
          }}
        />
      </div>
    );
  }

  if (screen.name === 'later') {
    return (
      <div className={columnClass}>
        <BigIcon icon="check" tone="green" />
        <div className={titleClass}>No problem</div>
        <p className={leadClass}>
          Your check-in still counts. If none of your check-ins can show you
          were together, Twinkle takes a quick look before Bridge Builder
          unlocks.
        </p>
        <p className={leadClass}>
          Next time you meet, you can try again from here.
        </p>
        <PrimaryButton onClick={onDone}>Got it</PrimaryButton>
      </div>
    );
  }

  if (screen.name === 'whoShares') {
    return (
      <div className={columnClass}>
        <BigIcon icon="tower-broadcast" tone="blue" />
        <div className={titleClass}>Whose phone shares its internet?</div>
        <p className={leadClass}>Pick one. The other phone joins it.</p>
        <Choice
          icon="mobile-screen-button"
          title="My phone"
          text="I’ll turn on the hotspot."
          onClick={() => setScreen({ name: 'hotspot', role: 'share', step: 0 })}
        />
        <Choice
          icon="wifi"
          title={partnerName ? `${partnerName}’s phone` : 'My friend’s phone'}
          text="I’ll join their hotspot."
          onClick={() => setScreen({ name: 'hotspot', role: 'join', step: 0 })}
        />
        <p className={smallClass}>
          A hotspot uses a little of the phone’s data. Ask a grown-up if you’re
          not sure.
        </p>
        <BackLink onClick={() => setScreen({ name: 'choose' })} />
      </div>
    );
  }

  const steps =
    screen.name === 'sound'
      ? SOUND_STEPS
      : HOTSPOT_STEPS[screen.role][platform];
  const step = steps[screen.step];
  const last = screen.step === steps.length - 1;
  return (
    <div className={columnClass}>
      {screen.name === 'hotspot' && (
        <div
          role="group"
          aria-label="Which phone do you have?"
          className={css`
            display: inline-flex;
            padding: 0.3rem;
            border-radius: 2rem;
            background: ${Color.extraLightGray()};
          `}
        >
          {(['ios', 'android'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={platform === value}
              onClick={() => setPlatform(value)}
              className={css`
                min-height: 3.6rem;
                padding: 0 1.4rem;
                border: 0;
                border-radius: 1.8rem;
                font-size: 1.3rem;
                font-weight: bold;
                cursor: pointer;
                color: ${platform === value ? '#fff' : Color.darkGray()};
                background: ${platform === value ? Color.logoBlue() : 'transparent'};
              `}
            >
              {value === 'ios' ? 'iPhone' : 'Android'}
            </button>
          ))}
        </div>
      )}
      <Progress count={steps.length} index={screen.step} />
      <div
        key={`${screen.name}-${screen.step}-${platform}`}
        className={css`
          ${columnInner}
          animation: ${slideIn} 0.25s ease-out both;
        `}
      >
        <BigIcon icon={step.icon} tone={last ? 'green' : 'blue'} />
        <div className={stepCountClass}>
          Step {screen.step + 1} of {steps.length}
        </div>
        <div className={titleClass}>{step.title}</div>
        <p className={leadClass}>{step.text}</p>
        {step.tip && <p className={tipClass}>{step.tip}</p>}
      </div>
      <PrimaryButton
        onClick={() => {
          if (!last) return setScreen({ ...screen, step: screen.step + 1 });
          if (screen.name === 'hotspot') track('together_hotspot_on');
          onScanAgain();
        }}
      >
        {last ? 'Scan again' : 'Next'}
      </PrimaryButton>
      <BackLink
        onClick={() =>
          screen.step > 0
            ? setScreen({ ...screen, step: screen.step - 1 })
            : setScreen(
                screen.name === 'hotspot'
                  ? { name: 'whoShares' }
                  : { name: 'choose' }
              )
        }
      />
    </div>
  );
}

function Progress({ count, index }: { count: number; index: number }) {
  return (
    <div
      aria-hidden
      className={css`
        display: flex;
        gap: 0.5rem;
        width: 100%;
        max-width: 24rem;
      `}
    >
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={css`
            flex: 1;
            height: 0.5rem;
            border-radius: 1rem;
            background: ${i <= index ? Color.logoBlue() : Color.logoBlue(0.15)};
          `}
        />
      ))}
    </div>
  );
}

function BigIcon({
  icon,
  tone
}: {
  icon: string;
  tone: 'blue' | 'green' | 'gold';
}) {
  const color =
    tone === 'green'
      ? Color.green
      : tone === 'gold'
        ? Color.orange
        : Color.logoBlue;
  return (
    <div
      className={css`
        width: 8rem;
        height: 8rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3.4rem;
        color: ${color()};
        background: ${color(0.12)};
      `}
    >
      <Icon icon={icon as any} />
    </div>
  );
}

function Choice({
  icon,
  title,
  text,
  badge,
  quiet,
  onClick
}: {
  icon: string;
  title: string;
  text: string;
  badge?: string;
  quiet?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={css`
        width: 100%;
        min-height: 7rem;
        display: flex;
        align-items: center;
        gap: 1.2rem;
        padding: 1.2rem 1.4rem;
        text-align: left;
        border-radius: 1.4rem;
        border: ${quiet ? '1px solid var(--ui-border)' : `2px solid ${Color.logoBlue(0.35)}`};
        background: ${quiet ? '#fff' : Color.logoBlue(0.05)};
        cursor: pointer;
        transition: transform 0.12s ease-out;
        &:active {
          transform: scale(0.98);
        }
      `}
    >
      <span
        className={css`
          flex-shrink: 0;
          width: 4.6rem;
          height: 4.6rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          color: ${quiet ? Color.darkGray() : Color.logoBlue()};
          background: ${quiet ? Color.extraLightGray() : Color.logoBlue(0.12)};
        `}
      >
        <Icon icon={icon as any} />
      </span>
      <span
        className={css`
          flex: 1;
          min-width: 0;
        `}
      >
        <span
          className={css`
            display: flex;
            align-items: center;
            gap: 0.6rem;
            flex-wrap: wrap;
            font-size: 1.65rem;
            font-weight: bold;
            color: ${Color.black()};
          `}
        >
          {title}
          {badge && (
            <span
              className={css`
                font-size: 1.1rem;
                padding: 0.15rem 0.7rem;
                border-radius: 1rem;
                color: #fff;
                background: ${Color.green()};
              `}
            >
              {badge}
            </span>
          )}
        </span>
        <span
          className={css`
            display: block;
            margin-top: 0.2rem;
            font-size: 1.35rem;
            line-height: 1.4;
            color: ${Color.darkGray()};
          `}
        >
          {text}
        </span>
      </span>
      <Icon icon="chevron-right" style={{ color: Color.gray() }} />
    </button>
  );
}

function PrimaryButton({
  onClick,
  children
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={css`
        width: 100%;
        min-height: 5rem;
        border: 0;
        border-radius: 1.4rem;
        font-size: 1.7rem;
        font-weight: bold;
        color: #fff;
        background: ${Color.logoBlue()};
        cursor: pointer;
        transition: transform 0.12s ease-out;
        &:active {
          transform: scale(0.98);
        }
      `}
    >
      {children}
    </button>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={css`
        min-height: 4.4rem;
        padding: 0 1.6rem;
        border: 0;
        background: none;
        font-size: 1.4rem;
        color: ${Color.darkGray()};
        cursor: pointer;
      `}
    >
      <Icon icon="arrow-left" style={{ marginRight: '0.6rem' }} />
      Back
    </button>
  );
}

const columnInner = `
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
`;

const columnClass = css`
  ${columnInner}
  gap: 1.2rem;
`;

const titleClass = css`
  font-size: 2rem;
  font-weight: bold;
  line-height: 1.3;
  color: ${Color.black()};
`;

const stepCountClass = css`
  font-size: 1.2rem;
  font-weight: bold;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${Color.logoBlue()};
`;

const leadClass = css`
  margin: 0;
  font-size: 1.5rem;
  line-height: 1.55;
  color: ${Color.darkerGray()};
`;

const tipClass = css`
  margin: 0;
  width: 100%;
  padding: 1rem 1.2rem;
  border-radius: 1rem;
  font-size: 1.35rem;
  line-height: 1.5;
  text-align: left;
  color: ${Color.black()};
  background: ${Color.gold(0.15)};
`;

const smallClass = css`
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.5;
  color: ${Color.darkGray()};
`;
