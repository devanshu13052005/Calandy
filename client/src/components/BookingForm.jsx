import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function BookingForm({
  eventType,
  selectedDate,
  selectedTime,
  onBack,
  onSubmit,
  submitting,
}) {
  const [form, setForm] = useState({
    invitee_name: '',
    invitee_email: '',
    notes: '',
    invitee_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
  });
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    if (!eventType?.id) return;
    api.get(`/event-types/${eventType.id}/questions`).then((res) => {
      setQuestions(res.data);
      const init = {};
      res.data.forEach((q) => {
        init[q.id] = '';
      });
      setAnswers(init);
    });
  }, [eventType?.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const answerList = questions.map((q) => ({
      question_id: q.id,
      answer_text: answers[q.id] || '',
    }));
    onSubmit({ ...form, answers: answerList });
  };

  return (
    <div>
      <button type="button" onClick={onBack} className="text-[#006BFF] text-sm mb-4 flex items-center gap-1 hover:underline">
        ← Back
      </button>
      <h3 className="text-base font-medium mb-4">Enter Details</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            required
            value={form.invitee_name}
            onChange={(e) => setForm((f) => ({ ...f, invitee_name: e.target.value }))}
            className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input
            required
            type="email"
            value={form.invitee_email}
            onChange={(e) => setForm((f) => ({ ...f, invitee_email: e.target.value }))}
            className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm resize-none"
          />
        </div>
        {questions.map((q) => (
          <div key={q.id}>
            <label className="block text-sm font-medium mb-1">
              {q.question_text}
              {q.is_required && ' *'}
            </label>
            {q.question_type === 'textarea' ? (
              <textarea
                required={q.is_required}
                rows={2}
                value={answers[q.id] || ''}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm"
              />
            ) : (
              <input
                required={q.is_required}
                value={answers[q.id] || ''}
                onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                className="w-full border border-[#E5E7EB] rounded-md px-3 py-2 text-sm"
              />
            )}
          </div>
        ))}
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-11 mt-2 bg-[#006BFF] text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Booking...' : 'Confirm Booking'}
        </button>
      </form>
    </div>
  );
}
