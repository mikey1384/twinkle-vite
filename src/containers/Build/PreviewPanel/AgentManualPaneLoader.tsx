import React, { Component, Suspense, lazy, useState } from 'react';
import { css } from '@emotion/css';
import Loading from '~/components/Loading';
import ErrorBoundary from '~/components/ErrorBoundary';
import { recordClientTrace } from '~/helpers/clientTraceBus';
import {
  importWithRecovery,
  isLazyImportLoadError
} from '~/helpers/lazyImportHelpers';
import type { BuildCapabilitySnapshot } from '../types/capabilityTypes';

// The Agent manual carries the whole Build SDK reference, and only a builder
// who opens the Manual tab reads it, so it is its own chunk. If that chunk
// does not load, only the Manual tab shows it: the Build editor around it
// (with any unsaved file edits) stays as it is.
//
// The browser keeps a failed module for the page's life, so a retry asks for
// a fresh copy of the chunk (the same loader request helpers use). The pane
// is a bare import() with a default component and only Emotion styles, so a
// fresh copy is exactly what the importer returns.
type AgentManualPaneModule = typeof import('./AgentManualPane');

function isAgentManualPaneModule(loaded: unknown) {
  return (
    typeof (loaded as Partial<AgentManualPaneModule> | null)?.default ===
    'function'
  );
}

function createAgentManualPane() {
  return lazy(() =>
    importWithRecovery(() => import('./AgentManualPane'), {
      isUsable: isAgentManualPaneModule
    })
  );
}

// React.lazy keeps a failed load too: a retry needs a new lazy component.
// Module level, so leaving and reopening the tab reuses a loaded pane.
let AgentManualPane = createAgentManualPane();

export default function AgentManualPaneLoader({
  capabilitySnapshot
}: {
  capabilitySnapshot: BuildCapabilitySnapshot | null;
}) {
  const [attempt, setAttempt] = useState(0);

  function handleRetry() {
    AgentManualPane = createAgentManualPane();
    setAttempt((current) => current + 1);
  }

  return (
    // Anything other than a failed load (a render bug) is reported and shown
    // by the site's boundary, still inside this tab.
    <ErrorBoundary componentPath="Build/AgentManual">
      <AgentManualLoadBoundary key={attempt} onRetry={handleRetry}>
        <Suspense fallback={<Loading />}>
          <AgentManualPane capabilitySnapshot={capabilitySnapshot} />
        </Suspense>
      </AgentManualLoadBoundary>
    </ErrorBoundary>
  );
}

class AgentManualLoadBoundary extends Component<
  { children: React.ReactNode; onRetry: () => void },
  { error: unknown }
> {
  state: { error: unknown } = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: unknown) {
    if (!isLazyImportLoadError(error)) return;
    recordClientTrace('boundary-error', {
      at: 'Build/AgentManual',
      msg: String((error as Error)?.message || error || '').slice(0, 200),
      lazy: true
    });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (!isLazyImportLoadError(error)) throw error;
    return <AgentManualLoadFailed onRetry={this.props.onRetry} />;
  }
}

export function AgentManualLoadFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className={loadFailedClass}
      data-testid="build-agent-manual-load-failed"
    >
      <h2>The manual didn't load</h2>
      <p>
        The connection dropped while the Agent manual was loading. Your open
        files and unsaved edits are still here.
      </p>
      <button type="button" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

const loadFailedClass = css`
  height: 100%;
  min-height: 16rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem 1rem;
  text-align: center;
  background: #f8fafc;
  color: #172033;
  h2 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 900;
    color: #111827;
  }
  p {
    margin: 0;
    max-width: 32rem;
    font-size: 1.1rem;
    line-height: 1.5;
    color: #475569;
  }
  button {
    margin-top: 0.25rem;
    border: 1px solid #475569;
    border-radius: 8px;
    background: #64748b;
    color: #ffffff;
    padding: 0.58rem 1rem;
    font-size: 1.1rem;
    font-weight: 800;
    cursor: pointer;
    &:hover {
      background: #475569;
    }
  }
`;
