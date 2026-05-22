module.exports = `
CREATE INDEX idx_event_types_user_id ON event_types(user_id);
CREATE INDEX idx_event_types_slug ON event_types(user_id, slug);
CREATE INDEX idx_bookings_event_type ON bookings(event_type_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_cancel_token ON bookings(cancel_token);
CREATE INDEX idx_availability_rules_schedule ON availability_rules(schedule_id, day_of_week);
CREATE INDEX idx_date_overrides_date ON date_overrides(schedule_id, override_date);
`;
