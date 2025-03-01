import React from 'react';

interface MergingProgressAreaProps {
  isMergingInProgress: boolean;
  mergeProgress: number;
  mergeStage: string;
  isTranslationInProgress: boolean;
  onSetIsMergingInProgress: (isInProgress: boolean) => void;
}

export default function MergingProgressArea({
  isMergingInProgress,
  mergeProgress,
  mergeStage,
  isTranslationInProgress,
  onSetIsMergingInProgress
}: MergingProgressAreaProps) {
  if (!isMergingInProgress) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: isTranslationInProgress ? 160 : 0,
        left: 0,
        right: 0,
        zIndex: 1090, // Below translation progress if both are visible
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
        <h3 style={{ margin: 0 }}>Merging Video with Subtitles</h3>
        <button
          onClick={() => onSetIsMergingInProgress(false)}
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

      {/* Merge Progress */}
      <div
        style={{
          padding: '10px 15px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          border: '1px solid #dee2e6'
        }}
      >
        <div style={{ marginBottom: 5 }}>
          <strong>Progress:</strong> {mergeStage || 'Initializing...'}
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
              width: `${mergeProgress}%`,
              backgroundColor: mergeProgress === 100 ? '#28a745' : '#6c757d',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
        <div style={{ fontSize: '0.9em', marginTop: 5, textAlign: 'right' }}>
          {mergeProgress.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}
