
import db from '../utils/db.js';

export default async function (fastify) {
  fastify.get('/parrainage', async (req, reply) => {
    const page = parseInt(req.query.page || '1');
    const limit = 10;
    const offset = (page - 1) * limit;

    const rows = db.prepare(`
      SELECT u.name, u.email, COUNT(r.id) AS filleuls
      FROM referrals r
      JOIN users u ON r.referrer_id = u.id
      GROUP BY r.referrer_id
      ORDER BY filleuls DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const total = db.prepare(`
      SELECT COUNT(DISTINCT referrer_id) AS total FROM referrals
    `).get().total;

    const totalPages = Math.ceil(total / limit);

    return reply.view('pages/leaderboard/parrainage.ejs', {
      user: req.session.get('user') || null,
      rows,
      page,
      totalPages,
      ref: new URLSearchParams(req.query).get('ref') || null,
    });
  });
}
