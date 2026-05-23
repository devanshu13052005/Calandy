module.exports = `
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type_id UUID NOT NULL REFERENCES event_types(id),
  invitee_name VARCHAR(255) NOT NULL,
  invitee_email VARCHAR(255) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','rescheduled')),
  cancel_token UUID UNIQUE DEFAULT uuid_generate_v4(),
  reschedule_token UUID UNIQUE DEFAULT uuid_generate_v4(),
  invitee_timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
  notes TEXT,
  meet_link VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;
