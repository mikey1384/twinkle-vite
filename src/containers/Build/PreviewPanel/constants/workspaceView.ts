export type WorkspaceViewMode = 'preview' | 'code' | 'api' | 'manual';

export const workspaceViewOptions = [
  { value: 'preview', label: 'Preview', icon: 'eye' },
  { value: 'code', label: 'Code', icon: 'code' },
  { value: 'api', label: 'API', icon: 'chart-line' },
  { value: 'manual', label: 'Manual', icon: 'book-open' }
] as const;
