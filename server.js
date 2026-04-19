// ═══════════════════════════════════════════════════════
//   cbc Life Platform — Backend Server
//   Node.js + Express + JWT + JSON file database
// ═══════════════════════════════════════════════════════

const express  = require('express');
const cors     = require('cors');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const fs       = require('fs');
const path     = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'cbc-super-secret-key-change-in-production';

// ── Middleware ────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── File-based database helpers ───────────────────────
const DB_DIR  = path.join(__dirname, 'data');
const USERS_FILE = path.join(DB_DIR, 'users.json');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch(e) { return []; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Per-user data file
function userDataFile(userId) {
  const dir = path.join(DB_DIR, 'users');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  return path.join(dir, `${userId}.json`);
}

function getUserData(userId) {
  const file = userDataFile(userId);
  if (!fs.existsSync(file)) {
    // Seed default data for new user
    const defaults = getDefaultUserData();
    writeJSON(file, defaults);
    return defaults;
  }
  return readJSON(file);
}

function saveUserData(userId, data) {
  writeJSON(userDataFile(userId), data);
}

// ── Default data for new users ────────────────────────
function getDefaultUserData() {
  return {
    tasks: [
      { id:1, name:'Complete Algorithm Assignment', priority:'High',   energy:'High Energy',   cat:'Study',   dl:'Today',    done:false },
      { id:2, name:'Submit project proposal',       priority:'High',   energy:'High Energy',   cat:'Work',    dl:'Tomorrow', done:false },
      { id:3, name:'Study Trees chapter',           priority:'High',   energy:'High Energy',   cat:'Study',   dl:'Today',    done:true  },
      { id:4, name:'Review Data Structures notes',  priority:'Medium', energy:'Medium Energy', cat:'Study',   dl:'Today',    done:false },
      { id:5, name:'Read 20 pages of book',         priority:'Low',    energy:'Low Energy',    cat:'Personal',dl:'This week',done:false }
    ],
    nextTaskId: 6,
    habits: [
      { id:1, name:'Gym Workout',   icon:'&#x1F3CB;', cat:'Fitness',    streak:12, best:21, hist:[1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0], today:true  },
      { id:2, name:'Reading',       icon:'&#x1F4DA;', cat:'Study',      streak:7,  best:14, hist:[1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,0,1,1,1,1,0,1,1,1,1,1,1], today:false },
      { id:3, name:'Meditation',    icon:'&#x1F9D8;', cat:'Mindfulness',streak:5,  best:9,  hist:[1,1,1,1,1,0,0,1,1,1,1,1,0,0,1,1,1,0,1,1,1,0,1,1,1,1,0,0], today:false },
      { id:4, name:'Study Session', icon:'&#x1F4D6;', cat:'Study',      streak:9,  best:9,  hist:[1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1], today:true  },
      { id:5, name:'Prayer',        icon:'&#x1F64F;', cat:'Spiritual',  streak:21, best:21, hist:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], today:true  }
    ],
    nextHabitId: 6,
    meals: [
      { id:1, name:'Breakfast',     icon:'&#x1F373;', desc:'Egg whites, oats 80g, banana, whey protein',   time:'07:00', kcal:620, prot:42, carb:72, fat:12 },
      { id:2, name:'Morning Snack', icon:'&#x1F34E;', desc:'Greek yogurt, almonds 30g, apple',              time:'10:30', kcal:280, prot:18, carb:28, fat:11 },
      { id:3, name:'Lunch',         icon:'&#x1F357;', desc:'Chicken breast 200g, brown rice 120g, broccoli',time:'13:00', kcal:680, prot:48, carb:82, fat:14 },
      { id:4, name:'Dinner',        icon:'&#x1F37D;', desc:'Salmon 180g, sweet potato 150g, salad',        time:'19:00', kcal:660, prot:40, carb:55, fat:22 }
    ],
    nextMealId: 5,
    nTargets: { kcal:2800, prot:150, carb:320, fat:70 },
    topics: [
      { id:1, name:'Algorithms',         progress:90, priority:'High',   notes:'Practice complex problems' },
      { id:2, name:'Stacks & Queues',    progress:75, priority:'High',   notes:'Review implementations' },
      { id:3, name:'Trees',              progress:45, priority:'High',   notes:'Study BST, AVL, Heap' },
      { id:4, name:'Graphs',             progress:20, priority:'Medium', notes:'BFS, DFS, Dijkstra' },
      { id:5, name:'Sorting Algorithms', progress:60, priority:'Medium', notes:'Merge, Quick, Heap sort' }
    ],
    nextTopicId: 6,
    examInfo: { name:'Data Structures Final', date:'2026-04-05', dailyGoal:2 },
    challenges: [
      { id:1, name:'30-Day Fitness Challenge', desc:'Gym workout every single day', goals:['Build consistent gym habit','Lose 3kg','Improve strength'], cat:'Fitness', duration:30, dailyTime:'1 hour', timeOfDay:'Morning', start:'2026-03-01', end:'2026-03-30', checkedIn:false, checkIns:12 }
    ],
    nextChalId: 2,
    planner: { blocks:[], accepted:false },
    reflection: { mood:'', q1:'', q2:'', q3:'' },
    focusSessions: [],
    focusTotalMins: 0,
    focusSettings: { focus:25, short:5, long:15, goal:5 },
    achManualOverrides: {},
    achCustom: []
  };
}

