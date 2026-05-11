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

// Export app for Vercel
if (require.main === module) {
  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
module.exports = app;
