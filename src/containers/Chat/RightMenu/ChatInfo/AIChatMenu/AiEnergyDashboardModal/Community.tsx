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
  communityDailyCapAvailable: boolean;
  communityFundHasEnoughCoins: boolean;
  communityRechargeDailyCap: number;
  communityRechargeCoinsRemaining: number;
  communityRequirementsComplete: boolean;
  communityRechargeReady: boolean;
  communityStatusLabel: string;
  communitySponsoredChargeUnlocked: boolean;
  energyAccentColor: string;
  fundStats: FundStats;
  onOpenChessPuzzle?: () => void;
  onOpenLumineBuild?: () => void;
  rechargeCost: number;
  requirements: CommunityFundRequirement[];
  totalFunds: number;
}

export default function Community({
  communityAccentColor,
  communityAccentSoft,
  communityDailyCapAvailable,
  communityFundHasEnoughCoins,
  communityRechargeDailyCap,
  communityRechargeCoinsRemaining,
  communityRequirementsComplete,
  communityRechargeReady,
  communityStatusLabel,
  communitySponsoredChargeUnlocked,
  energyAccentColor,
  fundStats,
  onOpenChessPuzzle,
  onOpenLumineBuild,
  rechargeCost,
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
  const formattedRechargeCost = `${addCommasToNumber(rechargeCost)} coins`;
  const communityNotice = communityRechargeReady
    ? 'Sponsored recharge ready. When your battery hits 0%, the next full charge is free.'
    : communityRequirementsComplete && !communitySponsoredChargeUnlocked
      ? "Tasks are done, but today's sponsored recharges are already used."
      : communitySponsoredChargeUnlocked && !communityDailyCapAvailable
        ? "Tasks are done, but today's sponsored limit is already used up."
        : communitySponsoredChargeUnlocked && !communityFundHasEnoughCoins
        ? `Tasks are done, but the community fund is below ${formattedRechargeCost} right now.`
        : requirements.length > 0
          ? 'Complete the tasks below to unlock the next sponsored recharge.'
          : 'Tasks unavailable right now.';
  const communityNoticeStyle = communityRechargeReady
    ? {
        color: Color.green(),
        borderColor: Color.green(0.22),
        background: Color.green(0.08)
      }
    : (communityRequirementsComplete && !communitySponsoredChargeUnlocked) ||
        (communitySponsoredChargeUnlocked &&
          (!communityDailyCapAvailable || !communityFundHasEnoughCoins))
      ? {
          color: Color.orange(),
          borderColor: Color.orange(0.22),
          background: Color.orange(0.08)
        }
      : {
          color: Color.darkGray(),
          borderColor: Color.rose(0.18),
          background: '#fff'
        };

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
            label="Used all-time"
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
              color: communityRechargeReady
                ? Color.green()
                : (communityRequirementsComplete &&
                    !communitySponsoredChargeUnlocked) ||
                    (communitySponsoredChargeUnlocked &&
                      (!communityDailyCapAvailable ||
                        !communityFundHasEnoughCoins))
                  ? Color.orange()
                  : communityAccentColor,
              background: communityRechargeReady
                ? Color.green(0.1)
                : (communityRequirementsComplete &&
                    !communitySponsoredChargeUnlocked) ||
                    (communitySponsoredChargeUnlocked &&
                      (!communityDailyCapAvailable ||
                        !communityFundHasEnoughCoins))
                  ? Color.orange(0.1)
                  : communityAccentSoft
            }}
          >
            {communityStatusLabel}
          </div>
        </div>
        <p className={surfaceDescriptionCls}>
          1 sponsored recharge = {formattedRechargeCost}. Daily sponsored
          limit: {addCommasToNumber(communityRechargeDailyCap)} coins. Left
          today: {addCommasToNumber(communityRechargeCoinsRemaining)} coins.
        </p>
        <div className={emptyInlineStateCls} style={communityNoticeStyle}>
          {communityNotice}
        </div>
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
