export type WorkspaceViewMode = 'preview' | 'code' | 'manual';

export const workspaceViewOptions = [
  { value: 'preview', label: 'Preview', icon: 'eye' },
  { value: 'code', label: 'Code', icon: 'code' },
  { value: 'manual', label: 'Manual', icon: 'book-open' }
] as const;
