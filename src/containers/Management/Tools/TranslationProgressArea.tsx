import React from 'react';

interface SubtitleProgressInfo {
  current?: number;
  total?: number;
  warning?: string;
}

interface TranslationProgressAreaProps {
  isTranslationInProgress: boolean;
  progress: number;
  progressStage: string;
  translationProgress: number;
  translationStage: string;
  subtitleProgress?: SubtitleProgressInfo;
  onSetIsTranslationInProgress: (isInProgress: boolean) => void;
}

export default function TranslationProgressArea({
  isTranslationInProgress,
  progress,
  progressStage,
  translationProgress,
  translationStage,
  subtitleProgress,
  onSetIsTranslationInProgress
}: TranslationProgressAreaProps) {
  if (!isTranslationInProgress) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        padding: '15px',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(5px)',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '5px'
        }}
      >
        <h3 style={{ margin: 0 }}>Translation in Progress</h3>
        <button
          onClick={() => onSetIsTranslationInProgress(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          ×
        </button>
      </div>

      {/* Audio Processing Progress */}
      {(progress > 0 || progressStage) && (
        <div
          style={{
            padding: '10px 15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #dee2e6'
          }}
        >
          <div style={{ marginBottom: 5 }}>
            <strong>Audio Processing:</strong> {progressStage || 'Starting...'}
          </div>
          <div
            style={{
              height: '20px',
              backgroundColor: '#e9ecef',
              borderRadius: '4px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: progress === 100 ? '#28a745' : '#007bff',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
          <div style={{ fontSize: '0.9em', marginTop: 5, textAlign: 'right' }}>
            {progress.toFixed(1)}%
          </div>
        </div>
      )}

      {/* Translation Progress */}
      {(translationProgress > 0 || translationStage) && (
        <div
          style={{
            padding: '10px 15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #dee2e6'
          }}
        >
          <div style={{ marginBottom: 5 }}>
            <strong>Progress:</strong> {translationStage || 'Initializing...'}
            {subtitleProgress?.current && subtitleProgress?.total ? (
              <span>
                {' '}
                ({subtitleProgress.current}/{subtitleProgress.total})
              </span>
            ) : null}
            {subtitleProgress?.warning ? (
              <div
                style={{
                  color: '#856404',
                  backgroundColor: '#fff3cd',
                  padding: '5px',
                  marginTop: '5px',
                  borderRadius: '3px'
                }}
              >
                Warning: {subtitleProgress.warning}
              </div>
            ) : null}
          </div>
          <div
            style={{
              height: '20px',
              backgroundColor: '#e9ecef',
              borderRadius: '4px',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${translationProgress}%`,
                backgroundColor:
                  translationProgress === 100 ? '#28a745' : '#17a2b8',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
          <div style={{ fontSize: '0.9em', marginTop: 5, textAlign: 'right' }}>
            {translationProgress.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}
