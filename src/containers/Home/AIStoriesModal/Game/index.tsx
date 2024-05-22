import React, { useState } from 'react';
import Listening from './Listening';
import MainMenu from './MainMenu';
import Reading from './Reading';

export default function Game({
  attemptId,
  difficulty,
  displayedSection,
  isGameStarted,
  imageGeneratedCount,
  loadingTopic,
  MainRef,
  onLoadTopic,
  onSetAttemptId,
  onSetIsGameStarted,
  onSetResetNumber,
  onSetDifficulty,
  onSetDisplayedSection,
  onSetDropdownShown,
  onSetIsCloseLocked,
  onSetTopicLoadError,
  storyType,
  topic,
  topicKey,
  topicLoadError
}: {
  attemptId: number;
  difficulty: number;
  displayedSection: string;
  isGameStarted: boolean;
  imageGeneratedCount: number;
  loadingTopic: boolean;
  MainRef: React.RefObject<any>;
  onLoadTopic: (v: any) => void;
  onSetAttemptId: (v: number) => void;
  onSetIsGameStarted: (v: boolean) => void;
  onSetResetNumber: (v: any) => void;
  onSetDifficulty: (v: number) => void;
  onSetDisplayedSection: (v: string) => void;
  onSetDropdownShown: (v: boolean) => void;
  onSetIsCloseLocked: (v: boolean) => void;
  onSetTopicLoadError: (v: boolean) => void;
  storyType: string;
  topic: string;
  topicKey: string;
  topicLoadError: boolean;
}) {
  const [gameMode, setGameMode] = useState('read');
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      {!isGameStarted ? (
        <MainMenu
          difficulty={difficulty}
          onLoadTopic={onLoadTopic}
          loadingTopic={loadingTopic}
          topicLoadError={topicLoadError}
          onSetDifficulty={onSetDifficulty}
          onSetDropdownShown={onSetDropdownShown}
          onSetTopicLoadError={onSetTopicLoadError}
          onStart={(mode: string) => {
            setGameMode(mode);
            onSetIsGameStarted(true);
          }}
        />
      ) : (
        <div style={{ height: '100%', width: '100%' }}>
          {gameMode === 'read' ? (
            <Reading
              attemptId={attemptId}
              difficulty={Number(difficulty)}
              displayedSection={displayedSection}
              imageGeneratedCount={imageGeneratedCount}
              MainRef={MainRef}
              onSetDisplayedSection={onSetDisplayedSection}
              onSetIsGameStarted={onSetIsGameStarted}
              onSetAttemptId={onSetAttemptId}
              onSetIsCloseLocked={onSetIsCloseLocked}
              onSetResetNumber={onSetResetNumber}
              storyType={storyType}
              topic={topic}
              topicKey={topicKey}
            />
          ) : (
            <Listening difficulty={difficulty} />
          )}
        </div>
      )}
    </div>
  );
}
