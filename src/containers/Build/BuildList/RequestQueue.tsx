import React from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import type { BuildProjectListItemData } from '~/containers/Build/shared/components/ProjectListItem';
import { borderRadius, mobileMaxWidth } from '~/constants/css';

const displayFontFamily =
  "'Trebuchet MS', 'Comic Sans MS', 'Segoe UI', 'Arial Rounded MT Bold', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif";

const requestQueueClass = css`
  margin: -0.8rem 0 1.4rem;
  padding: 1rem;
  border-radius: ${borderRadius};
  border: 1px solid rgba(236, 72, 153, 0.22);
  background: #fff7fb;
  box-shadow: 0 4px 14px rgba(190, 24, 93, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const requestQueueHeaderClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const requestQueueTitleClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--chat-text);
  font-size: 1.25rem;
  font-weight: 900;
  font-family: ${displayFontFamily};
`;

const requestQueueCountClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.38rem 0.7rem;
  border-radius: 999px;
  background: rgba(236, 72, 153, 0.12);
  border: 1px solid rgba(236, 72, 153, 0.28);
  color: #be185d;
  font-size: 1.1rem;
  font-weight: 900;
`;

const requestQueueRowsClass = css`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

const requestQueueRowClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 12px;
  border: 1px solid rgba(236, 72, 153, 0.16);
  background: rgba(255, 255, 255, 0.78);
  @media (max-width: ${mobileMaxWidth}) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const requestQueueBuildClass = css`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const requestQueueBuildTitleClass = css`
  color: var(--chat-text);
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1.2;
  overflow-wrap: anywhere;
`;

const requestQueueMetaClass = css`
  color: var(--chat-text);
  opacity: 0.68;
  font-size: 1.1rem;
  font-weight: 700;
`;

export default function RequestQueue({
  builds,
  totalCount,
  onOpenBuildRequests
}: {
  builds: BuildProjectListItemData[];
  totalCount: number;
  onOpenBuildRequests: (build: BuildProjectListItemData) => void;
}) {
  if (totalCount <= 0) return null;
  return (
    <section className={requestQueueClass}>
      <div className={requestQueueHeaderClass}>
        <div className={requestQueueTitleClass}>
          <Icon icon="comments" />
          Join requests
        </div>
        <div className={requestQueueCountClass}>
          <Icon icon="exclamation-circle" />
          {totalCount === 1 ? '1 pending' : `${totalCount} pending`}
        </div>
      </div>
      <div className={requestQueueRowsClass}>
        {builds.map((build) => {
          const requestCount = Number(
            build.pendingCollaborationRequestCount || 0
          );
          return (
            <div key={build.id} className={requestQueueRowClass}>
              <div className={requestQueueBuildClass}>
                <div className={requestQueueBuildTitleClass}>
                  {build.title || 'Untitled Build'}
                </div>
                <div className={requestQueueMetaClass}>
                  {requestCount === 1
                    ? '1 person asked to join'
                    : `${requestCount} people asked to join`}
                </div>
              </div>
              <GameCTAButton
                variant="pink"
                size="sm"
                icon="comments"
                onClick={() => onOpenBuildRequests(build)}
              >
                Review
              </GameCTAButton>
            </div>
          );
        })}
      </div>
    </section>
  );
}
