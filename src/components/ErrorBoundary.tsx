import React, { Component } from 'react';
import UsernameText from '~/components/Texts/UsernameText';
import UpdateRecoveryNotice from '~/components/UpdateRecoveryNotice';
import { clientVersion } from '~/constants/defaultValues';
import { css } from '@emotion/css';
import API_URL from '~/constants/URL';
import { isLazyImportLoadError } from '~/helpers/lazyImportHelpers';
import reportDomMutationEvent from '~/helpers/reportDomMutationEvent';
import { getStoredItem } from '~/helpers/userDataHelpers';
import { Color } from '~/constants/css';

if (import.meta.env.SSR) {
  import('source-map-support').then(({ install }) => install()).catch(() => {});
}

const token = () => getStoredItem('token');

// Bounded auto-recovery for the third-party-DOM-mutation crash class (see
// installDomMutationGuard.ts). The guard prevents most of these throws at the
// source; this boundary is the backstop for any that still reach React (unknown
// variants / browsers where the prototype patch didn't take). We remount the
// subtree, but cap it on a sliding window so a translator that keeps re-wrapping
// can't drive an infinite remount loop — past the cap we show the error UI.
const RECOVERY_WINDOW_MS = 10000;
const MAX_RECOVERIES_PER_WINDOW = 3;
// Marker that forces the rare cap-exceeded crash through the server's email
// suppression for this otherwise-silenced class. Keep in sync with
// twinkle-api/helpers/errorReporting.ts.
const DOM_MUTATION_UNRECOVERABLE_MARKER = '[dom-mutation-unrecoverable]';

interface State {
  hasError: boolean;
  lastErrorIsLazyImportLoadError: boolean;
  recoveryKey: number;
}
export default class ErrorBoundary extends Component<
  {
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
  },
  State
> {
  // Timestamps of recent DOM-mutation recoveries (sliding window). Instance
  // field, not state: it must survive the child remount and never trigger a
  // render. The boundary instance itself persists across recoveries (only its
  // children remount via recoveryKey).
  private recoveryTimestamps: number[] = [];

  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      lastErrorIsLazyImportLoadError: false,
      recoveryKey: 0
    };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Third-party DOM corruption (translators/extensions/in-app webviews). The
    // app did nothing wrong; recover the subtree instead of emailing an alert,
    // and capture sampled telemetry instead. Bounded so a relentless mutator
    // can't loop forever.
    if (isRecoverableDomMutationError(error)) {
      const now = Date.now();
      this.recoveryTimestamps = this.recoveryTimestamps.filter(
        (timestamp) => now - timestamp < RECOVERY_WINDOW_MS
      );
      const canRecover =
        this.recoveryTimestamps.length < MAX_RECOVERIES_PER_WINDOW;

      reportDomMutationEvent({
        method: 'recover',
        surface: this.props.componentPath,
        componentPath: this.props.componentPath,
        recovered: canRecover
      });

      if (canRecover) {
        this.recoveryTimestamps.push(now);
        this.setState((state) => ({
          hasError: false,
          recoveryKey: state.recoveryKey + 1
        }));
        return;
      }

      // Cap exceeded: the guard didn't catch it AND recovery couldn't keep up,
      // so the user is about to see the error UI. That's a genuine unhandled
      // crash worth an alert — force it past the server-side suppression for
      // this class with the marker.
      if (!isLocalDevelopmentRuntime()) {
        reportError({
          componentPath: this.props.componentPath,
          message: `${DOM_MUTATION_UNRECOVERABLE_MARKER} ${buildErrorMessage(
            error
          )}`,
          info: buildErrorInfo(errorInfo)
        });
      }
      this.setState({
        hasError: true,
        lastErrorIsLazyImportLoadError: false
      });
      return;
    }

    const lazyImportLoadError = isLazyImportLoadError(error);
    if (!shouldSuppressErrorReport(error)) {
      reportError({
        componentPath: this.props.componentPath,
        message: buildErrorMessage(error),
        info: buildErrorInfo(errorInfo)
      });
    }

    this.setState({
      hasError: true,
      lastErrorIsLazyImportLoadError: lazyImportLoadError
    });
  }

  render() {
    const { children, innerRef, componentPath, ...props } = this.props;
    const { hasError, lastErrorIsLazyImportLoadError, recoveryKey } =
      this.state;
    if (hasError) {
      if (lastErrorIsLazyImportLoadError) {
        return (
          <UpdateRecoveryNotice
            buttonLabel="Reload to Update"
            message="The app has been updated. Reload to get the newest version."
            onAction={handleLazyImportRecoveryReload}
            title="Update Available"
          />
        );
      }
      return (
        <div
          style={{
            width: '100%',
            minHeight: '30%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '3rem 1.5rem',
            ...props.style
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '44rem',
              padding: '2.4rem 2.8rem',
              borderRadius: '16px',
              border: '1px solid var(--ui-border-strong)',
              background: '#fff',
              boxShadow: '0 20px 40px -28px rgba(15, 23, 42, 0.2)',
              color: Color.darkerGray(),
              textAlign: 'center'
            }}
          >
            <p
              style={{
                fontSize: '1.9rem',
                fontWeight: 700,
                marginBottom: '1rem'
              }}
            >
              Uh oh, something went wrong
            </p>
            <div style={{ fontSize: '1.5rem', lineHeight: 1.6 }}>
              Screenshot this page and show it to{' '}
              <UsernameText
                color={Color.logoBlue()}
                user={{
                  username: 'Mikey',
                  id: 5
                }}
              />{' '}
              for a big <b style={{ color: Color.gold() }}>XP</b> bonus!
            </div>
            <div style={{ marginTop: '1.8rem', fontSize: '1.35rem' }}>
              Tap the button below once you’ve captured the screenshot.
            </div>
          </div>
          {componentPath ? (
            <div style={{ marginTop: '0.5rem', fontSize: '1.3rem' }}>
              {componentPath}
            </div>
          ) : null}
          <button
            className={css`
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 1rem 2.4rem;
              border-radius: 999px;
              border: 1px solid ${Color.logoBlue()};
              font-size: 1.45rem;
              font-weight: 600;
              margin-top: 2.4rem;
              background: #fff;
              color: ${Color.logoBlue()};
              cursor: pointer;
              transition:
                transform 0.2s ease,
                box-shadow 0.2s ease;

              @media (hover: hover) and (pointer: fine) {
                &:hover {
                  transform: translateY(-1px);
                  box-shadow: 0 14px 28px -22px rgba(15, 23, 42, 0.25);
                }
              }
              -webkit-tap-highlight-color: transparent;
              touch-action: manipulation;
            `}
            onClick={() => window.location.reload()}
          >
            Reload the page
          </button>
        </div>
      );
    }
    return Object.keys(props).length > 0 ? (
      <div key={recoveryKey} ref={innerRef} style={props.style} {...props}>
        {children}
      </div>
    ) : (
      <React.Fragment key={recoveryKey}>{children}</React.Fragment>
    );
  }
}

