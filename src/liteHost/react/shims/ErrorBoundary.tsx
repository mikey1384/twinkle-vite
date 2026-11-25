// The lite host's stand-in for components/ErrorBoundary (vite.lite-host
// .config.ts swaps it in for that build only). Same props and the same
// wrapper markup, without the website's recovery screen, which links to
// member profiles and pulls in the whole rich-text stack. A failed box shows
// a short message instead of breaking the page above the app.
import React, { Component } from 'react';

interface Props {
  children?: React.ReactNode;
  className?: string;
  draggable?: boolean;
  innerRef?: React.RefObject<any> | ((instance: any) => void);
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (event: React.DragEvent<HTMLDivElement>) => void;
  userId?: number;
  username?: string;
  componentPath: string;
  style?: React.CSSProperties;
}

export default class ErrorBoundary extends Component<
  Props,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[lumine host]', this.props.componentPath, error);
  }

  render() {
    const { children, innerRef, componentPath, userId, username, ...props } =
      this.props;
    void componentPath;
    void userId;
    void username;
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{ padding: '1.5rem', textAlign: 'center', ...props.style }}
        >
          Something went wrong here. Please reload the page.
        </div>
      );
    }
    return Object.keys(props).length > 0 ? (
      <div ref={innerRef as any} {...props}>
        {children}
      </div>
    ) : (
      <>{children}</>
    );
  }
}
