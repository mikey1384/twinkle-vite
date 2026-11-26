import React, { useMemo } from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { openWandIdsInText, removeOpenWandEmbed } from '~/helpers/sponsoredHelp';
import OpenWandCard from './OpenWandCard';

// Under a composer's text: every open wand card the draft embeds, drawn as
// readers will see it, each with Remove (which takes its line out of the
// text). Nothing shows for a draft without one.
export default function WandDraftPreview({
  text,
  onChange
}: {
  text: string;
  onChange: (text: string) => void;
}) {
  const ids = useMemo(() => openWandIdsInText(text), [text]);
  if (!ids.length) return null;
  return (
    <div className={wrapClass} data-wand-draft-preview>
      <span className={captionClass}>How readers will see it</span>
      {ids.map((id) => (
        <OpenWandCard key={id} openCardId={id} asReader onRemove={() => onChange(removeOpenWandEmbed(text, id))} />
      ))}
    </div>
  );
}

const wrapClass = css`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const captionClass = css`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${Color.gray()};
`;
