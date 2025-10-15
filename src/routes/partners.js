import db from '../utils/db.js';
import { authenticate } from '../utils/auth.js';
import { validators } from '../utils/validation.js';
import crypto from 'crypto'

export default async function (fastify) {
    // Formulaires
  fastify.get('/become-partner', async (req, reply) => reply.view('pages/become-partner.ejs', {user: req.session.get('user')||null, ref: req.query || null}));

  // Partenaire
  fastify.post('/become-partner', async (req, reply) => {
    const { name, email, password, phone } = req.body;
    const v = validators.register({email,password,name});
    if (!v.ok) return reply.redirect('/become-partner?error='+encodeURIComponent(v.error));

    const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email);
    if (exists) return reply.redirect('/become-partner?error=Email déjà utilisé');

    const code = crypto.randomBytes(8).toString('hex');
    const info = db.prepare(
      'INSERT INTO users (name,email,password_hash,role,referral_code) VALUES (?,?,?,?,?)'
    ).run(name, email, password, 'partner', code);

    // Créer enregistrement dans partners si besoin
    db.prepare('INSERT INTO partners (id,name,contact_email,contact_phone) VALUES (?,?,?,?)')
      .run(info.lastInsertRowid, name, email, phone || null);

    reply.redirect('/?success=Vous êtes désormais partenaire !');
  });



  fastify.get('/dashboard', async (req, reply) => {
    authenticate(req, reply, ['partner']);
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


    const redemptions = db.prepare('SELECT * FROM redemptions WHERE partner_id=? ORDER BY created_at DESC').all(req.session.get('user').id);
    return reply.view('pages/dashboards/partner.ejs', { user, ref: new URLSearchParams(req.query).get('ref') || null, referral_code, deposits, points, referrals, baseUrl, userBadges, parrainCount, nextBadge, alreadyEarned, redemptions, subscribed_until: db.prepare('SELECT points FROM users WHERE id=?').get(userId)?.subscribed_until,subscription_status:db.prepare('SELECT points FROM users WHERE id=?').get(userId)?.subscription_status });
});

}
