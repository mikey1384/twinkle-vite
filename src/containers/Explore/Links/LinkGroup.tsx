import React from 'react';
import LinkItem from './LinkItem';
import { css } from '@emotion/css';

export default function LinkGroup({
  anchorPrefix = 'explore-links',
  links
}: {
  anchorPrefix?: string;
  links: any[];
}) {
  return (
    <div
      className={css`
        nav {
          margin-bottom: 2rem;
        }
      `}
    >
      {links.map((link) => (
        <div
          key={link.id}
          data-scroll-anchor-id={`${anchorPrefix}:${link.id}`}
          data-scroll-anchor-secondary-id={String(link.id)}
          data-scroll-anchor-content-key={`url:${link.id}`}
        >
          <LinkItem link={link} />
        </div>
      ))}
    </div>
  );
}
