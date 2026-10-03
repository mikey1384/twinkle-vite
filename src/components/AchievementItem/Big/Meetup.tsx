import React, { useEffect, useState } from 'react';
import MeetupBadge from '~/assets/bridge-builder.png'; // Bridge Builder (once Face to Face)
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
// the example stories (containers/BridgeBuilderQuest/Story)
const BRIDGE_BUILDER_EXAMPLES_PATH = '/bridge-builder/examples';

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
  const trackMeetupQuestView = useAppContext(
    (v) => v.requestHelpers.trackMeetupQuestView
  );
  const [quest, setQuest] = useState<{
    crewId: number;
    completedCount?: number;
    stepNumber?: number;
    stepLabel?: string;
  } | null>(null);
  const questShown = !isThumb && !isNotification;

  useEffect(() => {
    if (!questShown || !userId) return;
    trackMeetupQuestView('card_view');
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

  // the quest stays open after the achievement unlocks: members can plan
  // meetup after meetup
  const questButtonLabel = quest?.crewId
    ? `Open your crew (step ${quest.stepNumber}: ${quest.stepLabel})`
    : quest?.completedCount
    ? 'Plan another meetup'
    : 'Start the meetup quest';
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
              <div
                style={{
                  marginTop: '0.8rem',
                  display: 'flex',
                  gap: '0.6rem',
                  flexWrap: 'wrap',
                  alignItems: 'center'
                }}
              >
                <Button
                  size="sm"
                  color="logoBlue"
                  onClick={() => navigate(BRIDGE_BUILDER_QUEST_PATH)}
                >
                  <Icon icon="users" style={{ marginRight: '0.5rem' }} />
                  {questButtonLabel}
                </Button>
                <Button
                  size="sm"
                  variant="soft"
                  color="logoBlue"
                  onClick={() => navigate(BRIDGE_BUILDER_EXAMPLES_PATH)}
                >
                  <Icon icon="wand-magic-sparkles" style={{ marginRight: '0.5rem' }} />
                  See what a finished meetup looks like
                </Button>
              </div>
            )}
          </>,
          <>
            Bring 7 friends who aren&apos;t on Twinkle yet: for each one, play{' '}
            <Link
              to={DARK_CITADEL_PRIVATE_ROOM_PATH}
              style={{ fontWeight: 'bold' }}
            >
              The Dark Citadel
            </Link>{' '}
            together for 10 minutes in a private room while they&apos;re a
            guest, and they sign up (or, if you moderate our Minecraft server,
            vouch for new players who join Twinkle)
          </>
        ]}
        progressObj={progressObj}
        badgeSrc={MeetupBadge}
      />
    </ErrorBoundary>
  );
}
