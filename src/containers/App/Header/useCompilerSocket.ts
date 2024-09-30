import { useEffect } from 'react';
import { socket } from '~/constants/sockets/compiler';
import { useBuildContext, useKeyContext } from '~/contexts';

export default function useCompilerSocket() {
  const { userId } = useKeyContext((v) => v.myState);
  const onSetDevServerUrl = useBuildContext((v) => v.actions.onSetDevServerUrl);
  const onSetCurrentFile = useBuildContext((v) => v.actions.onSetCurrentFile);
  const onSetFileContents = useBuildContext((v) => v.actions.onSetFileContents);
  const onSetCurrentFileContent = useBuildContext(
    (v) => v.actions.onSetCurrentFileContent
  );
  const onSetFileStructure = useBuildContext(
    (v) => v.actions.onSetFileStructure
  );
  const onSetIsProjectLoaded = useBuildContext(
    (v) => v.actions.onSetIsProjectLoaded
  );
  const onSetOpenFolders = useBuildContext((v) => v.actions.onSetOpenFolders);

  useEffect(() => {
    socket.on('connect', handleConnect);
    socket.on('boilerplate_code', handleBoilerplateCode);
    socket.on('boilerplate_error', handleBoilerplateError);
    socket.on('dev_session_ready', handleDevSessionReady);
    socket.on('code_change_ack', handleCodeChangeAck);
    socket.on('code_change_error', handleCodeChangeError);

    return () => {
      socket.off('boilerplate_code', handleBoilerplateCode);
      socket.off('boilerplate_error', handleBoilerplateError);
      socket.off('dev_session_ready', handleDevSessionReady);
      socket.off('code_change_ack', handleCodeChangeAck);
      socket.off('code_change_error', handleCodeChangeError);
    };

    function handleConnect() {
      console.log(`Connected to compiler server with socket ID: ${socket.id}`);
    }

    function handleBoilerplateCode({
      files
    }: {
      files: Record<string, string>;
    }) {
      // Handle received boilerplate files
      onSetFileContents({ fileContents: files });
      const fileStructure = buildFileStructure(files);
      onSetFileStructure({ fileStructure });

      // Set the default file
      const defaultFile = 'src/index.tsx';
      if (files[defaultFile]) {
        onSetCurrentFile({ currentFile: defaultFile });
        onSetCurrentFileContent({ currentFileContent: files[defaultFile] });
      } else {
        const firstFile = Object.keys(files)[0];
        onSetCurrentFile({ currentFile: firstFile });
        onSetCurrentFileContent({ currentFileContent: files[firstFile] });
      }

      const initialOpenFolders = new Set<string>();
      Object.keys(files).forEach((filePath) => {
        const parts = filePath.split('/');
        parts.pop(); // Remove the file name
        let path = '';
        parts.forEach((part) => {
          path = path ? `${path}/${part}` : part;
          initialOpenFolders.add(path);
        });
      });
      onSetOpenFolders({ openFolders: initialOpenFolders });
      onSetIsProjectLoaded({ isLoaded: true });
    }
    function handleBoilerplateError({
      projectId,
      error
    }: {
      projectId: string;
      error: string;
    }) {
      console.error(
        `Error receiving boilerplate for project ${projectId}:`,
        error
      );
    }
    function handleCodeChangeAck({ filePath }: { filePath: string }) {
      console.log(`Code change acknowledged for ${filePath}`);
    }
    function handleDevSessionReady({ url }: { url: string }) {
      onSetDevServerUrl({ devServerUrl: url });
      console.log(`Dev server ready at ${url}`);
    }
    function handleCodeChangeError({
      projectId,
      error
    }: {
      projectId: string;
      error: string;
    }) {
      console.error(`Error updating code for project ${projectId}:`, error);
    }
    function buildFileStructure(fileContents: Record<string, string>) {
      const structure: any = { name: 'root', children: [], isFolder: true };

      Object.keys(fileContents).forEach((filePath) => {
        const content = fileContents[filePath];
        if (filePath === '') return;

        const parts = filePath.split('/').filter((part) => part !== '');
        let currentLevel = structure;

        parts.forEach((part, index) => {
          const isLastPart = index === parts.length - 1;
          let existing = currentLevel.children.find(
            (c: any) => c.name === part
          );

          if (!existing) {
            const newItem = {
              name: part,
              children: [],
              isFolder: !isLastPart || !part.includes('.')
            };
            currentLevel.children.push(newItem);
            existing = newItem;
          }

          if (isLastPart && content.length > 0) {
            existing.isFolder = false;
            existing.children = [];
          }

          currentLevel = existing;
        });
      });

      // Function to sort children arrays
      function sortTree(node: any) {
        if (!node.children || node.children.length === 0) {
          return;
        }

        node.children.sort((a: any, b: any) => {
          // Folders first
          if (a.isFolder && !b.isFolder) return -1;
          if (!a.isFolder && b.isFolder) return 1;
          // Both are folders or both are files, sort alphabetically
          return a.name.localeCompare(b.name);
        });

        node.children.forEach(sortTree);
      }

      // Sort the tree starting from the root
      sortTree(structure);

      return structure.children;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
}
