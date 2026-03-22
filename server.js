const express = require('express');
const path = require('path');
const cors = require('cors');
const { pool, initDb } = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const normalizeSteps = (steps = []) => {
  const stepCount = 7;
  if (!Array.isArray(steps) || steps.length !== stepCount) {
    return Array(stepCount).fill(false);
  }
  return steps.map((v) => Boolean(v));
};

const computeStatus = (steps = []) => {
  const completed = steps.filter(Boolean).length;
  if (completed === 0) return 'planned';
  if (completed === steps.length) return 'done';
  return 'ongoing';
};

app.get('/api/releases', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM releases ORDER BY due_date ASC, id ASC');
  const out = rows.map((release) => ({
    ...release,
    steps: release.steps || [],
    status: computeStatus(release.steps || []),
  }));
  res.json(out);
});

app.post('/api/releases', async (req, res) => {
  const { name, due_date, additional_info } = req.body;
  if (!name || !due_date) {
    return res.status(400).json({ error: 'name and due_date are required' });
  }

  const steps = normalizeSteps(req.body.steps);
  const query = `INSERT INTO releases (name, due_date, additional_info, steps, updated_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *`;
  const values = [name, due_date, additional_info || '', JSON.stringify(steps)];

  const { rows } = await pool.query(query, values);
  const added = rows[0];
  res.status(201).json({
    ...added,
    steps,
    status: computeStatus(steps),
  });
});

app.put('/api/releases/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, due_date, additional_info, steps } = req.body;

  const existing = await pool.query('SELECT * FROM releases WHERE id = $1', [id]);
  if (!existing.rows.length) return res.status(404).json({ error: 'Not found' });

  const updatedSteps = steps !== undefined ? normalizeSteps(steps) : existing.rows[0].steps || [];
  const updatedName = name !== undefined ? name : existing.rows[0].name;
  const updatedDueDate = due_date !== undefined ? due_date : existing.rows[0].due_date;
  const updatedInfo = additional_info !== undefined ? additional_info : existing.rows[0].additional_info;

  await pool.query(
    `UPDATE releases SET name=$1, due_date=$2, additional_info=$3, steps=$4, updated_at=NOW() WHERE id=$5`,
    [updatedName, updatedDueDate, updatedInfo, JSON.stringify(updatedSteps), id]
  );

  res.json({
    id,
    name: updatedName,
    due_date: updatedDueDate,
    additional_info: updatedInfo,
    steps: updatedSteps,
    status: computeStatus(updatedSteps),
  });
});

app.delete('/api/releases/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { rowCount } = await pool.query('DELETE FROM releases WHERE id=$1', [id]);
  if (!rowCount) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 4000;

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Release checklist API + UI running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Error initializing database', err);

    if (err && err.code === 'ENOTFOUND') {
      console.error('Database host not found. Verify DATABASE_URL host and network access (DNS, firewall, internet) or switch to local DB.');
    }

    process.exit(1);
  });