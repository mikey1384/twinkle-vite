import React, { useState } from 'react';
import PdfPreview from './index';
import { getPdfAttachmentName } from '~/helpers/pdfAttachment';

interface PdfAttachmentLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href?: string;
  fileName?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

// An anchor remains an anchor: copy-link, modified clicks and external PDFs
// keep working. A normal click on our PDF opens the shared viewer.
export default function PdfAttachmentLink({
  href = '',
  fileName,
  children,
  onClick,
  ...props
}: PdfAttachmentLinkProps) {
  const [open, setOpen] = useState(false);
  const [aboveAssistant, setAboveAssistant] = useState(false);
  const pdfName = getPdfAttachmentName(href);
  return (
    <>
      <a {...props} href={href} onClick={handleClick}>
        {children}
      </a>
      {open && pdfName && (
        <PdfPreview
          key={href}
          src={href}
          fileName={fileName || pdfName}
          aboveAssistant={aboveAssistant}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      !pdfName ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    setAboveAssistant(!!event.currentTarget.closest('[data-website-agent-ui]'));
    setOpen(true);
  }
}
