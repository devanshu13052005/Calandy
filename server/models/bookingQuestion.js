module.exports = `
CREATE TABLE booking_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type_id UUID NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) DEFAULT 'text' CHECK (question_type IN ('text','textarea','select','checkbox')),
  is_required BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0
);
`;
