import { exportStatsPDF, exportStatsExcel } from '../utils/export.js';
import { authenticate } from '../utils/auth.js';
import db from '../utils/db.js';


export default async function (fastify) {
  fastify.get('/export/pdf', async (req, reply) => {
  const buffer = await exportStatsPDF();
  reply
    .header('Content-Type', 'application/pdf')
    .header('Content-Disposition', 'attachment; filename="stats-cleantech.pdf"')
    .send(buffer);
  });

  fastify.get('/export/excel', async (req, reply) => {
    const buffer = await exportStatsExcel();
    reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', 'attachment; filename="stats-cleantech.xlsx"')
      .send(buffer);
  });

  fastify.get('/', async (req, reply) => {
    /*/ Authentication middleware
    if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'moderator')) {
      return reply.redirect('/login');
    }*/

    // Gather statistics
    authenticate(req, reply, ['admin', 'investor', 'partner', 'moderator']);
    const totalUsers = db.prepare('SELECT COUNT(*) AS total FROM users').get().total;
    const byRole = db.prepare(`
      SELECT role, COUNT(*) AS count FROM users GROUP BY role
    `).all();

    const totalPoints = db.prepare('SELECT SUM(points) AS total FROM users').get().total || 0;
    const totalReferrals = db.prepare('SELECT COUNT(*) AS total FROM referrals').get().total;
    const totalBadges = db.prepare('SELECT COUNT(*) AS total FROM user_badges').get().total;
    const totalRewards = db.prepare('SELECT COUNT(*) AS total FROM rewards').get().total;
    const totalSubscriptions = db.prepare('SELECT COUNT(*) AS total FROM subscriptions').get().total;
    const revenue = db.prepare('SELECT SUM(amount) AS total FROM subscriptions').get().total || 0;

    return reply.view('pages/stats.ejs', {
      user: req.session.get('user') || null,
      ref: req.query || null,
      totalUsers,
      byRole,
      totalPoints,
      totalReferrals,
      totalBadges,
      totalRewards,
      totalSubscriptions,
      revenue
    });
  });
}