// ── Auth Middleware ───────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch(e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ════════════════════════════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════════════════════════════

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const users = readJSON(USERS_FILE);
    if (users.find(u => u.email === email.toLowerCase()))
      return res.status(409).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user   = { id: uuidv4(), name, email: email.toLowerCase(), password: hashed, createdAt: new Date().toISOString() };
    users.push(user);
    writeJSON(USERS_FILE, users);

    // Init user data
    getUserData(user.id);

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch(e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required' });

    const users = readJSON(USERS_FILE);
    const user  = users.find(u => u.email === email.toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Incorrect email or password' });

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch(e) {
    res.status(500).json({ error: 'Server error: ' + e.message });
  }
});

// GET /api/auth/me  — verify token + return user info
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ════════════════════════════════════════════════════════
//  TASKS
// ════════════════════════════════════════════════════════
app.get('/api/tasks', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  res.json({ tasks: d.tasks, nextId: d.nextTaskId });
});

app.post('/api/tasks', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  const task = { id: d.nextTaskId++, ...req.body, done: false };
  d.tasks.push(task);
  saveUserData(req.user.id, d);
  res.json(task);
});

app.put('/api/tasks/:id', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  const idx = d.tasks.findIndex(t => t.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });
  d.tasks[idx] = { ...d.tasks[idx], ...req.body };
  saveUserData(req.user.id, d);
  res.json(d.tasks[idx]);
});

app.delete('/api/tasks/:id', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  d.tasks = d.tasks.filter(t => t.id !== parseInt(req.params.id));
  saveUserData(req.user.id, d);
  res.json({ ok: true });
});

// ════════════════════════════════════════════════════════
//  HABITS
// ════════════════════════════════════════════════════════
app.get('/api/habits', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  res.json({ habits: d.habits, nextId: d.nextHabitId });
});

app.post('/api/habits', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  const habit = { id: d.nextHabitId++, streak:0, best:0, hist:[0,0,0,0,0,0,0], today:false, ...req.body };
  d.habits.push(habit);
  saveUserData(req.user.id, d);
  res.json(habit);
});

app.put('/api/habits/:id', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  const idx = d.habits.findIndex(h => h.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Habit not found' });
  d.habits[idx] = { ...d.habits[idx], ...req.body };
  saveUserData(req.user.id, d);
  res.json(d.habits[idx]);
});

app.delete('/api/habits/:id', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  d.habits = d.habits.filter(h => h.id !== parseInt(req.params.id));
  saveUserData(req.user.id, d);
  res.json({ ok: true });
});

// ════════════════════════════════════════════════════════
//  MEALS & NUTRITION
// ════════════════════════════════════════════════════════
app.get('/api/nutrition', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  res.json({ meals: d.meals, targets: d.nTargets, nextId: d.nextMealId });
});

app.post('/api/nutrition/meals', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  const meal = { id: d.nextMealId++, ...req.body };
  d.meals.push(meal);
  saveUserData(req.user.id, d);
  res.json(meal);
});

app.put('/api/nutrition/meals/:id', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  const idx = d.meals.findIndex(m => m.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Meal not found' });
  d.meals[idx] = { ...d.meals[idx], ...req.body };
  saveUserData(req.user.id, d);
  res.json(d.meals[idx]);
});

app.delete('/api/nutrition/meals/:id', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  d.meals = d.meals.filter(m => m.id !== parseInt(req.params.id));
  saveUserData(req.user.id, d);
  res.json({ ok: true });
});

app.put('/api/nutrition/targets', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  d.nTargets = { ...d.nTargets, ...req.body };
  saveUserData(req.user.id, d);
  res.json(d.nTargets);
});

// ════════════════════════════════════════════════════════
//  EXAM PREP
// ════════════════════════════════════════════════════════
app.get('/api/exam', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  res.json({ topics: d.topics, examInfo: d.examInfo, nextId: d.nextTopicId });
});

app.post('/api/exam/topics', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  const topic = { id: d.nextTopicId++, ...req.body };
  d.topics.push(topic);
  saveUserData(req.user.id, d);
  res.json(topic);
});

app.put('/api/exam/topics/:id', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  const idx = d.topics.findIndex(t => t.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Topic not found' });
  d.topics[idx] = { ...d.topics[idx], ...req.body };
  saveUserData(req.user.id, d);
  res.json(d.topics[idx]);
});

app.delete('/api/exam/topics/:id', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  d.topics = d.topics.filter(t => t.id !== parseInt(req.params.id));
  saveUserData(req.user.id, d);
  res.json({ ok: true });
});

