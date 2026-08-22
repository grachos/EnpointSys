import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Configuration (all secrets/credentials come from the environment)
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('FATAL: JWT_SECRET env var is required and must be at least 32 chars.');
  process.exit(1);
}
const DOCS_TOKEN_SECRET = process.env.DOCS_TOKEN_SECRET || JWT_SECRET;

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'endpointsys_db',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_LIMIT || '50', 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  namedPlaceholders: false
};

const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean)
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

const BODY_LIMIT = process.env.BODY_LIMIT || '2mb';
const HISTORY_LIMIT = parseInt(process.env.HISTORY_LIMIT || '200', 10);
const DB_NAME = DB_CONFIG.database;

const app = express();

// ---------------------------------------------------------------------------
// Security middleware
// ---------------------------------------------------------------------------
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // Vite/front-end served separately
}));
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: BODY_LIMIT }));

// General API rate limiter (300 req/min per IP)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' }
});
app.use('/api', apiLimiter);

// Stricter limiter on login to blunt brute-force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' }
});

// MySQL Connection Pool
const pool = mysql.createPool(DB_CONFIG);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function newId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function generatePassword(length = 16) {
  const charset = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) out += charset[bytes[i] % charset.length];
  return out;
}

function signDocToken(collectionId) {
  const mac = crypto.createHmac('sha256', DOCS_TOKEN_SECRET).update(collectionId).digest('base64url');
  return `${collectionId}.${mac}`;
}

function verifyDocToken(token) {
  if (typeof token !== 'string' || token.length === 0) return null;
  const idx = token.lastIndexOf('.');
  if (idx <= 0) return null;
  const colId = token.slice(0, idx);
  const mac = token.slice(idx + 1);
  if (!colId || !mac) return null;
  const expected = crypto.createHmac('sha256', DOCS_TOKEN_SECRET).update(colId).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return colId;
}

async function addColumnIfNotExists(conn, table, column, def) {
  const [cols] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [DB_NAME, table, column]
  );
  if (cols.length === 0) {
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN ${def}`);
  }
}

async function addIndexIfNotExists(conn, table, indexName, columns) {
  const [idx] = await conn.query(
    `SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [DB_NAME, table, indexName]
  );
  if (idx.length === 0) {
    await conn.query(`ALTER TABLE \`${table}\` ADD INDEX \`${indexName}\` (${columns})`);
  }
}

// Ensure a (user_id, refCol) composite PRIMARY KEY, migrating from a single-col
// PK or a fresh table. Safe to call repeatedly.
async function ensureCompositePK(conn, table, refCol) {
  const [pk] = await conn.query(
    `SELECT COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = 'PRIMARY' ORDER BY ORDINAL_POSITION`,
    [DB_NAME, table]
  );
  const pkCols = pk.map(r => r.COLUMN_NAME);
  const want = ['user_id', refCol];
  const isAlready = pkCols.length === 2 && pkCols[0] === want[0] && pkCols[1] === want[1];
  if (isAlready) return;
  if (pkCols.length > 0) {
    await conn.query(`ALTER TABLE \`${table}\` DROP PRIMARY KEY`);
  }
  await conn.query(`ALTER TABLE \`${table}\` ADD PRIMARY KEY (\`user_id\`, \`${refCol}\`)`);
}

// Prune history so the newest HISTORY_LIMIT rows per user are kept.
async function pruneHistory(conn, userId) {
  const [keep] = await conn.query(
    'SELECT MIN(created_at) AS min_created FROM (SELECT created_at FROM history WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?) k',
    [userId, HISTORY_LIMIT]
  );
  if (keep[0] && keep[0].min_created) {
    await conn.query('DELETE FROM history WHERE user_id = ? AND created_at < ?', [userId, keep[0].min_created]);
  }
}

// ---------------------------------------------------------------------------
// Auth Middleware
// ---------------------------------------------------------------------------
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (authHeader && authHeader.split(' ')[1]);

  if (!token) {
    req.user = { id: 'default', username: 'local_workspace', name: 'Workspace User', role: 'admin' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = { id: 'default', username: 'local_workspace', name: 'Workspace User', role: 'admin' };
      return next();
    }
    req.user = user;
    next();
  });
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.id === 'default' || req.user.role !== role) {
      return res.status(403).json({ error: `Access denied. Requires authenticated ${role} account.` });
    }
    next();
  };
}

