import React, { useEffect, useState } from 'react';
import MeetupBadge from '~/assets/meetup.png';
import ItemPanel from './ItemPanel';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext, useKeyContext } from '~/contexts';

const DARK_CITADEL_PRIVATE_ROOM_PATH = '/app/2610/vigil/megacitadel/private';
// Bridge Builder's step-by-step meetup quest (containers/BridgeBuilderQuest).
// It replaced the old free-text "let us know" form as the entry point; items
// already sent through that form stay reviewable in Management.
export const BRIDGE_BUILDER_QUEST_PATH = '/achievements/bridge-builder';

export default function Meetup({
  isThumb,
  isNotification,
  data: { id, ap, title, description, progressObj, unlockMessage },
  style
}: {
  isThumb?: boolean;
  isNotification?: boolean;
  data: {
    id: number;
    ap: number;
    title: string;
    description: string;
    unlockMessage: string;
    progressObj: { label: string; currentValue: number; targetValue: number };
  };
  style?: React.CSSProperties;
}) {
  const navigate = useNavigate();
  const userId = useKeyContext((v) => v.myState.userId);
  const unlockedAchievementIds = useKeyContext(
    (v) => v.myState.unlockedAchievementIds
  );
  const loadMyMeetupQuestSummary = useAppContext(
    (v) => v.requestHelpers.loadMyMeetupQuestSummary
  );
  const [quest, setQuest] = useState<{
    crewId: number;
    completed?: boolean;
    stepNumber?: number;
    stepLabel?: string;
  } | null>(null);
  const questShown = !isThumb && !isNotification;

  useEffect(() => {
    if (!questShown || !userId) return;
    let active = true;
    loadMyMeetupQuestSummary()
      .then((summary: any) => {
        if (active) setQuest(summary || null);
      })
      .catch(() => {
        if (active) setQuest(null);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questShown, userId]);

  const questButtonLabel = !quest?.crewId
    ? 'Start the meetup quest'
    : quest.completed
    ? 'See your crew'
    : `Open your crew (step ${quest.stepNumber}: ${quest.stepLabel})`;
  return (
    <ErrorBoundary componentPath="AchievementItems/Big/Meetup">
      <ItemPanel
        isThumb={isThumb}
        isNotification={isNotification}
        itemId={id}
        style={style}
        ap={ap}
        isUnlocked={unlockedAchievementIds.includes(id)}
        itemName={title}
        description={description}
        unlockMessage={unlockMessage}
        anyOf
        requirements={[
          <>
            Meet up in real life with at least 3 students from 3 different
            Twinkle branches, with a parent or a Twinkle teacher there. Do
            something educational together and film it: the{' '}
            <Link to={BRIDGE_BUILDER_QUEST_PATH} style={{ fontWeight: 'bold' }}>
              meetup quest
            </Link>{' '}
            walks your crew through it one step at a time
            {questShown && (
              <div style={{ marginTop: '0.8rem' }}>
                <Button
                  size="sm"
                  color="logoBlue"
                  onClick={() => navigate(BRIDGE_BUILDER_QUEST_PATH)}
                >
                  <Icon icon="users" style={{ marginRight: '0.5rem' }} />
                  {questButtonLabel}
                </Button>
              </div>
            )}
          </>,
          <>
            Bring a friend who isn&apos;t on Twinkle yet: play{' '}
            <Link
              to={DARK_CITADEL_PRIVATE_ROOM_PATH}
              style={{ fontWeight: 'bold' }}
            >
              The Dark Citadel
            </Link>{' '}
            together for 10 minutes in a private room while they&apos;re a
            guest, and they sign up (or, if you moderate our Minecraft server,
            vouch for a new player who joins Twinkle)
          </>
        ]}
        progressObj={progressObj}
        badgeSrc={MeetupBadge}
      />
    </ErrorBoundary>
  );
}
