import { createContext } from 'react';

const Context = createContext<{
  [key: string]: any;
}>({});
export default Context;
