const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, pool } = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow_super_secret_key';

// Helper to verify reCAPTCHA token using Google's API
const verifyRecaptcha = async (token) => {
  if (!token) return false;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.warn('RECAPTCHA_SECRET_KEY is not defined in .env');
    return false;
  }
  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`,
      { method: 'POST' }
    );
    const data = await response.json();
    return !!data.success;
  } catch (err) {
    console.error('reCAPTCHA verification failed:', err);
    return false;
  }
};

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.email || req.user.email.toLowerCase() !== 'anilkumard707@gmail.com') {
    return res.status(403).json({ error: 'Access denied: Admin only' });
  }
  next();
};

// --- Admin Endpoints ---

// Get all users with task count
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT u.id, u.email, u.email_enabled, COUNT(t.id) AS task_count
      FROM users u
      LEFT JOIN tasks t ON u.id = t.user_id
      GROUP BY u.id, u.email, u.email_enabled
      ORDER BY u.email ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post visitor access log (Public endpoint, optional authorization token)
app.post('/api/analytics/log', async (req, res) => {
  try {
    const { path } = req.body;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    let userId = null;

    // Try decoding auth token if present
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Silent token validation failure - treat as anonymous
      }
    }

    const logId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
    const timestamp = new Date().toISOString();

    await query(
      'INSERT INTO visit_logs (id, user_id, path, user_agent, timestamp) VALUES ($1, $2, $3, $4, $5)',
      [logId, userId, path || '/', userAgent, timestamp]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get admin analytics metrics (restricted)
app.get('/api/admin/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 1. Total page views
    const totalViewsRes = await query('SELECT COUNT(*) AS count FROM visit_logs');
    const totalViews = parseInt(totalViewsRes.rows[0]?.count || 0);

    // 2. Anonymous page views
    const anonViewsRes = await query('SELECT COUNT(*) AS count FROM visit_logs WHERE user_id IS NULL');
    const anonymousViews = parseInt(anonViewsRes.rows[0]?.count || 0);

    // 3. Logged-in page views
    const loggedInViews = totalViews - anonymousViews;

    // 4. Unique active logged-in users count
    const uniqueLoggedRes = await query('SELECT COUNT(DISTINCT user_id) AS count FROM visit_logs WHERE user_id IS NOT NULL');
    const uniqueLoggedUsers = parseInt(uniqueLoggedRes.rows[0]?.count || 0);

    // 5. Page views group by path (top 10 popular paths)
    const pageStatsRes = await query(`
      SELECT path, COUNT(*) AS count 
      FROM visit_logs 
      GROUP BY path 
      ORDER BY count DESC 
      LIMIT 10
    `);
    const pageStats = pageStatsRes.rows;

    // 6. Recent logs (last 20 access entries, with email)
    const recentLogsRes = await query(`
      SELECT v.id, v.path, v.user_agent, v.timestamp, u.email
      FROM visit_logs v
      LEFT JOIN users u ON v.user_id = u.id
      ORDER BY v.timestamp DESC
      LIMIT 20
    `);
    const recentLogs = recentLogsRes.rows;

    res.json({
      totalViews,
      anonymousViews,
      loggedInViews,
      uniqueLoggedUsers,
      pageStats,
      recentLogs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- Auth Endpoints ---

// Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Verify reCAPTCHA
    const isCaptchaValid = await verifyRecaptcha(captchaToken);
    if (!isCaptchaValid) {
      return res.status(400).json({ error: 'reCAPTCHA verification failed. Please try again.' });
    }

    // Check if user already exists
    const checkUser = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Date.now().toString();

    // Insert user
    await query(
      'INSERT INTO users (id, email, password, email_enabled, email_time, timezone) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, email.toLowerCase(), hashedPassword, false, '09:00', 'Asia/Kolkata']
    );

    // Generate JWT
    const token = jwt.sign({ id: userId, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ success: true, token, user: { id: userId, email: email.toLowerCase(), email_enabled: false, email_time: '09:00', timezone: 'Asia/Kolkata' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, captchaToken } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Verify reCAPTCHA
    const isCaptchaValid = await verifyRecaptcha(captchaToken);
    if (!isCaptchaValid) {
      return res.status(400).json({ error: 'reCAPTCHA verification failed. Please try again.' });
    }

    // Find user
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, email_enabled: !!user.email_enabled, email_time: user.email_time || '09:00', timezone: user.timezone || 'Asia/Kolkata' }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Public Config (to expose Google Client ID dynamically to frontend)
app.get('/api/auth/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || null
  });
});

// POST Google Auth Sign-in / Sign-up
app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken, isDemo } = req.body;
    
    let email;
    if (isDemo) {
      email = 'google-demo-user@gmail.com';
    } else {
      if (!idToken) {
        return res.status(400).json({ error: 'Google ID Token is required' });
      }

      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        return res.status(500).json({ error: 'Google Client ID is not configured on the server' });
      }

      // Verify ID Token with Google's API
      const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
      const response = await fetch(verifyUrl);
      if (!response.ok) {
        return res.status(400).json({ error: 'Invalid Google ID Token' });
      }

      const payload = await response.json();
      
      // Verify audience matches our Google Client ID to prevent spoofing
      if (payload.aud !== googleClientId) {
        return res.status(400).json({ error: 'Token audience mismatch' });
      }

      // Verify email is verified
      if (payload.email_verified !== 'true' && payload.email_verified !== true) {
        return res.status(400).json({ error: 'Google email is not verified' });
      }

      email = payload.email.toLowerCase();
    }

    // Check if user already exists
    let { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    let user;

    if (rows.length === 0) {
      // Register user automatically (Google signup)
      const userId = Date.now().toString();
      // Generate a secure random password since we use bcrypt
      const randomPassword = require('crypto').randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      await query(
        'INSERT INTO users (id, email, password, email_enabled, email_time, timezone) VALUES ($1, $2, $3, $4, $5, $6)',
        [userId, email, 'google_oauth_placeholder', false, '09:00', 'Asia/Kolkata']
      );
      
      user = { id: userId, email, email_enabled: false, email_time: '09:00', timezone: 'Asia/Kolkata' };
    } else {
      user = rows[0];
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, email_enabled: !!user.email_enabled, email_time: user.email_time || '09:00', timezone: user.timezone || 'Asia/Kolkata' }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get profile details
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const { rows } = await query('SELECT id, email, email_enabled, email_time, timezone FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const user = rows[0];
    user.email_enabled = !!user.email_enabled;
    user.email_time = user.email_time || '09:00';
    user.timezone = user.timezone || 'Asia/Kolkata';

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update email notifications toggle and settings preferences
app.put('/api/auth/settings', authenticateToken, async (req, res) => {
  try {
    const { email_enabled, email_time, timezone } = req.body;
    
    let tz = timezone;
    if (tz) {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
      } catch (e) {
        return res.status(400).json({ error: 'Invalid timezone.' });
      }
    } else {
      tz = 'Asia/Kolkata';
    }

    if (email_time !== undefined) {
      // Validate format of email_time (e.g. HH:MM)
      const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!timeRegex.test(email_time)) {
        return res.status(400).json({ error: 'Invalid time format. Use HH:MM.' });
      }
      await query('UPDATE users SET email_enabled = $1, email_time = $2, timezone = $3 WHERE id = $4', [email_enabled, email_time, tz, req.user.id]);
      res.json({ success: true, email_enabled, email_time, timezone: tz });
    } else {
      if (timezone !== undefined) {
        await query('UPDATE users SET email_enabled = $1, timezone = $2 WHERE id = $3', [email_enabled, tz, req.user.id]);
        res.json({ success: true, email_enabled, timezone: tz });
      } else {
        await query('UPDATE users SET email_enabled = $1 WHERE id = $2', [email_enabled, req.user.id]);
        res.json({ success: true, email_enabled });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Tasks API ---

// Get tasks by date
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { date } = req.query;
    const user_id = req.user.id;
    if (!date) return res.status(400).json({ error: 'Date is required' });
    
    const { rows } = await query('SELECT * FROM tasks WHERE date = $1 AND user_id = $2 ORDER BY sort_order ASC', [date, user_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single task by ID
app.get('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const { rows } = await query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [id, user_id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create task
app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { id, title, text, status, date, sort_order } = req.body;
    const user_id = req.user.id;
    
    await query(`
      INSERT INTO tasks (id, user_id, title, text, status, date, sort_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [id, user_id, title || 'Untitled Task', text, status, date, sort_order]);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update task status and order
