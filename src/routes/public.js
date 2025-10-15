import db from '../utils/db.js';
import { validators } from '../utils/validation.js';

/**
 * GET /become-partner, /become-investor
 * POST handlers to create user with role partner/investor.
 * Handle referral param ?ref=code
 */
export default async function (fastify) {
  // Formulaires
  fastify.get('/become-partner', async (req, reply) => reply.view('pages/become-partner.ejs'));
  fastify.get('/become-investor', async (req, reply) => reply.view('pages/become-investor.ejs'));

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

  // Investisseur
  fastify.post('/become-investor', async (req, reply) => {
    const { name, email, password } = req.body;
    const v = validators.register({email,password,name});
    if (!v.ok) return reply.redirect('/become-investor?error='+encodeURIComponent(v.error));

    const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email);
    if (exists) return reply.redirect('/become-investor?error=Email déjà utilisé');

    const code = crypto.randomBytes(8).toString('hex');
    const info = db.prepare(
      'INSERT INTO users (name,email,password_hash,role,referral_code) VALUES (?,?,?,?,?)'
    ).run(name, email, password, 'investor', code);

    reply.redirect('/investor/dashboard?success=Bienvenue investisseur !');
  });

  // Parrainage automatique sur inscription web traditionnelle
  fastify.post('/auth/register', async (req, reply) => {
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

    // Si query param ref est présent et valide
    const { ref } = req.query;
    if (ref) {
      const referrer = db.prepare('SELECT id FROM users WHERE referral_code=?').get(ref);
      if (referrer) {
        db.prepare('INSERT INTO referrals (referrer_id,referred_id) VALUES (?,?)')
          .run(referrer.id, newId);
        // bonus de parrainage
        const bonus = Number(process.env.REFERRAL_BONUS || 0);
        db.prepare('UPDATE users SET points=points+? WHERE id=?').run(bonus, referrer.id);
      }
    }

    return reply.redirect('/?success=Inscription réussie');
  });
}
