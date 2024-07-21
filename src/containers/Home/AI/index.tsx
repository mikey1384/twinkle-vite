import React, { useEffect, useState } from 'react';
import AIWidget from './AIWidget';
import ErrorBoundary from '~/components/ErrorBoundary';
import Loading from '~/components/Loading';
import { css } from '@emotion/css';
import { useAppContext } from '~/contexts/';

export default function AI() {
  const loadUserAIWidgets = useAppContext(
    (v) => v.requestHelpers.loadUserAIWidgets
  );

  const [widgets, setWidgets] = useState<
    {
      id: number;
      name: string;
      latestOutput: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();

    async function init() {
      setLoading(true);
      try {
        const { results } = await loadUserAIWidgets();
        setWidgets(results);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  return (
    <ErrorBoundary componentPath="Home/AI">
      <div
        className={css`
          display: flex;
          flex-direction: column;
          padding: 16px;
        `}
      >
        {loading ? (
          <Loading text="Loading AI Widgets..." />
        ) : (
          widgets.map((widget) => (
            <AIWidget
              key={widget.id}
              widgetId={widget.id}
              name={widget.name}
              latestOutput={widget.latestOutput}
            />
          ))
        )}
      </div>
    </ErrorBoundary>
  );
}
