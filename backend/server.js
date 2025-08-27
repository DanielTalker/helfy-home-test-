import express from 'express';
import cors from 'cors';
import log4js from 'log4js';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.PORT || 3001;
const DB_HOST = process.env.DB_HOST || 'tidb';
const DB_PORT = process.env.DB_PORT || 4000;
const DB_USER = process.env.DB_USER || 'root';
const DB_NAME = process.env.DB_NAME || 'helfy';

log4js.configure({ appenders: { out: { type: 'stdout' } }, categories: { default: { appenders: ['out'], level: 'info' } }});
const logger = log4js.getLogger();

const app = express();
app.use(cors());
app.use(express.json());

let pool;
async function initDb() {
  pool = mysql.createPool({
    host: DB_HOST, port: DB_PORT, user: DB_USER, database: DB_NAME,
    waitForConnections: true, connectionLimit: 10
  });
  const [rows] = await pool.query('SELECT id, email, password_hash FROM users WHERE email=?', ['admin@example.com']);
  if (rows.length > 0 && rows[0].password_hash === 'TO_BE_FILLED_BY_APP') {
    const hash = await bcrypt.hash('Password123!', 10);
    await pool.query('UPDATE users SET password_hash=? WHERE id=?', [hash, rows[0].id]);
    logger.info(JSON.stringify({ timestamp: new Date().toISOString(), action: 'seed_password_hash', userId: rows[0].id }));
  }
}

async function authMiddleware(req, res, next) {
  try {
    const token = req.header('X-Auth-Token');
    if (!token) return res.status(401).json({ error: 'Missing token' });
    const [rows] = await pool.query(
      'SELECT t.user_id as userId, u.email as email FROM tokens t JOIN users u ON u.id=t.user_id WHERE t.token=?',
      [token]
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid token' });
    req.user = { id: rows[0].userId, email: rows[0].email };
    next();
  } catch {
    res.status(500).json({ error: 'Auth failed' });
  }
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.post('/api/login', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const [rows] = await pool.query('SELECT id, password_hash FROM users WHERE email=?', [email]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = uuidv4().replace(/-/g, '');
    await pool.query('INSERT INTO tokens(user_id, token) VALUES (?, ?)', [user.id, token]);

    logger.info(JSON.stringify({ timestamp: new Date().toISOString(), userId: user.id, action: 'login', ipAddress: ip }));
    res.json({ token });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/me', authMiddleware, (req, res) => res.json({ id: req.user.id, email: req.user.email }));

app.post('/api/logout', authMiddleware, async (req, res) => {
  const token = req.header('X-Auth-Token');
  await pool.query('DELETE FROM tokens WHERE token=?', [token]);
  logger.info(JSON.stringify({ timestamp: new Date().toISOString(), userId: req.user.id, action: 'logout', ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '' }));
  res.json({ ok: true });
});

(async () => {
  try {
    await initDb();
    app.listen(PORT, () => logger.info(JSON.stringify({ timestamp: new Date().toISOString(), action: 'server_started', port: PORT })));
  } catch (e) {
    console.error('Failed to init:', e);
    process.exit(1);
  }
})();
