import db from '../utils/db.js';

export default async function (fastify) {
  fastify.get('/', async (req, reply) => {
    const badges = db.prepare('SELECT * FROM badges ORDER BY tier ASC').all();
    return reply.view('pages/badges.ejs', { user: req.session.get('user') || null, badges, ref: null });
  });
}
