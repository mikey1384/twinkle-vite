import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Icon from '~/components/Icon';
import ProgressBar from '~/components/ProgressBar';
import ProfilePic from '~/components/ProfilePic';
import useUserPopupTrigger from '~/components/UserPopup/useUserPopupTrigger';
import UserListModal from '~/components/Modals/UserListModal';
import ShareButton from '~/components/Buttons/ShareButton';
import AskAgentButton from '~/components/Buttons/AskAgentButton';
import { Link } from 'react-router-dom';
import { css, cx } from '@emotion/css';
import { Color, borderRadius, mobileMaxWidth } from '~/constants/css';
import { useAppContext } from '~/contexts';
import type { User as SiteUser } from '~/types';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { homePanelClass } from '~/theme/homePanels';
import { useHomePanelVars } from '~/theme/hooks/useHomePanelVars';

interface Achiever {
  id: number;
  profilePicUrl: string;
}

interface User extends Achiever {
  loaded?: boolean;
  username: string;
}

export interface AchievementPhase {
  label: string;
  type?: 'bar' | 'check';
  currentValue?: number;
  targetValue?: number;
  floor?: number;
  completed: boolean;
}

export default function ItemPanel({
  ap,
  itemId,
  itemName,
  isThumb,
  isNotification,
  isUnlocked,
  description,
  unlockMessage,
  requirements = [],
  anyOf = false,
  badgeSrc,
  milestones,
  progressObj,
  phases,
  style
}: {
  ap: number;
  itemId: number;
  itemName: string;
  isThumb?: boolean;
  isNotification?: boolean;
  isUnlocked?: boolean;
  description?: string;
  unlockMessage?: string;
  requirements?: React.ReactNode[];
  // the requirements are alternative ways (any one unlocks it), not a checklist
  anyOf?: boolean;
  badgeSrc?: string;
  milestones?: { name: string; completed: boolean }[];
  progressObj?: { label: string; currentValue: number; targetValue: number };
  phases?: AchievementPhase[];
  style?: React.CSSProperties;
}) {
  const loadUsersByAchievementId = useAppContext(
    (v) => v.requestHelpers.loadUsersByAchievementId
  );
  const achieverObj = useAppContext((v) => v.user.state.achieverObj);
  const achievers = achieverObj[itemId] || [];
  const onSetAchievers = useAppContext((v) => v.user.actions.onSetAchievers);

  const [userListModalShown, setUserListModalShown] = useState(false);

  const achievementsObj = useAppContext((v) => v.user.state.achievementsObj);
  const achievementType = useMemo(() => {
    if (!achievementsObj) return '';
    for (const key in achievementsObj) {
      if (achievementsObj[key]?.id === itemId) return key;
    }
    return '';
  }, [achievementsObj, itemId]);
  const achievementPath = achievementType
    ? `/achievements/${achievementType}`
    : '';
  const shareShown = !isThumb && !isNotification && !!achievementType;

  const milestonesShown = milestones && milestones.length > 0 && !isUnlocked;
  const anyMilestoneCompleted =
    milestones && milestones.some((m) => m.completed);
  const shouldHideRequirements = milestonesShown && anyMilestoneCompleted;

  const { panelVars } = useHomePanelVars();
  const panelStyle = useMemo(() => {
    const base = style ? { ...panelVars, ...style } : panelVars;
    return {
      ...base,
      ['--home-panel-surface' as const]: '#ffffff'
    } as React.CSSProperties;
  }, [panelVars, style]);

  const displayedAP = useMemo(
    () => (typeof ap === 'number' ? addCommasToNumber(ap) : null),
    [ap]
  );

  const progress = useMemo(() => {
    if (progressObj) {
      const { currentValue, targetValue } = progressObj;
      return Math.ceil(100 * (currentValue / targetValue));
    } else {
      return 0;
    }
  }, [progressObj]);

  const phasesShown = !!(phases && phases.length > 0 && !isUnlocked);
  // Phases reveal sequentially: show every completed phase plus the first
  // incomplete one (the active step); hide everything after it.
  const visiblePhases = useMemo(() => {
    if (!phasesShown || !phases) return [];
    const firstIncomplete = phases.findIndex((p) => !p.completed);
    const cutoff = firstIncomplete === -1 ? phases.length : firstIncomplete + 1;
    return phases.slice(0, cutoff);
  }, [phasesShown, phases]);

  const displayedAccomplishers = useMemo(
    () => achievers.slice(0, 10),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [achievers?.length]
  );

  const fetchAccomplishers = useCallback(async () => {
    try {
      const { users } = await loadUsersByAchievementId(itemId);
      onSetAchievers({
        achievementId: itemId,
        achievers: users
      });
    } catch (error) {
      console.error('Error fetching accomplishers:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  useEffect(() => {
    fetchAccomplishers();
  }, [fetchAccomplishers]);

  const displayedAchieversLength = useMemo(
    () => addCommasToNumber(achievers.length),
    [achievers.length]
  );

  return (
    <div
      className={cx(
        homePanelClass,
        css`
          position: relative;
          display: grid;
          grid-template-columns: auto 1fr 1fr;
          grid-template-areas:
            'badge title title'
            'badge description description'
            'badge ${shouldHideRequirements
              ? 'milestones milestones'
              : milestonesShown
              ? 'requirements milestones'
              : 'requirements requirements'}'
            'accomplishers accomplishers accomplishers';
          gap: 2rem;
          align-items: start;
          padding: 1.6rem 2rem;
          @media (max-width: ${mobileMaxWidth}) {
            grid-template-columns: 1fr;
            grid-template-areas:
              'title'
              'badge'
              'description'
              ${shouldHideRequirements ? '' : "'requirements'"}
              ${milestonesShown ? "'milestones'" : ''}
              'accomplishers';
          }
        `
      )}
      style={panelStyle}
    >
      {badgeSrc && (
        <img
          src={badgeSrc}
          alt="Badge"
          loading="lazy"
          className={css`
            grid-area: badge;
            width: 13rem;
            height: 13rem;
            justify-self: center;
          `}
        />
      )}
      {!isThumb && (
        <div
          className={css`
            grid-area: title;
            display: flex;
            flex-wrap: wrap;
            align-items: flex-start;
            gap: 0.8rem 1.2rem;
            min-width: 0;
          `}
        >
          <h2
            className={css`
              font-weight: bold;
              font-size: 2rem;
              flex: 1 1 24rem;
              min-width: 0;
            `}
            style={{ color: Color.black() }}
          >
            {shareShown ? (
              <Link
                to={achievementPath}
                className={css`
                  color: ${Color.black()};
                  &:hover {
                    color: ${Color.black()};
                    text-decoration: underline;
                  }
                `}
              >
                {itemName}
              </Link>
            ) : (
              itemName
            )}{' '}
            <span
              className={css`
                white-space: nowrap;
              `}
            >
              {displayedAP && (
                <span
                  className={css`
                    margin-left: 0.5rem;
                    font-size: 1.6rem;
                    color: ${Color.darkGray()};
                    font-weight: normal;
                  `}
                >
                  ({displayedAP} AP)
                </span>
              )}
              {!isNotification &&
                (isUnlocked ? (
                  <Icon
                    color={Color.green()}
                    className={css`
                      margin-left: 1rem;
                    `}
                    icon="check"
                  />
                ) : (
                  <Icon
                    color={Color.darkGray()}
                    className={css`
                      margin-left: 1rem;
                    `}
                    icon="lock"
                  />
                ))}
            </span>
          </h2>
          {shareShown && (
            <div
              className={css`
                display: flex;
                flex: 0 0 auto;
                align-items: center;
                justify-content: flex-end;
                gap: 0.6rem;
                max-width: 100%;
                margin-left: auto;
              `}
            >
              {/* help earning one you do not have yet */}
              {!isUnlocked && (
                <AskAgentButton
                  label="How do I earn this?"
                  style={{ padding: '0.4rem 0.9rem' }}
                  context={{
                    // the server reads the achievement and the member's own
                    // progress toward it
                    kind: 'achievement',
                    id: itemId,
                    label: `the "${itemName}" achievement`,
                    path: achievementPath
                  }}
                />
              )}
              <ShareButton
                linkPath={achievementPath}
                buttonStyle={{ fontSize: '1.1rem' }}
              />
            </div>
          )}
        </div>
      )}
      {!isThumb && (
        <div
          className={css`
            grid-area: description;
          `}
        >
          <p
            className={css`
              color: ${Color.darkerGray()};
              font-size: 1.5rem;
            `}
          >
            {description}
            {!isNotification && isUnlocked && unlockMessage
              ? ` ${unlockMessage}`
              : ''}
          </p>
        </div>
      )}
      {!isThumb && !shouldHideRequirements && (
        <div
          className={css`
            grid-area: requirements;
          `}
        >
          <h3
            className={css`
              margin-top: 1.5rem;
              font-weight: bold;
              font-size: 1.7rem;
              color: ${Color.black()};
            `}
          >
            {anyOf && requirements.length > 1
              ? 'Unlock it any one of these ways'
              : `Requirement${requirements.length > 1 ? 's' : ''}`}
          </h3>
          {requirements.map((requirement, index) => (
            <div
              key={index}
              className={css`
                margin-top: 0.3rem;
                color: ${Color.darkerGray()};
                font-size: 1.3rem;
              `}
            >
              {!isNotification && isUnlocked && (
                <div
                  className={css`
                    display: inline-block;
                    font-size: 1.6rem;
                    width: 2rem;
                  `}
                >
                  <Icon color={Color.green()} icon="check" />
                </div>
              )}
              {!isUnlocked && requirements.length > 1 ? (
                <span
                  className={css`
                    font-weight: bold;
                    margin-right: 0.5rem;
                  `}
                >
                  {anyOf ? `Way ${index + 1}:` : `${index + 1}.`}
                </span>
              ) : (
                ''
              )}
              {requirement}
            </div>
          ))}
          {phasesShown &&
            visiblePhases.map((phase, index) => {
              const isCurrent = !phase.completed;
              const floor = phase.floor || 0;
              const denom = (phase.targetValue || 0) - floor;
              const fraction =
                phase.type === 'bar' && denom > 0
                  ? Math.min(
                      100,
                      Math.max(
                        0,
                        Math.ceil(
                          100 * (((phase.currentValue || 0) - floor) / denom)
                        )
                      )
                    )
                  : phase.completed
                    ? 100
                    : 0;
              return (
                <div key={index} style={{ width: '100%', marginTop: '1.5rem' }}>
                  <h3
                    className={css`
                      margin-bottom: -0.5rem;
                      font-weight: bold;
                      font-size: 1.5rem;
                      color: ${Color.black()};
                      display: flex;
                      align-items: center;
                      gap: 0.6rem;
                    `}
                  >
                    <Icon
                      color={
                        phase.completed ? Color.green() : Color.darkerGray()
                      }
                      icon={phase.completed ? 'check' : ['far', 'circle']}
                    />
                    <span>
                      {phase.label}
                      {phase.type === 'bar' &&
                      isCurrent &&
                      typeof phase.currentValue === 'number'
                        ? `: ${addCommasToNumber(phase.currentValue)}${
                            typeof phase.targetValue === 'number'
                              ? ` / ${addCommasToNumber(phase.targetValue)}`
                              : ''
                          }`
                        : ''}
                    </span>
                  </h3>
                  {phase.type === 'bar' && isCurrent && (
                    <ProgressBar progress={fraction} />
                  )}
                </div>
              );
            })}
          {progressObj && !isUnlocked && !phasesShown && (
            <div style={{ width: '100%', marginTop: '1.5rem' }}>
              <h3
                className={css`
                  margin-top: 1.7rem;
                  margin-bottom: -0.5rem;
                  font-weight: bold;
                  font-size: 1.5rem;
                  color: ${Color.black()};
                `}
              >
                {progressObj.label ? `${progressObj.label}: ` : ''}
                {addCommasToNumber(progressObj.currentValue)}
              </h3>
              <ProgressBar progress={progress} />
            </div>
          )}
        </div>
      )}
      {milestonesShown && !isNotification && !isThumb && (
        <div
          className={css`
            grid-area: milestones;
            margin-top: 1.5rem;
          `}
        >
          <h3
            className={css`
              font-weight: bold;
              font-size: 1.7rem;
              color: ${Color.black()};
            `}
          >
            Check List
          </h3>
          <ul
            className={css`
              list-style: none;
              padding-left: 0;
            `}
          >
            {milestones.map((milestone, index) => (
              <li
                key={index}
                className={css`
                  justify-content: flex-start;
                  display: flex;
                  align-items: center;
                  color: ${Color.darkerGray()};
                  font-size: 1.3rem;
                  border-bottom: 1px solid var(--ui-border);
                  @media (max-width: ${mobileMaxWidth}) {
                    justify-content: center;
                  }
                `}
              >
                <div
                  className={css`
                    display: inline-block;
                    font-size: 1.6rem;
                    width: 2rem;
                  `}
                >
                  {milestone.completed ? (
                    <Icon color={Color.green()} icon="check" />
                  ) : !isNotification ? (
                    <Icon color={Color.darkerGray()} icon={['far', 'circle']} />
                  ) : (
                    ' '
                  )}
                </div>
                {milestone.name}
              </li>
            ))}
          </ul>
          {progressObj && !isUnlocked && (
            <div style={{ width: '100%', marginTop: '1.5rem' }}>
              <h3
                className={css`
                  margin-top: 1.7rem;
                  margin-bottom: -0.5rem;
                  font-weight: bold;
                  font-size: 1.5rem;
                  color: ${Color.black()};
                `}
              >
                {progressObj.label ? `${progressObj.label}: ` : ''}
                {addCommasToNumber(progressObj.currentValue)}
              </h3>
              <ProgressBar progress={progress} />
            </div>
          )}
        </div>
      )}
      {achievers.length > 0 && (
        <div
          className={css`
            grid-area: accomplishers;
            border-radius: ${borderRadius};
            padding: 0 1rem 1rem 1rem;
            transition: all 0.3s ease-in-out;
          `}
        >
          <h3
            className={css`
              font-weight: bold;
              font-size: 1.5rem;
              color: ${Color.black()};
              margin-bottom: 1rem;
              text-align: center;
            `}
          >
            Achieved by
          </h3>
          <div
            className={css`
              display: flex;
              flex-wrap: wrap;
              gap: 1rem;
              align-items: center;
              justify-content: center;
            `}
          >
            {displayedAccomplishers.map((achiever: Achiever) => (
              <AchieverFace key={achiever.id} achiever={achiever as User} />
            ))}
          </div>
          {achievers.length > 10 && (
            <div
              className={css`
                width: 100%;
                display: flex;
                justify-content: center;
              `}
            >
              <a
                onClick={() => setUserListModalShown(true)}
                className={css`
                  cursor: pointer;
                  font-weight: bold;
                  color: ${Color.blue()};
                  cursor: pointer;
                  font-size: 1.3rem;
                  padding: 0.5rem 1rem;
                  margin-top: 1rem;
                  transition: background-color 0.2s ease-in-out;
                  &:hover {
                    text-decoration: underline;
                  }
                `}
              >
                Show all ({displayedAchieversLength})
              </a>
            </div>
          )}
        </div>
      )}
      {userListModalShown && (
        <UserListModal
          onHide={() => setUserListModalShown(false)}
          title={`Users who achieved "${itemName}"`}
          users={achievers as User[]}
        />
      )}
    </div>
  );
}

const achieverFaceClass = css`
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  overflow: hidden;
  transition: all 0.2s ease-in-out;
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  @media (max-width: ${mobileMaxWidth}) {
    width: 3rem;
    height: 3rem;
  }
`;

// The site's profile card on hover (desktop) or tap, like a username. A tap
// stops there, so it never opens the achievement embed around it.
function AchieverFace({ achiever }: { achiever: User }) {
  const { triggerRef, popup, onMouseEnter, onMouseLeave, onClick } =
    useUserPopupTrigger<HTMLDivElement>({
      user: achiever as unknown as SiteUser
    });
  return (
    <div
      ref={triggerRef}
      className={achieverFaceClass}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <ProfilePic
        style={{
          width: '100%',
          height: '100%',
          cursor: 'pointer'
        }}
        userId={achiever.id}
        profilePicUrl={achiever.profilePicUrl}
      />
      {popup}
    </div>
  );
}
