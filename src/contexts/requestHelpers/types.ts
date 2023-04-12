export interface RequestHelpers {
  auth: () => any;
  handleError: (error: unknown) => void;
  token?: () => string | null;
}