function buildErrorMessage(error: Error) {
  const message = error.message || String(error);
  if (!error.stack) {
    return message;
  }
  return `Message: ${message}\n\nStack: ${error.stack}`;
}

function isRecoverableDomMutationError(error: Error) {
  // Gate on the SPECIFIC NotFoundError reparenting failure ("not a child of this
  // node"), NOT the generic "Failed to execute 'removeChild'/'insertBefore' on
  // 'Node'" prefix — that prefix also covers unrelated argument TypeErrors (e.g.
  // "parameter 1 is not of type 'Node'"), which are genuine app bugs we must
  // keep reporting instead of silently remounting/suppressing.
  return String(error?.message || '').includes('not a child of this node');
}

function isLocalDevelopmentRuntime() {
  if (import.meta.env.DEV) return true;
  if (typeof window === 'undefined') return false;
  return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
}

function shouldSuppressErrorReport(error: Error) {
  return isLazyImportLoadError(error) || isLocalDevelopmentRuntime();
}

function handleLazyImportRecoveryReload() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('_twinkleLazyImportRecovery', String(Date.now()));
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}

function buildErrorInfo(errorInfo: React.ErrorInfo) {
  const info = [
    getCurrentLocation(),
    getCurrentUserAgent(),
    errorInfo.componentStack
      ? `Component stack:\n${errorInfo.componentStack}`
      : ''
  ].filter(Boolean);

  return info.join('\n\n');
}

function getCurrentLocation() {
  if (typeof window === 'undefined') {
    return '';
  }
  return `URL: ${window.location.href}`;
}

function getCurrentUserAgent() {
  if (typeof navigator === 'undefined') {
    return '';
  }
  return `User agent: ${navigator.userAgent}`;
}

async function reportError({
  componentPath,
  info,
  message
}: {
  componentPath: string;
  info?: string;
  message: string;
}) {
  try {
    const { default: request } = await import('axios');
    const {
      data: { success }
    } = await request.post(
      `${API_URL}/user/error`,
      { componentPath, info, message, clientVersion },
      {
        headers: {
          authorization: token()
        }
      }
    );
    return Promise.resolve(success);
  } catch (error) {
    return console.error(error);
  }
}
