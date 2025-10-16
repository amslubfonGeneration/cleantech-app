import db from '../utils/db.js';
import { authenticate } from '../utils/auth.js';

export default async function (fastify) {
  fastify.get('/', async (req, reply) => {
    authenticate(req, reply, ['admin']);
  const users = db.prepare('SELECT id, name, email, role, points FROM users ORDER BY id DESC').all();
  return reply.view('/pages/admin/user', { users , user: req.session.get('user') || null, ref: null    });
});


  fastify.get('/dashboard', async (req, reply) => {
    authenticate(req, reply, ['user']);
    const user = req.session.get('user');
    const userId = user.id;

    const deposits = db.prepare('SELECT * FROM deposits WHERE user_id=? ORDER BY created_at DESC LIMIT 20').all(userId);
    const points = db.prepare('SELECT points FROM users WHERE id=?').get(userId)?.points || 0;
    const referral_code = db.prepare('SELECT  referral_code FROM users WHERE id=?').get(userId)?.referral_code || 0;
    
    const parrainCount = db.prepare('SELECT COUNT(*) AS total FROM referrals WHERE referrer_id=?').get(userId).total;

    const userBadges = db.prepare(`
      SELECT b.name, b.description, b.tier
      FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id=?
    `).all(userId);


    const nextBadge = db.prepare(`
      SELECT * FROM badges
      WHERE type='parrainage' AND requirement_points > ?
      ORDER BY requirement_points ASC LIMIT 1
    `).get(parrainCount);

    const alreadyEarned = db.prepare(`
      SELECT badge_id FROM user_badges WHERE user_id=? AND badge_id=?
    `).get(userId, nextBadge?.id);


    console.log(referral_code, points);
    const referrals = db.prepare(`
      SELECT u.name, u.email, r.created_at
      FROM referrals r
      JOIN users u ON r.referred_id = u.id
      WHERE r.referrer_id=?
      ORDER BY r.created_at DESC
    `).all(userId);

    const baseUrl = `${req.protocol}://${req.hostname}`;

    return reply.view('pages/dashboards/user.ejs', {
      user,
      ref: new URLSearchParams(req.query).get('ref') || null,
      referral_code,
      deposits,
      points,
      referrals,
      baseUrl,
      userBadges,
      parrainCount,
      nextBadge,
      alreadyEarned
    });
  });
}


//,{ preValidation: [authenticate, requireRole(['admin'])] }
