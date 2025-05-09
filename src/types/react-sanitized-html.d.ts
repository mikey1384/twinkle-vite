declare module 'react-sanitized-html' {
  import * as React from 'react';

  export interface SanitizedHTMLProps {
    allowedAttributes?:
      | {
          [key: string]: string[];
        }
      | {
          '*': string[]; // Support for wildcard attributes
        };
    allowedTags?: string[];
    html: string;
    onClick?: () => void;
    className?: string;
    style?: React.CSSProperties;
  }

  const SanitizedHTML: React.ComponentType<SanitizedHTMLProps>;
  export default SanitizedHTML;
}
