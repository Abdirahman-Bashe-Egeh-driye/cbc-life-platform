// ═══════════════════════════════════════════════════════
//   cbc Life Platform — Backend Server (FINAL)
// ═══════════════════════════════════════════════════════

const express  = require('express');
const cors     = require('cors');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const fs       = require('fs');
const path     = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();

// ===== IMPORTANT FOR RENDER =====
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || 'cbc-secret-key';

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== TEST ROUTE =====
app.get('/api/test', (req, res) => {
  res.json({ message: "API working" });
});

// ===== DATABASE SETUP =====
const DB_DIR  = path.join(__dirname, 'data');
const USERS_FILE = path.join(DB_DIR, 'users.json');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return []; }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ===== AUTH MIDDLEWARE =====
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ═══════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    const users = readJSON(USERS_FILE);

    if (users.find(u => u.email === email))
      return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const user = {
      id: uuidv4(),
      name,
      email,
      password: hashed
    };

    users.push(user);
    writeJSON(USERS_FILE, users);

    const token = jwt.sign({ id: user.id }, JWT_SECRET);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = readJSON(USERS_FILE);
    const user = users.find(u => u.email === email);

    if (!user)
      return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id }, JWT_SECRET);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// PROTECTED ROUTE (TEST)
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`
  =====================================
   CBC Life Platform Backend Running
   Port: ${PORT}
  =====================================
  `);
});