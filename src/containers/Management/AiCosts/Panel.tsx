import React from 'react';
import { panelClass } from './styles';

export function Panel({
  title,
  note,
  action,
  children
}: {
  title: string;
  note?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={panelClass}>
      <header>
        <div>
          <h2>{title}</h2>
          {note ? <span>{note}</span> : null}
        </div>
        {action}
      </header>
      <div>{children}</div>
    </section>
  );
}
