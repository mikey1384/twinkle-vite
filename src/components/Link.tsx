import React, {
  ReactNode,
  CSSProperties,
  Ref,
  MouseEvent,
  AnchorHTMLAttributes,
  DetailedHTMLProps
} from 'react';
import { useNavigate } from 'react-router-dom';

interface LinkProps
  extends DetailedHTMLProps<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  > {
  innerRef?:
    | Ref<HTMLAnchorElement>
    | ((instance: HTMLAnchorElement | null) => void);
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  target?: string;
  to?: string;
}

export default function Link({
  innerRef,
  className,
  to,
  onClick = () => {},
  children,
  style,
  target,
  ...props
}: LinkProps) {
  const navigate = useNavigate();
  return to ? (
    <a
      {...props}
      ref={innerRef}
      className={className}
      style={{
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        ...style
      }}
      href={to}
      onClick={handleLinkClick}
    >
      {children}
    </a>
  ) : (
    <div
      className={className}
      style={{
        whiteSpace: 'pre-wrap',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        ...style
      }}
    >
      {children}
    </div>
  );

  function handleLinkClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (target) return window.open(to, target);
    navigate(to!);
    onClick();
  }
}
