import React from 'react';
import { css, keyframes } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color, getStreakColor, mobileMaxWidth } from '~/constants/css';
import ScopedTheme from '~/theme/ScopedTheme';
import { useSectionPanelVars } from '~/theme/useSectionPanelVars';

type Focus = 'all' | 'wordle' | 'grammarbles' | 'aiStory';
type Tone =
  | 'logoBlue'
  | 'orange'
  | 'magenta'
  | 'gold'
  | 'green'
  | 'gray';

interface BoostRow {
  label: string;
  title: string;
  description: string;
  tone: Tone;
  basicAchieved: boolean;
  excellenceAchieved: boolean;
}

const compactFireAnimation = keyframes`
  0%, 100% { transform: scale(1) rotate(-3deg); }
  50% { transform: scale(1.08) rotate(3deg); }
`;

export default function DailyRewardBoostStrip({
  streak,
  wordle,
  grammarbles,
  aiStory,
  focus = 'all',
  style
}: {
  streak: number;
  wordle?: any;
  grammarbles?: any;
  aiStory?: any;
  focus?: Focus;
  style?: React.CSSProperties;
}) {
  const [showFormula, setShowFormula] = React.useState(false);
  const {
    themeName,
    accentColor,
    headerTextColor,
    headerTextShadow,
    styleVars
  } = useSectionPanelVars();
  const streakMultiplier = getBoostStreakMultiplier(streak);
  const potentialMultiplier = streakMultiplier * streakMultiplier;
  const rows = buildRows({
    focus,
    wordle,
    grammarbles,
    aiStory
  });
  const streakDays = Math.max(0, Number(streak) || 0);

  if (!rows.length) {
    return null;
  }

  const summaryLabel = 'Boost condition';
  const streakColor = getStreakColor(streakDays);
  const showStreakBadge = streakDays > 0;
  const showSparkles = streakDays >= 10;
  const summaryBlurb = `You're currently on a ${streakDays}-day Daily Tasks streak. That gives you an x${formatMultiplier(
    streakMultiplier
  )} multiplier boost for both Basic and Excellence conditions, up to x${formatMultiplier(
    potentialMultiplier
  )} total reward today.`;
  const panelStyle = {
    ...styleVars,
    ['--boost-strip-accent' as const]: accentColor,
    ['--boost-strip-accent-soft' as const]: withAlpha(accentColor, 0.08),
    ['--boost-strip-accent-muted' as const]: withAlpha(accentColor, 0.12),
    ['--boost-strip-accent-strong' as const]: withAlpha(accentColor, 0.2),
    ['--boost-strip-heading-color' as const]: headerTextColor,
    ['--boost-strip-heading-shadow' as const]: headerTextShadow,
    ...(style || {})
  } as React.CSSProperties;

  return (
    <ScopedTheme theme={themeName} roles={['sectionPanel', 'sectionPanelText']}>
      <section
        style={panelStyle}
        className={css`
          width: 100%;
          padding: 1.4rem 1.6rem;
          border-radius: 1.2rem;
          background: var(--section-panel-bg, #fff);
          border: 1px solid var(--section-panel-border-color);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        `}
      >
        <div
          className={css`
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: flex-start;
            gap: 0.9rem;
          `}
        >
          <div
            className={css`
              width: 3.1rem;
              height: 3.1rem;
              border-radius: 1rem;
              background: var(--boost-strip-accent-muted);
              color: var(--boost-strip-accent);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.6rem;
              box-shadow: inset 0 0 0 1px var(--boost-strip-accent-strong);
            `}
          >
            <Icon icon="sparkles" />
          </div>
          <div
            className={css`
              padding: 0.35rem 1rem;
              border-radius: 999px;
              background: var(--boost-strip-accent-soft);
              color: var(--boost-strip-heading-color);
              text-shadow: var(--boost-strip-heading-shadow);
              font-size: 1.2rem;
              font-weight: 800;
              letter-spacing: 0.02em;
              border: 1px solid var(--boost-strip-accent-strong);
            `}
          >
            {summaryLabel}
          </div>
          {showStreakBadge && (
            <div
              className={css`
                display: inline-flex;
                align-items: center;
                gap: 0.45rem;
                padding: 0.35rem 0.8rem;
                border-radius: 999px;
                background: ${withAlpha(streakColor, 0.1)};
                border: 1px solid ${withAlpha(streakColor, 0.22)};
                color: ${streakColor};
                font-size: 1.05rem;
                font-weight: 800;
                white-space: nowrap;
              `}
            >
              <span
                className={css`
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  line-height: 1;
                  font-size: ${streakDays >= 10
                    ? '1.45rem'
                    : streakDays >= 5
                      ? '1.28rem'
                      : '1.12rem'};
                  animation: ${streakDays >= 5
                    ? `${compactFireAnimation} 0.6s ease-in-out infinite`
                    : 'none'};
                `}
              >
                🔥
              </span>
              <span>{streakDays}-day streak</span>
              {showSparkles && (
                <Icon
                  icon="sparkles"
                  style={{ fontSize: '0.85rem', color: streakColor }}
                />
              )}
            </div>
          )}
        </div>
        <div
          className={css`
            padding: 0.95rem 1.05rem;
            border-radius: 1rem;
            border: 1px solid var(--boost-strip-accent-strong);
            background: var(--boost-strip-accent-soft);
            display: flex;
            flex-direction: column;
            gap: 0.85rem;
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 1rem;
            `}
          >
            <div
              className={css`
                font-size: 1.15rem;
                color: ${Color.darkGray()};
                font-weight: 600;
                line-height: 1.5;
              `}
            >
              {summaryBlurb}
            </div>
            <button
              type="button"
              aria-label="Show boost formula"
              onClick={() => setShowFormula((prev) => !prev)}
              className={css`
                flex-shrink: 0;
                width: 2rem;
                height: 2rem;
                border-radius: 999px;
                border: 1px solid var(--boost-strip-accent-strong);
                background: rgba(255, 255, 255, 0.96);
                color: var(--boost-strip-accent);
                font-size: 1.05rem;
                font-weight: 800;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition:
                  transform 120ms ease,
                  border-color 120ms ease;

                &:hover {
                  transform: translateY(-1px);
                  border-color: var(--boost-strip-accent);
                }
              `}
            >
              !
            </button>
          </div>
          {showFormula && (
            <div
              className={css`
                padding: 0.85rem 0.95rem;
                border-radius: 0.9rem;
                background: rgba(255, 255, 255, 0.96);
                border: 1px solid var(--section-panel-border-color);
                font-size: 1.08rem;
                line-height: 1.5;
                color: ${Color.darkGray()};
              `}
            >
              {`Streak days 0-10 use x2 for Basic and x2 for Excellence. Days 11-20 use x3 for both. Days 21-30 use x4 for both. Every extra 10 streak days adds +1 to both ladders, capped at x10 each. If you hit both conditions today, your current streak can take the reward as high as x${formatMultiplier(
                potentialMultiplier
              )} total.`}
            </div>
          )}
        </div>
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 0.85rem;
          `}
        >
          {rows.map((row) => (
            <BoostGuideRow
              key={row.label}
              focus={focus}
              row={row}
            />
          ))}
        </div>
      </section>
    </ScopedTheme>
  );
}

function BoostGuideRow({
  row,
  focus
}: {
  row: BoostRow;
  focus: Focus;
}) {
  const isFocused = focus !== 'all';
  const showCleared = row.basicAchieved && row.excellenceAchieved;
  const showPartial = row.basicAchieved && !row.excellenceAchieved;
  const frameColor = 'var(--boost-strip-accent-strong)';
  const borderColor = showCleared
    ? Color.green()
    : showPartial || isFocused
      ? getToneColor(row.tone)
      : 'var(--boost-strip-accent)';

  return (
    <div
      className={css`
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
        padding: 0.75rem 0.9rem;
        margin: -0.15rem -0.2rem;
        border-radius: 0.9rem;
        background: ${Color.white()};
        border: 1px solid ${frameColor};
        border-left: 3px solid ${borderColor};

        @media (max-width: ${mobileMaxWidth}) {
          flex-direction: column;
        }
      `}
    >
      <div
        className={css`
          display: flex;
          gap: 0.9rem;
          align-items: flex-start;
        `}
      >
        <div
          className={css`
            padding: 0.35rem 0.9rem;
            border-radius: 999px;
            background: ${showCleared
              ? Color.green(0.15)
              : getToneColor(row.tone, 0.12)};
            color: ${showCleared ? Color.green() : getToneColor(row.tone)};
            font-size: 1.1rem;
            font-weight: 800;
            white-space: nowrap;
          `}
        >
          {row.label}
        </div>
        <div
          className={css`
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          `}
        >
          <div
            className={css`
              font-size: 1.3rem;
              font-weight: 700;
              color: ${Color.darkerGray()};
            `}
          >
            {row.title}
          </div>
          <div
            className={css`
              font-size: 1.18rem;
              color: ${Color.gray()};
              line-height: 1.45;
            `}
          >
            {row.description}
          </div>
        </div>
      </div>
      <div
        className={css`
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 0.55rem;

          @media (max-width: ${mobileMaxWidth}) {
            width: 100%;
            justify-content: flex-start;
          }
        `}
      >
        <ProgressPill
          achieved={row.basicAchieved}
          label="Basic"
        />
        <ProgressPill
          achieved={row.excellenceAchieved}
          label="Excellence"
        />
      </div>
    </div>
  );
}

function ProgressPill({
  achieved,
  label
}: {
  achieved: boolean;
  label: string;
}) {
  return (
    <div
      className={css`
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.38rem 0.72rem;
        border-radius: 999px;
        border: 1px solid
          ${achieved ? Color.green(0.28) : Color.borderGray()};
        background: ${achieved ? Color.green(0.1) : Color.white()};
        color: ${achieved ? Color.green() : Color.darkGray()};
        font-size: 1.05rem;
        font-weight: 700;
        white-space: nowrap;
      `}
    >
      <Icon
        icon={achieved ? 'check' : 'circle'}
        style={{ color: achieved ? Color.green() : Color.gray() }}
      />
      <span>{label}</span>
    </div>
  );
}

function buildRows({
  focus,
  wordle,
  grammarbles,
  aiStory
}: {
  focus: Focus;
  wordle?: any;
  grammarbles?: any;
  aiStory?: any;
}) {
  const rows: BoostRow[] = [];

  if (focus === 'all' || focus === 'wordle') {
    rows.push(buildWordleRow(wordle));
  }
  if (focus === 'all' || focus === 'grammarbles') {
    rows.push(buildGrammarblesRow(grammarbles));
  }
  if (focus === 'all' || focus === 'aiStory') {
    rows.push(buildAIStoryRow(aiStory));
  }

  return rows;
}

function buildWordleRow(wordle: any): BoostRow {
  const solved = !!wordle?.isSolved;
  const failed = !!wordle?.failed;
  const numGuesses = Number(wordle?.numGuesses) || 0;
  const excellenceAchieved = !!wordle?.excellenceQualified;

  let title = `Solve today's Wordle`;
  if (solved) {
    title = numGuesses > 0 ? `Solved in ${numGuesses} guesses` : 'Solved today';
  } else if (failed) {
    title = 'Wordle ended without a solve';
  }

  let description = 'Excellence target: solve in 3 guesses.';
  if (excellenceAchieved) {
    description = '3-guess excellence secured.';
  } else if (solved) {
    description = '3-guess excellence missed for today.';
  } else if (failed) {
    description = '3-guess excellence is closed for today.';
  }

  return {
    label: 'Wordle',
    title,
    description,
    tone: 'orange',
    basicAchieved: !!wordle?.basicQualified,
    excellenceAchieved
  };
}

function buildGrammarblesRow(grammarbles: any): BoostRow {
  const currentLevel = Math.max(1, Number(grammarbles?.currentLevel) || 1);
  const basicAchieved = !!grammarbles?.basicQualified;
  const excellenceAchieved = !!grammarbles?.excellenceQualified;
  const comparisonScore =
    Number.isFinite(Number(grammarbles?.comparisonScore)) &&
    Number(grammarbles?.comparisonScore) > 0
      ? Number(grammarbles.comparisonScore)
      : null;

  let description = 'Excellence target is waiting.';
  switch (grammarbles?.excellenceMode) {
    case 'baseline':
      description =
        currentLevel >= 5
          ? 'No score to beat yet. Excellence target: make all 5 levels perfect.'
          : `No score to beat yet. Excellence target: clear Lv${currentLevel + 1}.`;
      break;
    case 'score-or-next-level':
      description = comparisonScore
        ? `Excellence target: beat yesterday's Lv${currentLevel} score of ${comparisonScore}, or clear Lv${currentLevel + 1}.`
        : `Excellence target: beat yesterday's Lv${currentLevel} score, or clear Lv${currentLevel + 1}.`;
      break;
    case 'total-score':
      description = comparisonScore
        ? `Excellence target: beat yesterday's 5-level total of ${comparisonScore}.`
        : `Excellence target: beat yesterday's 5-level total.`;
      break;
    case 'score':
      description = comparisonScore
        ? `Excellence target: beat yesterday's score benchmark of ${comparisonScore}.`
        : "Excellence target: beat yesterday's score benchmark.";
      break;
    case 'next-level':
      description = `Excellence target: clear Lv${Math.min(currentLevel + 1, 5)}.`;
      break;
    case 'all-perfect':
      description = excellenceAchieved
        ? 'All 5 levels perfect completed.'
        : 'Excellence target: make all 5 levels perfect.';
      break;
    default:
      description = 'Excellence target is waiting.';
  }

  return {
    label: 'Grammarbles',
    title: basicAchieved ? `Lv${currentLevel} cleared` : `Clear Lv${currentLevel}`,
    description,
    tone: 'magenta',
    basicAchieved,
    excellenceAchieved
  };
}

function buildAIStoryRow(aiStory: any): BoostRow {
  const currentLevel = Math.max(1, Number(aiStory?.currentLevel) || 1);
  const highestPassedLevel = Math.max(
    currentLevel,
    Number(aiStory?.highestPassedLevel) || 0
  );
  const basicAchieved = !!aiStory?.basicQualified;
  const hasReading = !!aiStory?.hasReadingClearAtCurrentLevel;
  const hasListening = !!aiStory?.hasListeningClearAtCurrentLevel;
  const excellenceAchieved = !!aiStory?.excellenceQualified;

  let description = `Excellence target: clear both Read and Listen at Lv${currentLevel} or higher.`;
  if (excellenceAchieved) {
    description = 'Read and Listen both cleared.';
  } else if (hasReading && !hasListening) {
    description = `Read is done. Finish Listen at Lv${currentLevel} or higher.`;
  } else if (!hasReading && hasListening) {
    description = `Listen is done. Finish Read at Lv${currentLevel} or higher.`;
  }

  return {
    label: 'AI Story',
    title: basicAchieved
      ? `Lv${highestPassedLevel} cleared`
      : `Clear Lv${currentLevel} or higher`,
    description,
    tone: 'logoBlue',
    basicAchieved,
    excellenceAchieved
  };
}

function getToneColor(tone?: Tone, opacity = 1) {
  switch (tone) {
    case 'green':
      return Color.green(opacity);
    case 'gray':
      return Color.gray(opacity);
    case 'gold':
      return Color.gold(opacity);
    case 'magenta':
      return Color.magenta(opacity);
    case 'orange':
      return Color.orange(opacity);
    case 'logoBlue':
    default:
      return Color.logoBlue(opacity);
  }
}

function withAlpha(color: string, alpha: number) {
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  const rgbaMatch = color.match(
    /rgba?\(([-\d.]+),\s*([-\d.]+),\s*([-\d.]+)(?:,\s*([-\d.]+))?\)/i
  );

  if (rgbaMatch) {
    const [, r, g, b] = rgbaMatch;
    return `rgba(${r}, ${g}, ${b}, ${clampedAlpha})`;
  }

  const hexMatch = color.trim().match(/^#?([0-9a-f]{6})$/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    return `rgba(${parseInt(hex.slice(0, 2), 16)}, ${parseInt(
      hex.slice(2, 4),
      16
    )}, ${parseInt(hex.slice(4, 6), 16)}, ${clampedAlpha})`;
  }

  return color;
}

function getBoostStreakMultiplier(streak: any) {
  const appliedStreak = Math.max(0, Math.floor(Number(streak) || 0));
  return Math.min(Math.floor(Math.max(appliedStreak - 1, 0) / 10) + 2, 10);
}

function formatMultiplier(value: number) {
  return `${Number(value.toFixed(2))}`;
}
