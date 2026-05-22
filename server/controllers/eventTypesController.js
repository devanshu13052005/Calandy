const pool = require('../db');
const { getDefaultUserId } = require('../lib/defaultUser');

async function list(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM event_types WHERE user_id = $1 ORDER BY created_at ASC',
      [getDefaultUserId()]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    const { name, slug, duration_minutes, description, color } = req.body;
    const result = await pool.query(
      `INSERT INTO event_types (user_id, name, slug, duration_minutes, description, color)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [getDefaultUserId(), name, slug, duration_minutes, description || null, color || '#006BFF']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const { name, slug, duration_minutes, description, color } = req.body;
    const result = await pool.query(
      `UPDATE event_types SET name=$1, slug=$2, duration_minutes=$3, description=$4, color=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [name, slug, duration_minutes, description, color, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function toggle(req, res) {
  try {
    const result = await pool.query(
      'UPDATE event_types SET is_active = NOT is_active WHERE id=$1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const bookings = await pool.query(
      'SELECT id FROM bookings WHERE event_type_id = $1 LIMIT 1',
      [req.params.id]
    );
    if (bookings.rows.length > 0) {
      return res.status(409).json({ error: 'Event type has bookings' });
    }
    await pool.query('DELETE FROM event_types WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listQuestions(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM booking_questions WHERE event_type_id=$1 ORDER BY display_order',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createQuestion(req, res) {
  try {
    const { question_text, question_type, is_required, display_order } = req.body;
    const result = await pool.query(
      `INSERT INTO booking_questions (event_type_id, question_text, question_type, is_required, display_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.id, question_text, question_type || 'text', is_required || false, display_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function removeQuestion(req, res) {
  try {
    await pool.query('DELETE FROM booking_questions WHERE id=$1', [req.params.qid]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  list,
  create,
  update,
  toggle,
  remove,
  listQuestions,
  createQuestion,
  removeQuestion,
};
