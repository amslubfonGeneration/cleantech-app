import db from '../utils/db.js';
import { authenticate } from '../utils/auth.js';
 



export default async function (fastify) {
//*
fastify.get('/challenges/new', async (req, reply) => {
  authenticate(req, reply, ['admin'])
  return reply.view('pages/admin/challenges/new.ejs', { user: req.session.get('user') || null, ref: null });
});

//*
fastify.post('/challenges/new', async (req, reply) => {
  authenticate(req, reply, ['admin'])
  const { name, sponsor, start_date, end_date, bonus_points, description } = req.body;
  const start = Math.floor(new Date(start_date).getTime() / 1000);
  const end = Math.floor(new Date(end_date).getTime() / 1000);
  db.prepare('INSERT INTO challenges (name,sponsor,start_date,end_date,bonus_points,description) VALUES (?,?,?,?,?,?)')
    .run(name, sponsor, start, end, bonus_points, description);
  reply.redirect('/admin/dashboard?success=Challenge créé');
});


//*


//*
fastify.get('/analytics', async (req, reply) => {
  authenticate(req, reply, ['admin'])
  const { period = 'month', region = 'all', waste_type = 'all' } = req.query;

  // Filtre période
  let dateFilter = '';
  if (period === 'week') dateFilter = 'AND d.created_at >= strftime(\'%s\',\'now\') - 7*24*3600';
  if (period === 'month') dateFilter = 'AND d.created_at >= strftime(\'%s\',\'now\',\'-1 month\')';
  if (period === 'year') dateFilter = 'AND d.created_at >= strftime("\'%s\',\'now\',\'-1 year\')';

  // Filtre région
  let regionFilter = '';
  if (region !== 'all') regionFilter = 'AND cp.address LIKE ?';

  // Filtre type de déchet
  let typeFilter = '';
  if (waste_type !== 'all') typeFilter = 'AND d.type = ?';

  const query = `
    SELECT SUM(d.weight) AS recycled, COUNT(d.id) AS deposits
    FROM deposits d
    JOIN collect_points cp ON cp.id = d.collect_point_id
    WHERE 1=1 ${dateFilter} ${regionFilter} ${typeFilter}
  `;

  const params = [];
  if (region !== 'all') params.push(`%${region}%`);
  if (waste_type !== 'all') params.push(waste_type);

  const stats = db.prepare(query).get(...params);

  const challenges = db.prepare(`
    SELECT c.id, c.name, c.sponsor, COUNT(cp.id) AS participants, SUM(c.bonus_points) AS total_bonus
    FROM challenges c
    LEFT JOIN challenge_participants cp ON cp.challenge_id = c.id
    GROUP BY c.id
    ORDER BY c.start_date DESC
  `).all();

  return reply.view('pages/admin/analytics.ejs', { stats, challenges, filters: { period, region, waste_type } , user: req.session.get('user') || null, ref: null });
});

//*
fastify.get('/badges/assign', async (req, reply) => {
    authenticate(req, reply, ['admin'])
    const users = db.prepare('SELECT id, name, email FROM users ORDER BY name').all();
    const badges = db.prepare('SELECT id, name, tier FROM badges ORDER BY tier').all();
    return reply.view('pages/admin/badges/assign.ejs', { users, badges , user: req.session.get('user') || null, ref: null });
});

//*
fastify.post('/badges/assign', async (req, reply) => {
    authenticate(req, reply, ['admin'])
    const { user_id, badge_id } = req.body;
    if (!user_id || !badge_id) {
      reply.redirect('/admin/badges/assign?error=Champs requis');
    }

    const already = db.prepare('SELECT id FROM user_badges WHERE user_id=? AND badge_id=?').get(user_id, badge_id);
    if (already) {
      return reply.redirect('/admin/badges/assign?error=Badge déjà attribué');
    }

    db.prepare('INSERT INTO user_badges (user_id, badge_id) VALUES (?,?)').run(user_id, badge_id);
    reply.redirect('/admin/badges?success=Badge attribué avec succès' );
  });

//*
fastify.get('/badges/refresh',
  async (req, reply) => {
    authenticate(req, reply, ['admin'])
    const query = `
      INSERT INTO user_badges (user_id, badge_id)
      SELECT u.id, b.id
      FROM users u
      JOIN badges b ON u.points >= b.requirement_points
      LEFT JOIN user_badges ub ON ub.user_id = u.id AND ub.badge_id = b.id
      WHERE ub.id IS NULL;
    `;
    db.exec(query);
    reply.redirect('/admin/badges?success=Badges mis à jour automatiquement' );
  });

//*
fastify.get('/badges',
  async (req, reply) => {
    authenticate(req, reply, ['admin'])
    const badges = db.prepare('SELECT * FROM badges ORDER BY requirement_points ASC').all();
    return reply.view('pages/admin/badges/list.ejs', { badges, user: req.session.get('user') || null, ref: null });
  });

//*
fastify.get('/badges/new',
  async (req, reply) => {
    authenticate(req, reply, ['admin'])
    return reply.view('pages/admin/badges/new.ejs', {user: req.session.get('user') || null, ref: null});
  });

//*
fastify.post('/badges/new',
  async (req, reply) => {
    authenticate(req, reply, ['admin'])
    const { name, description, tier, requirement_points, type } = req.body;
    if (!name || !tier || !requirement_points) {
      return reply.redirect('/admin/badges/new?error=Champs requis');
    }
    db.prepare('INSERT INTO badges (name,description,tier,requirement_points,type) VALUES (?,?,?,?,?)')
      .run(name, description || '', tier, requirement_points, type || 'parrainage');
    return reply.redirect('/admin/badges?success=Badge ajouté');
  });

//*
  fastify.get('/dashboard', async (req, reply) => {
    authenticate(req, reply, ['admin'])
    const users = db.prepare('SELECT id,name,email,role,points,referral_code FROM users ORDER BY id DESC LIMIT 50').all();
    const partners = db.prepare('SELECT * FROM partners ORDER BY id DESC').all();
    const agents = db.prepare('SELECT * FROM users WHERE role=\'agent\' ORDER BY id DESC').all();

    console.log(users, partners, agents)
    
    return reply.view('pages/dashboards/admin.ejs', { user: req.session.get('user'), users, partners, agents, ref: null });
  });

  // Admin blog CMS (simple)
  fastify.get('/blog', async (req, reply) => {
    authenticate(req, reply, ['admin'])
    const posts = db.prepare('SELECT * FROM blog_posts ORDER BY created_at DESC').all();
    return reply.view('pages/dashboards/blog_admin.ejs', { user: req.session.get('user')|| null, posts , ref:  null});
  });
//*
  fastify.post('/blog/new', async (req, reply) => {
    authenticate(req, reply, ['admin'])
    const { title, content, status = 'published' } = req.body;
    if (!title || !content) return reply.redirect('/admin/blog?error=' + encodeURIComponent('Titre et contenu requis'));
    db.prepare('INSERT INTO blog_posts (title,content,author_id,status) VALUES (?,?,?,?)').run(title, content, req.session.get('user').id, status);
    return reply.redirect('/admin/blog?success=' + encodeURIComponent('Article publié'));
  });
//*
  fastify.get('/rewards/new',async (req, reply) => {
      authenticate(req, reply,['admin'])
      return reply.view('pages/admin/new-reward.ejs', {user: req.session.get('user') || null, ref: null });
  });
//*
  fastify.post('/rewards/new', async (req, reply) => {
      authenticate(req, reply,['admin'])
      const { title, description, points,  partenaire_id} = req.body;
      if (!title || !points || !partenaire_id) return reply.redirect('/admin/rewards/new?error=Champs requis');
      db.prepare('INSERT INTO rewards (name,description,points_required,partner_id) VALUES (?,?,?,?)')
        .run(title, description || '', points, partenaire_id)
      return reply.redirect('/admin/rewards/new?success=Récompense ajoutée');
  });
//*
  fastify.get('/redemptions', async (req, reply) => {
      authenticate(req, reply,['admin'])
      const redemptions = db.prepare(`
        SELECT r.id, u.name AS user,r.created_at
        FROM redemptions r
        JOIN users u ON r.user_id = u.id
        JOIN rewards rw ON r.reward_id = rw.id
        ORDER BY r.created_at DESC
      `).all();
      return reply.view('pages/admin/redemptions.ejs', { user: req.session.get('user') || null, redemptions, ref: null });
  });

  fastify.post('/redemptions/:id/approve', async (req, reply) => {
      authenticate([req, reply,'admin'])
      const { id } = req.params;
      db.prepare('UPDATE redemptions SET status="approved" WHERE id=?').run(id);
      return reply.redirect('/admin/redemptions?success=Réclamation approuvée');
  });

  fastify.post('/redemptions/:id/reject', async (req, reply) => {
      
      const { id } = req.params;
      db.prepare('UPDATE redemptions SET status="rejected" WHERE id=?').run(id);
      return reply.redirect('/admin/redemptions?success=Réclamation rejetée');
  });
//*
  fastify.get('/deposits/:id/edit', async (req, reply) => {
    authenticate(req, reply,['admin'])
  const deposit = db.prepare('SELECT * FROM deposits WHERE id=?').get(req.params.id);
  const points = db.prepare('SELECT id, name FROM collect_points').all();
  console.log(deposit, points)
  return reply.view('pages/admin/deposits/edit.ejs', { deposit, points, user: req.session.get('user'), ref: null });
});
//*
fastify.post('/deposits/:id/edit', async (req, reply) => {
  authenticate(req, reply,['admin'])
  const { collect_point_id } = req.body;
  db.prepare('UPDATE deposits SET collect_point_id=? WHERE id=?').run(collect_point_id, req.params.id);
  reply.redirect('/admin/dashboard?success=Point de collecte attribué');
});

}
