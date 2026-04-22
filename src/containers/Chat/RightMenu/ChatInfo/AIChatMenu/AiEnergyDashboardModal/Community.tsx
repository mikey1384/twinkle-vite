import React from 'react';
import { css } from '@emotion/css';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import MetricTile from './MetricTile';
import {
  emptyInlineStateCls,
  heroCardCls,
  heroTitleCls,
  metricGridCls,
  requirementIconCls,
  requirementRowCls,
  requirementsListCls,
  sectionStackCls,
  statusPillCls,
  surfaceCardCls,
  surfaceDescriptionCls,
  surfaceTitleCls,
  surfaceTitleRowCls
} from './styles';
import type { CommunityFundRequirement, FundStats } from './types';

interface Props {
  communityAccentColor: string;
  communityAccentSoft: string;
  communityRechargeDailyCap: number;
  communityRechargeCoinsRemaining: number;
  communityRechargeUnlocked: boolean;
  communityStatusLabel: string;
  energyAccentColor: string;
  fundStats: FundStats;
  onOpenChessPuzzle?: () => void;
  onOpenLumineBuild?: () => void;
  requirements: CommunityFundRequirement[];
  totalFunds: number;
}

export default function Community({
  communityAccentColor,
  communityAccentSoft,
  communityRechargeDailyCap,
  communityRechargeCoinsRemaining,
  communityRechargeUnlocked,
  communityStatusLabel,
  energyAccentColor,
  fundStats,
  onOpenChessPuzzle,
  onOpenLumineBuild,
  requirements,
  totalFunds
}: Props) {
  function getCompactRequirementLabel(label: string) {
    switch (label) {
      case 'Chess puzzle XP':
        return 'Chess puzzle XP';
      case 'Lumine build generation':
        return 'Lumine build';
      default:
        return label;
    }
  }

  const totalCommunityCoinsUsed = Math.max(
    0,
    Number(fundStats.totalDonationsAllTime || 0) - Number(totalFunds || 0)
  );

  function getRequirementAction(label: string) {
    switch (label) {
      case 'Chess puzzle XP':
        return onOpenChessPuzzle;
      case 'Lumine build generation':
        return onOpenLumineBuild;
      default:
        return undefined;
    }
  }

  function getRequirementActionLabel(label: string) {
    switch (label) {
      case 'Chess puzzle XP':
        return 'Play';
      case 'Lumine build generation':
        return 'Open';
      default:
        return 'Open';
    }
  }

  return (
    <div className={sectionStackCls}>
      <section
        className={heroCardCls}
        style={{
          borderColor: Color.rose(0.2)
        }}
      >
        <div className={heroTitleCls}>Community recharges</div>
        <div className={metricGridCls}>
          <MetricTile
            accentColor={communityAccentColor}
            icon="coins"
            label="Fund balance"
            value={`${addCommasToNumber(totalFunds)} coins`}
          />
          <MetricTile
            accentColor={communityAccentColor}
            icon="coins"
            label="All-time donated"
            value={`${addCommasToNumber(fundStats.totalDonationsAllTime)} coins`}
          />
          <MetricTile
            accentColor={energyAccentColor}
            icon="bolt"
            label="Used so far"
            value={`${addCommasToNumber(totalCommunityCoinsUsed)} coins`}
          />
        </div>
      </section>

      <section className={surfaceCardCls}>
        <div className={surfaceTitleRowCls}>
          <div className={surfaceTitleCls}>Community recharge tasks</div>
          <div
            className={statusPillCls}
            style={{
              color: communityRechargeUnlocked
                ? Color.green()
                : communityAccentColor,
              background: communityRechargeUnlocked
                ? Color.green(0.1)
                : communityAccentSoft
            }}
          >
            {communityStatusLabel}
          </div>
        </div>
        <p className={surfaceDescriptionCls}>
          Complete these to unlock sponsored AI recharges. Daily cap:{' '}
          {addCommasToNumber(communityRechargeDailyCap)} coins. Remaining
          today: {addCommasToNumber(communityRechargeCoinsRemaining)} coins.
        </p>
        {requirements.length > 0 ? (
          <div className={requirementsListCls}>
            {requirements.map((requirement) => {
              const onClick = requirement.done
                ? undefined
                : getRequirementAction(requirement.label);
              const requirementLabel = `${getCompactRequirementLabel(
                requirement.label
              )}${
                typeof requirement.required === 'number'
                  ? requirement.label === 'Chess puzzle XP'
                    ? ` (${requirement.current || 0}/${requirement.required} xp)`
                    : ` (${requirement.current || 0}/${requirement.required})`
                  : ''
              }`;

              return (
                <div
                  key={requirement.key}
                  className={requirementRowCls}
                  style={{
                    borderColor: requirement.done
                      ? Color.green(0.22)
                      : 'var(--ui-border)',
                    background: requirement.done ? Color.green(0.07) : '#fff'
                  }}
                >
                  <div className={requirementMainCls}>
                    <span
                      className={requirementIconCls}
                      style={{
                        color: requirement.done ? Color.green() : Color.darkGray()
                      }}
                    >
                      <Icon icon={requirement.done ? 'check' : 'times'} />
                    </span>
                    <span className={requirementLabelCls}>
                      {requirementLabel}
                    </span>
                  </div>
                  {onClick ? (
                    <Button
                      className={requirementActionButtonCls}
                      color="logoBlue"
                      variant="soft"
                      tone="raised"
                      size="sm"
                      shape="pill"
                      uppercase={false}
                      onClick={onClick}
                    >
                      {getRequirementActionLabel(requirement.label)}
                      <Icon icon="arrow-right" />
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={emptyInlineStateCls}>
            Tasks unavailable right now.
          </div>
        )}
      </section>
    </div>
  );
}

const requirementMainCls = css`
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.7rem;
`;

const requirementLabelCls = css`
  min-width: 0;
  word-break: break-word;
`;

const requirementActionButtonCls = css`
  margin-left: auto;
  flex-shrink: 0;
`;
