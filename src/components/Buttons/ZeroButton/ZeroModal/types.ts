export interface ResponseObj {
  grammar: string;
  rewrite: {
    [key: string]: {
      [key: string]: string;
    };
  };
  easy: string;
}
