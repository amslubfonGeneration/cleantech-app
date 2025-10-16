import Fastify from 'fastify';
import config from './fastify.config.js';
import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';

import fastifyStatic from '@fastify/static';

import fastifyFormbody from '@fastify/formbody';
import fastifyView from '@fastify/view';
import ejs from 'ejs';
import secureSession from '@fastify/secure-session';

import indexRoutes from './src/routes/index.js';
import authRoutes from './src/routes/auth.js';
import usersRoutes from './src/routes/users.js';
import agentsRoutes from './src/routes/agents.js';
import partnersRoutes from './src/routes/partners.js';
import depositsRoutes from './src/routes/deposits.js';
import rewardsRoutes from './src/routes/rewards.js';
import badgesRoutes from './src/routes/badges.js';
import challengesRoutes from './src/routes/challenges.js';
import statsRoutes from './src/routes/stats.js';
import adminRoutes from './src/routes/admin.js';
import blogApiRoutes from './src/routes/blog.js';
import investors from './src/routes/investors.js';
import leaderboardRoutes from './src/routes/leaderboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = Fastify(config);

// Core plugins
await app.register(secureSession,[{
    sessionName: 'session',
    cookieName: 'session_cookies',
    key:  'ZLPHoDKCh2Mh1OZJnEbvBfhpKHpTMzI3EgwSIIekeJk=',
    cookie: {
        path:'/',
        secure: true,
        httpOnly:true,
        sameSite:true,
    }}
])

await app.register(fastifyFormbody);

await app.register(fastifyView, {
  engine: { ejs },
  templates: path.join(__dirname, 'views')
});
await app.register(fastifyStatic, { root: path.join(__dirname, 'public'), prefix: '/public/' });

//await app.register(fastifyJWT, { secret: process.env.JWT_SECRET || 'supersecretjwtcleantech'});

// Simple metrics route (no hooks)
import client from 'prom-client';

client.collectDefaultMetrics();
app.get('/metrics', async (req, reply) => {
  reply.header('Content-Type', client.register.contentType);
  return client.register.metrics();
});

// Routes
await app.register(indexRoutes);
await app.register(authRoutes, { prefix: '/auth' });
await app.register(usersRoutes, { prefix: '/users' });
await app.register(agentsRoutes, { prefix: '/agents' });
await app.register(partnersRoutes, { prefix: '/partners' });
await app.register(depositsRoutes, { prefix: '/deposits' });
await app.register(rewardsRoutes, { prefix: '/rewards' });
await app.register(badgesRoutes, { prefix: '/badges' });
await app.register(challengesRoutes, { prefix: '/challenges' });
await app.register(statsRoutes, { prefix: '/stats' });
await app.register(adminRoutes, { prefix: '/admin' });
await app.register(investors, {prefix: '/investors'})
await app.register(leaderboardRoutes, { prefix: '/leaderboard' });
// API mobile blog (CRUD + drafts)
await app.register(blogApiRoutes, { prefix: '/api/blog' });

const start = async () => {
  try {
    await app.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
    app.log.info(`Server running on http://localhost:${process.env.PORT || 3000}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};
start();