app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, sort_order, text, title, priority, ideas, effort_size, effort_time, effort_reasoning } = req.body;
    const user_id = req.user.id;
    
    const { rows } = await query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [id, user_id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    await query(`
      UPDATE tasks 
      SET status = COALESCE($1, status), 
          sort_order = COALESCE($2, sort_order),
          text = COALESCE($3, text),
          title = COALESCE($4, title),
          priority = COALESCE($5, priority),
          ideas = COALESCE($6, ideas),
          effort_size = COALESCE($7, effort_size),
          effort_time = COALESCE($8, effort_time),
          effort_reasoning = COALESCE($9, effort_reasoning)
      WHERE id = $10 AND user_id = $11
    `, [status, sort_order, text, title, priority, ideas, effort_size, effort_time, effort_reasoning, id, user_id]);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete task
app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    await query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [id, user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Batch update tasks (for drag and drop reordering)
app.post('/api/tasks/batch', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const { updates } = req.body; // [{ id, status, sort_order }]
    const user_id = req.user.id;
    
    await client.query('BEGIN');
    for (const u of updates) {
      await client.query(`
        UPDATE tasks 
        SET status = $1, sort_order = $2
        WHERE id = $3 AND user_id = $4
      `, [u.status, u.sort_order, u.id, user_id]);
    }
    await client.query('COMMIT');
    
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --- Subtasks API ---

// Get all subtasks for a task
app.get('/api/tasks/:taskId/subtasks', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const user_id = req.user.id;
    
    // Verify task belongs to user
    const taskCheck = await query('SELECT id FROM tasks WHERE id = $1 AND user_id = $2', [taskId, user_id]);
    if (taskCheck.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    
    const { rows } = await query('SELECT * FROM subtasks WHERE task_id = $1 ORDER BY id ASC', [taskId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new subtask
app.post('/api/tasks/:taskId/subtasks', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title } = req.body;
    const user_id = req.user.id;
    
    if (!title) return res.status(400).json({ error: 'Subtask title is required' });
    
    // Verify task belongs to user
    const taskCheck = await query('SELECT id FROM tasks WHERE id = $1 AND user_id = $2', [taskId, user_id]);
    if (taskCheck.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    await query(
      'INSERT INTO subtasks (id, task_id, title, completed) VALUES ($1, $2, $3, $4)',
      [id, taskId, title, false]
    );
    
    res.json({ success: true, subtask: { id, task_id: taskId, title, completed: false } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a subtask (title or completion status)
app.put('/api/subtasks/:subtaskId', authenticateToken, async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const { title, completed } = req.body;
    const user_id = req.user.id;
    
    // Verify subtask belongs to task of current user
    const subtaskCheck = await query(`
      SELECT s.id 
      FROM subtasks s
      JOIN tasks t ON s.task_id = t.id
      WHERE s.id = $1 AND t.user_id = $2
    `, [subtaskId, user_id]);
    
    if (subtaskCheck.rows.length === 0) return res.status(404).json({ error: 'Subtask not found' });
    
    await query(`
      UPDATE subtasks 
      SET title = COALESCE($1, title), 
          completed = COALESCE($2, completed)
      WHERE id = $3
    `, [title, completed !== undefined ? completed : null, subtaskId]);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a subtask
app.delete('/api/subtasks/:subtaskId', authenticateToken, async (req, res) => {
  try {
    const { subtaskId } = req.params;
    const user_id = req.user.id;
    
    // Verify subtask belongs to task of current user
    const subtaskCheck = await query(`
      SELECT s.id 
      FROM subtasks s
      JOIN tasks t ON s.task_id = t.id
      WHERE s.id = $1 AND t.user_id = $2
    `, [subtaskId, user_id]);
    
    if (subtaskCheck.rows.length === 0) return res.status(404).json({ error: 'Subtask not found' });
    
    await query('DELETE FROM subtasks WHERE id = $1', [subtaskId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai
app.post('/api/ai', authenticateToken, async (req, res) => {
  const { action, text, taskTitle, taskDescription } = req.body;

  if (!action) {
    return res.status(400).json({ error: 'Action is required' });
  }

  const supportedActions = ['summary', 'rewrite', 'subtasks', 'ideas', 'estimate', 'priority'];
  if (!supportedActions.includes(action)) {
    return res.status(400).json({ error: `Unsupported action: ${action}` });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('GROQ_API_KEY is not defined in environment variables.');
    return res.status(500).json({ error: 'AI features are not configured. Please contact the administrator to set up GROQ_API_KEY.' });
  }

  // System prompt templates
  let systemPrompt = '';
  switch (action) {
    case 'summary':
      systemPrompt = `You are a concise, productivity-focused AI assistant. Summarize the task or text in 2 to 5 brief, actionable bullet points.
You must return a JSON object with a single key "summary" which contains an array of strings (the bullet points).
Keep the summary concise and productivity-focused. Do not include any introductory or concluding text, explanations, or markdown formatting outside the JSON object itself.
Never fabricate details not present in the input.

Example response format:
{
  "summary": [
    "Review draft proposal for team feedback.",
    "Correct budget errors in section 3.",
    "Submit final copy by Friday afternoon."
  ]
}`;
      break;

    case 'rewrite':
      systemPrompt = `You are a concise, productivity-focused AI assistant. Rewrite the task description to be clear, concise, and actionable, while preserving the original meaning.
You must return a JSON object with a single key "rewrittenText" which contains the rewritten text. You may use clean HTML tags (like <p>, <ul>, <li>, <strong>) if appropriate, but keep it minimal and clean.
Do not include any introductory or concluding text, explanations, or markdown formatting outside the JSON object itself.
Never fabricate details not present in the input.

Example response format:
{
  "rewrittenText": "Review the design guidelines and update the buttons component to match the new token definitions."
}`;
      break;

    case 'subtasks':
      systemPrompt = `You are a concise, productivity-focused AI assistant. Convert the task title and description or paragraph into a checklist of actionable subtasks.
You must return a JSON object with a single key "subtasks" which contains an array of strings (each representing a single actionable subtask).
Do not include any introductory or concluding text, explanations, or markdown formatting outside the JSON object itself.
Never fabricate details not present in the input.

Example response format:
{
  "subtasks": [
    "Create a new database migration file.",
    "Define columns for the notifications table.",
    "Run migrations and verify constraints."
  ]
}`;
      break;

    case 'ideas':
      systemPrompt = `You are a concise, productivity-focused AI assistant. Based on the task title and description, suggest practical next steps, ideas, or improvements.
You must return a JSON object with a single key "ideas" which contains an array of strings (the suggested next steps or ideas).
Do not include any introductory or concluding text, explanations, or markdown formatting outside the JSON object itself.
Never fabricate details not present in the input.

Example response format:
{
  "ideas": [
    "Consider setting up an index on the user_id column for faster queries.",
    "Draft a quick questionnaire to gather feedback from initial testers.",
    "Add client-side validation to prevent duplicate submissions."
  ]
}`;
      break;

    case 'estimate':
      systemPrompt = `You are a concise, productivity-focused AI assistant. Classify the effort for the task as "Small", "Medium", or "Large". Provide an estimated completion time and a brief explanation of your reasoning (1-2 sentences).
You must return a JSON object with the keys "size", "timeEstimate", and "reasoning".
Do not include any introductory or concluding text, explanations, or markdown formatting outside the JSON object itself.
Never fabricate details not present in the input.

Example response format:
{
  "size": "Medium",
  "timeEstimate": "4 hours",
  "reasoning": "Setting up OAuth requires configuring API credentials and implementing token validation callbacks on the server, which takes moderate effort."
}`;
      break;

    case 'priority':
      systemPrompt = `You are a concise, productivity-focused AI assistant. Recommend a priority (High, Medium, Low) for the task and briefly explain why (1-2 sentences).
You must return a JSON object with the keys "priority" and "reasoning".
Do not include any introductory or concluding text, explanations, or markdown formatting outside the JSON object itself.
Never fabricate details not present in the input.

Example response format:
{
  "priority": "High",
  "reasoning": "This task addresses a security vulnerability where database passwords could be exposed in debug logs, making it highly urgent."
}`;
      break;
  }

  // Construct the user content
  let userContent = '';
  if (text) {
    userContent = `Input Text:\n"""\n${text}\n"""`;
  } else {
    userContent = `Task Title: ${taskTitle || 'Untitled'}\nTask Description: ${taskDescription || '(No description provided)'}`;
  }

  const payload = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ],
    temperature: 0.4,
    response_format: { type: 'json_object' }
  };

  const callGroq = async () => {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {}
      const message = errorJson?.error?.message || `Groq API responded with status ${response.status}`;
      const code = errorJson?.error?.code || null;
      
      const errorObj = new Error(message);
      errorObj.status = response.status;
      errorObj.code = code;
      throw errorObj;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Groq returned an empty response.');
    }

    try {
      return JSON.parse(content);
    } catch (err) {
      console.error('Failed to parse Groq response content as JSON:', content);
      throw new Error('AI response was not in valid JSON format. Please try again.');
    }
  };

  // Retry logic (try up to 2 times for transient failures)
  let attempts = 0;
  const maxAttempts = 2;
  let lastError;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const result = await callGroq();
      return res.json(result);
    } catch (err) {
      lastError = err;
      console.warn(`Groq API call attempt ${attempts} failed: ${err.message}`);
      
      // Don't retry if it's an authorization/bad request error or client setup issue
      if (err.status && err.status >= 400 && err.status < 500 && err.status !== 429) {
        break;
      }
      
      // Wait a short duration before retrying if rate limited (429) or server error (5xx)
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // Gracefully handle rate limit errors or general failures
  if (lastError.status === 429 || lastError.code === 'rate_limit_exceeded') {
    return res.status(429).json({ error: 'AI Assistant rate limit reached. Please wait a moment before trying again.' });
  }

  res.status(lastError.status || 500).json({ error: lastError.message || 'An error occurred while calling the AI Assistant.' });
});

// Daily Cron Job to email pending tasks
app.get('/api/cron/email', async (req, res) => {
  // Simple validation for Vercel Cron Secret (if configured)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Check for required SMTP environment variables
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('SMTP configuration is incomplete in .env file.');
      return res.status(400).json({ error: 'SMTP configurations are missing in environment.' });
    }

    // Query all users and filter active notification settings in Javascript
    // Filter users whose preferred email summary hour matches the current hour in their local timezone
    const { rows: allUsers } = await query("SELECT id, email, email_enabled, email_time, timezone FROM users");
    const activeUsers = allUsers.filter(u => {
      if (!u.email_enabled) return false;
      const tz = u.timezone || 'Asia/Kolkata';
      
      let userHour = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        timeZone: tz
      });
      if (userHour === '24') userHour = '00';
      userHour = userHour.padStart(2, '0');
      
      const userTime = u.email_time || '09:00';
      const targetHour = userTime.split(':')[0];
      return userHour === targetHour;
    });

    if (activeUsers.length === 0) {
      console.log('No users match the current email cron hour.');
      return res.json({ success: true, message: 'No users match the current email cron hour.' });
    }

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    let sentCount = 0;
    let failCount = 0;

    for (const user of activeUsers) {
      try {
        const tz = user.timezone || 'Asia/Kolkata';
        
        // Get current date in user's timezone (YYYY-MM-DD)
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        const [{ value: month }, , { value: day }, , { value: year }] = formatter.formatToParts(new Date());
        const todayLocal = `${year}-${month}-${day}`;

        // Get local day of week to determine if it is Monday (1)
        const localDate = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
        const isMondayLocal = localDate.getDay() === 1;

        // Helper to format an overdue badge
        const formatTaskDateLocal = (taskDate) => {
          if (taskDate < todayLocal) {
            return ` <span style="color: #ef4444; font-size: 11px; font-weight: bold; background-color: #fef2f2; padding: 2px 6px; border-radius: 4px; margin-left: 8px; border: 1px solid #fee2e2;">Overdue: ${taskDate}</span>`;
          }
          return '';
        };

        // Query tasks for this specific user
        const sqlQuery = isMondayLocal
          ? "SELECT * FROM tasks WHERE user_id = $1 AND date <= $2 AND status != 'done' ORDER BY date ASC, status, sort_order"
          : "SELECT * FROM tasks WHERE user_id = $1 AND date = $2 AND status != 'done' ORDER BY status, sort_order";

        const { rows: userTasks } = await query(sqlQuery, [user.id, todayLocal]);

        if (userTasks.length === 0) {
          continue; // skip users with no pending tasks
        }

        const todoTasks = userTasks.filter(t => t.status === 'todo');
        const inProgressTasks = userTasks.filter(t => t.status === 'in-progress');

        const localDisplayDate = new Date(todayLocal).toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        });

        let htmlContent = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1a202c; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <h2 style="color: #6366f1; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-top: 0; font-size: 22px;">📋 Daily Pending Tasks Summary</h2>
            <p style="font-size: 15px; color: #4a5568; margin-bottom: 20px;">
              Hello, here is your summary of pending tasks as of today, <strong>${localDisplayDate}</strong>:
            </p>
        `;

        if (todoTasks.length > 0) {
          htmlContent += `
            <h3 style="color: #ec4899; margin-top: 24px; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">📌 To Do (${todoTasks.length})</h3>
            <ul style="padding-left: 20px; margin: 8px 0; line-height: 1.6; color: #2d3748;">
              ${todoTasks.map(t => `
                <li style="margin-bottom: 14px;">
                  <strong style="font-size: 15px;">${t.title}</strong>${formatTaskDateLocal(t.date)}
                  ${t.text ? `<div style="color: #718096; font-size: 13px; margin-top: 4px; padding-left: 8px; border-left: 2px solid #edf2f7;">${t.text.replace(/<[^>]*>/g, '')}</div>` : ''}
                </li>
              `).join('')}
            </ul>
          `;
        }

        if (inProgressTasks.length > 0) {
          htmlContent += `
            <h3 style="color: #eab308; margin-top: 24px; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">⏳ In Progress (${inProgressTasks.length})</h3>
            <ul style="padding-left: 20px; margin: 8px 0; line-height: 1.6; color: #2d3748;">
              ${inProgressTasks.map(t => `
                <li style="margin-bottom: 14px;">
                  <strong style="font-size: 15px;">${t.title}</strong>${formatTaskDateLocal(t.date)}
                  ${t.text ? `<div style="color: #718096; font-size: 13px; margin-top: 4px; padding-left: 8px; border-left: 2px solid #edf2f7;">${t.text.replace(/<[^>]*>/g, '')}</div>` : ''}
                </li>
              `).join('')}
            </ul>
          `;
        }

        htmlContent += `
            <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #edf2f7; font-size: 11px; color: #a0aec0; text-align: center;">
              This is an automated notification from your Daily Task Manager (MissionChecked). You can disable these in your Settings.
            </div>
          </div>
        `;

        const mailOptions = {
          from: process.env.EMAIL_FROM || process.env.SMTP_USER,
          to: user.email,
          subject: isMondayLocal
            ? `📋 MissionChecked: Weekly Task Overview (All Pending)`
            : `📋 MissionChecked: Pending Tasks for ${todayLocal}`,
          html: htmlContent,
        };

        await transporter.sendMail(mailOptions);
        sentCount++;
      } catch (err) {
        console.error(`Failed to send email to ${user.email}:`, err);
        failCount++;
      }
    }

    console.log(`Daily tasks email cron finished. Sent: ${sentCount}, Failed: ${failCount}`);
    res.json({ success: true, sent: sentCount, failed: failCount });
  } catch (err) {
    console.error('Failed to execute daily tasks email cron job:', err);
    res.status(500).json({ error: err.message });
  }
});

// Export app for Vercel
if (require.main === module) {
  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
module.exports = app;
