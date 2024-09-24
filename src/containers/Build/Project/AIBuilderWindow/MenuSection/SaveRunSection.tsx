import React from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { useBuildContext, useAppContext } from '~/contexts';

export default function SaveRunSection({
  isMenuExpanded
}: {
  isMenuExpanded: boolean;
}) {
  const updateProjectCode = useAppContext(
    (v) => v.requestHelpers.updateProjectCode
  );

  // Access projectId and fileContents from the build context
  const projectId = useBuildContext((v) => v.state.projectId);
  const fileContents = useBuildContext((v) => v.state.fileContents);

  const onSetCompiledHtml = useBuildContext((v) => v.actions.onSetCompiledHtml);
  const onSetCompiledJs = useBuildContext((v) => v.actions.onSetCompiledJs);

  return (
    <div
      className={css`
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding-top: 8px;
        border-top: 1px solid #dee2e6;
      `}
    >
      <button
        onClick={handleSave}
        className={css`
          padding: 10px 20px;
          width: 100%;
          background-color: #0d6efd;
          color: #fff;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 1rem;
          margin-bottom: 8px;
          transition: all 0.3s;

          &:hover {
            background-color: #0b5ed7;
          }
        `}
      >
        <Icon icon="save" />
        {isMenuExpanded && (
          <span
            className={css`
              margin-left: 8px;
            `}
          >
            Save
          </span>
        )}
      </button>
      <button
        onClick={handleRun}
        className={css`
          padding: 10px 20px;
          width: 100%;
          background-color: #198754;
          color: #fff;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s;

          &:hover {
            background-color: #157347;
          }
        `}
      >
        <Icon icon="play" />
        {isMenuExpanded && (
          <span
            className={css`
              margin-left: 8px;
            `}
          >
            Run
          </span>
        )}
      </button>
    </div>
  );

  function handleSave() {
    // Your save logic here
  }

  async function handleRun() {
    try {
      // Show a loading indicator
      onSetCompiledHtml({ compiledHtml: '<p>Compiling...</p>' });
      onSetCompiledJs({ compiledJs: '' });

      if (!projectId) {
        throw new Error('Project ID is missing. Please reload the project.');
      }

      // Update the project code
      const result = await updateProjectCode(projectId, fileContents);

      if (result && result.html && result.bundleJs) {
        // Update the compiled HTML and JS in the context
        onSetCompiledHtml({ compiledHtml: result.html });
        onSetCompiledJs({ compiledJs: result.bundleJs });
      } else {
        console.error('Invalid compilation result:', result);
        throw new Error('Compilation result is invalid');
      }
    } catch (error: unknown) {
      // Handle errors and update the compiled HTML with the error message
      onSetCompiledHtml({
        compiledHtml: `<p>Error compiling project: ${
          error instanceof Error ? error.message : 'Unknown error'
        }</p>`
      });
      onSetCompiledJs({ compiledJs: '' });
    }
  }
}
