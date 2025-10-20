import React, { useMemo, useState } from 'react';
import Icon from '~/components/Icon';
import Editor from './Editor';
import { borderRadius, Color } from '~/constants/css';
import { css } from '@emotion/css';
import { useRoleColor } from '~/theme/useRoleColor';

export default function CreatorView({
  missionId,
  onSetMissionState,
  tutorialPrompt,
  tutorialButtonLabel
}: {
  missionId: number;
  onSetMissionState: (info: { missionId: number; newState: any }) => void;
  tutorialPrompt?: string;
  tutorialButtonLabel?: string;
}) {
  const linkRole = useRoleColor('link', { fallback: 'logoBlue' });
  const linkColor = useMemo(
    () => linkRole.getColor() || Color.logoBlue(),
    [linkRole]
  );
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          color: linkColor,
          fontSize: '1.5rem',
          marginTop: '-1.7rem',
          marginLeft: '-1rem',
          marginBottom: '2rem'
        }}
      >
        {!isEditing && (
          <span
            className={css`
              cursor: pointer;
              font-weight: bold;
              &:hover {
                text-decoration: underline;
              }
            `}
            onClick={() => setIsEditing(true)}
          >
            <Icon icon="pencil-alt" />
            <span style={{ marginLeft: '0.7rem' }}>
              This is the preview for your tutorial prompt. Tap here to edit
            </span>
          </span>
        )}
      </div>
      {isEditing ? (
        <Editor
          missionId={missionId}
          onSetMissionState={onSetMissionState}
          tutorialPrompt={tutorialPrompt}
          tutorialButtonLabel={tutorialButtonLabel}
          onClose={() => setIsEditing(false)}
        />
      ) : (
        <div
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            flexDirection: 'column'
          }}
        >
          <h2 style={{ marginBottom: '2rem' }}>
            {tutorialPrompt || 'Need Help? Read the Tutorial'}
          </h2>
          <div
            style={{
              fontSize: '2rem',
              padding: '1rem',
              borderRadius,
              border: '1px solid var(--ui-border)'
            }}
          >
            {tutorialButtonLabel || 'Show Tutorial'}
          </div>
        </div>
      )}
    </div>
  );
}
