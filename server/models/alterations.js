module.exports = `
ALTER TABLE availability_schedules
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'Asia/Kolkata';

ALTER TABLE event_types
  ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES availability_schedules(id) ON DELETE SET NULL;

UPDATE availability_schedules
SET name = 'Working Hours (default)'
WHERE is_default = true AND name = 'Working Hours';

UPDATE event_types et
SET schedule_id = s.id
FROM availability_schedules s
WHERE et.user_id = s.user_id
  AND s.is_default = true
  AND et.schedule_id IS NULL;
`;
