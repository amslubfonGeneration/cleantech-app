import db from '../utils/db.js';
import { authenticate } from '../utils/auth.js';
import { validators } from '../utils/validation.js';
import crypto from 'crypto'

export default async function (fastify) {
  fastify.get('/become-investor', async (req, reply) => reply.view('pages/become-investor.ejs', {user: req.session.get('user')||null, ref: null}));

  // Investisseur
  fastify.post('/become-investor', async (req, reply) => {
    const { name, email, password } = req.body;
    const v = validators.register({email,password,name});
    if (!v.ok) return reply.redirect('/investisors/become-investor?error='+encodeURIComponent(v.error));

    const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email);
    if (exists) return reply.redirect('/investors/become-investor?error=Email déjà utilisé');

    const code = crypto.randomBytes(8).toString('hex');
    const info = db.prepare(
      'INSERT INTO users (name,email,password_hash,role,referral_code) VALUES (?,?,?,?,?)'
    ).run(name, email, password, 'investor', code);

    reply.redirect('/investors/become-investor?success=Bienvenue investisseur !Connecté vous avec votre email et mot de passe' );
  });

  fastify.get('/dashboard', async (req, reply) => {
      // Nombre de filleuls
      authenticate(req, reply, ['investor'])
      const userId = req.session.get('user').id;
const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

const baseUrl = `${req.protocol}://${req.hostname}`;
const referral_code = user.referral_code || '';
const referralsCount = db.prepare('SELECT COUNT(*) AS c FROM referrals WHERE referrer_id = ?').get(userId).c;

return reply.view('pages/dashboards/investor.ejs', {
  user,
  ref: null,
  referralsCount,
  baseUrl,
  referral_code
});

  });
}