// ---------------------------------------------------------------------------
// Schema initialisation & migration
// ---------------------------------------------------------------------------
async function initMySQLSchema() {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role ENUM('admin','operador') NOT NULL DEFAULT 'operador',
        must_change_password TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_users_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await addColumnIfNotExists(conn, 'users', 'must_change_password', 'must_change_password TINYINT(1) NOT NULL DEFAULT 0');

    // Collections (per-user)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS collections (
        user_id VARCHAR(100) NOT NULL,
        id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        items_json LONGTEXT NOT NULL,
        position INT DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await addColumnIfNotExists(conn, 'collections', 'user_id', 'user_id VARCHAR(100) NOT NULL DEFAULT \'\'');
    await conn.query("UPDATE collections SET user_id = 'default' WHERE user_id = '' OR user_id = 'user-admin'");
    await addIndexIfNotExists(conn, 'collections', 'idx_collections_pos', 'user_id, position');
    await ensureCompositePK(conn, 'collections', 'id');

    // Environments (per-user)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS environments (
        user_id VARCHAR(100) NOT NULL,
        id VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        variables_json LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await addColumnIfNotExists(conn, 'environments', 'user_id', 'user_id VARCHAR(100) NOT NULL DEFAULT \'\'');
    await conn.query("UPDATE environments SET user_id = 'default' WHERE user_id = '' OR user_id = 'user-admin'");
    await ensureCompositePK(conn, 'environments', 'id');

    // History (per-user, indexed by created_at for ORDER BY DESC LIMIT)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS history (
        user_id VARCHAR(100) NOT NULL,
        id VARCHAR(100) NOT NULL,
        timestamp VARCHAR(100) NOT NULL,
        request_json LONGTEXT NOT NULL,
        response_json LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, id),
        INDEX idx_history_created (user_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await addColumnIfNotExists(conn, 'history', 'user_id', 'user_id VARCHAR(100) NOT NULL DEFAULT \'\'');
    await conn.query("UPDATE history SET user_id = 'default' WHERE user_id = '' OR user_id = 'user-admin'");
    await addIndexIfNotExists(conn, 'history', 'idx_history_created', 'user_id, created_at');
    await ensureCompositePK(conn, 'history', 'id');

    // Preferences (per-user, keyed by (user_id, pref_key))
    await conn.query(`
      CREATE TABLE IF NOT EXISTS preferences (
        user_id VARCHAR(100) NOT NULL,
        pref_key VARCHAR(100) NOT NULL,
        pref_value LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, pref_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    await addColumnIfNotExists(conn, 'preferences', 'user_id', 'user_id VARCHAR(100) NOT NULL DEFAULT \'\'');
    await conn.query("UPDATE preferences SET user_id = 'default' WHERE user_id = '' OR user_id = 'user-admin'");
    await ensureCompositePK(conn, 'preferences', 'pref_key');

    // Seed default admin with a random one-time password (printed once) if no users exist.
    const [existingUsers] = await conn.query('SELECT COUNT(*) AS cnt FROM users');
    if (existingUsers[0].cnt === 0) {
      const adminPassword = generatePassword(18);
      const adminHash = await bcrypt.hash(adminPassword, 12);
      await conn.query(
        "INSERT INTO users (id, username, password_hash, name, role, must_change_password) VALUES (?, 'admin', ?, 'Administrator', 'admin', 1)",
        [newId('user'), adminHash]
      );
      console.log('==============================================================');
      console.log('  Default admin created. Username: admin');
      console.log(`  One-time password: ${adminPassword}`);
      console.log('  You will be required to change it on first login.');
      console.log('==============================================================');
    }

    console.log('EndpointSys MySQL schema initialised.');
  } catch (err) {
    console.error('MySQL schema init error:', err.message);
  } finally {
    if (conn) conn.release();
  }
}

// ---------------------------------------------------------------------------
// REST API
// ---------------------------------------------------------------------------

// Health check (no auth, no DB secrets leaked)
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', connected: true });
  } catch (err) {
    res.status(500).json({ status: 'error', connected: false });
  }
});

// --- Authentication ----------------------------------------------------------
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      console.warn(`[auth] failed login username="${username}" ip="${req.ip}" reason="no-user"`);
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      console.warn(`[auth] failed login username="${username}" ip="${req.ip}" reason="bad-password"`);
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const payload = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
    console.info(`[auth] login ok username="${username}" role="${user.role}" ip="${req.ip}"`);
    res.json({
      success: true,
      token,
      user: { ...payload, mustChangePassword: !!user.must_change_password }
    });
  } catch (err) {
    console.error('[auth] login error:', err.message);
    res.status(500).json({ error: 'Login failed.' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, name, role, must_change_password FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    const u = rows[0];
    res.json({ user: { id: u.id, username: u.username, name: u.name, role: u.role, mustChangePassword: !!u.must_change_password } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    const match = await bcrypt.compare(currentPassword || '', rows[0].password_hash);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect.' });
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?', [hash, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Staff user management (admin only) -------------------------------------
app.get('/api/users', authenticateToken, requireRole('admin'), async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, name, role, must_change_password, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { username, password, name, role } = req.body;
    if (!username || !name || !role || !['admin', 'operador'].includes(role)) {
      return res.status(400).json({ error: 'username, name and a valid role are required.' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'An initial password of at least 8 characters is required.' });
    }
    const hash = await bcrypt.hash(password, 12);
    await pool.query(
      'INSERT INTO users (id, username, password_hash, name, role, must_change_password) VALUES (?, ?, ?, ?, ?, 1)',
      [newId('user'), username, hash, name, role]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Username already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// --- Collections (per-user, auth required) ----------------------------------
app.get('/api/collections', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, description, items_json FROM collections WHERE user_id = ? ORDER BY position ASC, updated_at DESC',
      [req.user.id]
    );
    res.json(rows.map(r => ({
      id: r.id, name: r.name, description: r.description || '',
      items: JSON.parse(r.items_json || '[]')
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/collections', authenticateToken, async (req, res) => {
  const collections = Array.isArray(req.body) ? req.body : [];
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    if (collections.length > 0) {
      const ids = collections.map(c => c.id).filter(Boolean);
      if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',');
        await conn.query(
          `DELETE FROM collections WHERE user_id = ? AND id NOT IN (${placeholders})`,
          [req.user.id, ...ids]
        );
      }
    } else {
      await conn.query('DELETE FROM collections WHERE user_id = ?', [req.user.id]);
    }

    let idx = 0;
    for (const col of collections) {
      await conn.query(
        `INSERT INTO collections (id, user_id, name, description, items_json, position)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), items_json=VALUES(items_json), position=VALUES(position)`,
        [col.id, req.user.id, col.name, col.description || '', JSON.stringify(col.items || []), idx]
      );
      idx++;
    }

    await conn.commit();
    res.json({ success: true, count: collections.length });
  } catch (err) {
    if (conn) await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// --- Environments (per-user, auth required) ----------------------------------
app.get('/api/environments', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, variables_json FROM environments WHERE user_id = ? ORDER BY updated_at DESC',
      [req.user.id]
    );
    res.json(rows.map(r => ({
      id: r.id, name: r.name, variables: JSON.parse(r.variables_json || '[]')
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/environments', authenticateToken, async (req, res) => {
  const environments = Array.isArray(req.body) ? req.body : [];
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    if (environments.length > 0) {
      const ids = environments.map(e => e.id).filter(Boolean);
      if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',');
        await conn.query(
          `DELETE FROM environments WHERE user_id = ? AND id NOT IN (${placeholders})`,
          [req.user.id, ...ids]
        );
      }
    } else {
      await conn.query('DELETE FROM environments WHERE user_id = ?', [req.user.id]);
    }

    for (let i = 0; i < environments.length; i++) {
      const env = environments[i];
      await conn.query(
        `INSERT INTO environments (id, user_id, name, variables_json)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), variables_json=VALUES(variables_json)`,
        [env.id, req.user.id, env.name, JSON.stringify(env.variables || [])]
      );
    }

    await conn.commit();
    res.json({ success: true, count: environments.length });
  } catch (err) {
    if (conn) await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// --- History (per-user, auth required) --------------------------------------
app.get('/api/history', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, timestamp, request_json, response_json FROM history WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?',
      [req.user.id, HISTORY_LIMIT]
    );
    res.json(rows.map(r => ({
      id: r.id, timestamp: r.timestamp,
      request: JSON.parse(r.request_json || '{}'),
      response: JSON.parse(r.response_json || '{}')
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/history', authenticateToken, async (req, res) => {
  const item = req.body || {};
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO history (id, user_id, timestamp, request_json, response_json)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE timestamp=VALUES(timestamp), request_json=VALUES(request_json), response_json=VALUES(response_json)`,
      [item.id, req.user.id, item.timestamp || new Date().toISOString(), JSON.stringify(item.request || {}), JSON.stringify(item.response || {})]
    );
    await pruneHistory(conn, req.user.id);
    res.json({ success: true });
  } catch (err) {
    if (conn) await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

app.post('/api/history/batch', authenticateToken, async (req, res) => {
  const items = Array.isArray(req.body) ? req.body.slice(0, HISTORY_LIMIT) : [];
  if (items.length === 0) return res.json({ success: true, count: 0 });
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    for (const item of items) {
      await conn.query(
        `INSERT INTO history (id, user_id, timestamp, request_json, response_json)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE timestamp=VALUES(timestamp), request_json=VALUES(request_json), response_json=VALUES(response_json)`,
        [item.id, req.user.id, item.timestamp || new Date().toISOString(), JSON.stringify(item.request || {}), JSON.stringify(item.response || {})]
      );
    }
    await pruneHistory(conn, req.user.id);
    await conn.commit();
    res.json({ success: true, count: items.length });
  } catch (err) {
    if (conn) await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// --- Preferences (per-user, auth required) -----------------------------------
app.get('/api/preferences/:key', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT pref_value FROM preferences WHERE user_id = ? AND pref_key = ?',
      [req.user.id, req.params.key]
    );
    res.json({ value: rows.length > 0 ? JSON.parse(rows[0].pref_value) : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/preferences', authenticateToken, async (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key || typeof key !== 'string') return res.status(400).json({ error: 'key is required.' });
    await pool.query(
      `INSERT INTO preferences (user_id, pref_key, pref_value)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE pref_value=VALUES(pref_value)`,
      [req.user.id, key, JSON.stringify(value === undefined ? null : value)]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Public documentation (signed token, no auth) ---------------------------
// Generate a signed share token for a collection owned by the caller.
app.post('/api/docs/publish', authenticateToken, async (req, res) => {
  try {
    const { collectionId } = req.body;
    if (!collectionId) return res.status(400).json({ error: 'collectionId is required.' });
    const [rows] = await pool.query(
      'SELECT 1 FROM collections WHERE user_id = ? AND id = ?',
      [req.user.id, collectionId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Collection not found.' });
    res.json({ token: signDocToken(collectionId) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public read of a single collection behind a signed token.
app.get('/api/docs/:collectionId', async (req, res) => {
  try {
    const colId = verifyDocToken(req.query.token);
    if (!colId || colId !== req.params.collectionId) {
      return res.status(403).json({ error: 'Invalid or missing documentation token.' });
    }
    const [rows] = await pool.query(
      'SELECT id, name, description, items_json FROM collections WHERE id = ? LIMIT 1',
      [colId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Collection not found.' });
    const r = rows[0];
    res.json({
      id: r.id, name: r.name, description: r.description || '',
      items: JSON.parse(r.items_json || '[]')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Centralised error handler ----------------------------------------------
app.use((err, _req, res, _next) => {
  console.error('[unhandled]', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, '127.0.0.1', async () => {
  console.log(`EndpointSys backend listening on http://127.0.0.1:${PORT}`);
  await initMySQLSchema();
});