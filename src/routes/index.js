
import db from '../utils/db.js';

export default async function (fastify) {
  fastify.get('/', async (req, reply) => {
    // Optionnel: charger quelques récompenses pour l'accueil
    const rewards = db.prepare('SELECT * FROM rewards ORDER BY points_required ASC LIMIT 3').all();
    return reply.view('pages/home.ejs', { user: req.session.get('user') || null, rewards , ref: req.query.ref || null});
  });

  fastify.get('/faq', async (req, reply) => reply.view('pages/faq.ejs', { user: req.session.get('user') || null , ref: null}));
  fastify.get('/blog', async (req, reply) => {
    const posts = db.prepare('SELECT * FROM blog_posts WHERE status=\'published\' ORDER BY created_at DESC').all();
    return reply.view('pages/blog.ejs', { user: req.session.get('user') || null, posts , ref: req.query || null});
  });
  fastify.get('/partners', async (req, reply) => {
    const partners = db.prepare('SELECT * FROM partners ORDER BY id ASC').all();
    return reply.view('pages/partners.ejs', { user: req.session.get('user') || null, partners, ref: req.query || null });
  });

  fastify.get('/subscribe', async (req, reply) => {
  const user = req.session.get('user');
  if (!user || !['partner', 'investor'].includes(user.role)) {
    return reply.redirect('/?error=Accès réservé aux partenaires et investisseurs');
  }
  return reply.view('pages/subscribe.ejs', { user: req.session.get('user'), ref: null});
});

fastify.post('/subscribe', async (req, reply) => {
  const user = req.session.get('user');
  const { plan, method } = req.body;

  const duration = plan === 'monthly' ? 30 * 24 * 3600 : 365 * 24 * 3600;
  const amount = plan === 'monthly' ? 10000 : 100000;
  const now = Math.floor(Date.now() / 1000);
  const expires = now + duration;

  db.prepare(`
    INSERT INTO subscriptions (user_id, role, amount, method, paid_at, expires_at)
    VALUES (?,?,?,?,?,?)
  `).run(user.id, user.role, amount, method, now, expires);

  db.prepare(`
    UPDATE users SET subscribed_until=?, subscription_status='active' WHERE id=?
  `).run(expires, user.id);

  return reply.redirect(`/${user.role}s/dashboard?success=Abonnement activé`);
});

}
