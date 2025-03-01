import React from 'react';

interface BackToTopButtonProps {
  showButton: boolean;
  onClick?: () => void;
}

export default function BackToTopButton({
  showButton,
  onClick
}: BackToTopButtonProps) {
  if (!showButton) return null;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      const topPadding = document.getElementById('top-padding');
      if (topPadding) {
        topPadding.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        zIndex: 1000
      }}
    >
      <button
        onClick={handleClick}
        style={{
          padding: '10px 15px',
          backgroundColor: 'rgba(108, 117, 125, 0.85)',
          backdropFilter: 'blur(3px)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          transition: 'background-color 0.2s, transform 0.2s',
          transform: 'translateZ(0)'
        }}
        title="Back to Top"
      >
        ↑
      </button>
    </div>
  );
}
