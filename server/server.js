const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { initDefaultUser } = require('./lib/defaultUser');
const eventTypesRouter = require('./routes/eventTypes');
const availabilityRouter = require('./routes/availability');
const meetingsRouter = require('./routes/meetings');
const contactsRouter = require('./routes/contacts');
const publicRouter = require('./routes/public');
const schedulesRouter = require('./routes/schedules');
const { error } = require('console');

const app = express();
app.use(cors({ origin: process.env.APP_URL || 'http://localhost:5174' }));
app.use(express.json());

app.use('/api/event-types', eventTypesRouter);
app.use('/api/schedules', schedulesRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/meetings', meetingsRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/public', publicRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;

initDefaultUser()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize:', err.message);
    console.error(err);
    console.error(err.stack);
    process.exit(1);
  });
