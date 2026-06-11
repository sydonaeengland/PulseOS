import cors from 'cors';
import env from './env.js';

export default cors({
  origin: env.clientOrigin,
  credentials: true,
});
