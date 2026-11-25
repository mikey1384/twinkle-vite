import React, { useEffect, useState } from 'react';
import MeetupBadge from '~/assets/bridge-builder.png'; // Bridge Builder (once Face to Face)
import ItemPanel from './ItemPanel';
import ErrorBoundary from '~/components/ErrorBoundary';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useNavigate } from 'react-router-dom';
import { Color } from '~/constants/css';
import { useAppContext, useKeyContext } from '~/contexts';
import { FACE_TO_FACE_RECRUIT_TARGET } from '~/constants/meetupQuest';

// Bridge Builder (containers/BridgeBuilderQuest): people brought onto Twinkle
// (invited friends who join and learn) or met in person (check-ins), or one
// meetup with a grown-up there. Items sent through the old
// free-text form stay reviewable in Management.
export const BRIDGE_BUILDER_QUEST_PATH = '/achievements/bridge-builder';

export default function Meetup({
  isThumb,
  isNotification,
  data: { id, ap, title, description, unlockMessage },
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
          <>Crew: make a crew with Twinkle friends and meet up together.</>,
          <>
            Show friends around: take {FACE_TO_FACE_RECRUIT_TARGET} different
            Twinkle friends on the tour of Twinkle Minecraft World.
          </>
        ]}
        afterRequirements={
          <>
            {questShown && (
              <div
                style={{
                  marginTop: '1rem',
                  display: 'flex',
                  gap: '0.6rem',
                  flexWrap: 'wrap'
                }}
              >
                <Button
                  size="sm"
                  color="green"
                  onClick={() => navigate(BRIDGE_BUILDER_QUEST_PATH)}
                >
                  <Icon icon="arrow-right" style={{ marginRight: '0.5rem' }} />
                  How it works
                </Button>
                {!!quest?.crewId && (
                  <Button
                    size="sm"
                    variant="soft"
                    color="logoBlue"
                    onClick={() =>
                      navigate(
                        `${BRIDGE_BUILDER_QUEST_PATH}/crew/${quest.crewId}`
                      )
                    }
                  >
                    <Icon icon="users" style={{ marginRight: '0.5rem' }} />
                    Open your crew
                  </Button>
                )}
              </div>
            )}
            {!isNotification && (
              <div
                style={{
                  marginTop: '1rem',
                  fontSize: '1.1rem',
                  color: Color.gray()
                }}
              >
                Or the original way: meet up in person with a parent or Twinkle
                teacher there, 3 or more students from different Twinkle
                branches, doing something educational on video. Mikey awards
                it.
              </div>
            )}
          </>
        }
        badgeSrc={MeetupBadge}
      />
    </ErrorBoundary>
  );
}
