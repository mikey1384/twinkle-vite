import 'axios';

declare module '*.mp3' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  import type { FunctionComponent, SVGProps } from 'react';

  export const ReactComponent: FunctionComponent<SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module 'html-react-parser' {
  // eslint-disable-next-line no-duplicate-imports
  import type { ReactNode } from 'react';

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

declare module 'axios' {
  export interface AxiosRequestConfig {
    meta?: {
      maxBytes?: number;
    };
  }
}

declare module 'intersection-observer';
