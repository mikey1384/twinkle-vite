import React, { useState, useMemo } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import Input from '~/components/Texts/Input';
import Link from '~/components/Link';
import ProgressBar from '~/components/ProgressBar';
import { css, cx } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { DONOR_ACHIEVEMENT_THRESHOLD } from '~/constants/defaultValues';
import { useKeyContext, useAppContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import ItemPanel from './ItemPanel';
import { homePanelClass } from '~/theme/homePanels';
import { getThemeRoles, ThemeName } from '~/theme/themes';

export default function DonorLicenseItem({
  karmaPoints,
  loading,
  canDonate,
  donatedCoins = 0,
  style
}: {
  karmaPoints: number;
  loading: boolean;
  canDonate?: boolean;
  donatedCoins?: number;
  style?: React.CSSProperties;
}) {
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const userId = useKeyContext((v) => v.myState.userId);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const unlockDonorLicense = useAppContext(
    (v) => v.requestHelpers.unlockDonorLicense
  );
  const makeDonation = useAppContext((v) => v.requestHelpers.makeDonation);
  const [donationAmount, setDonationAmount] = useState('');
  const [donating, setDonating] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const donationAmountNumber = useMemo(() => {
    const num = parseInt(donationAmount.replace(/,/g, '')) || 0;
    return num;
  }, [donationAmount]);

  const insufficientCoins = useMemo(() => {
    return donationAmountNumber > (twinkleCoins || 0);
  }, [donationAmountNumber, twinkleCoins]);

  const canMakeDonation = useMemo(() => {
    return donationAmountNumber > 0 && !insufficientCoins && !donating;
  }, [donationAmountNumber, insufficientCoins, donating]);

  const progress = useMemo(() => {
    return Math.ceil(100 * (donatedCoins / DONOR_ACHIEVEMENT_THRESHOLD));
  }, [donatedCoins]);

  const achievementCompleted = useMemo(() => {
    return donatedCoins >= DONOR_ACHIEVEMENT_THRESHOLD;
  }, [donatedCoins]);

  const profileTheme = useKeyContext((v) => v.myState.profileTheme);
  const themeName = useMemo<ThemeName>(
    () => ((profileTheme || 'logoBlue') as ThemeName),
    [profileTheme]
  );
  const themeRoles = useMemo(() => getThemeRoles(themeName), [themeName]);
  const headingColor = useMemo(() => {
    const key = themeRoles.sectionPanelText?.color as
      | keyof typeof Color
      | undefined;
    const fn =
      key && (Color[key] as ((opacity?: number) => string) | undefined);
    return fn ? fn() : Color.darkerGray();
  }, [themeRoles.sectionPanelText?.color]);
  const accentColor = useMemo(() => {
    const key = themeRoles.sectionPanel?.color as
      | keyof typeof Color
      | undefined;
    const fn =
      key && (Color[key] as ((opacity?: number) => string) | undefined);
    return fn ? fn() : Color.logoBlue();
  }, [themeRoles.sectionPanel?.color]);
  const panelVars = useMemo(
    () =>
      ({
        ['--home-panel-bg' as const]: '#ffffff',
        ['--home-panel-tint' as const]: Color.logoBlue(0.08),
        ['--home-panel-border' as const]: Color.borderGray(0.65),
        ['--home-panel-heading' as const]: headingColor,
        ['--home-panel-accent' as const]: accentColor,
        ['--home-panel-gap' as const]: '2rem',
        ...style
      }) as React.CSSProperties,
    [accentColor, headingColor, style]
  );

  if (!canDonate) {
    return (
      <ItemPanel
        itemKey="donate"
        itemName="Donor License"
        itemDescription={
          <div>
            <p style={{ marginBottom: '1rem' }}>
              Unlock the ability to donate your Twinkle Coins and work toward
              the{' '}
              <Link to="/achievements" style={{ fontWeight: 'bold' }}>
                Big Donor
              </Link>{' '}
              achievement.
            </p>
          </div>
        }
        locked={true}
        karmaPoints={karmaPoints}
        loading={loading}
        onUnlock={handleUnlock}
        unlocking={unlocking}
        style={style}
      />
    );
  }

  return (
    <div
      className={cx(
        homePanelClass,
        css`
          padding: 2rem;
          gap: 2rem;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 1.5rem;
          }
        `
      )}
      style={panelVars}
    >
      <div
        className={css`
          display: flex;
          align-items: center;
          margin-bottom: 2rem;
        `}
      >
        <Icon
          icon="heart"
          className={css`
            color: ${Color.rose()};
            margin-right: 1rem;
            font-size: 2.5rem;
            filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
          `}
        />
        <div>
          <h2
            className={css`
              font-size: 2.2rem;
              font-weight: 700;
              color: ${Color.black()};
              margin: 0;
              letter-spacing: -0.02em;
              text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5);
            `}
          >
            You are a Licensed Donor
          </h2>
          <p
            className={css`
              margin: 0.5rem 0 0 0;
              color: ${Color.darkGray()};
              font-size: 1.4rem;
              font-weight: 500;
            `}
          >
            By donating, you make it possible for others to use{' '}
            <strong>Think Hard mode</strong> for Zero and Ciel for free.
          </p>
        </div>
      </div>

      <div
        className={css`
          background: linear-gradient(
            135deg,
            #fff 0%,
            ${Color.wellGray()} 100%
          );
          border-radius: ${borderRadius};
          padding: 1.5rem;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.03),
            inset 0 -1px 2px rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.01);
        `}
      >
        <h3
          className={css`
            font-size: 1.7rem;
            font-weight: 600;
            color: ${Color.black()};
            margin: 0 0 1.5rem 0;
            display: flex;
            align-items: center;
            text-shadow: 0 1px 1px rgba(255, 255, 255, 0.3);
          `}
        >
          <Icon
            icon="coins"
            className={css`
              margin-right: 0.8rem;
              color: ${Color.orange()};
              font-size: 1.8rem;
              filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
            `}
          />
          Donate Twinkle Coins
        </h3>

        <div
          className={css`
            margin-bottom: 1.5rem;
          `}
        >
          <label
            className={css`
              display: block;
              font-size: 1.4rem;
              font-weight: 500;
              color: ${Color.darkGray()};
              margin-bottom: 0.8rem;
            `}
          >
            Amount to Donate
          </label>
          <Input
            placeholder="Enter amount (e.g., 1,000)..."
            value={donationAmount}
            onChange={handleAmountChange}
            style={{
              fontSize: '1.6rem',
              padding: '1rem'
            }}
          />
          {donationAmount && (
            <div
              className={css`
                margin-top: 0.8rem;
                font-size: 1.3rem;
                color: ${insufficientCoins ? Color.red() : Color.darkGray()};
                display: flex;
                justify-content: space-between;
                align-items: center;
              `}
            >
              <span>
                Balance:{' '}
                <strong>{addCommasToNumber(twinkleCoins || 0)} coins</strong>
              </span>
              {insufficientCoins && (
                <span
                  className={css`
                    color: ${Color.red()};
                    font-weight: 600;
                  `}
                >
                  Not enough coins!
                </span>
              )}
            </div>
          )}
        </div>

        <Button
          filled
          disabled={!canMakeDonation}
          loading={donating}
          onClick={handleDonate}
          className={css`
            width: 100%;
            font-size: 1.6rem;
            background: linear-gradient(
                180deg,
                rgba(255, 255, 255, 0.2) 0%,
                rgba(0, 0, 0, 0.05) 100%
              ),
              ${Color.rose()};
            border: 1px solid rgba(0, 0, 0, 0.05);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);

            &:active:not(:disabled) {
              transform: translateY(1px);
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1),
                inset 0 1px 3px rgba(0, 0, 0, 0.2);
            }

            &:disabled {
              background: ${Color.borderGray()};
              box-shadow: none;
            }
          `}
        >
          <Icon
            icon="heart"
            className={css`
              margin-right: 0.8rem;
              filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
            `}
          />
          Donate {donationAmount ? addCommasToNumber(donationAmountNumber) : ''}{' '}
          Coins
        </Button>

        <div
          className={css`
            margin-top: 1.5rem;
            padding: 1.2rem;
            background: ${achievementCompleted
              ? 'linear-gradient(135deg, #fff 0%, #f8fffe 50%, #fff 100%)'
              : '#fff'};
            border-radius: ${borderRadius};
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.8);
            border: ${achievementCompleted
              ? `2px solid ${Color.gold()}`
              : '1px solid rgba(0, 0, 0, 0.01)'};
          `}
        >
          <div
            className={css`
              display: flex;
              align-items: center;
              margin-bottom: 1rem;
            `}
          >
            <Icon
              icon={achievementCompleted ? 'crown' : 'trophy'}
              className={css`
                color: ${achievementCompleted ? Color.gold() : Color.orange()};
                margin-right: 0.8rem;
                font-size: 1.6rem;
                filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
              `}
            />
            <span
              className={css`
                font-size: 1.5rem;
                font-weight: 600;
                color: ${Color.black()};
                text-shadow: 0 1px 1px rgba(255, 255, 255, 0.3);
              `}
            >
              {achievementCompleted ? (
                <>
                  🎉{' '}
                  <Link to="/achievements" style={{ fontWeight: 600 }}>
                    Big Donor Achievement
                  </Link>{' '}
                  Unlocked!
                </>
              ) : (
                <>
                  Progress toward{' '}
                  <Link to="/achievements" style={{ fontWeight: 600 }}>
                    Big Donor Achievement
                  </Link>
                </>
              )}
            </span>
          </div>

          {achievementCompleted ? (
            <div
              className={css`
                text-align: center;
                padding: 1.5rem;
                background: linear-gradient(
                  135deg,
                  ${Color.gold()}15 0%,
                  ${Color.gold()}05 100%
                );
                border-radius: ${borderRadius};
                border: 1px solid ${Color.gold()}30;
              `}
            >
              <div
                className={css`
                  font-size: 3rem;
                  margin-bottom: 0.5rem;
                `}
              >
                👑
              </div>
              <h3
                className={css`
                  margin: 0 0 0.8rem 0;
                  font-weight: bold;
                  font-size: 1.8rem;
                  color: ${Color.black()};
                  text-shadow: 0 1px 1px rgba(255, 255, 255, 0.5);
                `}
              >
                Congratulations!
              </h3>
              <p
                className={css`
                  margin: 0 0 1rem 0;
                  font-size: 1.4rem;
                  color: ${Color.darkGray()};
                  line-height: 1.4;
                `}
              >
                You've donated{' '}
                <strong>{addCommasToNumber(donatedCoins)}</strong> Twinkle Coins
                and achieved the prestigious{' '}
                <Link to="/achievements" style={{ fontWeight: 'bold' }}>
                  Big Donor
                </Link>{' '}
                status!
              </p>
              <p
                className={css`
                  margin: 0;
                  font-size: 1.3rem;
                  color: ${Color.logoBlue()};
                  font-weight: 600;
                `}
              >
                Thank you for your incredible generosity to the Twinkle
                community! 💙
              </p>
            </div>
          ) : (
            <div style={{ width: '100%' }}>
              <h3
                className={css`
                  margin-bottom: 0.5rem;
                  font-weight: bold;
                  font-size: 1.4rem;
                  color: ${Color.black()};
                `}
              >
                Twinkle Coins donated: {addCommasToNumber(donatedCoins)}
              </h3>
              <ProgressBar progress={progress} />
              <p
                className={css`
                  margin: 0.8rem 0 0 0;
                  font-size: 1.2rem;
                  color: ${Color.darkGray()};
                  line-height: 1.4;
                `}
              >
                Donate{' '}
                <strong>
                  {addCommasToNumber(DONOR_ACHIEVEMENT_THRESHOLD)}
                </strong>{' '}
                total coins to unlock this achievement
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  async function handleUnlock() {
    setUnlocking(true);
    try {
      const success = await unlockDonorLicense();
      if (success) {
        onSetUserState({
          userId,
          newState: { canDonate: true }
        });
      }
    } catch (error) {
      console.error('Failed to unlock donor license:', error);
    }
    setUnlocking(false);
  }

  async function handleDonate() {
    if (!canMakeDonation) return;

    setDonating(true);
    try {
      const { coins, donatedCoins } = await makeDonation(donationAmountNumber);

      onSetUserState({
        userId,
        newState: {
          twinkleCoins: coins,
          donatedCoins
        }
      });
      setDonationAmount('');
    } catch (error) {
      console.error('Failed to make donation:', error);
    }
    setDonating(false);
  }

  function handleAmountChange(value: string) {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, '');
    // Add commas for formatting
    const formatted = addCommasToNumber(parseInt(numbers) || 0);
    setDonationAmount(numbers === '0' ? '' : formatted);
  }
}
