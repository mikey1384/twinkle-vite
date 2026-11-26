import React from 'react';
import { css } from '@emotion/css';
import { useParams } from 'react-router-dom';
import ErrorBoundary from '~/components/ErrorBoundary';
import OpenWandCard from '~/components/SponsoredHelp/OpenWandCard';
import { mobileMaxWidth } from '~/constants/css';

// /wand/<id>: an open wand card on its own (a shared link). In a Subject or
// comment the same card is drawn inline by the rich-text embed.
export default function WandCardPage() {
  const { openCardId } = useParams();
  const id = Number(openCardId);
  return (
    <ErrorBoundary componentPath="WandCardPage">
      <div
        className={css`
          width: 100%;
          padding: 3rem 1rem 6rem;
          display: flex;
          justify-content: center;
          @media (max-width: ${mobileMaxWidth}) {
            padding: 1.5rem 1rem 6rem;
          }
        `}
      >
        {id > 0 ? <OpenWandCard openCardId={id} /> : null}
      </div>
    </ErrorBoundary>
  );
}
