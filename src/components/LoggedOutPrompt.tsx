import React, { CSSProperties, ReactNode } from 'react';
import { css, cx } from '@emotion/css';
import Button from '~/components/Button';
import { Color, mobileMaxWidth } from '~/constants/css';
import { useAppContext } from '~/contexts';

const rootClass = css`
  width: 100%;
  height: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1.5rem 3rem;
  text-align: center;
  background: #fff;
  box-sizing: border-box;
`;

const contentClass = css`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
`;

const badgeWrapClass = css`
  display: flex;
  justify-content: center;
`;

const titleClass = css`
  margin: 0;
  width: 100%;
  max-width: 72rem;
  color: var(--chat-text, ${Color.black()});
  font-size: clamp(2.3rem, 4.8vw, 3.3rem);
  font-weight: 900;
  line-height: 1.14;
`;

const bodyClass = css`
  margin: 0;
  max-width: 42rem;
  color: var(--chat-text, ${Color.black()});
  opacity: 0.82;
  font-size: 1.45rem;
  line-height: 1.55;

  @media (max-width: ${mobileMaxWidth}) {
    font-size: 1.2rem;
  }
`;

const actionWrapClass = css`
  margin-top: 0.5rem;
`;

interface LoggedOutPromptProps {
  badge?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  buttonLabel?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function LoggedOutPrompt({
  badge,
  title,
  body,
  buttonLabel = 'Log In',
  className,
  style
}: LoggedOutPromptProps) {
  const onOpenSigninModal = useAppContext(
    (v) => v.user.actions.onOpenSigninModal
  );

  return (
    <div className={cx(rootClass, className)} style={style}>
      <div className={contentClass}>
        {badge ? <div className={badgeWrapClass}>{badge}</div> : null}
        <div className={titleClass}>{title}</div>
        {body ? <div className={bodyClass}>{body}</div> : null}
        <div className={actionWrapClass}>
          <Button
            variant="soft"
            tone="raised"
            color="green"
            size="lg"
            uppercase={false}
            onClick={onOpenSigninModal}
          >
            {buttonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
