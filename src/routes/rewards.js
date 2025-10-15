import db from '../utils/db.js';
import { authenticate } from '../utils/auth.js';

export default async function (fastify) {
  fastify.get('/',async (req, reply) => {
    authenticate(req, reply, ['agent', 'user', 'admin', 'partenaire'])
    const points = db.prepare('SELECT points FROM users WHERE id=?').get(req.session.get('user').id)?.points || 0;
    const rewards = db.prepare('SELECT * FROM rewards ORDER BY points_required ASC').all();
    console.log(rewards, points);
    return reply.view('pages/rewards/list.ejs', { rewards, user: req.session.get('user'), points , ref: null});
  });

  fastify.post('/:id/redeem', async (req, reply) => {
    authenticate(req, reply, ['agent', 'user', 'admin', 'partenaire'])
    console.log(req.params.id);
    const reward = db.prepare('SELECT * FROM rewards WHERE id=?').get(req.params.id);
    const points = db.prepare('SELECT points FROM users WHERE id=?').get(req.session.get('user').id)?.points || 0;
    
    if (!reward) return reply.redirect('/rewards?error=Récompense introuvable');

    const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.session.get('user').id);
    if (points < reward.points_required)
      return reply.redirect('/rewards?error=Points insuffisants');

    db.prepare('INSERT INTO redemptions (user_id,reward_id,title,statut) VALUES (?,?,?,?)')
      .run(user.id, reward.id, 'votre récompense','pending');
    //envoie d'identifiant de réclamation par email
    return reply.redirect('/rewards?success=Réclamation envoyée');
  });


  /*fastify.get('/', async (req, reply) => {
    const rewards = db.prepare('SELECT * FROM rewards ORDER BY points_required ASC').all();
    return reply.view('pages/rewards.ejs', { user: req.session.get('user') || null, rewards });
  });*/

//No use
  fastify.post('/redeem', async (req, reply) => {
    authenticate(req, reply, ['user', 'partner', 'agent']);
    const { rewardId } = req.body;
    const reward = db.prepare('SELECT * FROM rewards WHERE id=?').get(rewardId);
    const user = db.prepare('SELECT points FROM users WHERE id=?').get(req.user.id);
    if (!reward) return reply.redirect('/rewards?error=' + encodeURIComponent('Récompense introuvable'));
    if (user.points < reward.points_required) return reply.redirect('/rewards?error=' + encodeURIComponent('Points insuffisants'));

    db.prepare('INSERT INTO redemptions (user_id,reward_id,partner_id) VALUES (?,?,?)').run(req.user.id, reward.id, reward.partner_id);
    db.prepare('UPDATE users SET points = points - ? WHERE id=?').run(reward.points_required, req.user.id);

    return reply.redirect('/rewards?success=' + encodeURIComponent('Récompense échangée'));
  });
}