app.put('/api/exam/info', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  d.examInfo = { ...d.examInfo, ...req.body };
  saveUserData(req.user.id, d);
  res.json(d.examInfo);
});

// ════════════════════════════════════════════════════════
//  CHALLENGES
// ════════════════════════════════════════════════════════
app.get('/api/challenges', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  res.json({ challenges: d.challenges, nextId: d.nextChalId });
});

app.post('/api/challenges', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  const chal = { id: d.nextChalId++, checkIns:0, checkedIn:false, ...req.body };
  d.challenges.push(chal);
  saveUserData(req.user.id, d);
  res.json(chal);
});

app.put('/api/challenges/:id', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  const idx = d.challenges.findIndex(c => c.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Challenge not found' });
  d.challenges[idx] = { ...d.challenges[idx], ...req.body };
  saveUserData(req.user.id, d);
  res.json(d.challenges[idx]);
});

app.delete('/api/challenges/:id', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  d.challenges = d.challenges.filter(c => c.id !== parseInt(req.params.id));
  saveUserData(req.user.id, d);
  res.json({ ok: true });
});

// ════════════════════════════════════════════════════════
//  PLANNER
// ════════════════════════════════════════════════════════
app.get('/api/planner', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  res.json(d.planner || { blocks:[], accepted:false });
});

app.put('/api/planner', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  d.planner = req.body;
  saveUserData(req.user.id, d);
  res.json(d.planner);
});

// ════════════════════════════════════════════════════════
//  REFLECTION
// ════════════════════════════════════════════════════════
app.get('/api/reflection', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  res.json(d.reflection || {});
});

app.put('/api/reflection', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  d.reflection = { ...d.reflection, ...req.body };
  saveUserData(req.user.id, d);
  res.json(d.reflection);
});

// ════════════════════════════════════════════════════════
//  FOCUS SESSIONS
// ════════════════════════════════════════════════════════
app.get('/api/focus', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  res.json({ sessions: d.focusSessions||[], totalMins: d.focusTotalMins||0, settings: d.focusSettings||{focus:25,short:5,long:15,goal:5} });
});

app.post('/api/focus/sessions', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  if (!d.focusSessions) d.focusSessions=[];
  d.focusSessions.unshift({ ...req.body, time: new Date().toISOString() });
  d.focusTotalMins = (d.focusTotalMins||0) + (req.body.mins||0);
  saveUserData(req.user.id, d);
  res.json({ ok:true, sessions: d.focusSessions, totalMins: d.focusTotalMins });
});

app.delete('/api/focus/sessions', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  d.focusSessions=[]; d.focusTotalMins=0;
  saveUserData(req.user.id, d);
  res.json({ ok:true });
});

app.put('/api/focus/settings', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  d.focusSettings = { ...d.focusSettings, ...req.body };
  saveUserData(req.user.id, d);
  res.json(d.focusSettings);
});

// ════════════════════════════════════════════════════════
//  ACHIEVEMENTS (overrides + custom)
// ════════════════════════════════════════════════════════
app.get('/api/achievements', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  res.json({ overrides: d.achManualOverrides||{}, custom: d.achCustom||[] });
});

app.put('/api/achievements/overrides', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  d.achManualOverrides = req.body;
  saveUserData(req.user.id, d);
  res.json(d.achManualOverrides);
});

app.post('/api/achievements/custom', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  if (!d.achCustom) d.achCustom=[];
  const ach = { id:'custom_'+uuidv4(), ...req.body };
  d.achCustom.push(ach);
  saveUserData(req.user.id, d);
  res.json(ach);
});

app.put('/api/achievements/custom/:id', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  const idx = (d.achCustom||[]).findIndex(a => a.id===req.params.id);
  if (idx===-1) return res.status(404).json({ error:'Not found' });
  d.achCustom[idx]={ ...d.achCustom[idx], ...req.body };
  saveUserData(req.user.id, d);
  res.json(d.achCustom[idx]);
});

app.delete('/api/achievements/custom/:id', authMiddleware, (req, res) => {
  const d = getUserData(req.user.id);
  d.achCustom = (d.achCustom||[]).filter(a => a.id!==req.params.id);
  saveUserData(req.user.id, d);
  res.json({ ok:true });
});

// ════════════════════════════════════════════════════════
//  FULL USER DATA SYNC (load all at login)
// ════════════════════════════════════════════════════════
app.get('/api/userdata', authMiddleware, (req, res) => {
  res.json(getUserData(req.user.id));
});

app.put('/api/userdata', authMiddleware, (req, res) => {
  saveUserData(req.user.id, req.body);
  res.json({ ok: true });
});

// ── Serve frontend for all non-API routes ─────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start server ──────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  ╔═══════════════════════════════════╗`);
  console.log(`  ║   cbc Life Platform — Backend     ║`);
  console.log(`  ║   Running on http://localhost:${PORT}  ║`);
  console.log(`  ╚═══════════════════════════════════╝\n`);
});