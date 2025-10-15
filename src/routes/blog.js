import db from '../utils/db.js';
import { authenticate } from '../utils/auth.js';

export default async function (fastify) {
  // List (filter by status optional)
  fastify.get('/', async (req, reply) => {
    const status = req.query.status;
    const posts = status
      ? db.prepare('SELECT * FROM blog_posts WHERE status=? ORDER BY created_at DESC').all(status)
      : db.prepare('SELECT * FROM blog_posts ORDER BY created_at DESC').all();
    return reply.view('pages/blog.ejs', { posts, user: req.session.get('user') || null, ref: req.query || null });
  
  });

  // Create
  fastify.post('/', async (req, reply) => {
    authenticate(req,reply,['admin'])
    const { title, content, status = 'published' } = req.body;
    if (!title || !content) return reply.code(400).send({ error: 'Titre et contenu requis' });
    const info = db.prepare('INSERT INTO blog_posts (title,content,author_id,status) VALUES (?,?,?,?)')
      .run(title, content, req.session.get('user').id, status);
    return { success: true, post: { id: info.lastInsertRowid, title, status, created_at: Math.floor(Date.now()/1000) } };
  });

  // Update
  fastify.patch('/:id',async (req, reply) => {
    authenticate(req,reply,['admin'])
    const { id } = req.params;
    const { title, content, status } = req.body;
    const post = db.prepare('SELECT * FROM blog_posts WHERE id=?').get(id);
    if (!post) return reply.code(404).send({ error: 'Article introuvable' });
    db.prepare(`
      UPDATE blog_posts SET
        title = COALESCE(?, title),
        content = COALESCE(?, content),
        status = COALESCE(?, status),
        updated_at = strftime('%s','now')
      WHERE id=?
    `).run(title, content, status, id);
    return { success: true };
  });

  // Delete
  fastify.delete('/:id', async (req, reply) => {
    authenticate(req, reply, ['admin'])
    const { id } = req.params;
    db.prepare('DELETE FROM blog_posts WHERE id=?').run(id);
    return { success: true };
  });
}
