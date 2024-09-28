import io from 'socket.io-client';
import { COMPILER_URL } from '~/constants/defaultValues';

export const socket = io(`${COMPILER_URL || 'http://localhost:3600'}`);
//ok
