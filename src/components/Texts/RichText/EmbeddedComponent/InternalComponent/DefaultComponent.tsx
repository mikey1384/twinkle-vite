import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { capitalize } from '~/helpers/stringHelpers';

export default function DefaultComponent({
  linkType,
  src
}: {
  linkType: string;
  src: string;
}) {
  const linkLabel = useMemo(
    () =>
      capitalize(
        linkType === 'ai-cards' ? 'AI Cards' : linkType ? linkType : 'Home'
      ),
    [linkType]
  );

  return (
    <div>
      <Link to={src} style={{ fontWeight: 'bold' }}>
        <u>
          Go to {linkLabel}
          {}
        </u>
      </Link>
    </div>
  );
}
