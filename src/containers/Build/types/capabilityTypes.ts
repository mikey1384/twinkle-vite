export interface BuildCapabilitySnapshotNamespaceDetail {
  name: string;
  available: boolean;
  reason: string | null;
  notes: string[];
}

export type BuildCapabilitySnapshotLumineActionName =
  | 'lumine.readCapabilitySnapshot'
  | 'lumine.generateGreeting'
  | 'lumine.readProjectFiles'
  | 'lumine.requestFocusedContext'
  | 'lumine.inspectRuntimeObservations'
  | 'lumine.applyCodeChanges';

export interface BuildCapabilitySnapshotLumineActionDetail {
  name: BuildCapabilitySnapshotLumineActionName;
  allowed: boolean;
  reason: string | null;
  notes: string[];
}

export interface BuildCapabilitySnapshot {
  routeMode: 'workspace' | 'runtime';
  viewer: {
    isOwner: boolean;
    isLoggedIn: boolean;
    isGuest: boolean;
    isAppViewOnly: boolean;
  };
  build: {
    isPublic: boolean;
  };
  buildTools: {
    unavailable: boolean;
    blockedActions: string[];
  };
  availableNamespaces: string[];
  restrictedNamespaces: string[];
  namespaceDetails: BuildCapabilitySnapshotNamespaceDetail[];
  blockedWriteActions: string[];
  lumine: {
    availableActions: BuildCapabilitySnapshotLumineActionName[];
    blockedActions: BuildCapabilitySnapshotLumineActionName[];
    actionDetails: BuildCapabilitySnapshotLumineActionDetail[];
  };
}
