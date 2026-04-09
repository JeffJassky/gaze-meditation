import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';

import { config } from './config.js';
import { configurePassport } from './auth/passport.js';
import { authRouter } from './routes/auth.routes.js';
import { usersRouter } from './routes/users.routes.js';
import { uploadsRouter } from './routes/uploads.routes.js';
import { sessionsRouter } from './routes/sessions.routes.js';
import { assetsRouter } from './routes/assets.routes.js';
import { playlistsRouter } from './routes/playlists.routes.js';
import { historyRouter } from './routes/history.routes.js';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);
  app.use(cors({ origin: config.clientOrigin, credentials: true }));
  // 10mb ceiling accommodates session history payloads, which include full
  // physiological telemetry arrays for long playthroughs.
  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  app.use(
    session({
      name: config.session.name,
      secret: config.session.secret,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: config.mongodbUri }),
      cookie: config.session.cookie,
    }),
  );

  configurePassport();
  app.use(passport.initialize());
  app.use(passport.session());

  app.get('/health', (_req, res) => res.json({ ok: true }));

  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/uploads', uploadsRouter);
  app.use('/sessions', sessionsRouter);
  app.use('/assets', assetsRouter);
  app.use('/playlists', playlistsRouter);
  app.use('/history', historyRouter);

  // 404
  app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

  // Error handler
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[gaze] error', err);
    const status = (err as { status?: number })?.status ?? 500;
    const message = (err as { message?: string })?.message ?? 'internal_error';
    res.status(status).json({ error: message });
  });

  return app;
}
