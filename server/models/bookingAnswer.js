module.exports = `
CREATE TABLE booking_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES booking_questions(id),
  answer_text TEXT
);
`;
