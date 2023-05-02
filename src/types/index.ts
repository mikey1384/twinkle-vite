export type Dispatch = (action: { type: string; [key: string]: any }) => void;
export interface RequestHelpers {
  auth: () => any;
  handleError: (error: unknown) => void;
  token?: () => string | null;
}
