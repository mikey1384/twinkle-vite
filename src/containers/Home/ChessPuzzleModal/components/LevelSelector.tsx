import React from 'react';
import Icon from '~/components/Icon';
import { Color } from '~/constants/css';
import { useChessStats } from '~/helpers/hooks/useChessStats';

interface LevelSelectorProps {
  onClose?: () => void;
}

export default function LevelSelector({ onClose }: LevelSelectorProps) {
  const { stats, loading, error } = useChessStats();

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <Icon icon="spinner" pulse style={{ fontSize: '2rem' }} />
        <div style={{ marginTop: '1rem' }}>Loading chess statistics...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div
        style={{
          padding: '2rem',
          textAlign: 'center',
          color: Color.darkerGray()
        }}
      >
        {error || 'Failed to load chess statistics'}
      </div>
    );
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 2000) return Color.gold();
    if (rating >= 1600) return Color.purple();
    if (rating >= 1200) return Color.blue();
    return Color.green();
  };

  const getLevelColor = (level: number) => {
    if (level >= 40) return Color.gold();
    if (level >= 30) return Color.purple();
    if (level >= 20) return Color.blue();
    if (level >= 10) return Color.green();
    return Color.gray();
  };

  return (
    <div
      style={{
        padding: '1.5rem',
        background: Color.whiteGray(),
        borderRadius: '0.5rem',
        border: `1px solid ${Color.borderGray()}`
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}
      >
        <h3 style={{ margin: 0, color: Color.black() }}>
          <Icon icon="chess-knight" style={{ marginRight: '0.5rem' }} />
          Chess Statistics
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: Color.gray(),
              fontSize: '1.2rem'
            }}
          >
            <Icon icon="times" />
          </button>
        )}
      </div>

      {/* Rating Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div
          style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '0.5rem',
            textAlign: 'center',
            border: `2px solid ${getRatingColor(stats.rating)}`
          }}
        >
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: getRatingColor(stats.rating),
              marginBottom: '0.5rem'
            }}
          >
            {stats.rating}
          </div>
          <div style={{ color: Color.gray(), fontSize: '0.9rem' }}>Rating</div>
          <div
            style={{
              color: Color.darkerGray(),
              fontSize: '0.8rem',
              marginTop: '0.25rem'
            }}
          >
            ±{Math.round(stats.ratingDeviation)}
          </div>
        </div>

        <div
          style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '0.5rem',
            textAlign: 'center',
            border: `2px solid ${getLevelColor(stats.level)}`
          }}
        >
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: getLevelColor(stats.level),
              marginBottom: '0.5rem'
            }}
          >
            {stats.level}
          </div>
          <div style={{ color: Color.gray(), fontSize: '0.9rem' }}>Level</div>
          <div
            style={{
              color: Color.darkerGray(),
              fontSize: '0.8rem',
              marginTop: '0.25rem'
            }}
          >
            {stats.gamesPlayed} games
          </div>
        </div>
      </div>

      {/* XP Progress */}
      <div
        style={{
          background: 'white',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}
        >
          <span style={{ color: Color.black(), fontWeight: 'bold' }}>
            Experience Points
          </span>
          <span style={{ color: Color.gray(), fontSize: '0.9rem' }}>
            {stats.isMaxLevel ? 'MAX LEVEL' : `${stats.progressPercent}%`}
          </span>
        </div>

        <div
          style={{
            background: Color.lightGray(),
            height: '0.5rem',
            borderRadius: '0.25rem',
            overflow: 'hidden',
            marginBottom: '0.5rem'
          }}
        >
          <div
            style={{
              background: stats.isMaxLevel ? Color.gold() : Color.logoBlue(),
              height: '100%',
              width: `${stats.progressPercent}%`,
              transition: 'width 0.3s ease'
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: Color.gray()
          }}
        >
          <span>{stats.xpInCurrentLevel} XP</span>
          {!stats.isMaxLevel && <span>{stats.xpNeededForNext} XP needed</span>}
        </div>
      </div>

      {/* Recent Activity */}
      {stats.lastPlayedAt && (
        <div
          style={{
            fontSize: '0.8rem',
            color: Color.gray(),
            textAlign: 'center'
          }}
        >
          Last played: {new Date(stats.lastPlayedAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
