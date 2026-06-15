import cors from 'cors';
import env from './env.js';

const allowedOrigins = env.nodeEnv === 'development'
  ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175']
  : [env.clientOrigin];

export default cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
});
