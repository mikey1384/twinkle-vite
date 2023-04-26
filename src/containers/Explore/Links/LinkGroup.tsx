import React from 'react';
import LinkItem from './LinkItem';
import { css } from '@emotion/css';

export default function LinkGroup({ links }: { links: any[] }) {
  return (
    <div
      className={css`
        nav {
          margin-bottom: 2rem;
        }
      `}
    >
      {links.map((link) => (
        <LinkItem key={link.id} link={link} />
      ))}
    </div>
  );
}
