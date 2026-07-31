import React from 'react';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import StudioHero from '~/containers/Build/StudioHero';

export default function PromptHero({
  onOpenWorkshop
}: {
  onOpenWorkshop: () => void;
}) {
  return (
    <StudioHero
      badgeIcon="robot"
      badgeLabel="Prompt Studio"
      title="AI Prompts"
      description="Create a custom AI personality in the Prompt Workshop, then save it to Zero or Ciel."
      action={
        <GameCTAButton
          variant="primary"
          size="lg"
          shiny
          icon="wand-magic-sparkles"
          onClick={onOpenWorkshop}
        >
          Design your AI
        </GameCTAButton>
      }
    />
  );
}
