-- Avant chaque INSERT dans users, on génère referral_code via RANDOM()
INSERT INTO users (name,email,password_hash,role,points,referral_code) VALUES
('Admin','admin@cleantech.bj','admin123','admin',0,hex(randomblob(8))),
('Agent Alpha','agent@cleantech.bj','agent123','agent',0,hex(randomblob(8))),
('Partenaire Valdeo','partner@valdeo.bj','partner123','partner',0,hex(randomblob(8))),
('Investisseur Demo','invest@demo.bj','invest123','investor',0,hex(randomblob(8))),
('Utilisateur Test','user@test.bj','user123','user',1000,hex(randomblob(8))),
('Utilisateur Test2','user@test2.bj','user123','user',500,hex(randomblob(8)));


-- Aucune donnée initiale dans referrals


INSERT INTO partners (name, contact_email, contact_phone) VALUES
('Valdeo','contact@valdeo.bj','+229 01 02 03 04'),
('SGDS','info@sgds.bj','+229 05 06 07 08'),
('Bénin Ferrailles','contact@ferrailles.bj','+229 09 10 11 12');

INSERT INTO collect_points (name,address,agent_id) VALUES
('Point Cadjèhoun','Cotonou Cadjèhoun',2),
('Point Akpakpa','Cotonou Akpakpa',2);

INSERT INTO rewards (name,description,points_required,partner_id) VALUES
('Bon d''achat 5,000 XOF','Chez partenaire local',500,1),
('Plante d''intérieur','Plante décorative',300,2),
('Gourde durable','Made in Benin',700,1),
('Gourde durable','Made in French',700,1),
('Sac durable','Made in Benin',800,1);

INSERT INTO badges (name,description,tier,requirement_points) VALUES
('Eco-Débutant','Premier dépôt',1,10),
('Eco-Avancé','100 points cumulés',2,100),
('Eco-Héros','500 points cumulés',3,500);

INSERT INTO challenges (name,sponsor,start_date,end_date,bonus_points,description) VALUES
('Semaine Verte','SGDS',strftime('%s','now'),strftime('%s','now')+7*24*3600,50,'Défi communautaire pour recycler plus.');

INSERT INTO blog_posts (title,content,author_id,status) VALUES
('Bienvenue sur le blog CleanTech','Ce blog partage nos actualités, conseils et témoignages.',1,'published'),
('Article en brouillon','Un article en cours de rédaction.',1,'draft');

INSERT INTO badges (name, description, tier, requirement_points, type)
VALUES ('Super Parrain', 'A obtenu 5 filleuls grâce au parrainage', 1, 0, 'parrainage');


-- Exemple d'insertion dans user_badges
-- INSERT INTO user_badges (user_id, badge_id) VALUES (5, 1); -- L'utilisateur avec id 5 reçoit le badge avec id 1
-- INSERT INTO user_badges (user_id, badge_id) VALUES (5, 2); -- L'utilisateur avec id 5 reçoit le badge avec id 2
-- INSERT INTO user_badges (user_id, badge_id) VALUES (6, 1); -- L'utilisateur avec id 6 reçoit le badge avec id 1
-- INSERT INTO user_badges (user_id, badge_id) VALUES (6, 2); -- L'utilisateur avec id 6 reçoit le badge avec id 2
-- INSERT INTO user_badges (user_id, badge_id) VALUES (6, 3); -- L'utilisateur avec id 6 reçoit le badge avec id 3