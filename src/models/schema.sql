PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user','agent','partner','admin','investor')),
  points INTEGER NOT NULL DEFAULT 0,
  referral_code TEXT UNIQUE,
  created_at INTEGER NOT NULL DEFAULT(strftime('%s','now')),
  subscribed_until INTEGER DEFAULT 0,
  subscription_status TEXT DEFAULT 'pending'
);

-- Table partners
CREATE TABLE IF NOT EXISTS partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- Table collect_points
CREATE TABLE IF NOT EXISTS collect_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  agent_id INTEGER,
  FOREIGN KEY (agent_id) REFERENCES users(id)
);

-- Table deposits
CREATE TABLE IF NOT EXISTS deposits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('plastique','verre','metal','electronique')),
  weight REAL NOT NULL,
  points INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  collect_point_id INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (collect_point_id) REFERENCES collect_points(id)
);

-- Table subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'XOF',
  method TEXT,
  paid_at INTEGER NOT NULL DEFAULT(strftime('%s','now')),
  expires_at INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Table challenges
CREATE TABLE IF NOT EXISTS challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sponsor TEXT,
  start_date INTEGER,
  end_date INTEGER,
  bonus_points INTEGER NOT NULL DEFAULT 0,
  description TEXT
);

-- Table challenge_participants
CREATE TABLE IF NOT EXISTS challenge_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  joined_at INTEGER DEFAULT(strftime('%s','now')),
  FOREIGN KEY(challenge_id) REFERENCES challenges(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Table badges
CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  tier INTEGER NOT NULL,
  requirement_points INTEGER NOT NULL,
  type TEXT DEFAULT 'parrainage'
);

-- Table user_badges
CREATE TABLE IF NOT EXISTS user_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  badge_id INTEGER NOT NULL,
  awarded_at INTEGER NOT NULL DEFAULT(strftime('%s','now')),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(badge_id) REFERENCES badges(id)
);

-- Table referrals
CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_id INTEGER NOT NULL,
  referred_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT(strftime('%s','now')),
  FOREIGN KEY(referrer_id) REFERENCES users(id),
  FOREIGN KEY(referred_id) REFERENCES users(id)
);

-- Table rewards
CREATE TABLE IF NOT EXISTS rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  partner_id INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  FOREIGN KEY (partner_id) REFERENCES partners(id)
);

-- Table redemptions
CREATE TABLE IF NOT EXISTS redemptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  reward_id INTEGER NOT NULL,
  partner_id INTEGER,
  title TEXT NOT NULL,
  statut TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (reward_id) REFERENCES rewards(id),
  FOREIGN KEY (partner_id) REFERENCES partners(id)
);

-- Table blog_posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id INTEGER,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published','draft')),
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER,
  FOREIGN KEY (author_id) REFERENCES users(id)
);