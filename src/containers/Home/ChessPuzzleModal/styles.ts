import { css } from '@emotion/css';

// Heavy animation styles moved out of component for performance
export const checkmateFireworksOverlay = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  pointer-events: none;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(
    circle,
    rgba(255, 215, 0, 0.1) 0%,
    rgba(255, 69, 0, 0.05) 50%,
    transparent 100%
  );
  animation: checkmateFireworks 2s ease-out;

  @keyframes checkmateFireworks {
    0% {
      background: transparent;
      opacity: 0;
    }
    20% {
      background: radial-gradient(
        circle,
        rgba(255, 215, 0, 0.15) 0%,
        rgba(255, 69, 0, 0.08) 50%,
        transparent 100%
      );
      opacity: 1;
    }
    60% {
      background: radial-gradient(
        circle,
        rgba(255, 215, 0, 0.1) 0%,
        rgba(255, 69, 0, 0.05) 50%,
        transparent 100%
      );
    }
    100% {
      background: transparent;
      opacity: 0;
    }
  }
`;

export const checkmateText = css`
  text-align: center;
  color: #ffd700;
  font-size: 3.5rem;
  font-weight: 800;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.8),
    0 0 30px rgba(255, 215, 0, 0.4);
  animation: checkmateText 2s ease-out;

  @keyframes checkmateText {
    0% {
      transform: scale(0.7);
      opacity: 0;
    }
    30% {
      transform: scale(1.05);
      opacity: 1;
    }
    60% {
      transform: scale(1);
    }
    100% {
      transform: scale(1);
      opacity: 0.9;
    }
  }
`;

export const checkmateSparkle = css`
  font-size: 1.5rem;
  margin-top: 0.75rem;
  color: #ffa500;
  font-weight: 700;
  animation: sparkle 1.5s infinite alternate;

  @keyframes sparkle {
    0% {
      text-shadow: 0 0 3px rgba(255, 165, 0, 0.6);
    }
    100% {
      text-shadow: 0 0 10px rgba(255, 165, 0, 0.8),
        0 0 15px rgba(255, 215, 0, 0.6);
    }
  }
`;

export const aiCheckmateOverlay = css`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  pointer-events: none;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(
    circle,
    rgba(220, 20, 60, 0.15) 0%,
    rgba(139, 0, 0, 0.08) 50%,
    transparent 100%
  );
  animation: aiCheckmateEffect 2s ease-out;

  @keyframes aiCheckmateEffect {
    0% {
      background: transparent;
      opacity: 0;
    }
    20% {
      background: radial-gradient(
        circle,
        rgba(220, 20, 60, 0.12) 0%,
        rgba(139, 0, 0, 0.06) 50%,
        transparent 100%
      );
      opacity: 1;
    }
    60% {
      background: radial-gradient(
        circle,
        rgba(220, 20, 60, 0.08) 0%,
        rgba(139, 0, 0, 0.04) 50%,
        transparent 100%
      );
    }
    100% {
      background: transparent;
      opacity: 0;
    }
  }
`;

export const aiCheckmateText = css`
  text-align: center;
  color: #dc143c;
  font-size: 3.5rem;
  font-weight: 800;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.6), 0 0 18px rgba(220, 20, 60, 0.8),
    0 0 25px rgba(220, 20, 60, 0.5);
  animation: aiCheckmateText 2s ease-out;

  @keyframes aiCheckmateText {
    0% {
      transform: scale(0.7);
      opacity: 0;
    }
    30% {
      transform: scale(1.05);
      opacity: 1;
    }
    60% {
      transform: scale(1);
    }
    100% {
      transform: scale(1);
      opacity: 0.9;
    }
  }
`;

export const aiCheckmateSparkle = css`
  font-size: 1.5rem;
  margin-top: 0.75rem;
  color: #b22222;
  font-weight: 700;
  animation: redSparkle 1.5s infinite alternate;

  @keyframes redSparkle {
    0% {
      text-shadow: 0 0 3px rgba(178, 34, 34, 0.6);
    }
    100% {
      text-shadow: 0 0 10px rgba(178, 34, 34, 0.8),
        0 0 15px rgba(220, 20, 60, 0.6);
    }
  }
`;

export const primaryButton = css`
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 1.25rem 2rem;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1.25rem;
  font-weight: 700;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

  &:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const secondaryButton = css`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: #475569;
  border: 2px solid #cbd5e1;
  padding: 1.25rem 2rem;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1.25rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
    border-color: #94a3b8;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const successButton = css`
  background: linear-gradient(135deg, #10b981 0%, #047857 100%);
  color: white;
  border: none;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.125rem;
  font-weight: 700;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

  &:hover {
    background: linear-gradient(135deg, #059669 0%, #065f46 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    cursor: not-allowed;
    transform: none !important;
    opacity: 0.6;
  }
`;
