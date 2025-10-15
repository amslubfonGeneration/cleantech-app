import db from '../utils/db.js';
import { authenticate } from '../utils/auth.js';


export default async function (fastify) {
  fastify.get('/', async (req, reply) => {
    authenticate(req,reply,['admin', 'user', 'agent', 'partner'])
    const list = db.prepare('SELECT * FROM deposits WHERE user_id=? ORDER BY created_at DESC').all(req.session.get('user').id);
    return reply.view('pages/deposits.ejs', { user: req.session.get('user') || null, deposits: list , ref: null});
  });
}
