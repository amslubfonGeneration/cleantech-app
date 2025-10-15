import db from '../utils/db.js';
import { authenticate } from '../utils/auth.js';
import { checkDepositConsistency } from '../services/antiFraud.js';
import { pointsForDeposit } from '../utils/helpers.js';

export default async function (fastify) {
  fastify.get('/dashboard', async (req, reply) => {
    authenticate(req, reply, ['agent'])
    const user = req.session.get('user');
    const userId = user.id;

    const deposits = db.prepare('SELECT * FROM deposits WHERE user_id=? ORDER BY created_at DESC LIMIT 20').all(userId);
    const points = db.prepare('SELECT points FROM users WHERE id=?').get(userId)?.points || 0;
    const referral_code = db.prepare('SELECT  referral_code FROM users WHERE id=?').get(userId)?.referral_code || 0;
    const parrainCount = db.prepare('SELECT COUNT(*) AS total FROM referrals WHERE referrer_id=?').get(userId).total;
    const assignedPoints = db.prepare('SELECT * FROM collect_points WHERE agent_id=?').all(req.session.get('user').id);
    const referrals = db.prepare(`
      SELECT u.name, u.email, r.created_at
      FROM referrals r
      JOIN users u ON r.referred_id = u.id
      WHERE r.referrer_id=?
      ORDER BY r.created_at DESC
    `).all(userId);

    const baseUrl = `${req.protocol}://${req.hostname}`;
    return reply.view('pages/dashboards/agent.ejs', { user: req.session.get('user'), assignedPoints, deposits, points, referrals, referral_code, parrainCount, baseUrl, ref: new URLSearchParams(req.query).get('ref') || null });
  });

  fastify.post('/scan', async (req, reply) => {
    authenticate(req, reply, ['agent'])
    const { userId, type, weight } = req.body;
    const point = db.prepare('SELECT points FROM users WHERE id=?').get(userId)
    const user = db.prepare('SELECT * FROM users WHERE id=?').get(userId);
    
    let bonus = 0;

    if (user.role === 'investor' && user.subscription_status === 'active') {
      bonus = Number(process.env.INVESTOR_BONUS || 50); // Exemple : 50 points bonus
    }

    if (user.role === 'partner' && user.subscription_status === 'active') {
      bonus = Number(process.env.INVESTOR_BONUS || 50); // Exemple : 50 points bonus
    }

    const totalPoints =  point + bonus;
    db.prepare('UPDATE users SET points=points+? WHERE id=?').run(totalPoints, user.id);

    const recent = db.prepare('SELECT * FROM deposits WHERE user_id=? AND created_at > strftime(\'%s\', \'now\')-86400').all(userId);
    const res = checkDepositConsistency({ weight: Number(weight), recentDeposits: recent });
    if (!res.ok) return reply.redirect('/agents/dashboard?error=' + encodeURIComponent(res.reason));

    const points = pointsForDeposit({ type, weight: Number(weight) });
    db.prepare('INSERT INTO deposits (user_id,type,weight,points) VALUES (?,?,?,?)').run(userId, type, weight, points);
    db.prepare('UPDATE users SET points = points + ? WHERE id=?').run(points, userId);

    return reply.redirect('/agents/dashboard?success=' + encodeURIComponent(`Dépôt validé (+${points} pts)`));
  });
}
