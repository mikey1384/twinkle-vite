import React from 'react';
import Embedly from '~/components/Embedly';

export default function UrlDetails({
  contentId,
  title
}: {
  contentId: number;
  title: string;
}) {
  return (
    <div>
      <span
        style={{
          fontWeight: 'bold',
          fontSize: '2rem'
        }}
        className="label"
      >
        {title}
      </span>
      <Embedly
        small
        noLink
        style={{ marginTop: '0.5rem' }}
        contentId={contentId}
      />
    </div>
  );
}
