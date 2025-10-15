import db from '../utils/db.js';
import { validators } from '../utils/validation.js';
import crypto from 'crypto'

export default async function (fastify) {

  fastify.post('/register/', async (req, reply) => {
    const { email, password, name } = req.body;
    const v = validators.register({email,password,name});
    if (!v.ok) return reply.redirect('/?error='+encodeURIComponent(v.error));

    const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email);
    if (exists) return reply.redirect('/?error=Email déjà utilisé');

    const code = crypto.randomBytes(8).toString('hex');
    const insert = db.prepare(
      'INSERT INTO users (name,email,password_hash,role,referral_code) VALUES (?,?,?,?,?)'
    );
    const res = insert.run(name, email, password, 'user', code);
    const newId = res.lastInsertRowid;

    // Si query param ref est présent et valide*
    
    
    const { ref } = req.query;
    console.log('p',ref, req.query, req.params ,newId)
    if (ref) {
      const referrer = db.prepare('SELECT id FROM users WHERE referral_code=?').get(ref);
      
      if (referrer) {
        db.prepare('INSERT INTO referrals (referrer_id,referred_id) VALUES (?,?)')
          .run(referrer.id, newId);
        // bonus de parrainage
        const bonus = Number(process.env.REFERRAL_BONUS || 0);
        db.prepare('UPDATE users SET points=points+? WHERE id=?').run(bonus, referrer.id);

      // Badge “Super Parrain” après 5 filleuls
      const count = db.prepare('SELECT COUNT(*) AS total FROM referrals WHERE referrer_id=?').get(referrer.id).total;

      if (count === 5) {
        const badge = db.prepare('SELECT id FROM badges WHERE name=?').get('Super Parrain');
        const already = db.prepare('SELECT id FROM user_badges WHERE user_id=? AND badge_id=?').get(referrer.id, badge.id);
        if (!already) {
          db.prepare('INSERT INTO user_badges (user_id, badge_id) VALUES (?,?)').run(referrer.id, badge.id);
        }
      }
      
      }
    }

    return reply.redirect('/?success=Inscription réussie');
  });


  
  fastify.post('/login', async (req, reply) => {
    //Completer le lien de parrainage.
    const { email, password } = req.body;
    const user = db.prepare('SELECT id,name,email,role,password_hash,referral_code FROM users WHERE email=?').get(email);
    if (!user || user.password_hash !== password) {
      return reply.redirect('/?error=' + encodeURIComponent('Identifiants invalides'));
    }

    req.session.set('user',{ id: user.id, role: user.role, email: user.email, name: user.name })
    
    if (user.role === 'admin') return reply.redirect('/admin/dashboard');
    if (user.role === 'agent') return reply.redirect('/agents/dashboard');
    if (user.role === 'partner') return reply.redirect('/partners/dashboard');
    return reply.redirect('/users/dashboard');
  });

  fastify.post('/logout', async (req, reply) => {
    reply.clearCookie('session_cookies', { path: '/' });
    return reply.redirect('/?success=Déconnexion effectuée');
  });
}
