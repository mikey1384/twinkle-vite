import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface SanitizedHTMLProps {
  allowedAttributes?:
    | {
        [key: string]: string[];
      }
    | {
        '*': string[];
      };
  allowedTags?: string[];
  html: string;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export default function SanitizedHTML({
  allowedAttributes,
  allowedTags,
  html,
  onClick,
  className,
  style
}: SanitizedHTMLProps) {
  const sanitizedHTML = useMemo(() => {
    const config: DOMPurify.Config = {};

    if (allowedTags?.length) {
      config.ALLOWED_TAGS = allowedTags;
    }

    if (allowedAttributes && Object.keys(allowedAttributes).length > 0) {
      const wildcardAttributes = (allowedAttributes as { '*': string[] })['*'] || [];
      const mergedAttributes = new Set(wildcardAttributes);

      for (const [tagName, attributes] of Object.entries(allowedAttributes)) {
        if (tagName === '*') continue;
        for (const attribute of attributes) {
          mergedAttributes.add(attribute);
        }
      }

      config.ALLOWED_ATTR = Array.from(mergedAttributes);
    }

    return DOMPurify.sanitize(html || '', config);
  }, [allowedAttributes, allowedTags, html]);

  return (
    <div
      className={className}
      onClick={onClick}
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
}
