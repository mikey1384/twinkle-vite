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

declare module '*.svg' {
  import React from 'react';
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement>
  >;
  const src: string;
  export default src;
}
