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
    let active = 0
    if (!req.session.get('user')){
    active = db.prepare(`
    SELECT 
      c.*,
      COUNT(cp.user_id) AS participant_count
    FROM challenges c
    LEFT JOIN challenge_participants cp ON cp.challenge_id = c.id
    GROUP BY c.id
    ORDER BY c.start_date DESC
  `).all();
    }else{
  const now = Math.floor(Date.now() / 1000);
  active = db.prepare(`
    SELECT 
      c.*,
      COUNT(cp.user_id) AS participant_count,
      EXISTS (
        SELECT 1 FROM challenge_participants 
        WHERE challenge_id = c.id AND user_id = ?
      ) AS is_joined
    FROM challenges c
    LEFT JOIN challenge_participants cp ON cp.challenge_id = c.id
    GROUP BY c.id
    ORDER BY c.start_date DESC
  `).all(req.session.get('user').id);
}
  console.log(active);
  return reply.view('pages/admin/challenges/list.ejs', { challenges: active, user: req.session.get('user') || null, ref: null  });
});

fastify.post('/:id/join', async (req, reply) => {
  authenticate(req, reply, ['user', 'partner', 'investor', 'agent']);
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
