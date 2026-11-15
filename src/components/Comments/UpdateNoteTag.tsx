import React from 'react';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import {
  formatUpdateNoteLabel,
  getBuildUpdateNoteNumber
} from '~/helpers/buildUpdateNote';

// An app owner's Lumine update note is an ordinary comment the server tagged
// with settings.buildUpdateNote (twinkle-api services/updateNotes.ts). The
// tag sits beside the time so the note stands out from ordinary comments.

const tagClass = css`
  display: inline-flex;
  align-items: center;
  margin-left: 0.6rem;
  padding: 0.15rem 0.65rem;
  border-radius: 999px;
  border: 1px solid ${Color.logoBlue(0.35)};
  background: ${Color.logoBlue(0.1)};
  color: ${Color.logoBlue()};
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1.5;
  white-space: nowrap;
  vertical-align: middle;
`;

export default function UpdateNoteTag({
  comment
}: {
  comment?: { settings?: any } | null;
}) {
  // null: not an update note. 0: a note without a number shows "Update".
  const updateNumber = getBuildUpdateNoteNumber(comment);
  if (updateNumber === null) return null;
  return <span className={tagClass}>{formatUpdateNoteLabel(updateNumber)}</span>;
}
