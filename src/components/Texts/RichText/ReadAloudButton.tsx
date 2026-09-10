import React from 'react';
import AIAudioButton from './AIAudioButton';
import { READ_ALOUD_DEFAULT_VOICE, isReadAloudEligible } from './readAloud';

// Header-placeable speaker for text that RichText does not render itself
// (for example a page's description header). Same player, billing, and
// eligibility rule as RichText's inline read-aloud tools.
export default function ReadAloudButton({
  text,
  contentKey,
  voice = READ_ALOUD_DEFAULT_VOICE,
  style
}: {
  text: string;
  contentKey: string;
  voice?: string;
  style?: React.CSSProperties;
}) {
  if (!isReadAloudEligible(text)) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', ...style }}>
      <AIAudioButton text={text} voice={voice} contentKey={contentKey} />
    </span>
  );
}
