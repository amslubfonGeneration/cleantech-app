# CleanTech (v2 sans decorate/addHook)

- Fastify (API), EJS (views), better-sqlite3 (DB)
- Modules: Auth, Agents, Partenaires, Stats, Récompenses, Badges, Challenges, Admin, Blog API mobile (CRUD + brouillons)
- JWT sécurisé via @fastify/jwt (utilisé directement dans les routes, pas de decorate)
- SweetAlert2 pour les boîtes de dialogue de feedback
- Intégrations: Stripe (stub), Mobile Money (stub), Email/SMS/Push (stubs)
- Monitoring: /metrics via prom-client (route simple)

Scripts:
- npm run dev
- npm run migrate
- npm run seed
