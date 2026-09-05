import React from 'react';
import BatteryMeter from './BatteryMeter';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import AiEnergyRefillNotice from '~/components/AiEnergyRefillNotice';
import {
  getAiEnergyDisplay,
  type AiEnergyDisplayPolicy
} from '~/helpers/aiEnergyDisplay';
import {
  batteryChargeActionCls,
  batteryChargeErrorCls,
  batteryChargeMetaCls,
  heroCardCls,
  heroDescriptionCls,
  heroEyebrowCls,
  heroTitleCls,
  sectionStackCls
} from './styles';

interface Props {
  currentModeLabel: string;
  energyAccentColor: string;
  energyAccentSoft: string;
  energyBorderColor: string;
  energyPolicy: AiEnergyDisplayPolicy | null;
  onRefreshBalance: () => void;
  refillRefreshLoading: boolean;
  refillRefreshError: string;
  energySegments: number;
  heroDescription: string;
  chargeButtonDisabled: boolean;
  chargeButtonLoading: boolean;
  chargeButtonMeta: string;
  chargeButtonShiny: boolean;
  chargeButtonVariant: 'orange' | 'gold';
  onCharge: () => void;
  showChargeButton: boolean;
  chargeError?: string;
}

export default function Overview({
  currentModeLabel,
  energyAccentColor,
  energyAccentSoft,
  energyBorderColor,
  energyPolicy,
  onRefreshBalance,
  refillRefreshLoading,
  refillRefreshError,
  energySegments,
  heroDescription,
  chargeButtonDisabled,
  chargeButtonLoading,
  chargeButtonMeta,
  chargeButtonShiny,
  chargeButtonVariant,
  onCharge,
  showChargeButton,
  chargeError
}: Props) {
  const energyBoltColor = '#f59e0b';
  const energyDisplay = getAiEnergyDisplay(energyPolicy);

  return (
    <div className={sectionStackCls}>
      <section
        className={heroCardCls}
        style={{
          borderColor: energyBorderColor
        }}
      >
        <div
          className={heroEyebrowCls}
          style={{
            color: energyAccentColor
          }}
        >
          Today
        </div>
        <div className={heroTitleCls}>AI Energy overview</div>
        <p className={heroDescriptionCls}>{heroDescription}</p>
        <BatteryMeter
          accentColor={energyAccentColor}
          accentSoft={energyAccentSoft}
          energyPercent={energyDisplay.percent}
          energyPercentLabel={energyDisplay.label}
          modeLabel={currentModeLabel}
          segments={energySegments}
          title={
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <span
                style={{
                  color: energyBoltColor,
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                <Icon icon="bolt" />
              </span>
              AI Energy
            </span>
          }
        />
        <AiEnergyRefillNotice
          centered
          energyPolicy={energyPolicy}
          onRefresh={onRefreshBalance}
          refreshing={refillRefreshLoading}
          refreshError={refillRefreshError}
          refreshLabel="Refresh balance"
        />
        {showChargeButton && (
          <div className={batteryChargeActionCls}>
            <GameCTAButton
              icon="bolt"
              variant={chargeButtonVariant}
              size="lg"
              shiny={chargeButtonShiny}
              loading={chargeButtonLoading}
              disabled={chargeButtonDisabled}
              onClick={onCharge}
              style={{ minWidth: '13rem' }}
            >
              Charge
            </GameCTAButton>
            <div className={batteryChargeMetaCls}>{chargeButtonMeta}</div>
            {chargeError && (
              <div className={batteryChargeErrorCls}>{chargeError}</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
