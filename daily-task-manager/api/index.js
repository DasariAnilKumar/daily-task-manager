const express = require('express');
const cors = require('cors');
const { query, pool } = require('./db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Tasks API ---

// Get tasks by date
app.get('/api/tasks', async (req, res) => {
  try {
    const { date } = req.query;
    const user_id = 'default_user'; // SAML placeholder
    if (!date) return res.status(400).json({ error: 'Date is required' });
    
    const { rows } = await query('SELECT * FROM tasks WHERE date = $1 AND user_id = $2 ORDER BY sort_order ASC', [date, user_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single task by ID
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = 'default_user'; // SAML placeholder
    const { rows } = await query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [id, user_id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create task
app.post('/api/tasks', async (req, res) => {
  try {
    const { id, title, text, status, date, sort_order } = req.body;
    const user_id = 'default_user'; // SAML placeholder
    
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
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, sort_order, text, title } = req.body;
    const user_id = 'default_user'; // SAML placeholder
    
    const { rows } = await query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [id, user_id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });

    await query(`
      UPDATE tasks 
      SET status = COALESCE($1, status), 
          sort_order = COALESCE($2, sort_order),
          text = COALESCE($3, text),
          title = COALESCE($4, title)
      WHERE id = $5 AND user_id = $6
    `, [status, sort_order, text, title, id, user_id]);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = 'default_user'; // SAML placeholder
    await query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [id, user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Batch update tasks (for drag and drop reordering)
app.post('/api/tasks/batch', async (req, res) => {
  const client = await pool.connect();
  try {
    const { updates } = req.body; // [{ id, status, sort_order }]
    const user_id = 'default_user'; // SAML placeholder
    
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

// Daily Cron Job to email pending tasks
app.get('/api/cron/email', async (req, res) => {
  // Simple validation for Vercel Cron Secret (if configured)
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get current date and day of week in IST (GMT+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(Date.now() + istOffset);
    const todayIST = istDate.toISOString().split('T')[0];
    const dayOfWeek = istDate.getDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.

    // Helper to format an overdue badge
    const formatTaskDate = (taskDate) => {
      if (taskDate < todayIST) {
        return ` <span style="color: #ef4444; font-size: 11px; font-weight: bold; background-color: #fef2f2; padding: 2px 6px; border-radius: 4px; margin-left: 8px; border: 1px solid #fee2e2;">Overdue: ${taskDate}</span>`;
      }
      return '';
    };

    // Monday (1): Get all pending + overdue tasks. Other days: Get only today's pending tasks.
    const isMonday = dayOfWeek === 1;
    const sqlQuery = isMonday
      ? "SELECT * FROM tasks WHERE date <= $1 AND status != 'done' ORDER BY date ASC, status, sort_order"
      : "SELECT * FROM tasks WHERE date = $1 AND status != 'done' ORDER BY status, sort_order";

    const { rows } = await query(sqlQuery, [todayIST]);

    if (rows.length === 0) {
      console.log('No pending tasks to email.');
      return res.json({ success: true, message: 'No pending tasks to email.' });
    }

    // Check for required SMTP environment variables
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.EMAIL_TO) {
      console.warn('SMTP configuration is incomplete in .env file.');
      return res.status(400).json({ error: 'SMTP configurations are missing in environment.' });
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

    const todoTasks = rows.filter(t => t.status === 'todo');
    const inProgressTasks = rows.filter(t => t.status === 'in-progress');

    let htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1a202c; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <h2 style="color: #6366f1; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-top: 0; font-size: 22px;">📋 Daily Pending Tasks Summary</h2>
        <p style="font-size: 15px; color: #4a5568; margin-bottom: 20px;">
          ${isMonday 
            ? 'Here is your weekly overview of all pending and overdue tasks:' 
            : 'Here are your pending tasks for today:'
          } <strong>${new Date(todayIST).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong>:
        </p>
    `;

    if (todoTasks.length > 0) {
      htmlContent += `
        <h3 style="color: #ec4899; margin-top: 24px; font-size: 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">📌 To Do (${todoTasks.length})</h3>
        <ul style="padding-left: 20px; margin: 8px 0; line-height: 1.6; color: #2d3748;">
          ${todoTasks.map(t => `
            <li style="margin-bottom: 14px;">
              <strong style="font-size: 15px;">${t.title}</strong>${formatTaskDate(t.date)}
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
              <strong style="font-size: 15px;">${t.title}</strong>${formatTaskDate(t.date)}
              ${t.text ? `<div style="color: #718096; font-size: 13px; margin-top: 4px; padding-left: 8px; border-left: 2px solid #edf2f7;">${t.text.replace(/<[^>]*>/g, '')}</div>` : ''}
            </li>
          `).join('')}
        </ul>
      `;
    }

    htmlContent += `
        <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #edf2f7; font-size: 11px; color: #a0aec0; text-align: center;">
          This is an automated notification from your Daily Task Manager (TaskFlow).
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: process.env.EMAIL_TO,
      subject: isMonday
        ? `📋 TaskFlow: Weekly Task Overview (All Pending)`
        : `📋 TaskFlow: Pending Tasks for ${todayIST}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log('Daily tasks summary email sent successfully!');
    res.json({ success: true, message: 'Daily tasks summary email sent successfully!' });
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
