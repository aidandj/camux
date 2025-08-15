import express from 'express';
import cors from 'cors';
import session from 'express-session';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { devicesRouter } from './routes/devices';
import { streamRouter } from './routes/stream';
import f = require("session-file-store");
const FileStore = f(session);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6001;

// Request logging
if (process.env.NODE_ENV === 'production') {
  // Production: Log in combined format with timestamps
  app.use(morgan('combined'));
} else {
  // Development: Log in detailed format with colors
  app.use(morgan('dev'));
}

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 * 90
  },
  store: new FileStore({
    path: process.env.SESSION_STORE_PATH || './sessions',
  })
}));

app.use('/api/auth', authRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/stream', streamRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
