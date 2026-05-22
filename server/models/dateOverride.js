module.exports = `
CREATE TABLE date_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES availability_schedules(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  is_off BOOLEAN DEFAULT FALSE,
  start_time TIME,
  end_time TIME,
  reason VARCHAR(255),
  UNIQUE (schedule_id, override_date)
);
`;
