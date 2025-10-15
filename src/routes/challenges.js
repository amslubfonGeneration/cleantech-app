import { authenticate } from '../utils/auth.js';
import db from '../utils/db.js';

export default async function (fastify) {
  fastify.get('/:id/participants', async (req, reply) => {
  authenticate(req, reply, ['admin', 'user', 'partener', 'investor'])
  const challenge = db.prepare('SELECT * FROM challenges WHERE id=?').get(req.params.id);
  const participants = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, cp.joined_at
    FROM challenge_participants cp
    JOIN users u ON u.id = cp.user_id
    WHERE cp.challenge_id = ?
    ORDER BY cp.joined_at DESC
  `).all(req.params.id);
   
  return reply.view('pages/admin/challenges/participants.ejs', { challenge, participants, user: req.session.get('user') || null, ref: null});
});

  fastify.get('/', async (req, reply) => {
  const now = Math.floor(Date.now() / 1000);
  const active = db.prepare('SELECT * FROM challenges WHERE start_date <= ? AND end_date >= ?').all(now, now);
  return reply.view('pages/admin/challenges/list.ejs', { challenges: active, user: req.session.get('user') || null, ref: null  });
});

fastify.post('/:id/join', async (req, reply) => {
  authenticate(req, reply, ['user', 'partener', 'investor', 'agent']);
  const user = req.session.get('user');
  const challengeId = req.params.id;

  const already = db.prepare('SELECT id FROM challenge_participants WHERE user_id=? AND challenge_id=?').get(user.id, challengeId);
  if (already) return reply.redirect('/challenges?error=Déjà inscrit');

  const challenge = db.prepare('SELECT bonus_points FROM challenges WHERE id=?').get(challengeId);
  db.prepare('INSERT INTO challenge_participants (user_id, challenge_id) VALUES (?,?)').run(user.id, challengeId);
  db.prepare('UPDATE users SET points = points + ? WHERE id=?').run(challenge.bonus_points, user.id);

  reply.redirect('/challenges?success=Inscription réussie + bonus');
});

}
