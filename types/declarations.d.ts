declare module '*.gif' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.mp3' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  import React from 'react';
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement>
  >;
  const src: string;
  export default src;
}

declare module 'react-sanitized-html' {
  import { ComponentType } from 'react';

  export interface SanitizedHTMLProps {
    allowedAttributes?: {
      [key: string]: string[];
    };
    allowedTags?: string[];
    html: string;
  }

  const SanitizedHTML: ComponentType<SanitizedHTMLProps>;

  export default SanitizedHTML;
}

declare module 'html-react-parser' {
  import { ReactNode } from 'react';

  export interface Attributes {
    [key: string]: string | undefined;
  }

  export interface DOMNode {
    type: 'text' | 'tag' | 'comment';
    name?: string;
    data?: string;
    attribs?: Attributes;
    children?: DOMNode[];
  }

  export interface Options {
    replace?: (domNode: DOMNode) => ReactNode | void;
  }

  function parse(html: string, options?: Options): ReactNode;

  export default parse;
}

declare module 'intersection-observer';
